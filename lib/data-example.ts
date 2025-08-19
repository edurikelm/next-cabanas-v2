// Define CalendarEvent type if not imported
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

// Eventos de ejemplo con fechas reales
  export const events: CalendarEvent[] = [
    {
      id: 1,
      title: 'Reserva Cabaña del Bosque - Juan Pérez',
      start: new Date(2025, 7, 20, 15, 0), // 20 agosto 2025, 3:00 PM
      end: new Date(2025, 7, 23, 11, 0),   // 23 agosto 2025, 11:00 AM
      resource: {
        cabana: 'Cabaña del Bosque',
        huespedes: 4,
        telefono: '+56 9 1234 5678'
      }
    },
    {
      id: 2,
      title: 'Reserva Vista al Lago - María González',
      start: new Date(2025, 7, 25, 14, 0), // 25 agosto 2025, 2:00 PM
      end: new Date(2025, 7, 28, 12, 0),   // 28 agosto 2025, 12:00 PM
      resource: {
        cabana: 'Vista al Lago',
        huespedes: 2,
        telefono: '+56 9 8765 4321'
      }
    },
    {
      id: 3,
      title: 'Cabaña Montaña - Familia Rodríguez',
      start: new Date(2025, 7, 30, 16, 0), // 30 agosto 2025, 4:00 PM
      end: new Date(2025, 8, 2, 10, 0),    // 2 septiembre 2025, 10:00 AM
      resource: {
        cabana: 'Cabaña Montaña',
        huespedes: 6,
        telefono: '+56 9 5555 1234'
      }
    },
    {
      id: 4,
      title: 'Refugio Andino - Carlos Muñoz',
      start: new Date(2025, 8, 5, 15, 30), // 5 septiembre 2025, 3:30 PM
      end: new Date(2025, 8, 7, 11, 30),   // 7 septiembre 2025, 11:30 AM
      resource: {
        cabana: 'Refugio Andino',
        huespedes: 3,
        telefono: '+56 9 9999 8888'
      }
    },
    {
      id: 5,
      title: 'Casa del Río - Ana Morales',
      start: new Date(2025, 8, 10, 14, 0), // 10 septiembre 2025, 2:00 PM
      end: new Date(2025, 8, 15, 12, 0),   // 15 septiembre 2025, 12:00 PM
      resource: {
        cabana: 'Casa del Río',
        huespedes: 8,
        telefono: '+56 9 7777 6666'
      }
    }
  ];