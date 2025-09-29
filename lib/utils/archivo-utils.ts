// Utilidades para manejo de archivos e imágenes en Firebase Storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/db/firebase';
import type { ArchivoAdjunto, ImagenAdjunta } from '@/lib/types/booking-types';

/**
 * Sube un archivo a Firebase Storage y retorna la información del archivo
 */
export async function subirArchivo(
  file: File, 
  bookingId: string,
  carpeta: 'archivos' | 'imagenes' = 'archivos'
): Promise<ArchivoAdjunto | ImagenAdjunta> {
  try {
    // Generar un ID único para el archivo
    const archivoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const extension = file.name.split('.').pop() || '';
    const nombreArchivo = `${archivoId}.${extension}`;
    
    // Crear la ruta en Storage
    const rutaArchivo = `arriendos/${bookingId}/${carpeta}/${nombreArchivo}`;
    const storageRef = ref(storage, rutaArchivo);
    
    console.log(`📤 Subiendo ${carpeta.slice(0, -1)} a:`, rutaArchivo);
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const archivoInfo = {
      id: archivoId,
      nombre: file.name,
      url: downloadURL,
      tipo: file.type,
      tamaño: file.size,
      fechaSubida: new Date()
    };
    
    console.log(`✅ ${carpeta.slice(0, -1)} subido exitosamente:`, archivoInfo);
    
    return archivoInfo;
    
  } catch (error) {
    console.error(`❌ Error subiendo ${carpeta.slice(0, -1)}:`, error);
    throw new Error(`No se pudo subir el ${carpeta.slice(0, -1)}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Sube múltiples archivos
 */
export async function subirMultiplesArchivos(
  files: File[], 
  bookingId: string,
  carpeta: 'archivos' | 'imagenes' = 'archivos',
  onProgress?: (progreso: number, archivo: string) => void
): Promise<(ArchivoAdjunto | ImagenAdjunta)[]> {
  const resultados: (ArchivoAdjunto | ImagenAdjunta)[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      onProgress?.(Math.round(((i) / files.length) * 100), file.name);
      
      const resultado = await subirArchivo(file, bookingId, carpeta);
      resultados.push(resultado);
      
      onProgress?.(Math.round(((i + 1) / files.length) * 100), file.name);
      
    } catch (error) {
      console.error(`Error subiendo archivo ${file.name}:`, error);
      // Continuar con los demás archivos en caso de error
    }
  }
  
  return resultados;
}

/**
 * Valida que un archivo sea una imagen
 */
export function esImagen(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Valida el tamaño del archivo
 */
export function validarTamañoArchivo(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Valida que el tipo de archivo sea permitido
 */
export function validarTipoArchivo(file: File, tiposPermitidos: string[]): boolean {
  return tiposPermitidos.some(tipo => file.type.includes(tipo));
}

/**
 * Tipos de archivo permitidos por categoría
 */
export const TIPOS_ARCHIVOS_PERMITIDOS = {
  imagenes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documentos: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  todos: ['image/', 'application/pdf', 'application/msword', 'text/plain']
};

/**
 * Tamaños máximos recomendados (en MB)
 */
export const TAMAÑOS_MAXIMOS = {
  imagen: 5,  // 5MB para imágenes
  archivo: 10 // 10MB para documentos
};