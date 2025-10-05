"use client";

import { useState } from "react";
import { Search, Home, Users, DollarSign, MapPin, Settings, Plus, Edit, Trash2, Eye, FileText, Image, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCabanas } from "@/lib/hooks/useCabanas";
import { useArriendos, useArriendoOperaciones } from "@/lib/hooks/useFirestore";
import { BookingForm } from "@/components/booking-form";
import type { Cabana } from "@/lib/types/cabana-types";
import type { Booking, ArchivoAdjunto, ImagenAdjunta } from "@/lib/types/booking-types";

export default function CabanasPage() {
  const { data: cabanas, loading, error, recargar } = useCabanas();
  const { data: arriendos, loading: loadingArriendos, error: errorArriendos, recargar: recargarArriendos } = useArriendos();
  const { eliminar } = useArriendoOperaciones();
  const [busqueda, setBusqueda] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Obtener arriendos actuales (que están en curso hoy)
  const getArriendosActuales = () => {
    if (!arriendos) return [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return arriendos.filter(arriendo => {
      const inicio = new Date(arriendo.start);
      const fin = new Date(arriendo.end);
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      
      return hoy >= inicio && hoy <= fin;
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

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Archivos adjuntos ({archivos.length})
        </h5>
        <div className="flex flex-wrap gap-2">
          {archivos.map((archivo) => (
            <Button
              key={archivo.id}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => window.open(archivo.url, '_blank')}
            >
              <Download className="h-3 w-3 mr-1" />
              {archivo.nombre}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Componente para mostrar galería de imágenes
  const ImagenesViewer = ({ imagenes }: { imagenes: ImagenAdjunta[] }) => {
    if (!imagenes || imagenes.length === 0) return null;

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Image className="h-4 w-4" />
          Imágenes ({imagenes.length})
        </h5>
        <div className="flex flex-wrap gap-2">
          {imagenes.map((imagen) => (
            <Dialog key={imagen.id}>
              <DialogTrigger asChild>
                <button className="relative group">
                  <img
                    src={imagen.urlThumbnail || imagen.url}
                    alt={imagen.nombre}
                    className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
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
        </div>
      </div>
    );
  };

  // Filtrar cabañas por búsqueda
  const cabanasFiltradas = cabanas?.filter(cabana => 
    cabana.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cabana.arrendatario.toLowerCase().includes(busqueda.toLowerCase()) ||
    cabana.estado.toLowerCase().includes(busqueda.toLowerCase()) ||
    cabana.periodo.toLowerCase().includes(busqueda.toLowerCase())
  ) || [];

  // Estadísticas
  const estadisticas = {
    total: cabanas?.length || 0,
    disponibles: cabanas?.filter(c => c.estado === 'disponible').length || 0,
    ocupadas: cabanas?.filter(c => c.estado === 'ocupada').length || 0,
    valorTotal: cabanas?.reduce((sum, c) => sum + c.valor, 0) || 0,
    promedioValor: cabanas?.length ? Math.round(cabanas.reduce((sum, c) => sum + c.valor, 0) / cabanas.length) : 0
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {cabanasFiltradas.length} cabañas registradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            recargar(); // Recargar cabañas
            recargarArriendos(); // Recargar arriendos
          }} variant="outline">
            Recargar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cabaña
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-semibold">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-xl font-semibold">{estadisticas.disponibles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Ocupadas</p>
                <p className="text-xl font-semibold">{estadisticas.ocupadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-semibold">${estadisticas.valorTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Promedio</p>
                <p className="text-xl font-semibold">${estadisticas.promedioValor.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arriendos Actuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personas Actualmente Arrendando
          </CardTitle>
          <CardDescription>
            {arriendosActuales.length} {arriendosActuales.length === 1 ? 'persona está' : 'personas están'} arrendando hoy
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
              <p className="text-gray-600">No hay arriendos activos hoy</p>
              <p className="text-sm text-gray-400 mt-1">Las cabañas están disponibles</p>
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
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{arriendo.title}</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{arriendo.cabana}</p>
                      </div>
                      <Badge variant={diasRestantes <= 1 ? "destructive" : diasRestantes <= 3 ? "default" : "secondary"}>
                        {diasRestantes <= 0 ? 'Finaliza hoy' : `${diasRestantes} día${diasRestantes > 1 ? 's' : ''} restantes`}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">{arriendo.ubicacion || arriendo.cabana}</span>
                      </div>
                      
                      {arriendo.celular && (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-center text-xs font-medium text-gray-500">📱</span>
                          <span className="text-gray-700 dark:text-gray-300">{arriendo.celular}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">{arriendo.cantPersonas} persona{arriendo.cantPersonas > 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span>{format(inicio, 'dd MMM', { locale: es })} - {format(fin, 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            ${arriendo.valorTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant={arriendo.pago ? "outline" : "destructive"} className="text-xs">
                          {arriendo.pago ? '✓ Pagado' : '⚠ Pendiente'}
                        </Badge>
                        <span className="text-xs text-gray-500">
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
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Arriendos Mensuales
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {arriendosMensuales.map((arriendo) => {
                const inicio = new Date(arriendo.start);
                const fin = new Date(arriendo.end);
                const enCurso = new Date() >= inicio && new Date() <= fin;
                const hasArchivos = arriendo.archivos && arriendo.archivos.length > 0;
                const hasImagenes = arriendo.imagenes && arriendo.imagenes.length > 0;
                
                return (
                  <Card key={arriendo.id} className="arriendos-mensuales-card h-auto flex flex-col overflow-visible transition-all duration-200 hover:shadow-lg border-border/50 bg-card">
                    {/* Header compacto para móviles */}
                    <CardHeader className="pb-3 sm:pb-4 flex-shrink-0 border-b border-border/50">
                      <div className="space-y-2 sm:space-y-4">
                        {/* Título y ubicación */}
                        <div className="space-y-1 sm:space-y-2">
                          <CardTitle className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem] leading-tight">
                            {arriendo.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Home className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span className="text-xs sm:text-sm font-medium truncate">{arriendo.cabana}</span>
                          </div>
                          {arriendo.ubicacion ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                              <span className="text-xs truncate">{arriendo.ubicacion}</span>
                            </div>
                          ) : (
                            <div className="h-3 sm:h-4"></div>
                          )}
                        </div>
                        
                        {/* Estados y botones en móviles */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          {/* Estados */}
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <Badge 
                              variant={enCurso ? "default" : "secondary"}
                              className={`text-xs ${
                                enCurso 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}
                            >
                              <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1 sm:mr-1.5 ${
                                enCurso ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}></div>
                              {enCurso ? 'En curso' : 'Finalizado'}
                            </Badge>
                            <Badge 
                              variant={arriendo.pago ? "outline" : "destructive"}
                              className={`text-xs ${
                                arriendo.pago
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                              }`}
                            >
                              {arriendo.pago ? (
                                <>
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 mr-1 sm:mr-1.5"></div>
                                  Pagado
                                </>
                              ) : (
                                <>
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 mr-1 sm:mr-1.5"></div>
                                  Pendiente
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          {/* Botones de acción - compactos en móviles */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(arriendo);
                                setFormOpen(true);
                              }}
                              className="h-7 px-2 sm:h-8 sm:px-3 text-xs flex-1 sm:flex-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                              <span className="hidden sm:inline">Editar</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (confirm(`¿Está seguro que desea eliminar el arriendo "${arriendo.title}"?`)) {
                                  try {
                                    setEliminando(arriendo.id);
                                    await eliminar(arriendo.id);
                                    await recargarArriendos();
                                  } catch (error) {
                                    console.error('Error al eliminar arriendo:', error);
                                    alert('Error al eliminar el arriendo. Inténtelo nuevamente.');
                                  } finally {
                                    setEliminando(null);
                                  }
                                }
                              }}
                              disabled={eliminando === arriendo.id}
                              className="h-7 px-2 sm:h-8 sm:px-3 text-xs flex-1 sm:flex-none opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                              {eliminando === arriendo.id ? (
                                <span className="sm:hidden">...</span>
                              ) : (
                                <>
                                  <span className="hidden sm:inline">Eliminar</span>
                                  <span className="sm:hidden">Del</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col p-3 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Información principal - layout compacto para móviles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 flex-shrink-0">
                        {/* Contacto */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-1 sm:p-1.5 bg-muted rounded-md">
                            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Personas</p>
                            <p className="text-sm text-foreground">
                              {arriendo.cantPersonas} persona{arriendo.cantPersonas > 1 ? 's' : ''}
                            </p>
                            {arriendo.celular && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                📱 {arriendo.celular}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Valor */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-1 sm:p-1.5 bg-muted rounded-md">
                            <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Valor</p>
                            <p className="text-base sm:text-lg font-bold text-foreground">
                              ${arriendo.valorTotal.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${arriendo.valorNoche.toLocaleString()}/noche
                            </p>
                            {arriendo.descuento && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                ✨ Con descuento
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Período - full width */}
                      <div className="flex items-start gap-2 sm:gap-3 flex-shrink-0">
                        <div className="p-1 sm:p-1.5 bg-muted rounded-md">
                          <span className="text-xs text-muted-foreground">📅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Período</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <p className="text-sm text-foreground">
                              {format(inicio, 'dd MMM yyyy', { locale: es })}
                            </p>
                            <span className="hidden sm:inline text-muted-foreground">hasta</span>
                            <p className="text-sm text-foreground">
                              {format(fin, 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {arriendo.cantDias} día{arriendo.cantDias > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      {/* Sección flexible - comentarios y archivos */}
                      <div className="flex-1 flex flex-col space-y-2 sm:space-y-3 min-h-0">
                        {/* Comentarios */}
                        {arriendo.comentarios && (
                          <>
                            <Separator className="my-1 sm:my-2" />
                            <div className="space-y-1 sm:space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comentarios</p>
                              <div className="max-h-none sm:max-h-16 overflow-y-auto">
                                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border line-clamp-3">
                                  {arriendo.comentarios}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Archivos */}
                        {(hasArchivos || hasImagenes) && (
                          <>
                            {!arriendo.comentarios && <Separator className="my-1 sm:my-2" />}
                            <div className="space-y-2 sm:space-y-3 flex-1 min-h-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Archivos</p>
                              <div className="max-h-none sm:max-h-24 overflow-y-auto space-y-1 sm:space-y-2">
                                {hasArchivos && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span>📄</span>
                                      {arriendo.archivos!.length} doc{arriendo.archivos!.length > 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-0.5 sm:space-y-1">
                                      {arriendo.archivos!.slice(0, 2).map((archivo, index) => (
                                        <a
                                          key={index}
                                          href={archivo.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 hover:bg-muted/50 rounded text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                        >
                                          <span className="shrink-0 text-xs">📄</span>
                                          <span className="truncate group-hover:text-foreground text-xs">{archivo.nombre}</span>
                                          <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                      ))}
                                      {arriendo.archivos!.length > 2 && (
                                        <p className="text-xs text-muted-foreground pl-4 sm:pl-6">
                                          +{arriendo.archivos!.length - 2} más...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {hasImagenes && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span>🖼️</span>
                                      {arriendo.imagenes!.length} img{arriendo.imagenes!.length > 1 ? 's' : ''}
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                                      {arriendo.imagenes!.slice(0, 3).map((imagen, index) => (
                                        <a
                                          key={index}
                                          href={imagen.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group relative block aspect-square"
                                        >
                                          <img
                                            src={imagen.urlThumbnail || imagen.url}
                                            alt={imagen.nombre}
                                            className="w-full h-full object-cover rounded border border-border group-hover:opacity-80 transition-opacity"
                                          />
                                          {index === 2 && arriendo.imagenes!.length > 3 && (
                                            <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                                              <span className="text-white text-xs font-medium">
                                                +{arriendo.imagenes!.length - 2}
                                              </span>
                                            </div>
                                          )}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
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
          }
        }}
        initial={editing || undefined}
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