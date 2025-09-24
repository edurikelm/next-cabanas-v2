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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ics')) {
      setError('Por favor selecciona un archivo .ics válido');
      return;
    }

    await processFile(file);
  };

  const handleUrlSync = async () => {
    if (!icalUrl.trim()) {
      setError('Por favor ingresa una URL válida');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sync-icalendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icalUrl: icalUrl.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar desde URL');
      }

      setPreviewData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la URL');
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError('');
    setProgress(25);

    try {
      const fileContent = await file.text();
      setProgress(50);

      const response = await fetch('/api/sync-icalendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icalContent: fileContent })
      });

      const data = await response.json();
      setProgress(75);
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el archivo');
      }

      setPreviewData(data);
      setProgress(100);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleSync = async () => {
    if (!previewData?.data?.bookings) return;

    setLoading(true);
    setStep('sync');
    setProgress(0);

    const bookings = previewData.data.bookings;
    const results: SyncResult = {
      total: bookings.length,
      success: 0,
      errors: [],
      reservations: []
    };

    try {
      for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        setProgress((i / bookings.length) * 100);

        try {
          // Validar y normalizar las fechas antes de crear el arriendo
          const normalizedBooking = {
            ...booking,
            start: new Date(booking.start),
            end: new Date(booking.end),
          };

          // Verificar que las fechas sean válidas
          if (isNaN(normalizedBooking.start.getTime())) {
            throw new Error(`Fecha de inicio inválida: ${booking.start}`);
          }
          
          if (isNaN(normalizedBooking.end.getTime())) {
            throw new Error(`Fecha de fin inválida: ${booking.end}`);
          }

          console.log('Creando arriendo con fechas:', {
            title: normalizedBooking.title,
            start: normalizedBooking.start,
            end: normalizedBooking.end,
            startType: typeof normalizedBooking.start,
            endType: typeof normalizedBooking.end
          });

          const createdBooking = await crear(normalizedBooking);
          results.success++;
          results.reservations.push(createdBooking);
        } catch (error) {
          const errorMsg = `Error en reserva ${booking.title}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          results.errors.push(errorMsg);
          console.error('Error creating booking:', error);
        }
      }

      setProgress(100);
      setSyncResult(results);
      setStep('complete');
    } catch (error) {
      setError('Error durante la sincronización');
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('upload');
    setPreviewData(null);
    setSyncResult(null);
    setError('');
    setProgress(0);
    setICalUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Sincronizar Airbnb
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sincronizar reservas de Airbnb</DialogTitle>
          <DialogDescription>
            Importa reservas desde un archivo iCalendar (.ics) de Airbnb
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Subir archivo .ics
                </CardTitle>
                <CardDescription>
                  Descarga el archivo iCalendar desde tu panel de Airbnb
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                {loading && progress > 0 && (
                  <div className="mt-3">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-gray-600 mt-1">Procesando archivo...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center text-gray-500">
              <span>O</span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Sincronizar desde URL
                </CardTitle>
                <CardDescription>
                  URL de iCalendar de Airbnb para sincronización automática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="ical-url">URL de iCalendar</Label>
                  <Input
                    id="ical-url"
                    placeholder="https://airbnb.com/calendar/ical/..."
                    value={icalUrl}
                    onChange={(e) => setICalUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button 
                  onClick={handleUrlSync} 
                  disabled={loading || !icalUrl.trim()}
                  className="w-full"
                >
                  {loading ? 'Sincronizando...' : 'Sincronizar desde URL'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Previsualización</h3>
              <Badge variant="outline">
                {previewData.data.summary.total} reservas encontradas
              </Badge>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total de reservas:</span> {previewData.data.summary.total}
                  </div>
                  <div>
                    <span className="font-medium">Cabañas:</span> {previewData.data.summary.cabanas.length}
                  </div>
                </div>
                
                {previewData.data.summary.cabanas.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">Cabañas encontradas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.data.summary.cabanas.map((cabana: string) => (
                        <Badge key={cabana} variant="secondary" className="text-xs">
                          {cabana}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {previewData.data.reservations.slice(0, 10).map((reservation: any, index: number) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{reservation.cliente}</h4>
                        <p className="text-sm text-gray-600">{reservation.cabana}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(reservation.start), 'dd/MM/yyyy', { locale: es })} - {' '}
                          {format(new Date(reservation.end), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${reservation.valorTotal.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          ${reservation.valorNoche.toLocaleString()}/noche
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {previewData.data.reservations.length > 10 && (
                <p className="text-center text-sm text-gray-500">
                  ... y {previewData.data.reservations.length - 10} reservas más
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSync} className="flex-1">
                Sincronizar Reservas
              </Button>
            </div>
          </div>
        )}

        {step === 'sync' && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Download className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-semibold">Sincronizando reservas...</h3>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-gray-600">
              Importando reservas a tu calendario
            </p>
          </div>
        )}

        {step === 'complete' && syncResult && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Sincronización completada</h3>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total procesadas:</span> {syncResult.total}
                  </div>
                  <div>
                    <span className="font-medium text-green-600">Sincronizadas:</span> {syncResult.success}
                  </div>
                </div>
                {syncResult.errors.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-red-600">Errores:</span> {syncResult.errors.length}
                    <div className="mt-1 text-xs text-red-600 max-h-20 overflow-y-auto">
                      {syncResult.errors.map((error, i) => (
                        <div key={i}>• {error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={() => setIsOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}