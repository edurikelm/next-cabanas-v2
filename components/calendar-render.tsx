'use client';

import { localizer } from '@/lib/date';
import { Calendar, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';
import { convertirReservaAEvento, Reserva } from '@/lib/db/reservas';

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    cabana: string;
    huespedes: number;
    telefono: string;
  };
};

export const CalendarRender = ({ events }: { events: Reserva[] }) => {


  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const eventos = events
    .filter(reserva => reserva.start && reserva.end)
    .map(convertirReservaAEvento);

    console.log(eventos);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    console.log('Evento seleccionado:', event);
  };

  const eventPropGetter = (event: CalendarEvent) => {
    let backgroundColor = "#22c55e"; // Verde por defecto
    
    // Cambiar color según la cabaña
    if (event.resource?.cabana === 'Regional Cuatro') backgroundColor = "#3b82f6"; // Azul
    if (event.resource?.cabana === 'Regional Uno') backgroundColor = "#f59e0b"; // Naranja
    if (event.resource?.cabana === 'Regional Tres') backgroundColor = "#8b5cf6"; // Púrpura
    if (event.resource?.cabana === 'Casa del Río') backgroundColor = "#ef4444"; // Rojo
    
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

  return (
    <div>
      <div className="h-[600px] sm:h-[700px] lg:h-[800px] p-4">
        <Calendar
            events={eventos}
            localizer={localizer}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            style={{ height: '100%' }}
            popup
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            culture="es"
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              allDay: 'Todo el día',
              noEventsInRange: 'No hay eventos en este rango.',
              showMore: (total: number) => `+ Ver ${total} más`,
            }}
          />
        </div>
        {selectedEvent && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-lg mb-2">Detalles de la Reserva</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><strong>Título:</strong> {selectedEvent.title}</p>
            <p><strong>Cabaña:</strong> {selectedEvent.resource?.cabana}</p>
            <p><strong>Check-in:</strong> {selectedEvent.start.toLocaleDateString('es-CL')}</p>
            <p><strong>Check-out:</strong> {selectedEvent.end.toLocaleDateString('es-CL')}</p>
            <p><strong>Huéspedes:</strong> {selectedEvent.resource?.huespedes}</p>
            <p><strong>Teléfono:</strong> {selectedEvent.resource?.telefono}</p>
          </div>
        </div>
      )}
    </div>
  );
};
