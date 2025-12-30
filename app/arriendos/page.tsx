"use client";

import { useState } from "react";
import { Home, Users, PhoneCall, DollarSign, MapPin, Settings, Plus, Edit, Trash2, Eye, FileText, Image, Download, ExternalLink, User, Phone, Calendar, MessageSquare, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCabanas } from "@/lib/hooks/useCabanas";
import { useArriendos, useArriendoOperaciones } from "@/lib/hooks/useFirestore";
import { BookingForm } from "@/components/booking-form";
import { BookingDetail } from "@/components/booking-detail";
import type { Booking, ArchivoAdjunto, ImagenAdjunta } from "@/lib/types/booking-types";

export default function CabanasPage() {
  const { data: cabanas, loading, error, recargar } = useCabanas();
  const { data: arriendos, loading: loadingArriendos, error: errorArriendos, recargar: recargarArriendos } = useArriendos();
  const { eliminar } = useArriendoOperaciones();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [nuevoArriendomMensual, setNuevoArriendomMensual] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [arriendoDetalle, setArriendoDetalle] = useState<Booking | null>(null);

  // Obtener arriendos actuales (que están en curso hoy) - solo diarios
  const getArriendosActuales = () => {
    if (!arriendos) return [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return arriendos.filter(arriendo => {
      const inicio = new Date(arriendo.start);
      const fin = new Date(arriendo.end);
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      
      // Filtrar solo arriendos diarios (no mensuales) que están en curso hoy
      return hoy >= inicio && hoy <= fin && !arriendo.esMensual;
    });
  };

  // Obtener arriendos futuros (que comienzan después de hoy) - solo diarios
  const getArriendosProximos = () => {
    if (!arriendos) return [];
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    return arriendos.filter(arriendo => {
      const inicio = new Date(arriendo.start);
      inicio.setHours(0, 0, 0, 0);
      
      // Filtrar solo arriendos diarios (no mensuales) que empiezan después de hoy
      return inicio > hoy && !arriendo.esMensual;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()); // Ordenar por fecha de inicio (más cercanos primero)
  };

  // Obtener arriendos mensuales (todos los que tienen esMensual = true)
  const getArriendosMensuales = () => {
    if (!arriendos) return [];
    return arriendos.filter(arriendo => arriendo.esMensual === true)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // Más recientes primero
  };

  const arriendosActuales = getArriendosActuales();
  const arriendosProximos = getArriendosProximos();
  const arriendosMensuales = getArriendosMensuales();

  // Componente para mostrar archivos adjuntos
  const ArchivosViewer = ({ archivos }: { archivos: ArchivoAdjunto[] }) => {
    if (!archivos || archivos.length === 0) return null;

    const getFileIcon = (fileName: string) => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          return '📄';
        case 'docx':
        case 'doc':
          return '📝';
        case 'xlsx':
        case 'xls':
          return '📊';
        case 'pptx':
        case 'ppt':
          return '📽️';
        default:
          return '📎';
      }
    };

    const canPreview = (fileName: string) => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      return ['pdf', 'docx', 'doc'].includes(extension || '');
    };

    const getPreviewUrl = (archivo: ArchivoAdjunto) => {
      const extension = archivo.nombre.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        return archivo.url;
      } else if (['docx', 'doc'].includes(extension || '')) {
        // Usar Google Docs Viewer para archivos de Word
        return `https://docs.google.com/gviewapi=v1&embedded=true&url=${encodeURIComponent(archivo.url)}`;
      }
      return null;
    };

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Archivos adjuntos ({archivos.length})
        </h5>
        <div className="space-y-1">
          {archivos.map((archivo) => {
            const previewUrl = getPreviewUrl(archivo);
            
            return (
              <div key={archivo.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded transition-colors">
                <span className="text-lg">{getFileIcon(archivo.nombre)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{archivo.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {(archivo.tamaño / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-1">
                  {canPreview(archivo.nombre) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 w-7 flex items-center justify-center p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span className="text-lg">{getFileIcon(archivo.nombre)}</span>
                            {archivo.nombre}
                          </DialogTitle>
                          <DialogDescription>
                            Previsualización del archivo - Tamaño: {(archivo.tamaño / 1024 / 1024).toFixed(2)} MB
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 min-h-0">
                          {previewUrl && (
                            <iframe
                              src={previewUrl}
                              className="w-full h-full border rounded"
                              title={`Preview de ${archivo.nombre}`}
                            />
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => window.open(archivo.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir en nueva pestaña
                          </Button>
                          <Button onClick={() => window.open(archivo.url, '_blank')}>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 w-7 flex items-center justify-center p-0"
                    onClick={() => window.open(archivo.url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando cabañas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error al cargar las cabañas:</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => {
            recargar(); // Recargar cabañas
            recargarArriendos(); // Recargar arriendos
          }}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Cabañas</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            recargar(); // Recargar cabañas
            recargarArriendos(); // Recargar arriendos
          }} variant="outline">
            Recargar
          </Button>
        </div>
      </div>

      {/* Arriendos Actuales y Próximos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Arriendos Actuales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Arriendos Diarios Activos
            </CardTitle>
            <CardDescription>
              {arriendosActuales.length} {arriendosActuales.length === 1 ? 'arriendo diario activo' : 'arriendos diarios activos'} hoy
            </CardDescription>
          </CardHeader>
        <CardContent>
          {loadingArriendos ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando arriendos...</p>
              </div>
            </div>
          ) : errorArriendos ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Error al cargar arriendos:</p>
              <p className="text-sm text-gray-600">{errorArriendos}</p>
            </div>
          ) : arriendosActuales.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay arriendos diarios activos hoy</p>
              <p className="text-sm text-gray-400 mt-1">Las cabañas están disponibles para arriendos diarios</p>
            </div>
          ) : (
            <div className="space-y-2">
              {arriendosActuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasRestantes = Math.ceil((fin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 border rounded-lg hover:shadow-sm transition-shadow">
                    {/* Info principal */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                      {/* Primera fila móvil: Cabaña + Arrendatario */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-sm whitespace-nowrap">{arriendo.cabana}</div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <div className="font-medium text-sm truncate">{arriendo.title}</div>
                      </div>
                      
                      {/* Segunda fila móvil: Resto de info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">{format(inicio, 'dd MMM', { locale: es })} - {format(fin, 'dd MMM', { locale: es })}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">${arriendo.valorTotal.toLocaleString()}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Badge variant={arriendo.pago ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                          {arriendo.pago ? '✓' : '⚠'}
                        </Badge>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Badge variant={diasRestantes <= 1 ? "destructive" : diasRestantes <= 3 ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                          {diasRestantes <= 0 ? 'Hoy' : `${diasRestantes}d`}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 flex-1 sm:flex-none"
                        onClick={() => {
                          setArriendoDetalle(arriendo);
                          setDetalleOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 sm:mr-1" />
                      </Button>
                      {arriendo.celular && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 flex-1 sm:flex-none"
                            onClick={() => {
                              const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                              window.open(`https://wa.me/56${phoneNumber}`, '_blank');
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5 sm:mr-1" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 flex-1 sm:flex-none"
                            onClick={() => {
                              const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                              window.open(`tel:+56${phoneNumber}`, '_self');
                            }}
                          >
                            <PhoneCall className="h-3.5 w-3.5 sm:mr-1" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arriendos Próximos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Arriendos Diarios
          </CardTitle>
          <CardDescription>
            {arriendosProximos.length} {arriendosProximos.length === 1 ? 'arriendo próximo' : 'arriendos próximos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingArriendos ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando arriendos...</p>
              </div>
            </div>
          ) : errorArriendos ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Error al cargar arriendos:</p>
              <p className="text-sm text-gray-600">{errorArriendos}</p>
            </div>
          ) : arriendosProximos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay arriendos próximos programados</p>
              <p className="text-sm text-gray-400 mt-1">Los próximos arriendos aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-2">
              {arriendosProximos.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasHastaInicio = Math.ceil((inicio.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 border rounded-lg hover:shadow-sm transition-shadow">
                    {/* Info principal */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                      {/* Primera fila móvil: Cabaña + Arrendatario */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-sm whitespace-nowrap">{arriendo.cabana}</div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <div className="font-medium text-sm truncate">{arriendo.title}</div>
                      </div>
                      
                      {/* Segunda fila móvil: Resto de info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">{format(inicio, 'dd MMM', { locale: es })} - {format(fin, 'dd MMM', { locale: es })}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">${arriendo.valorTotal.toLocaleString()}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Badge variant={arriendo.pago ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                          {arriendo.pago ? '✓' : '⚠'}
                        </Badge>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                          {diasHastaInicio === 1 ? 'Mañana' : `En ${diasHastaInicio}d`}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 flex-1 sm:flex-none"
                        onClick={() => {
                          setArriendoDetalle(arriendo);
                          setDetalleOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 sm:mr-1" />
                      </Button>
                      {arriendo.celular && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 flex-1 sm:flex-none"
                            onClick={() => {
                              const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                              window.open(`https://wa.me/56${phoneNumber}`, '_blank');
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5 sm:mr-1" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 flex-1 sm:flex-none"
                            onClick={() => {
                              const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                              window.open(`tel:+56${phoneNumber}`, '_self');
                            }}
                          >
                            <PhoneCall className="h-3.5 w-3.5 sm:mr-1" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

      {/* Arriendos Mensuales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Cabañas Arrendadas Mensualmente</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {arriendosMensuales.length} activas
            </Badge>
            <Button 
              onClick={() => {
                setEditing(null);
                setNuevoArriendomMensual(true);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Arriendo
            </Button>
          </div>
        </div>

        {loadingArriendos ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Cargando arriendos mensuales...</p>
            </div>
          </div>
        ) : errorArriendos ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error al cargar arriendos mensuales:</p>
            <p className="text-sm text-gray-600">{errorArriendos}</p>
          </div>
        ) : arriendosMensuales.length === 0 ? (
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay arriendos mensuales registrados</p>
            <p className="text-sm text-gray-400 mt-1">Los arriendos mensuales aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {arriendosMensuales.map((arriendo) => {
              const inicio = new Date(arriendo.start);
              const fin = new Date(arriendo.end);
              const enCurso = new Date() >= inicio && new Date() <= fin;
              const hasArchivos = arriendo.archivos && arriendo.archivos.length > 0;
              const hasImagenes = arriendo.imagenes && arriendo.imagenes.length > 0;
              
              return (
                <Card key={arriendo.id} className="overflow-hidden bg-gradient-to-r from-green-50 to-green-50 dark:from-green-900/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800 gap-2">
                  <CardHeader className="">
                    <div className="flex items-start justify-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        <CardTitle className="text-base text-green-600 truncate uppercase">{arriendo.cabana}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="space-y-2.5">
                    {/* Contact info in compact grid */}
                    <div className="grid grid-cols-2 gap-x-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{arriendo.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-xs truncate">
                          {arriendo.celular ? `+56 9 ${arriendo.celular}` : 'Sin teléfono'}
                        </span>
                      </div>
                    </div>

                    {/* Dates and price in compact layout */}
                    <div className="grid grid-cols-2 gap-x-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {format(inicio, 'dd MMM yyy', { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-foreground shrink-0">
                        <span className="text-muted-foreground">Mes:</span>
                        <span className="text-sm font-semibold">${(arriendo.valorTotal).toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    {/* Comments section - compact */}
                    {arriendo.comentarios && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Comentarios</span>
                        </div>
                        <div className="bg-green-200 dark:bg-green-100 border rounded p-2 mt-2">
                          <p className="text-xs text-green-900 leading-snug line-clamp-2">{arriendo.comentarios}</p>
                        </div>
                      </div>
                    )}

                    {/* Documents section - compact badges */}
                    {hasArchivos && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Documentos ({arriendo.archivos!.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1 bg-green-200 dark:bg-green-100 border rounded p-2 mt-2">
                          {arriendo.archivos!.map((archivo, index) => (
                            <Dialog key={archivo.id}>
                              <DialogTrigger asChild>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal cursor-pointer bg-muted">
                                  {archivo.nombre.length > 20 ? archivo.nombre.substring(0, 20) + "..." : archivo.nombre}
                                </Badge>
                              </DialogTrigger>
                              <DialogContent className="max-w-full">
                                <DialogHeader>
                                  <DialogTitle>{archivo.nombre}</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 flex justify-center items-center h-[70vh]">
                                  <iframe
                                    src={archivo.url}
                                    className="w-full h-full border rounded"
                                    title={archivo.nombre}
                                    
                                  />
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const mensaje = `Hola ${arriendo.title}, te envío el documento: ${archivo.nombre} relacionado con tu arriendo de ${arriendo.cabana}. ${archivo.url}`;
                                        const whatsappUrl = `https://wa.me/569${arriendo.celular}?text=${encodeURIComponent(mensaje)}`;
                                        window.open(whatsappUrl, '_blank');
                                      }}
                                      className="gap-2"
                                    >
                                      <span className="text-green-600">📱</span>
                                      Enviar por WhatsApp
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const subject = `Documento: ${archivo.nombre} - Arriendo ${arriendo.cabana}`;
                                        const body = `Estimado/a ${arriendo.title},\n\nAdjunto encontrarás el documento "${archivo.nombre}" relacionado con tu arriendo de la cabaña ${arriendo.cabana}.\n\nPuedes acceder al documento en el siguiente enlace:\n${archivo.url}\n\nSaludos cordiales.`;
                                        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                        window.open(mailtoUrl, '_blank');
                                      }}
                                      className="gap-2"
                                    >
                                      <span>📧</span>
                                      Enviar por Email
                                    </Button>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(archivo.url, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Abrir en nueva pestaña
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = archivo.url;
                                        link.download = archivo.nombre;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Descargar
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images section - compact thumbnails */}
                    {hasImagenes && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Image className="h-3.5 w-3.5" />
                          <span>Imágenes ({arriendo.imagenes!.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 bg-green-200 dark:bg-green-100 border rounded p-2 mt-2">
                          {arriendo.imagenes!.map((imagen, index) => (
                            <Dialog key={imagen.id}>
                              <DialogTrigger asChild>
                                <div className="h-14 w-14 overflow-hidden rounded border border-border bg-muted shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                  <img
                                    src={imagen.urlThumbnail || imagen.url || "/placeholder.svg"}
                                    alt={`Imagen ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>{imagen.nombre}</DialogTitle>
                                  <DialogDescription>
                                    Tamaño: {(imagen.tamaño / 1024 / 1024).toFixed(2)} MB
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-center">
                                  <img
                                    src={imagen.url}
                                    alt={imagen.nombre}
                                    className="max-w-full max-h-[70vh] object-contain"
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Button onClick={() => window.open(imagen.url, '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Abrir en nueva pestaña
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator className="my-2" />

                    {/* Action buttons - compact */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setEditing(arriendo);
                          setNuevoArriendomMensual(false);
                          setFormOpen(true);
                        }}
                        className="gap-1.5 h-8 flex-1 text-xs bg-yellow-500"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`¿Está seguro que desea eliminar el arriendo "${arriendo.title}"?`)) {
                            try {
                              setEliminando(arriendo.id);
                              await eliminar(arriendo.id);
                              await recargarArriendos();
                              recargar();
                            } catch (error) {
                              console.error('Error al eliminar arriendo:', error);
                              alert('Error al eliminar el arriendo. Inténtelo nuevamente.');
                            } finally {
                              setEliminando(null);
                            }
                          }
                        }}
                        disabled={eliminando === arriendo.id}
                        className="gap-1.5 h-8 flex-1 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <BookingDetail
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        booking={arriendoDetalle || undefined}
        onEdit={() => {
          setEditing(arriendoDetalle);
          setDetalleOpen(false);
          setFormOpen(true);
        }}
        onDelete={async () => {
          if (arriendoDetalle && confirm(`¿Está seguro que desea eliminar el arriendo "${arriendoDetalle.title}"?`)) {
            try {
              setEliminando(arriendoDetalle.id);
              await eliminar(arriendoDetalle.id);
              await recargarArriendos();
              recargar();
              setDetalleOpen(false);
              setArriendoDetalle(null);
            } catch (error) {
              console.error('Error al eliminar arriendo:', error);
              alert('Error al eliminar el arriendo. Inténtelo nuevamente.');
            } finally {
              setEliminando(null);
            }
          }
        }}
      />

      {/* Formulario de edición de arriendos */}
      <BookingForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null); // Limpiar estado de edición al cerrar
            setNuevoArriendomMensual(false); // Limpiar estado de nuevo arriendo mensual
          }
        }}
        initial={editing ? editing : (nuevoArriendomMensual ? { 
          esMensual: true,
          title: "",
          cabana: "",
          ubicacion: "",
          cantPersonas: 1,
          celular: "",
          valorNoche: 0,
          descuento: "sin-descuento",
          pago: false,
          archivos: [],
          imagenes: [],
          comentarios: ""
        } as Partial<Booking> : undefined)}
        onSubmit={() => {
          recargar(); // Recargar cabañas
          recargarArriendos(); // Recargar arriendos
        }}
        onReload={() => {
          recargar(); // Recargar cabañas
          recargarArriendos(); // Recargar arriendos
        }}
      />
    </div>
  );
}