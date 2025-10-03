// Utilidades para manejo de archivos e imágenes en Firebase Storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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

/**
 * Elimina un archivo de Firebase Storage usando su URL
 */
export async function eliminarArchivo(url: string): Promise<void> {
  try {
    console.log(`🔍 Intentando eliminar archivo con URL:`, url);
    
    // Extraer la ruta del archivo desde la URL
    const urlObj = new URL(url);
    console.log(`🔍 URL parseada:`, {
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      search: urlObj.search
    });
    
    // Intentar diferentes patrones de URL de Firebase Storage
    let filePath: string | null = null;
    
    // Patrón 1: URLs con /o/ (formato estándar)
    const pathMatch1 = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch1) {
      filePath = decodeURIComponent(pathMatch1[1]);
      console.log(`✅ Ruta extraída con patrón 1:`, filePath);
    } else {
      // Patrón 2: URLs con /v0/b/[bucket]/o/
      const pathMatch2 = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+?)(\?|$)/);
      if (pathMatch2) {
        filePath = decodeURIComponent(pathMatch2[1]);
        console.log(`✅ Ruta extraída con patrón 2:`, filePath);
      } else {
        // Patrón 3: URLs directas del storage
        const pathMatch3 = urlObj.pathname.match(/\/([^\/]+\/[^\/]+\/[^\/]+\/.+)$/);
        if (pathMatch3) {
          filePath = decodeURIComponent(pathMatch3[1]);
          console.log(`✅ Ruta extraída con patrón 3:`, filePath);
        } else {
          // Patrón 4: Intentar extraer desde el query string si está en el token
          const searchParams = new URLSearchParams(urlObj.search);
          const token = searchParams.get('token');
          if (token) {
            // A veces la ruta está codificada en el token o en otro parámetro
            console.log(`🔍 Revisando token para extraer ruta:`, token);
          }
          
          // Patrón 5: Si nada funciona, intentar usar toda la pathname excepto el primer slash
          if (urlObj.pathname.length > 1) {
            filePath = urlObj.pathname.substring(1);
            console.log(`⚠️ Usando pathname completo como último recurso:`, filePath);
          }
        }
      }
    }
    
    if (!filePath) {
      console.error(`❌ No se pudo extraer la ruta del archivo. URL completa:`, url);
      throw new Error('No se pudo extraer la ruta del archivo de la URL');
    }
    
    console.log(`🗑️ Eliminando archivo de Storage:`, filePath);
    
    // Crear referencia y eliminar
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    console.log(`✅ Archivo eliminado exitosamente:`, filePath);
    
  } catch (error) {
    console.error(`❌ Error eliminando archivo:`, error);
    if (error instanceof Error && error.message.includes('object-not-found')) {
      console.log(`ℹ️ El archivo ya no existe en Storage, continuando...`);
      return; // No es un error crítico si el archivo ya no existe
    }
    throw new Error(`No se pudo eliminar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Elimina múltiples archivos de Firebase Storage
 */
export async function eliminarMultiplesArchivos(
  archivos: (ArchivoAdjunto | ImagenAdjunta)[],
  onProgress?: (progreso: number, archivo: string) => void
): Promise<void> {
  console.log(`🗑️ Iniciando eliminación de ${archivos.length} archivos del Storage`);
  
  let exitosos = 0;
  let fallidos = 0;
  
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    
    try {
      onProgress?.(Math.round(((i) / archivos.length) * 100), archivo.nombre);
      
      await eliminarArchivo(archivo.url);
      exitosos++;
      
      onProgress?.(Math.round(((i + 1) / archivos.length) * 100), archivo.nombre);
      
    } catch (error) {
      console.error(`Error eliminando archivo ${archivo.nombre}:`, error);
      fallidos++;
      // Continuar con los demás archivos en caso de error
    }
  }
  
  console.log(`✅ Eliminación completada: ${exitosos} exitosos, ${fallidos} fallidos`);
}