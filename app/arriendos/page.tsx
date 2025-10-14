"use client";

import { useState } from "react";
import { Home, Users, PhoneCall, DollarSign, MapPin, Settings, Plus, Edit, Trash2, Eye, FileText, Image, Download, ExternalLink } from "lucide-react";
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
import type { Booking, ArchivoAdjunto, ImagenAdjunta } from "@/lib/types/booking-types";

export default function CabanasPage() {
  const { data: cabanas, loading, error, recargar } = useCabanas();
  const { data: arriendos, loading: loadingArriendos, error: errorArriendos, recargar: recargarArriendos } = useArriendos();
  const { eliminar } = useArriendoOperaciones();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [nuevoArriendomMensual, setNuevoArriendomMensual] = useState(false);

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

  // Obtener arriendos mensuales (todos los que tienen esMensual = true)
  const getArriendosMensuales = () => {
    if (!arriendos) return [];
    return arriendos.filter(arriendo => arriendo.esMensual === true)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // Más recientes primero
  };

  const arriendosActuales = getArriendosActuales();
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arriendosActuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const diasRestantes = Math.ceil((fin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={arriendo.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-800">{arriendo.cabana}</h4>
                        <p className="font-medium">{arriendo.title}</p>
                      </div>
                      <Badge variant={diasRestantes <= 1 ? "destructive" : diasRestantes <= 3 ? "default" : "secondary"}>
                        {diasRestantes <= 0 ? 'Finaliza hoy' : `${diasRestantes} día${diasRestantes > 1 ? 's' : ''} restantes`}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 " />
                        <span className="">{arriendo.ubicacion || arriendo.cabana}</span>
                      </div>
                      
                      {arriendo.celular && (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-center text-xs font-medium ">📱</span>
                          <span className="">{arriendo.celular}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 " />
                        <span className="">{arriendo.cantPersonas} persona{arriendo.cantPersonas > 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span>{format(inicio, 'dd MMM', { locale: es })} - {format(fin, 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-500">
                            ${arriendo.valorTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant={arriendo.pago ? "outline" : "destructive"} className="text-xs">
                          {arriendo.pago ? '✓ Pagado' : '⚠ Pendiente'}
                        </Badge>
                        <span className="text-xs ">
                          ${arriendo.valorNoche.toLocaleString()}/noche
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arriendos Mensuales */}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between w-full">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Arriendos Mensuales
            </div>
            <Button 
              onClick={() => {
                setEditing(null); // Asegurar que no estamos editando
                setNuevoArriendomMensual(true); // Indicar que es un nuevo arriendo mensual
                setFormOpen(true); // Abrir formulario para nuevo arriendo mensual
              }}
            >
              <Plus className="h-4 w-4" />
              Arriendo
            </Button>
          </CardTitle>
          <CardDescription>
            {arriendosMensuales.length} {arriendosMensuales.length === 1 ? 'arriendo mensual registrado' : 'arriendos mensuales registrados'}
          </CardDescription>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {arriendosMensuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const enCurso = new Date() >= inicio && new Date() <= fin;
                const hasArchivos = arriendo.archivos && arriendo.archivos.length > 0;
                const hasImagenes = arriendo.imagenes && arriendo.imagenes.length > 0;
                
                return (
                  <Card key={arriendo.id} className="p-0 bg-gradient-to-r from-green-50 to-emerald-50-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      {/* Header con título y badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-green-800 dark:text-green-500 mb-1">
                            {arriendo.cabana}
                          </h4>
                          <p className="font-medium">
                            Arrendatario: <span className="text-sm">{arriendo.title}</span>
                          </p>
                        </div>
                        <Badge 
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 border-orange-200 font-medium px-3 py-1"
                        >
                          Mensual
                        </Badge>
                      </div>

                      {/* Precio destacado */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-green-500">
                            ${arriendo.valorTotal.toLocaleString()}
                          </span>
                          <span className=" text-sm">/ mes</span>
                        </div>
                      </div>

                      {/* Información de contacto y fecha en dos columnas */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium  uppercase tracking-wide">
                            Celular
                          </p>
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4" />
                            <span className="text-sm">
                              {arriendo.celular ? `+56 9 ${arriendo.celular}` : 'Sin teléfono'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium  uppercase tracking-wide">
                            Fecha contrato
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📅</span>
                            <span className="text-sm">
                              {format(inicio, 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Comentarios del dueño */}
                      {arriendo.comentarios && (
                        <div className="mb-6">
                          <p className="text-xs font-medium uppercase tracking-wide mb-2">
                            Comentarios del dueño:
                          </p>
                          <p className="text-sm bg-green-100 text-black p-3 rounded-md border">
                            {arriendo.comentarios}
                          </p>
                        </div>
                      )}

                      {/* Archivos adjuntos */}
                      {hasArchivos && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">
                              Archivos adjuntos ({arriendo.archivos!.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {arriendo.archivos!.map((archivo) => (
                              <div key={archivo.id} className="flex items-center gap-2 p-2 rounded border text-sm bg-green-100">
                                <span className="">📄</span>
                                <span className="flex-1 truncate font-medium text-black">{archivo.nombre}</span>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                      <Eye className="h-3 w-3 text-black" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[95vw] h-[90vh]">
                                    <DialogHeader>
                                      <DialogTitle>{archivo.nombre}</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-1 flex justify-center items-center">
                                      <iframe
                                        src={archivo.url}
                                        className="w-full h-full border rounded"
                                        title={archivo.nombre}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Imágenes */}
                      {hasImagenes && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Image className="h-4 w-4 " />
                            <span className="text-xs font-medium  uppercase tracking-wide">
                              Imágenes ({arriendo.imagenes!.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {arriendo.imagenes!.slice(0, 3).map((imagen) => (
                              <Dialog key={imagen.id}>
                                <DialogTrigger asChild>
                                  <button className="group relative aspect-square bg-gray-100 rounded border overflow-hidden hover:ring-2 hover:ring-green-600 transition-all">
                                    <img
                                      src={imagen.urlThumbnail || imagen.url}
                                      alt={imagen.nombre}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                      <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
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
                            {arriendo.imagenes!.length > 3 && (
                              <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                                <span className=" text-sm font-medium">
                                  +{arriendo.imagenes!.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <Button
                          size="sm"
                          className="flex-1 background-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800"
                          variant="outline"
                          onClick={() => {
                            setEditing(arriendo);
                            setNuevoArriendomMensual(false);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bacgkground-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
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
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
          descuento: false,
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