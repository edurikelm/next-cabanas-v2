"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Calendar, Download, AlertCircle, CheckCircle, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useArriendoOperaciones } from '@/lib/hooks/useFirestore';
import { useAvailableCabanas } from '@/lib/cabanas';
import { Booking } from '@/lib/types/booking-types';

interface AirbnbReservation {
  id: string;
  cabana: string;
  cliente: string;
  celular: string;
  email?: string;
  start: Date | string;
  end: Date | string;
  valorNoche: number;
  valorTotal: number;
  observaciones?: string;
  fuente: 'airbnb' | 'local';
  airbnbId?: string;
  sincronizadoEn: Date | string;
}

interface SyncResult {
  total: number;
  success: number;
  errors: string[];
  reservations: any[];
}

export function ICalendarSync() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'sync' | 'complete'>('upload');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [icalUrl, setICalUrl] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { crear } = useArriendoOperaciones();
  const { cabanas: availableCabanas } = useAvailableCabanas();

  // Función para convertir AirbnbReservation a Booking
  const convertToBooking = (airbnbRes: AirbnbReservation): Omit<Booking, 'id'> => {
    // Asegurar que las fechas sean objetos Date
    const startDate = typeof airbnbRes.start === 'string' ? new Date(airbnbRes.start) : airbnbRes.start;
    const endDate = typeof airbnbRes.end === 'string' ? new Date(airbnbRes.end) : airbnbRes.end;
    
    // Validar fechas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(`Fechas inválidas: ${airbnbRes.start} - ${airbnbRes.end}`);
    }
    
    const cantDias = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      title: airbnbRes.cliente,
      cabana: airbnbRes.cabana,
      cantDias: cantDias,
      cantPersonas: 2, // Valor por defecto ya que Airbnb no siempre proporciona esta info
      celular: airbnbRes.celular || '',
      descuento: "sin-descuento",
      end: endDate,
      start: startDate,
      pago: true, // Asumimos que reservas de Airbnb están pagadas
      ubicacion: airbnbRes.cabana,
      valorNoche: airbnbRes.valorNoche,
      valorTotal: airbnbRes.valorTotal,
      esMensual: false, // Reservas de Airbnb son típicamente por días, no mensuales
      archivos: [], // Reservas de Airbnb no incluyen archivos adjuntos
      imagenes: [], // Reservas de Airbnb no incluyen imágenes adjuntas
      comentarios: '' // Sin comentarios adicionales por defecto
    };
  };

  const resetDialog = () => {
    setStep('upload');
    setLoading(false);
    setProgress(0);
    setICalUrl('');
    setPreviewData(null);
    setSyncResult(null);
    setError('');
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/sync-icalendar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el archivo');
      }

      const data = await response.json();
      
      if (data.reservations.length === 0) {
        throw new Error('No se encontraron reservaciones válidas en el archivo');
      }

      setPreviewData({
        filename: file.name,
        totalReservations: data.reservations.length,
        reservations: data.reservations
      });
      
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSync = async () => {
    if (!icalUrl.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sync-icalendar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: icalUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo descargar el archivo desde la URL');
      }

      const data = await response.json();
      
      if (data.reservations.length === 0) {
        throw new Error('No se encontraron reservaciones válidas en el archivo');
      }

      setPreviewData({
        filename: 'Archivo desde URL',
        totalReservations: data.reservations.length,
        reservations: data.reservations
      });
      
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!previewData) return;

    setLoading(true);
    setStep('sync');
    setProgress(0);

    const result: SyncResult = {
      total: previewData.reservations.length,
      success: 0,
      errors: [],
      reservations: []
    };

    try {
      for (let i = 0; i < previewData.reservations.length; i++) {
        const airbnbReservation = previewData.reservations[i] as AirbnbReservation;
        setProgress(((i + 1) / previewData.reservations.length) * 100);

        try {
          // Convertir de AirbnbReservation a Booking con validación de fechas
          const bookingData = convertToBooking(airbnbReservation);
          console.log(airbnbReservation);
          const docId = await crear(bookingData);
          result.success++;
          result.reservations.push({ ...airbnbReservation, id: docId });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          console.error(`Error procesando reservación ${i + 1}:`, err);
          console.error('Datos de la reservación:', airbnbReservation);
          result.errors.push(`Error en reservación ${i + 1}: ${errorMessage}`);
        }
      }

      setSyncResult(result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la sincronización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Sincronizar iCalendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sincronización iCalendar</DialogTitle>
          <DialogDescription>
            Importa reservaciones desde un archivo iCalendar (.ics) de Airbnb
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Paso 1: Cargar archivo */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Cargar archivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Cargar archivo iCalendar
                </CardTitle>
                <CardDescription>
                  Selecciona el archivo .ics descargado desde Airbnb
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? 'Procesando...' : 'Seleccionar archivo .ics'}
                </Button>
              </CardContent>
            </Card>

            {/* O sincronizar desde URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Sincronizar desde URL
                </CardTitle>
                <CardDescription>
                  Ingresa la URL del calendario iCalendar de Airbnb
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ical-url">URL del calendario</Label>
                  <Input
                    id="ical-url"
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    value={icalUrl}
                    onChange={(e) => setICalUrl(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUrlSync}
                  disabled={loading || !icalUrl.trim()}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? 'Descargando...' : 'Sincronizar desde URL'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 2: Vista previa */}
        {step === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Vista previa</h3>
              <Badge variant="secondary">
                {previewData.totalReservations} reservaciones
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Archivo: {previewData.filename}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {previewData.reservations.map((reservation: AirbnbReservation, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{reservation.cliente}</p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.cabana || 'Sin cabaña asignada'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(reservation.start), 'dd MMM', { locale: es })} - {' '}
                          {format(new Date(reservation.end), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          ${reservation.valorTotal?.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={() => setStep('upload')} variant="outline">
                Volver
              </Button>
              <Button onClick={handleSync} className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Sincronizar reservaciones
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Sincronización */}
        {step === 'sync' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Sincronizando...</h3>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(progress)}% completado
              </p>
            </div>
          </div>
        )}

        {/* Paso 4: Resultados */}
        {step === 'complete' && syncResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold">Sincronización completa</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded">
                <p className="text-2xl font-bold">{syncResult.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-2xl font-bold text-green-600">{syncResult.success}</p>
                <p className="text-sm text-green-600">Exitosas</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-2xl font-bold text-red-600">{syncResult.errors.length}</p>
                <p className="text-sm text-red-600">Errores</p>
              </div>
            </div>

            {syncResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Errores encontrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto">
                    {syncResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 mb-1">
                        • {error}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => setIsOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}