// app/calendario/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Calendar, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { localizer } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/components/bookings-context";
import type { Booking } from "@/lib/types/booking-types";
import { BookingForm } from "@/components/booking-form";
import { BookingDetail } from "@/components/booking-detail";

export default function CalendarioPage() {
  const { bookings, addBooking, updateBooking, deleteBooking } = useBookings();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);

  const events = useMemo(
    () =>
      bookings.map((b) => ({
        ...b,
        title: b.title,
        start: b.start,
        end: b.end,
        resource: b.id,
        allDay: true,
      })),
    [bookings]
  );

  const eventPropGetter = () => ({ style: { backgroundColor: "#22c55e", borderRadius: "10px", border: "none" } });

  const handleSelectEvent = (event: any) => {
    const booking = bookings.find((b) => b.id === event.resource);
    if (!booking) return;
    setSelected(booking);
    setDetailOpen(true);
  };

  const handleCreate = (data: Omit<Booking, "id">) => addBooking(data);

  const handleEdit = (data: Omit<Booking, "id">) => {
    if (!editing) return;
    updateBooking(editing.id, data);
  };

  const handleDelete = () => {
    if (!selected) return;
    const ok = confirm("¿Eliminar este arriendo? Esta acción no se puede deshacer.");
    if (ok) {
      deleteBooking(selected.id);
      setDetailOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Calendario</h2>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>Agregar arriendo</Button>
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
              showMore: (total) => `+ Ver ${total} más`,
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
        initial={editing ?? undefined}
      />
    </div>
  );
}