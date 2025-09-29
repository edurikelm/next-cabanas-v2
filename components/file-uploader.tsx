// Componente para subir archivos e imágenes
"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { subirMultiplesArchivos, validarTamañoArchivo, validarTipoArchivo, TIPOS_ARCHIVOS_PERMITIDOS, TAMAÑOS_MAXIMOS } from '@/lib/utils/archivo-utils';
import type { ArchivoAdjunto, ImagenAdjunta } from '@/lib/types/booking-types';

interface FileUploaderProps {
  bookingId: string;
  tipo: 'archivos' | 'imagenes';
  archivosExistentes?: (ArchivoAdjunto | ImagenAdjunta)[];
  onArchivosSubidos?: (archivos: (ArchivoAdjunto | ImagenAdjunta)[]) => void;
  maxArchivos?: number;
}

export function FileUploader({ 
  bookingId, 
  tipo, 
  archivosExistentes = [], 
  onArchivosSubidos,
  maxArchivos = 5
}: FileUploaderProps) {
  const [archivos, setArchivos] = useState<(ArchivoAdjunto | ImagenAdjunta)[]>(archivosExistentes);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [archivoActual, setArchivoActual] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const esImagen = tipo === 'imagenes';
  const tiposPermitidos = esImagen ? TIPOS_ARCHIVOS_PERMITIDOS.imagenes : TIPOS_ARCHIVOS_PERMITIDOS.documentos;
  const tamañoMaximo = esImagen ? TAMAÑOS_MAXIMOS.imagen : TAMAÑOS_MAXIMOS.archivo;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validar número máximo de archivos
    if (archivos.length + files.length > maxArchivos) {
      alert(`Máximo ${maxArchivos} archivos permitidos`);
      return;
    }

    // Validar cada archivo
    const archivosValidos: File[] = [];
    for (const file of files) {
      if (!validarTamañoArchivo(file, tamañoMaximo)) {
        alert(`El archivo ${file.name} es muy grande. Máximo ${tamañoMaximo}MB`);
        continue;
      }

      if (!validarTipoArchivo(file, tiposPermitidos)) {
        alert(`Tipo de archivo no permitido: ${file.name}`);
        continue;
      }

      archivosValidos.push(file);
    }

    if (archivosValidos.length === 0) return;

    setSubiendo(true);
    setProgreso(0);

    try {
      const archivosSubidos = await subirMultiplesArchivos(
        archivosValidos,
        bookingId,
        tipo,
        (progreso, archivo) => {
          setProgreso(progreso);
          setArchivoActual(archivo);
        }
      );

      const nuevosArchivos = [...archivos, ...archivosSubidos];
      setArchivos(nuevosArchivos);
      onArchivosSubidos?.(nuevosArchivos);

    } catch (error) {
      console.error('Error subiendo archivos:', error);
      alert('Error subiendo archivos');
    } finally {
      setSubiendo(false);
      setProgreso(0);
      setArchivoActual('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const eliminarArchivo = (id: string) => {
    const nuevosArchivos = archivos.filter(archivo => archivo.id !== id);
    setArchivos(nuevosArchivos);
    onArchivosSubidos?.(nuevosArchivos);
  };

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {esImagen ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          {esImagen ? 'Imágenes' : 'Documentos'}
          <Badge variant="outline">
            {archivos.length}/{maxArchivos}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input para subir archivos */}
        <div className="space-y-2">
          <Label htmlFor={`file-upload-${tipo}`}>
            Seleccionar {esImagen ? 'imágenes' : 'documentos'}
          </Label>
          <Input
            ref={inputRef}
            id={`file-upload-${tipo}`}
            type="file"
            multiple
            accept={tiposPermitidos.join(',')}
            onChange={handleFileSelect}
            disabled={subiendo || archivos.length >= maxArchivos}
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-500">
            Máximo {tamañoMaximo}MB por archivo. 
            Tipos permitidos: {esImagen ? 'JPG, PNG, GIF, WebP' : 'PDF, Word, TXT'}
          </p>
        </div>

        {/* Indicador de progreso */}
        {subiendo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Subiendo: {archivoActual}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-center">{progreso}%</p>
          </div>
        )}

        {/* Lista de archivos */}
        {archivos.length > 0 && (
          <div className="space-y-2">
            <Label>Archivos subidos:</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {archivos.map((archivo) => (
                <div key={archivo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {esImagen ? (
                      <Image className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{archivo.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {formatearTamaño(archivo.tamaño)} • {archivo.fechaSubida.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(archivo.url, '_blank')}
                    >
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarArchivo(archivo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón para subir más archivos */}
        {!subiendo && archivos.length < maxArchivos && (
          <Button
            onClick={() => inputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Agregar más {esImagen ? 'imágenes' : 'documentos'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}