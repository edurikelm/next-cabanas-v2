// app/calendario/page.tsx
"use client";

import { useMemo, useState } from "react";
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

export default function CalendarioPage() {
  const { data: arriendos, loading, error, recargar } = useArriendos();
  const { eliminar } = useArriendoOperaciones();
  const { cabanas: cabanasDisponibles, loading: cabanasLoading } = useAvailableCabanas();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [selectedCabana, setSelectedCabana] = useState<string>("todas");

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

  // Filtrar arriendos por cabaña seleccionada
  const arriendosFiltrados = useMemo(() => {
    if (!arriendos || selectedCabana === "todas") return arriendos;
    return arriendos.filter(arriendo => 
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

  const openEditForm = (arriendo: Booking) => {
    setEditing(arriendo);
    setDetailOpen(false);
    setFormOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Calendario</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {arriendosFiltrados ? `Mostrando ${arriendosFiltrados.length} arriendos` : 'No hay arriendos'}
            {selectedCabana !== "todas" && ` • Filtrado por: ${cabanas.find(c => c.value === selectedCabana)?.label}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={recargar}>
            Recargar
          </Button>
          <ICalendarSync />
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            Agregar arriendo
          </Button>
        </div>
      </div>

      {/* Filtro de cabañas */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Filtrar por cabaña:</span>
        <Select value={selectedCabana} onValueChange={setSelectedCabana}>
          <SelectTrigger className="w-64">
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
          >
            Limpiar filtro
          </Button>
        )}
      </div>

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