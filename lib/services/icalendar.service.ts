import * as ical from 'node-ical';
import { Booking } from '@/lib/types/booking-types';

// Tipos para iCalendar
interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  status?: string;
  organizer?: {
    params?: { CN?: string };
    val: string;
  };
  attendee?: any;
}

// Tipo para reservas sincronizadas de Airbnb
export interface AirbnbReservation {
  id: string;
  cabana: string;
  cliente: string;
  celular: string;
  email?: string;
  start: Date;
  end: Date;
  valorNoche: number;
  valorTotal: number;
  observaciones?: string;
  fuente: 'airbnb' | 'local';
  airbnbId?: string;
  sincronizadoEn: Date;
}

export class ICalendarService {
  
  /**
   * Parsea un archivo iCalendar (.ics) y extrae las reservas
   */
  static async parseICalendarFile(fileContent: string): Promise<AirbnbReservation[]> {
    try {
      const events = ical.parseICS(fileContent);
      const reservations: AirbnbReservation[] = [];

      for (const eventKey in events) {
        const event = events[eventKey];
        
        // Solo procesar eventos VEVENT (no VTIMEZONE, etc.)
        if (event.type !== 'VEVENT') continue;

        const iEvent = event as ICalEvent;
        
        // Extraer información de la reserva de Airbnb
        const reservation = this.convertICalEventToReservation(iEvent);
        if (reservation) {
          reservations.push(reservation);
        }
      }

      return reservations;
    } catch (error) {
      console.error('Error parsing iCalendar file:', error);
      throw new Error('Error al procesar el archivo iCalendar');
    }
  }

  /**
   * Convierte un evento iCal en una reserva del sistema
   */
  private static convertICalEventToReservation(event: ICalEvent): AirbnbReservation | null {
    try {
      // Validar que sea un evento válido
      if (!event.start || !event.end || !event.summary) {
        return null;
      }

      // Extraer información del huésped desde el summary o description
      const guestInfo = this.extractGuestInfo(event.summary, event.description);
      
      // Extraer información de la cabaña desde location o summary
      const cabanaInfo = this.extractCabanaInfo(event.location, event.summary);
      
      // Validar y crear fechas
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Validar que las fechas sean válidas
      if (isNaN(startDate.getTime())) {
        console.warn(`Evento con fecha de inicio inválida: ${event.summary}, start: ${event.start}`);
        return null;
      }
      
      if (isNaN(endDate.getTime())) {
        console.warn(`Evento con fecha de fin inválida: ${event.summary}, end: ${event.end}`);
        return null;
      }
      
      // Calcular duración y precios
      const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Precios estimados (Airbnb no siempre incluye precios en iCal)
      const estimatedPricePerNight = this.estimatePriceFromDescription(event.description);

      const reservation: AirbnbReservation = {
        id: `airbnb-${event.uid}`,
        cabana: cabanaInfo.nombre,
        cliente: guestInfo.nombre,
        celular: guestInfo.telefono || '',
        email: guestInfo.email,
        start: startDate,
        end: endDate,
        valorNoche: estimatedPricePerNight,
        valorTotal: estimatedPricePerNight * nights,
        observaciones: `Reserva Airbnb - ${nights} noche${nights > 1 ? 's' : ''}\n${event.description || ''}`,
        fuente: 'airbnb',
        airbnbId: event.uid,
        sincronizadoEn: new Date()
      };

      return reservation;
    } catch (error) {
      console.error('Error converting iCal event:', error);
      return null;
    }
  }

  /**
   * Extrae información del huésped del summary o description
   */
  private static extractGuestInfo(summary?: string, description?: string) {
    const info = { nombre: 'Huésped Airbnb', telefono: '', email: '' };
    
    if (!summary && !description) return info;

    const text = `${summary || ''} ${description || ''}`;
    
    // Buscar patrones comunes en reservas de Airbnb
    // Ejemplo: "Reserved for John Doe"
    const nameMatch = text.match(/(?:Reserved for|Reservado para)\s+([^(\n]+)/i);
    if (nameMatch) {
      info.nombre = nameMatch[1].trim();
    }

    // Buscar teléfono
    const phoneMatch = text.match(/(?:Phone|Tel|Teléfono):\s*([+\d\s-()]+)/i);
    if (phoneMatch) {
      info.telefono = phoneMatch[1].trim();
    }

    // Buscar email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      info.email = emailMatch[1];
    }

    return info;
  }

  /**
   * Extrae información de la cabaña
   */
  private static extractCabanaInfo(location?: string, summary?: string) {
    // Por defecto usar location o extraer del summary
    let nombre = location || 'Cabaña Externa';
    
    // Si el location parece ser una dirección, extraer solo el nombre de la propiedad
    if (location) {
      // Buscar patrones como "Cabaña Regional Uno - Dirección completa"
      const cabanaMatch = location.match(/^([^,-]+)/);
      if (cabanaMatch) {
        nombre = cabanaMatch[1].trim();
      }
    }

    return { nombre };
  }

  /**
   * Intenta estimar el precio desde la descripción
   */
  private static estimatePriceFromDescription(description?: string): number {
    if (!description) return 0;

    // Buscar patrones de precio en la descripción
    const pricePatterns = [
      /\$\s*(\d+(?:,\d{3})*)/,  // $85,000
      /CLP\s*(\d+(?:,\d{3})*)/i, // CLP 85000
      /(\d+(?:,\d{3})*)\s*pesos?/i, // 85000 pesos
    ];

    for (const pattern of pricePatterns) {
      const match = description.match(pattern);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }
    }

    return 0; // Sin precio detectado
  }

  /**
   * Descarga y parsea un iCalendar desde una URL
   */
  static async syncFromUrl(icalUrl: string): Promise<AirbnbReservation[]> {
    try {
      const response = await fetch(icalUrl);
      if (!response.ok) {
        throw new Error(`Error fetching iCalendar: ${response.statusText}`);
      }

      const icalContent = await response.text();
      return this.parseICalendarFile(icalContent);
    } catch (error) {
      console.error('Error syncing from iCalendar URL:', error);
      throw new Error('Error al sincronizar desde la URL de iCalendar');
    }
  }

  /**
   * Convierte una reserva de Airbnb al formato Booking del sistema
   */
  static convertAirbnbToBooking(airbnbReservation: AirbnbReservation): Omit<Booking, 'id'> {
    const nights = Math.ceil(
      (airbnbReservation.end.getTime() - airbnbReservation.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      title: airbnbReservation.cliente,
      cabana: airbnbReservation.cabana,
      cantDias: nights,
      cantPersonas: 2, // Default, puede ajustarse
      celular: airbnbReservation.celular,
      descuento: false,
      start: airbnbReservation.start,
      end: airbnbReservation.end,
      pago: true, // Asumimos que las reservas de Airbnb están pagadas
      ubicacion: airbnbReservation.cabana,
      valorNoche: airbnbReservation.valorNoche,
      valorTotal: airbnbReservation.valorTotal,
    };
  }
}