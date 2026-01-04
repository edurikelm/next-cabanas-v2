"use client";

import { useState } from "react";
import { Home, Users, PhoneCall, DollarSign, MapPin, Settings, Plus, Edit, Trash2, Eye, FileText, Image, Download, ExternalLink, User, Phone, Calendar, MessageSquare, Pencil, MessageCircleXIcon, MessageSquareText } from "lucide-react";
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
              Arriendos Activos
            </CardTitle>
            <CardDescription>
              {arriendosActuales.length} {arriendosActuales.length === 1 ? 'arriendo activo' : 'arriendos activos'} hoy
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
            <div className="space-y-3">
              {arriendosActuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasRestantes = Math.ceil((fin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="group border rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-br from-background to-muted/30">
                    {/* Header: Cabaña y Badges */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">{arriendo.cabana}</h3>
                          <p className="text-sm text-muted-foreground">{arriendo.title}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge 
                          variant={diasRestantes <= 1 ? "destructive" : diasRestantes <= 3 ? "default" : "secondary"} 
                          className="text-xs font-semibold"
                        >
                          {diasRestantes <= 0 ? 'Último día' : `${diasRestantes}d restantes`}
                        </Badge>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Fechas</p>
                          <p className="font-medium">{format(inicio, 'dd MMM', { locale: es })} — {format(fin, 'dd MMM', { locale: es })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold text-primary">${arriendo.valorTotal.toLocaleString('es-CL')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Estado de pago y acciones */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge 
                        variant={arriendo.pago ? "outline" : "destructive"} 
                        className="text-xs"
                      >
                        {arriendo.pago ? '✓ Pagado' : '⚠ Pendiente'}
                      </Badge>
                      
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setArriendoDetalle(arriendo);
                            setDetalleOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {arriendo.celular && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                                window.open(`https://wa.me/56${phoneNumber}`, '_blank');
                              }}
                            >
                              <MessageSquareText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                                window.open(`tel:+56${phoneNumber}`, '_self');
                              }}
                            >
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
            Próximos Arriendos
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
            <div className="space-y-3">
              {arriendosProximos.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasHastaInicio = Math.ceil((inicio.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="group border rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-br from-background to-muted/30">
                    {/* Header: Cabaña y Badges */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">{arriendo.cabana}</h3>
                          <p className="text-sm text-muted-foreground">{arriendo.title}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {diasHastaInicio === 1 ? 'Mañana' : `En ${diasHastaInicio}d`}
                      </Badge>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Fechas</p>
                          <p className="font-medium">{format(inicio, 'dd MMM', { locale: es })} — {format(fin, 'dd MMM', { locale: es })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold text-primary">${arriendo.valorTotal.toLocaleString('es-CL')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Estado de pago y acciones */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge 
                        variant={arriendo.pago ? "outline" : "destructive"} 
                        className="text-xs"
                      >
                        {arriendo.pago ? '✓ Pagado' : '⚠ Pendiente'}
                      </Badge>
                      
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setArriendoDetalle(arriendo);
                            setDetalleOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {arriendo.celular && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                                window.open(`https://wa.me/56${phoneNumber}`, '_blank');
                              }}
                            >
                              <MessageSquareText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                                window.open(`tel:+56${phoneNumber}`, '_self');
                              }}
                            >
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Arriendos Mensuales
              </CardTitle>
              <CardDescription>
                {arriendosMensuales.length} {arriendosMensuales.length === 1 ? 'arriendo mensual' : 'arriendos mensuales'}
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                setEditing(null);
                setNuevoArriendomMensual(true);
                setFormOpen(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Arriendo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-3">
              {arriendosMensuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const enCurso = new Date() >= inicio && new Date() <= fin;
                
                return (
                  <div key={arriendo.id} className="group border rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-br from-background to-blue-50/30 dark:to-blue-950/10">
                    {/* Header: Cabaña y Badges */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base">{arriendo.cabana}</h3>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Mensual</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{arriendo.title}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={enCurso ? "default" : "secondary"} 
                        className="text-xs font-semibold"
                      >
                        {enCurso ? '✓ Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Inicio</p>
                          <p className="font-medium">{format(inicio, 'dd MMM yyyy', { locale: es })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Valor mensual</p>
                          <p className="font-bold text-primary">${arriendo.valorTotal.toLocaleString('es-CL')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Estado de pago y acciones */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge 
                        variant={arriendo.pago ? "outline" : "destructive"} 
                        className="text-xs"
                      >
                        {arriendo.pago ? '✓ Pagado' : '⚠ Pendiente'}
                      </Badge>
                      
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setArriendoDetalle(arriendo);
                            setDetalleOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {arriendo.celular && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                                window.open(`https://wa.me/56${phoneNumber}`, '_blank');
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const phoneNumber = arriendo.celular?.replace(/\D/g, '');
                                window.open(`tel:+56${phoneNumber}`, '_self');
                              }}
                            >
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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