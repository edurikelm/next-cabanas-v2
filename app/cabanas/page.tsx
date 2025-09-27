"use client";

import { useState } from "react";
import { Search, Home, Users, DollarSign, MapPin, Settings, Plus, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCabanas } from "@/lib/hooks/useCabanas";
import { useArriendos } from "@/lib/hooks/useFirestore";
import type { Cabana } from "@/lib/types/cabana-types";
import type { Booking } from "@/lib/types/booking-types";

export default function CabanasPage() {
  const { data: cabanas, loading, error, recargar } = useCabanas();
  const { data: arriendos, loading: loadingArriendos, error: errorArriendos } = useArriendos();
  const [busqueda, setBusqueda] = useState("");

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

  const arriendosActuales = getArriendosActuales();

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
          <Button onClick={recargar}>Reintentar</Button>
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
          <Button onClick={recargar} variant="outline">
            Recargar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cabaña
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, arrendatario, estado o período..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
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

      {/* Lista de cabañas */}
      <div className="space-y-4">
        {cabanasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {busqueda.trim() 
                  ? "No se encontraron cabañas con ese criterio de búsqueda."
                  : "No hay cabañas registradas."
                }
              </p>
              {!busqueda.trim() && (
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primera cabaña
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cabanasFiltradas.map((cabana) => (
              <CabanaCard key={cabana.id} cabana={cabana} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CabanaCardProps {
  cabana: Cabana;
}

const CabanaCard = ({ cabana }: CabanaCardProps) => {
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Disponible</Badge>;
      case 'ocupada':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Ocupada</Badge>;
      case 'fuera_servicio':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Fuera de Servicio</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{cabana.nombre}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Users className="h-3 w-3" />
              {cabana.arrendatario}
            </CardDescription>
          </div>
          {getEstadoBadge(cabana.estado)}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Información principal */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Período</p>
              <p className="text-sm font-medium capitalize">{cabana.periodo}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Valor</p>
              <p className="text-sm font-medium">${cabana.valor.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Detalles */}
        {cabana.detalles && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">{cabana.detalles}</p>
          </div>
        )}

        {/* Imágenes */}
        {cabana.imagenes && cabana.imagenes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Imágenes ({cabana.imagenes.length}):</p>
            <div className="flex flex-wrap gap-1">
              {cabana.imagenes.slice(0, 3).map((imagen, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {imagen}
                </Badge>
              ))}
              {cabana.imagenes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{cabana.imagenes.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Fecha de contrato */}
        <div className="text-xs text-gray-500 mb-4">
          <p>Contrato: {format(cabana.fechaContrato, "dd/MM/yyyy", { locale: es })}</p>
        </div>

        {/* Acciones */}
        <div className="flex justify-between gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Ver
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};