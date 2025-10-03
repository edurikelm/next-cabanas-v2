import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

/**
 * API Route para probar la conexión con Firebase Storage
 * GET /api/test-storage
 */
export async function GET(request: NextRequest) {
  try {
    // Probar conexión listando archivos en la raíz
    const storageRef = ref(storage, '/');
    const result = await listAll(storageRef);
    
    // Obtener información de algunos archivos
    const fileInfo = await Promise.all(
      result.items.slice(0, 5).map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            hasUrl: !!url
          };
        } catch (error) {
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            error: 'No se pudo obtener URL'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Firebase Storage conectado correctamente',
      data: {
        totalItems: result.items.length,
        totalPrefixes: result.prefixes.length,
        sampleFiles: fileInfo,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Error en test-storage:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      details: {
        code: error.code,
        environment: process.env.NODE_ENV,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      }
    }, { status: 500 });
  }
}

/**
 * Probar subida de archivo de prueba
 * POST /api/test-storage
 */
export async function POST(request: NextRequest) {
  try {
    const { testFile } = await request.json();
    
    if (!testFile) {
      return NextResponse.json({
        success: false,
        error: 'No se proporcionó archivo de prueba'
      }, { status: 400 });
    }

    // Crear referencia de prueba
    const testRef = ref(storage, `test/${Date.now()}_test.txt`);
    
    return NextResponse.json({
      success: true,
      message: 'Referencia de Storage creada correctamente',
      data: {
        path: testRef.fullPath,
        name: testRef.name
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}