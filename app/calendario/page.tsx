// app/calendario/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { localizer } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Booking } from "@/lib/types/booking-types";
import { BookingForm } from "@/components/booking-form";
import { BookingDetail } from "@/components/booking-detail";
import { ICalendarSync } from "@/components/icalendar-sync";
import { useArriendos, useArriendoOperaciones } from "@/lib/hooks/useFirestore";
import { convertirBookingAEvento } from "@/lib/db/arriendos";
import { useAvailableCabanas } from "@/lib/cabanas";
import { Plus, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, startOfWeek, endOfWeek, format, isSameDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarioPage() {
  const { data: arriendos, loading, error, recargar } = useArriendos();
  const { eliminar } = useArriendoOperaciones();
  const { cabanas: cabanasDisponibles, loading: cabanasLoading } = useAvailableCabanas();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [selectedCabana, setSelectedCabana] = useState<string>("todas");
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [timelineStartDate, setTimelineStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isMobile, setIsMobile] = useState(false);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar al montar
    checkMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lista de cabañas disponibles para el filtro
  const cabanas = useMemo(() => {
    const opciones = [{ value: "todas", label: "Todas las cabañas" }];
    
    if (cabanasDisponibles && cabanasDisponibles.length > 0) {
      cabanasDisponibles.forEach(cabana => {
        opciones.push({
          value: cabana.toLowerCase(),
          label: cabana
        });
      });
    }
    
    return opciones;
  }, [cabanasDisponibles]);

  // Filtrar arriendos por cabaña seleccionada y excluir arriendos mensuales
  const arriendosFiltrados = useMemo(() => {
    if (!arriendos) return [];
    
    // Primero filtrar arriendos mensuales (excluir esMensual = true)
    const arriendosDiarios = arriendos.filter(arriendo => !arriendo.esMensual);
    
    // Luego filtrar por cabaña si no es "todas"
    if (selectedCabana === "todas") return arriendosDiarios;
    return arriendosDiarios.filter(arriendo => 
      arriendo.cabana.toLowerCase().includes(selectedCabana.toLowerCase())
    );
  }, [arriendos, selectedCabana]);

  // Convertir arriendos filtrados a eventos del calendario
  const events = useMemo(() => {
    if (!arriendosFiltrados) return [];
    return arriendosFiltrados.map(convertirBookingAEvento);
  }, [arriendosFiltrados]);

  const eventPropGetter = (event: any) => {
    let backgroundColor = "#22c55e"; // Verde por defecto
    
    // Colores por cabaña
    if (event.resource?.cabana) {
      const cabana = event.resource.cabana.toLowerCase();
      if (cabana.includes('regional uno')) backgroundColor = "#f59e0b"; // Naranja
      if (cabana.includes('regional cuatro')) backgroundColor = "#3b82f6"; // Azul
      if (cabana.includes('regional tres')) backgroundColor = "#8b5cf6"; // Púrpura
      if (cabana.includes('regional dos')) backgroundColor = "#ef4444"; // Rojo
      if (cabana.includes('teja uno')) backgroundColor = "#10b981"; // Verde esmeralda
      if (cabana.includes('teja dos')) backgroundColor = "#f97316"; // Naranja oscuro
      if (cabana.includes('teja tres')) backgroundColor = "#6b7280"; // Gris
    }
    
    return { 
      style: { 
        backgroundColor, 
        borderRadius: "6px", 
        border: "none",
        color: "white",
        fontSize: "12px"
      } 
    };
  };

  const handleSelectEvent = (event: any) => {
    const arriendo = arriendosFiltrados?.find(a => a.id === event.id);
    if (arriendo) {
      setSelected(arriendo);
      setDetailOpen(true);
    }
  };

  // Generar días para la vista timeline
  const timelineDays = useMemo(() => {
    const days = [];
    // En mobile mostrar solo 3 días, en desktop 7 días
    const diasAMostrar = isMobile ? 3 : 7;
    const end = addDays(timelineStartDate, diasAMostrar - 1);
    let current = timelineStartDate;
    
    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    
    return days;
  }, [timelineStartDate, isMobile]);

  // Función para obtener el color de una cabaña
  const getCabanaColor = (cabana: string) => {
    const cabanaLower = cabana.toLowerCase();
    if (cabanaLower.includes('regional uno')) return "#f59e0b";
    if (cabanaLower.includes('regional cuatro')) return "#3b82f6";
    if (cabanaLower.includes('regional tres')) return "#8b5cf6";
    if (cabanaLower.includes('regional dos')) return "#ef4444";
    if (cabanaLower.includes('teja uno')) return "#10b981";
    if (cabanaLower.includes('teja dos')) return "#f97316";
    if (cabanaLower.includes('teja tres')) return "#6b7280";
    return "#22c55e";
  };

  // Calcular posición y ancho de arriendo en timeline
  const getArriendoPosition = (arriendo: Booking, dayIndex: number, day: Date) => {
    const arriendoStart = new Date(arriendo.start);
    const arriendoEnd = new Date(arriendo.end);
    
    // Verificar si el arriendo está activo en este día
    if (!isWithinInterval(day, { start: arriendoStart, end: arriendoEnd })) {
      return null;
    }
    
    // Si empieza en este día, calcular el ancho
    if (isSameDay(arriendoStart, day) || dayIndex === 0) {
      let width = 1;
      for (let i = dayIndex + 1; i < timelineDays.length; i++) {
        if (isWithinInterval(timelineDays[i], { start: arriendoStart, end: arriendoEnd })) {
          width++;
        } else {
          break;
        }
      }
      return { start: true, width };
    }
    
    return null;
  };

  const handleCreate = (data: Omit<Booking, "id">) => {
    // La creación se maneja en el formulario
    console.log('Arriendo creado:', data);
  };

  const handleEdit = (data: Omit<Booking, "id">) => {
    // La edición se maneja en el formulario
    console.log('Arriendo editado:', data);
  };

  const handleDelete = async () => {
    if (!selected) return;
    const ok = confirm("¿Eliminar este arriendo? Esta acción no se puede deshacer.");
    if (ok) {
      try {
        await eliminar(selected.id);
        setDetailOpen(false);
        setSelected(null);
        recargar(); // Recargar datos después de eliminar
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el arriendo');
      }
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando arriendos...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error al cargar los arriendos:</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={recargar}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        

        {/* Sección de filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
            <span className="text-sm font-medium whitespace-nowrap">Filtrar por cabaña:</span>
            <div className="flex items-center gap-2 flex-1">
              <Select value={selectedCabana} onValueChange={setSelectedCabana}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Seleccionar cabaña" />
                </SelectTrigger>
                <SelectContent>
                  {cabanas.map((cabana) => (
                    <SelectItem key={cabana.value} value={cabana.value}>
                      {cabana.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCabana !== "todas" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedCabana("todas")}
                  className="whitespace-nowrap"
                >
                  Limpiar filtro
                </Button>
              )}
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={recargar} size="sm" className="flex-1 sm:flex-none">
              Recargar
            </Button>
            {/* <ICalendarSync /> */}
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm" className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-1 sm:mr-0" />
              <span className="sm:hidden">Nuevo</span>
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Toggle de vista */}
          <div className="flex rounded-lg border bg-muted p-3">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario</span>
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </Button>
          </div>
      </div>

      {/* Vista Calendario */}
      {viewMode === 'calendar' && (
        <div className="rounded-2xl border bg-white dark:bg-white p-3">
          <div className="h-[65dvh] sm:h-[70dvh] md:h-[75dvh] lg:h-[80dvh] dark:text-black">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView={Views.MONTH}
              style={{ height: "100%" }}
              popup
              showAllEvents
              doShowMoreDrillDown={false}
              max={undefined}
              eventLimit={false}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              messages={{
                today: "Hoy",
                previous: "Anterior",
                next: "Siguiente",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                noEventsInRange: "No hay eventos en este rango.",
                showMore: (total: number) => `+ Ver ${total} más`,
              }}
            />
          </div>
        </div>
      )}

      {/* Vista Timeline */}
      {viewMode === 'timeline' && (
        <div className="rounded-2xl border bg-muted overflow-hidden">
          {/* Navegación de fechas */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimelineStartDate(addDays(timelineStartDate, isMobile ? -3 : -7))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-sm sm:text-base">
              {format(timelineStartDate, isMobile ? 'MMM yyyy' : 'MMMM yyyy', { locale: es })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimelineStartDate(addDays(timelineStartDate, isMobile ? 3 : 7))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline Grid */}
          <div className="overflow-x-auto">
            <div className={isMobile ? "" : "min-w-[800px]"}>
              {/* Header con días */}
              <div className={`grid border-b bg-white ${
                isMobile 
                  ? 'grid-cols-[100px_repeat(3,1fr)]' 
                  : 'grid-cols-[200px_repeat(7,1fr)]'
              }`}>
                <div className="p-2 sm:p-3 font-semibold text-xs sm:text-sm border-r sticky left-0 bg-white dark:text-black z-10">
                  Cabañas
                </div>
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    className={`p-1 sm:p-2 text-center text-xs sm:text-sm border-r ${
                      isSameDay(day, new Date())
                        ? 'bg-gray-200 font-semibold '
                        : ''
                    }`}
                  >
                    <div className="font-medium dark:text-black">{format(day, 'EEE', { locale: es })}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-black">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>

              {/* Filas de cabañas */}
              <div className="divide-y dark:text-black">
                {cabanasDisponibles
                  .filter(cabana => 
                    selectedCabana === "todas" || 
                    cabana.toLowerCase().includes(selectedCabana.toLowerCase())
                  )
                  .map((cabana) => {
                    const arriendosCabana = arriendosFiltrados.filter(a => a.cabana === cabana);
                    const numDias = timelineDays.length;
                    
                    return (
                      <div key={cabana} className={`grid min-h-[60px] sm:min-h-[80px] ${
                        isMobile 
                          ? 'grid-cols-[100px_repeat(3,1fr)]' 
                          : 'grid-cols-[200px_repeat(7,1fr)]'
                      }`}>
                        {/* Nombre de cabaña */}
                        <div className="p-2 sm:p-3 font-medium text-xs sm:text-sm border-r sticky left-0 bg-white z-10 flex items-center">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCabanaColor(cabana) }}
                            />
                            <span className="truncate">{cabana}</span>
                          </div>
                        </div>

                        {/* Celdas de días */}
                        <div className={`relative grid ${
                          isMobile ? 'col-span-3 grid-cols-3' : 'col-span-7 grid-cols-7'
                        }`}>
                          {timelineDays.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`border-r ${
                                isSameDay(day, new Date())
                                  ? 'bg-blue-50/50 dark:bg-blue-950/20'
                                  : ''
                              }`}
                            />
                          ))}

                          {/* Arriendos */}
                          {arriendosCabana.map((arriendo) => {
                            // Buscar el día de inicio dentro del rango visible
                            const startDayIndex = timelineDays.findIndex(day =>
                              isSameDay(day, new Date(arriendo.start)) ||
                              (new Date(arriendo.start) < day && new Date(arriendo.end) >= day)
                            );

                            if (startDayIndex === -1) return null;

                            const position = getArriendoPosition(arriendo, startDayIndex, timelineDays[startDayIndex]);
                            if (!position) return null;

                            const backgroundColor = getCabanaColor(cabana);

                            return (
                              <div
                                key={arriendo.id}
                                onClick={() => {
                                  setSelected(arriendo);
                                  setDetailOpen(true);
                                }}
                                className="absolute cursor-pointer hover:opacity-90 transition-opacity"
                                style={{
                                  left: `${(startDayIndex / numDias) * 100}%`,
                                  width: `calc(${(position.width / numDias) * 100}% - ${isMobile ? '2px' : '4px'})`,
                                  top: isMobile ? '4px' : '8px',
                                  height: isMobile ? 'calc(100% - 8px)' : 'calc(100% - 16px)',
                                  backgroundColor,
                                  borderRadius: isMobile ? '4px' : '6px',
                                  padding: isMobile ? '4px' : '8px',
                                  color: 'white',
                                  fontSize: isMobile ? '10px' : '12px',
                                  marginLeft: isMobile ? '1px' : '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div className="font-semibold truncate leading-tight">{arriendo.title}</div>
                                {!isMobile && (
                                  <>
                                    <div className="text-xs opacity-90 truncate">
                                      {arriendo.cantDias} {arriendo.cantDias === 1 ? 'noche' : 'noches'}
                                    </div>
                                    {arriendo.pago && (
                                      <div className="text-xs mt-1 opacity-90">✓ Pagado</div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      <BookingDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        booking={selected ?? undefined}
        onEdit={() => {
          if (!selected) return;
          setEditing(selected);
          setFormOpen(true);
          setDetailOpen(false);
        }}
        onDelete={handleDelete}
      />

      <BookingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        onReload={recargar}
        initial={editing ?? undefined}
      />
    </div>
  );
}