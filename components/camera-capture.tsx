"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onCancel, isOpen }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      setError('No se pudo acceder a la cámara');
      // Fallback a input file si no hay acceso a cámara
      fallbackToFileInput();
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `foto-${timestamp}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            handleClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    stopCamera();
    
    // Pequeña pausa antes de reiniciar
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const fallbackToFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        onCapture(files[0]);
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const handleClose = () => {
    stopCamera();
    onCancel();
  };

  // Detectar si es dispositivo móvil y soporta getUserMedia
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const supportsCamera = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  // Iniciar cámara cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && supportsCamera) {
      startCamera();
    }
    
    return () => {
      if (isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, facingMode]);

  // Si no es móvil o no soporta getUserMedia, usar input file
  if (!isMobile || !supportsCamera) {
    if (isOpen) {
      fallbackToFileInput();
      onCancel();
    }
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-center">📷 Capturar Imagen</DialogTitle>
        </DialogHeader>
        
        <div className="relative bg-black">
          {isLoading && (
            <div className="flex items-center justify-center h-64 bg-gray-900">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Iniciando cámara...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-64 bg-gray-900">
              <div className="text-center text-white">
                <p className="text-sm mb-2">⚠️ {error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fallbackToFileInput}
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Seleccionar archivo
                </Button>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-64 bg-black object-cover ${isLoading || error ? 'hidden' : 'block'}`}
          />
          
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Controles superpuestos */}
          {!isLoading && !error && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 px-4">
              <Button
                variant="outline"
                size="icon"
                onClick={switchCamera}
                className="bg-white/90 hover:bg-white border-0 backdrop-blur-sm"
                title="Cambiar cámara"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                size="lg"
                onClick={capturePhoto}
                className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16 border-0"
                title="Capturar foto"
              >
                <Camera className="h-6 w-6" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleClose}
                className="bg-white/90 hover:bg-white border-0 backdrop-blur-sm"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Toca el botón de cámara para capturar la imagen
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}