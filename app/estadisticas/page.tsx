// app/estadisticas/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, Users, MapPin, DollarSign, Home, Clock, Target } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useArriendos } from "@/lib/hooks/useFirestore";

interface EstadisticaCard {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: number;
  color?: string;
}

export default function EstadisticasPage() {
  const { data: arriendos, loading, error, recargar } = useArriendos();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filtroRapido, setFiltroRapido] = useState<string>("");

  // Filtros rápidos
  const aplicarFiltroRapido = (tipo: string) => {
    const hoy = new Date();
    let rango: DateRange | undefined;

    switch (tipo) {
      case "mes":
        rango = { from: startOfMonth(hoy), to: endOfMonth(hoy) };
        break;
      case "año":
        rango = { from: startOfYear(hoy), to: endOfYear(hoy) };
        break;
      case "todo":
        rango = undefined;
        break;
      default:
        return;
    }

    setDateRange(rango);
    setFiltroRapido(tipo);
  };

  // Arriendos filtrados por fecha
  const arriendosFiltrados = useMemo(() => {
    if (!arriendos) return [];
    if (!dateRange?.from || !dateRange?.to) return arriendos;

    return arriendos.filter((arriendo) => {
      const fechaInicio = arriendo.start instanceof Date ? arriendo.start : parseISO(arriendo.start as string);
      return isWithinInterval(fechaInicio, {
        start: dateRange.from!,
        end: dateRange.to!,
      });
    });
  }, [arriendos, dateRange]);

  // Cálculos de estadísticas
  const estadisticas = useMemo(() => {
    if (!arriendosFiltrados.length) {
      return {
        totalArriendos: 0,
        totalIngresos: 0,
        promedioPorNoche: 0,
        diasOcupados: 0,
        cabanaMasSolicitada: "N/A",
        ubicacionMasSolicitada: "N/A",
        promedioPersonas: 0,
        arriendosConDescuento: 0,
        arriendosPagados: 0,
        tasaOcupacion: 0,
      };
    }

    const totalIngresos = arriendosFiltrados.reduce((sum, a) => sum + (a.valorTotal || 0), 0);
    const totalNoches = arriendosFiltrados.reduce((sum, a) => sum + (a.cantDias || 0), 0);
    const totalPersonas = arriendosFiltrados.reduce((sum, a) => sum + (a.cantPersonas || 0), 0);
    
    // Cabaña más solicitada
    const cabanaCount = arriendosFiltrados.reduce((acc, a) => {
      acc[a.cabana] = (acc[a.cabana] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const cabanaMasSolicitada = Object.entries(cabanaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Ubicación más solicitada
    const ubicacionCount = arriendosFiltrados.reduce((acc, a) => {
      const ubicacion = a.ubicacion || "Sin ubicación";
      acc[ubicacion] = (acc[ubicacion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const ubicacionMasSolicitada = Object.entries(ubicacionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      totalArriendos: arriendosFiltrados.length,
      totalIngresos,
      promedioPorNoche: totalNoches > 0 ? Math.round(totalIngresos / totalNoches) : 0,
      diasOcupados: totalNoches,
      cabanaMasSolicitada,
      ubicacionMasSolicitada,
      promedioPersonas: arriendosFiltrados.length > 0 ? Math.round(totalPersonas / arriendosFiltrados.length) : 0,
      arriendosConDescuento: arriendosFiltrados.filter(a => a.descuento).length,
      arriendosPagados: arriendosFiltrados.filter(a => a.pago).length,
      tasaOcupacion: arriendosFiltrados.length > 0 ? Math.round((arriendosFiltrados.filter(a => a.pago).length / arriendosFiltrados.length) * 100) : 0,
    };
  }, [arriendosFiltrados]);

  // Ranking de cabañas
  const rankingCabanas = useMemo(() => {
    if (!arriendosFiltrados.length) return [];
    
    const stats = arriendosFiltrados.reduce((acc, arriendo) => {
      const cabana = arriendo.cabana;
      if (!acc[cabana]) {
        acc[cabana] = {
          nombre: cabana,
          arriendos: 0,
          ingresos: 0,
          diasOcupados: 0,
          personasTotal: 0,
        };
      }
      acc[cabana].arriendos += 1;
      acc[cabana].ingresos += arriendo.valorTotal || 0;
      acc[cabana].diasOcupados += arriendo.cantDias || 0;
      acc[cabana].personasTotal += arriendo.cantPersonas || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(stats).sort((a: any, b: any) => b.arriendos - a.arriendos);
  }, [arriendosFiltrados]);

  const tarjetas: EstadisticaCard[] = [
    {
      title: "Total Arriendos",
      value: estadisticas.totalArriendos,
      description: "Reservas registradas",
      icon: Home,
      color: "text-blue-600",
    },
    {
      title: "Ingresos Totales",
      value: `$${estadisticas.totalIngresos.toLocaleString()}`,
      description: "Valor total generado",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Promedio por Noche",
      value: `$${estadisticas.promedioPorNoche.toLocaleString()}`,
      description: "Ingreso promedio diario",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Días Ocupados",
      value: estadisticas.diasOcupados,
      description: "Total de noches reservadas",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Promedio Huéspedes",
      value: estadisticas.promedioPersonas,
      description: "Personas por reserva",
      icon: Users,
      color: "text-indigo-600",
    },
    {
      title: "Tasa de Pago",
      value: `${estadisticas.tasaOcupacion}%`,
      description: `${estadisticas.arriendosPagados} de ${estadisticas.totalArriendos} pagados`,
      icon: Target,
      color: "text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error al cargar las estadísticas:</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={recargar}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Estadísticas</h2>
          <p className="text-sm text-gray-600">
            {arriendosFiltrados.length === arriendos?.length
              ? `Mostrando todos los arriendos (${arriendos?.length || 0})`
              : `Mostrando ${arriendosFiltrados.length} de ${arriendos?.length || 0} arriendos`}
          </p>
        </div>
        
        <Button variant="outline" onClick={recargar}>
          Actualizar datos
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros por Fecha</CardTitle>
          <CardDescription>Filtra las estadísticas por período de tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filtroRapido === "mes" ? "default" : "outline"}
              size="sm"
              onClick={() => aplicarFiltroRapido("mes")}
            >
              Este mes
            </Button>
            <Button
              variant={filtroRapido === "año" ? "default" : "outline"}
              size="sm"
              onClick={() => aplicarFiltroRapido("año")}
            >
              Este año
            </Button>
            <Button
              variant={filtroRapido === "todo" ? "default" : "outline"}
              size="sm"
              onClick={() => aplicarFiltroRapido("todo")}
            >
              Todos los tiempos
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: es })
                    )
                  ) : (
                    "Seleccionar rango de fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange(undefined);
                  setFiltroRapido("");
                }}
              >
                Limpiar filtro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarjetas.map((tarjeta, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tarjeta.title}</CardTitle>
              <tarjeta.icon className={`h-4 w-4 ${tarjeta.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tarjeta.value}</div>
              <p className="text-xs text-muted-foreground">{tarjeta.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Información destacada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              Cabaña Más Solicitada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-blue-600 mb-2">
              {estadisticas.cabanaMasSolicitada}
            </div>
            <p className="text-sm text-gray-600">
              La cabaña con mayor número de reservas en el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Ubicación Más Popular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-green-600 mb-2">
              {estadisticas.ubicacionMasSolicitada}
            </div>
            <p className="text-sm text-gray-600">
              El destino más solicitado por los huéspedes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de cabañas */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Cabañas</CardTitle>
          <CardDescription>Desempeño detallado por cabaña</CardDescription>
        </CardHeader>
        <CardContent>
          {rankingCabanas.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay datos disponibles</p>
          ) : (
            <div className="space-y-4">
              {rankingCabanas.map((cabana, index) => (
                <div key={cabana.nombre} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <h4 className="font-medium">{cabana.nombre}</h4>
                      <p className="text-sm text-gray-600">
                        {cabana.arriendos} arriendos • {cabana.diasOcupados} días • {cabana.personasTotal} huéspedes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${cabana.ingresos.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${Math.round(cabana.ingresos / Math.max(cabana.diasOcupados, 1)).toLocaleString()}/noche
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-800">Arriendos con Descuento</div>
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas.arriendosConDescuento}
              </div>
              <div className="text-blue-600">
                {arriendosFiltrados.length > 0 
                  ? Math.round((estadisticas.arriendosConDescuento / arriendosFiltrados.length) * 100)
                  : 0}% del total
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-800">Arriendos Pagados</div>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.arriendosPagados}
              </div>
              <div className="text-green-600">
                {estadisticas.tasaOcupacion}% de tasa de pago
              </div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-800">Ingreso Promedio</div>
              <div className="text-2xl font-bold text-purple-600">
                ${Math.round(estadisticas.totalIngresos / Math.max(estadisticas.totalArriendos, 1)).toLocaleString()}
              </div>
              <div className="text-purple-600">por arriendo</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-800">Duración Promedio</div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(estadisticas.diasOcupados / Math.max(estadisticas.totalArriendos, 1))}
              </div>
              <div className="text-orange-600">días por arriendo</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}