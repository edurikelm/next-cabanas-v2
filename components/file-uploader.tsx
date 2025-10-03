// Componente para subir archivos e imágenes
"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Image, Loader2, Clock } from 'lucide-react';
import { subirMultiplesArchivos, validarTamañoArchivo, validarTipoArchivo, TIPOS_ARCHIVOS_PERMITIDOS, TAMAÑOS_MAXIMOS } from '@/lib/utils/archivo-utils';
import type { ArchivoAdjunto, ImagenAdjunta } from '@/lib/types/booking-types';

// Tipo para archivos pendientes de subir
interface ArchivoPendiente {
  id: string;
  file: File;
  nombre: string;
  tamaño: number;
}

interface FileUploaderProps {
  bookingId?: string; // Opcional ahora, se proporcionará al subir
  tipo: 'archivos' | 'imagenes';
  archivosExistentes?: (ArchivoAdjunto | ImagenAdjunta)[];
  onArchivosChange?: (archivos: (ArchivoAdjunto | ImagenAdjunta)[]) => void;
  maxArchivos?: number;
}

// Ref para exponer métodos del componente
export interface FileUploaderRef {
  subirArchivosPendientes: (bookingId: string) => Promise<(ArchivoAdjunto | ImagenAdjunta)[]>;
  limpiarArchivosPendientes: () => void;
  obtenerArchivosFinales: () => (ArchivoAdjunto | ImagenAdjunta)[];
  obtenerArchivosEliminados: () => (ArchivoAdjunto | ImagenAdjunta)[];
}

