// app/calendario/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Calendar, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { localizer } from "@/lib/date";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/types/booking-types";
import { BookingForm } from "@/components/booking-form";
import { BookingDetail } from "@/components/booking-detail";
import { useArriendos, useArriendoOperaciones } from "@/lib/hooks/useFirestore";
import { convertirBookingAEvento } from "@/lib/db/arriendos";

export default function CalendarioPage() {
  const { data: arriendos, loading, error, recargar } = useArriendos();
  const { eliminar } = useArriendoOperaciones();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);

  // Convertir arriendos a eventos del calendario
  const events = useMemo(() => {
    if (!arriendos) return [];
    return arriendos.map(convertirBookingAEvento);
  }, [arriendos]);

  const eventPropGetter = (event: any) => {
    let backgroundColor = "#22c55e"; // Verde por defecto
    
    // Colores por cabaña
    if (event.resource?.cabana) {
      const cabana = event.resource.cabana.toLowerCase();
      if (cabana.includes('regional cuatro')) backgroundColor = "#3b82f6"; // Azul
      if (cabana.includes('regional uno')) backgroundColor = "#f59e0b"; // Naranja
      if (cabana.includes('regional tres')) backgroundColor = "#8b5cf6"; // Púrpura
      if (cabana.includes('regional dos')) backgroundColor = "#ef4444"; // Rojo
      if (cabana.includes('teja')) backgroundColor = "#10b981"; // Verde esmeralda
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
    const arriendo = arriendos?.find(a => a.id === event.id);
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
          <p className="text-sm text-gray-600">
            {arriendos ? `Mostrando ${arriendos.length} arriendos` : 'No hay arriendos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={recargar}>
            Recargar
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            Agregar arriendo
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3">
        <div className="h-[65dvh] sm:h-[70dvh] md:h-[75dvh] lg:h-[80dvh]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.MONTH}
            style={{ height: "100%" }}
            popup
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