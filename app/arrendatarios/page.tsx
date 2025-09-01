"use client";

import { useMemo, useState } from "react";
import { Search, User, Calendar, Home, DollarSign, Phone, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useArriendos } from "@/lib/hooks/useFirestore";
import type { Booking } from "@/lib/types/booking-types";

interface Arrendatario {
  celular: string;
  nombre: string; // Extraído del title del primer arriendo
  arriendos: Booking[];
  totalArriendos: number;
  cabañasArrendadas: string[];
  ultimoArriendo: Date;
  ingresoTotal: number;
}

const ArrendatariosPage = () => {
  const { data: arriendos, loading, error, recargar } = useArriendos();
  const [busqueda, setBusqueda] = useState("");

  // Agrupar arriendos por número de celular
  const arrendatarios = useMemo(() => {
    if (!arriendos) return [];

    const grupos: { [celular: string]: Booking[] } = {};
    
    arriendos.forEach(arriendo => {
      if (arriendo.celular && arriendo.celular.trim()) {
        const celular = arriendo.celular.trim();
        if (!grupos[celular]) {
          grupos[celular] = [];
        }
        grupos[celular].push(arriendo);
      }
    });

    return Object.entries(grupos).map(([celular, arriendosCliente]): Arrendatario => {
      // Ordenar por fecha más reciente
      const arriendosOrdenados = arriendosCliente.sort((a, b) => 
        new Date(b.start).getTime() - new Date(a.start).getTime()
      );

      // Extraer nombre del title del arriendo más reciente
      const ultimoTitle = arriendosOrdenados[0]?.title || "";
      const nombre = ultimoTitle.split(" - ")[0] || ultimoTitle || "Cliente";

      // Obtener cabañas únicas
      const cabañasUnicas = [...new Set(arriendosCliente.map(a => a.cabana))];

      return {
        celular,
        nombre,
        arriendos: arriendosOrdenados,
        totalArriendos: arriendosCliente.length,
        cabañasArrendadas: cabañasUnicas,
        ultimoArriendo: new Date(arriendosOrdenados[0]?.start),
        ingresoTotal: arriendosCliente.reduce((sum, a) => sum + a.valorTotal, 0),
      };
    }).sort((a, b) => b.ultimoArriendo.getTime() - a.ultimoArriendo.getTime());
  }, [arriendos]);

  // Filtrar arrendatarios por búsqueda
  const arrendatariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return arrendatarios;
    
    const termino = busqueda.toLowerCase().trim();
    return arrendatarios.filter(arrendatario => 
      arrendatario.nombre.toLowerCase().includes(termino) ||
      arrendatario.celular.includes(termino) ||
      arrendatario.cabañasArrendadas.some(cabana => 
        cabana.toLowerCase().includes(termino)
      )
    );
  }, [arrendatarios, busqueda]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando arrendatarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error al cargar los datos:</p>
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
          <h2 className="text-2xl font-semibold">Arrendatarios</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {arrendatariosFiltrados.length} clientes registrados
          </p>
        </div>
        <Button onClick={recargar} variant="outline">
          Recargar
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, teléfono o cabaña..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-xl font-semibold">{arrendatarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Arriendos</p>
                <p className="text-xl font-semibold">
                  {arrendatarios.reduce((sum, a) => sum + a.totalArriendos, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-xl font-semibold">
                  ${arrendatarios.reduce((sum, a) => sum + a.ingresoTotal, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Clientes Recurrentes</p>
                <p className="text-xl font-semibold">
                  {arrendatarios.filter(a => a.totalArriendos > 1).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de arrendatarios */}
      <div className="space-y-4">
        {arrendatariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {busqueda.trim() 
                  ? "No se encontraron arrendatarios con ese criterio de búsqueda."
                  : "No hay arrendatarios registrados."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          arrendatariosFiltrados.map((arrendatario) => (
            <ArrendatarioCard key={arrendatario.celular} arrendatario={arrendatario} />
          ))
        )}
      </div>
    </div>
  );
};

interface ArrendatarioCardProps {
  arrendatario: Arrendatario;
}

const ArrendatarioCard = ({ arrendatario }: ArrendatarioCardProps) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{arrendatario.nombre}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {arrendatario.celular}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={arrendatario.totalArriendos > 1 ? "default" : "secondary"}>
              {arrendatario.totalArriendos} {arrendatario.totalArriendos === 1 ? "arriendo" : "arriendos"}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? "Ocultar" : "Ver detalles"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Cabañas</p>
              <p className="text-sm font-medium">{arrendatario.cabañasArrendadas.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Último arriendo</p>
              <p className="text-sm font-medium">
                {format(arrendatario.ultimoArriendo, "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Total gastado</p>
              <p className="text-sm font-medium">${arrendatario.ingresoTotal.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Promedio/arriendo</p>
              <p className="text-sm font-medium">
                ${Math.round(arrendatario.ingresoTotal / arrendatario.totalArriendos).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Cabañas arrendadas */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Cabañas arrendadas:</p>
          <div className="flex flex-wrap gap-2">
            {arrendatario.cabañasArrendadas.map((cabana) => (
              <Badge key={cabana} variant="outline">
                {cabana}
              </Badge>
            ))}
          </div>
        </div>

        {/* Historial detallado */}
        {expandido && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Historial de arriendos:</h4>
            <div className="space-y-3">
              {arrendatario.arriendos.map((arriendo) => (
                <div key={arriendo.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{arriendo.cabana}</span>
                      {arriendo.ubicacion && (
                        <>
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500">{arriendo.ubicacion}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        {format(new Date(arriendo.start), "dd/MM/yyyy", { locale: es })} - {" "}
                        {format(new Date(arriendo.end), "dd/MM/yyyy", { locale: es })}
                      </span>
                      <span>{arriendo.cantDias} días</span>
                      <span>{arriendo.cantPersonas} personas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${arriendo.valorTotal.toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {arriendo.pago && (
                        <Badge variant="default" className="text-xs">Pagado</Badge>
                      )}
                      {arriendo.descuento && (
                        <Badge variant="secondary" className="text-xs">Descuento</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ArrendatariosPage;