export const FileUploader = forwardRef<FileUploaderRef, FileUploaderProps>(({ 
  bookingId, 
  tipo, 
  archivosExistentes = [], 
  onArchivosChange,
  maxArchivos = 5
}, ref) => {
  const [archivosSubidos, setArchivosSubidos] = useState<(ArchivoAdjunto | ImagenAdjunta)[]>(archivosExistentes);
  const [archivosPendientes, setArchivosPendientes] = useState<ArchivoPendiente[]>([]);
  const [archivosEliminados, setArchivosEliminados] = useState<(ArchivoAdjunto | ImagenAdjunta)[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [archivoActual, setArchivoActual] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const esImagen = tipo === 'imagenes';
  const tiposPermitidos = esImagen ? TIPOS_ARCHIVOS_PERMITIDOS.imagenes : TIPOS_ARCHIVOS_PERMITIDOS.documentos;
  const tamañoMaximo = esImagen ? TAMAÑOS_MAXIMOS.imagen : TAMAÑOS_MAXIMOS.archivo;

  // Función para subir archivos pendientes (llamada desde el formulario)
  const subirArchivosPendientes = async (finalBookingId: string): Promise<(ArchivoAdjunto | ImagenAdjunta)[]> => {
    if (archivosPendientes.length === 0) {
      return archivosSubidos;
    }

    setSubiendo(true);
    setProgreso(0);

    try {
      const archivosSubidosNuevos = await subirMultiplesArchivos(
        archivosPendientes.map(ap => ap.file),
        finalBookingId,
        tipo,
        (progreso, archivo) => {
          setProgreso(progreso);
          setArchivoActual(archivo);
        }
      );

      const todosLosArchivos = [...archivosSubidos, ...archivosSubidosNuevos];
      setArchivosSubidos(todosLosArchivos);
      setArchivosPendientes([]); // Limpiar pendientes después de subir
      onArchivosChange?.(todosLosArchivos);

      return todosLosArchivos;
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      throw error;
    } finally {
      setSubiendo(false);
      setProgreso(0);
      setArchivoActual('');
    }
  };

  // Función para limpiar archivos pendientes
  const limpiarArchivosPendientes = () => {
    setArchivosPendientes([]);
    setArchivosEliminados([]); // También limpiar archivos eliminados
  };

  // Función para obtener todos los archivos (subidos + pendientes convertidos)
  const obtenerArchivosFinales = (): (ArchivoAdjunto | ImagenAdjunta)[] => {
    return archivosSubidos;
  };

  // Función para obtener archivos eliminados
  const obtenerArchivosEliminados = (): (ArchivoAdjunto | ImagenAdjunta)[] => {
    return archivosEliminados;
  };

  // Exponer métodos a través de ref
  useImperativeHandle(ref, () => ({
    subirArchivosPendientes,
    limpiarArchivosPendientes,
    obtenerArchivosFinales,
    obtenerArchivosEliminados
  }));

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    const totalArchivos = archivosSubidos.length + archivosPendientes.length + files.length;
    
    // Validar número máximo de archivos
    if (totalArchivos > maxArchivos) {
      alert(`Máximo ${maxArchivos} archivos permitidos`);
      return;
    }

    // Validar cada archivo
    const archivosValidos: ArchivoPendiente[] = [];
    for (const file of files) {
      if (!validarTamañoArchivo(file, tamañoMaximo)) {
        alert(`El archivo ${file.name} es muy grande. Máximo ${tamañoMaximo}MB`);
        continue;
      }

      if (!validarTipoArchivo(file, tiposPermitidos)) {
        alert(`Tipo de archivo no permitido: ${file.name}`);
        continue;
      }

      // Crear archivo pendiente
      const archivoPendiente: ArchivoPendiente = {
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        nombre: file.name,
        tamaño: file.size
      };

      archivosValidos.push(archivoPendiente);
    }

    if (archivosValidos.length > 0) {
      const nuevosArchivosPendientes = [...archivosPendientes, ...archivosValidos];
      setArchivosPendientes(nuevosArchivosPendientes);
    }

    // Limpiar input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const eliminarArchivoPendiente = (id: string) => {
    const nuevosArchivosPendientes = archivosPendientes.filter(archivo => archivo.id !== id);
    setArchivosPendientes(nuevosArchivosPendientes);
  };

  const eliminarArchivoSubido = (id: string) => {
    const archivoAEliminar = archivosSubidos.find(archivo => archivo.id === id);
    const nuevosArchivosSubidos = archivosSubidos.filter(archivo => archivo.id !== id);
    
    // Agregar a la lista de archivos eliminados para eliminación posterior del storage
    if (archivoAEliminar) {
      setArchivosEliminados(prev => [...prev, archivoAEliminar]);
    }
    
    setArchivosSubidos(nuevosArchivosSubidos);
    onArchivosChange?.(nuevosArchivosSubidos);
  };

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalArchivos = archivosSubidos.length + archivosPendientes.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {esImagen ? (
            <>
              <Image className="h-5 w-5" />
              Subir Imágenes
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              Subir Archivos
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input de archivos */}
        <div className="space-y-2">
          <Label htmlFor={`file-input-${tipo}`}>
            {esImagen ? 'Seleccionar imágenes' : 'Seleccionar archivos'}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={`file-input-${tipo}`}
              ref={inputRef}
              type="file"
              multiple
              accept={tiposPermitidos.join(',')}
              onChange={handleFileSelect}
              disabled={subiendo || totalArchivos >= maxArchivos}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <span className="text-sm text-gray-500">
              {totalArchivos}/{maxArchivos}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Máximo {tamañoMaximo}MB por archivo. Tipos permitidos: {tiposPermitidos.join(', ')}
          </p>
        </div>

        {/* Progreso de subida */}
        {subiendo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Subiendo {archivoActual}...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">{progreso}% completado</p>
          </div>
        )}

        {/* Lista de archivos pendientes */}
        {archivosPendientes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Archivos pendientes de subir ({archivosPendientes.length})
            </h4>
            <div className="space-y-2">
              {archivosPendientes.map((archivo) => (
                <div key={archivo.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 bg-amber-100 rounded">
                      {esImagen ? (
                        <Image className="h-4 w-4 text-amber-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{archivo.nombre}</p>
                      <p className="text-xs text-gray-500">{formatearTamaño(archivo.tamaño)}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      Pendiente
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarArchivoPendiente(archivo.id)}
                    className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de archivos subidos */}
        {archivosSubidos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700 flex items-center gap-2">
              {esImagen ? (
                <>
                  <Image className="h-4 w-4" />
                  Imágenes subidas ({archivosSubidos.length})
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Archivos subidos ({archivosSubidos.length})
                </>
              )}
            </h4>
            <div className="space-y-2">
              {archivosSubidos.map((archivo) => (
                <div key={archivo.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 bg-green-100 rounded">
                      {esImagen ? (
                        <Image className="h-4 w-4 text-green-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{archivo.nombre}</p>
                      <p className="text-xs text-gray-500">{formatearTamaño(archivo.tamaño)}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      Subido
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(archivo.url, '_blank')}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarArchivoSubido(archivo.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {archivosSubidos.length === 0 && archivosPendientes.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            {esImagen ? (
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            ) : (
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            )}
            <p className="text-gray-600">
              {esImagen ? 'No hay imágenes seleccionadas' : 'No hay archivos seleccionados'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Haz clic en "Seleccionar {esImagen ? 'imágenes' : 'archivos'}" para comenzar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FileUploader.displayName = 'FileUploader';