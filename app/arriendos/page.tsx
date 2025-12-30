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
            <div className="space-y-2">
              {arriendosActuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasRestantes = Math.ceil((fin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 border rounded-lg hover:shadow-sm transition-shadow bg-muted">
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
                            <MessageSquareText className="h-3.5 w-3.5 sm:mr-1" />
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
            <div className="space-y-2">
              {arriendosProximos.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasHastaInicio = Math.ceil((inicio.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 border rounded-lg hover:shadow-sm transition-shadow bg-muted">
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
                            <MessageSquareText className="h-3.5 w-3.5 sm:mr-1" />
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
            <div className="space-y-2">
              {arriendosMensuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const enCurso = new Date() >= inicio && new Date() <= fin;
                
                return (
                  <div key={arriendo.id} className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 border rounded-lg hover:shadow-sm transition-shadow bg-muted">
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
                          <span className="text-xs">{format(inicio, 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">${arriendo.valorTotal.toLocaleString()}/mes</span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Badge variant={arriendo.pago ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                          {arriendo.pago ? '✓' : '⚠'}
                        </Badge>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Badge variant={enCurso ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                          {enCurso ? 'Activo' : 'Inactivo'}
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