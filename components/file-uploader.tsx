// Componente para subir archivos e imágenes
"use client";

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Image, Loader2, Clock, Camera } from 'lucide-react';
import { subirMultiplesArchivos, validarTamañoArchivo, validarTipoArchivo, TIPOS_ARCHIVOS_PERMITIDOS, TAMAÑOS_MAXIMOS } from '@/lib/utils/archivo-utils';
import type { ArchivoAdjunto, ImagenAdjunta } from '@/lib/types/booking-types';
import { CameraCapture } from './camera-capture';

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
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const esImagen = tipo === 'imagenes';
  const tiposPermitidos = esImagen ? TIPOS_ARCHIVOS_PERMITIDOS.imagenes : TIPOS_ARCHIVOS_PERMITIDOS.documentos;
  const tamañoMaximo = esImagen ? TAMAÑOS_MAXIMOS.imagen : TAMAÑOS_MAXIMOS.archivo;

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const supportsCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      setIsMobile(isMobileDevice && hasTouch && supportsCamera);
    };
    
    checkMobile();
  }, []);

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

  // Función para manejar captura de cámara
  const handleCameraCapture = async (file: File) => {
    // Validar archivo capturado
    if (!validarTamañoArchivo(file, tamañoMaximo)) {
      alert(`La imagen capturada es muy grande. Máximo ${tamañoMaximo}MB`);
      return;
    }

    if (!validarTipoArchivo(file, tiposPermitidos)) {
      alert('Tipo de archivo no permitido');
      return;
    }

    const totalArchivos = archivosSubidos.length + archivosPendientes.length + 1;
    if (totalArchivos > maxArchivos) {
      alert(`Máximo ${maxArchivos} archivos permitidos`);
      return;
    }

    // Crear archivo pendiente
    const archivoPendiente: ArchivoPendiente = {
      id: `camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      nombre: file.name,
      tamaño: file.size
    };

    setArchivosPendientes(prev => [...prev, archivoPendiente]);
    
    // Notificar cambios
    const archivosActualizados = [...archivosSubidos];
    onArchivosChange?.(archivosActualizados);
    
    setShowCamera(false);
  };

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
    <Card className="w-full border-muted">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
          {esImagen ? (
            <>
              <Image className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-base">Subir Imágenes</span>
            </>
          ) : (
            <>
              <FileText className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-base">Subir Archivos</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-4 pt-0">
        {/* Botones de selección */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-xs sm:text-base font-medium">
            {esImagen ? 'Añadir imágenes' : 'Añadir archivos'}
          </Label>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo || totalArchivos >= maxArchivos}
              className="flex-1 h-8 sm:h-11 text-xs sm:text-base"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Seleccionar {esImagen ? 'imágenes' : 'archivos'}</span>
              <span className="sm:hidden">{esImagen ? 'Imágenes' : 'Archivos'}</span>
            </Button>
            
            {esImagen && isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCamera(true)}
                disabled={subiendo || totalArchivos >= maxArchivos}
                className="flex-1 sm:flex-initial camera-button h-8 sm:h-11"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Cámara</span>
                <span className="sm:hidden">📷</span>
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="hidden sm:inline">Máximo {tamañoMaximo}MB por archivo</span>
            <span className="sm:hidden">Max {tamañoMaximo}MB</span>
            <span>{totalArchivos}/{maxArchivos}</span>
          </div>
        </div>

        {/* Input oculto */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={tiposPermitidos.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

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
            <div className="space-y-1 sm:space-y-2">
              {archivosPendientes.map((archivo) => (
                <div key={archivo.id} className="file-list-item flex items-center justify-between p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    <div className="p-1 sm:p-2 bg-amber-100 rounded">
                      {esImagen ? (
                        <Image className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                      ) : (
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{archivo.nombre}</p>
                      <p className="text-xs text-gray-500">{formatearTamaño(archivo.tamaño)}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs px-1 py-0">
                      Pendiente
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarArchivoPendiente(archivo.id)}
                    className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 h-6 w-6 sm:h-8 sm:w-8 p-0"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de archivos subidos */}
        {archivosSubidos.length > 0 && (
          <div className="space-y-1 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-1 sm:gap-2">
              {esImagen ? (
                <>
                  <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Imágenes subidas ({archivosSubidos.length})</span>
                  <span className="sm:hidden">Imágenes ({archivosSubidos.length})</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Archivos subidos ({archivosSubidos.length})</span>
                  <span className="sm:hidden">Archivos ({archivosSubidos.length})</span>
                </>
              )}
            </h4>
            <div className="space-y-1 sm:space-y-2">
              {archivosSubidos.map((archivo) => (
                <div key={archivo.id} className="file-list-item flex items-center justify-between p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    <div className="p-1 sm:p-2 bg-green-100 rounded">
                      {esImagen ? (
                        <Image className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      ) : (
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{archivo.nombre}</p>
                      <p className="text-xs text-gray-500">{formatearTamaño(archivo.tamaño)}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs px-1 py-0">
                      Subido
                    </Badge>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(archivo.url, '_blank')}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100 h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarArchivoSubido(archivo.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100 h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
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
      
      {/* Componente de captura de cámara */}
      {esImagen && (
        <CameraCapture
          isOpen={showCamera}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </Card>
  );
});

FileUploader.displayName = 'FileUploader';