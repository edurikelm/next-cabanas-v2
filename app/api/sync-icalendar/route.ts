import { NextRequest, NextResponse } from 'next/server';
import { ICalendarService } from '@/lib/services/icalendar.service';
import { useArriendoOperaciones } from '@/lib/hooks/useFirestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { icalContent, icalUrl, mapToCabanas } = body;

    if (!icalContent && !icalUrl) {
      return NextResponse.json(
        { error: 'Se requiere contenido iCalendar o URL' },
        { status: 400 }
      );
    }

    let airbnbReservations;

    // Procesar desde contenido o URL
    if (icalContent) {
      airbnbReservations = await ICalendarService.parseICalendarFile(icalContent);
    } else {
      airbnbReservations = await ICalendarService.syncFromUrl(icalUrl);
    }

    // Mapear cabañas si se proporciona mapeo personalizado
    if (mapToCabanas) {
      airbnbReservations = airbnbReservations.map(reservation => ({
        ...reservation,
        cabana: mapToCabanas[reservation.cabana] || reservation.cabana
      }));
    }

    // Convertir a formato de booking y preparar respuesta
    const bookingsToCreate = airbnbReservations.map(reservation => 
      ICalendarService.convertAirbnbToBooking(reservation)
    );

    return NextResponse.json({
      success: true,
      message: `Se encontraron ${airbnbReservations.length} reservas para sincronizar`,
      data: {
        reservations: airbnbReservations,
        bookings: bookingsToCreate,
        summary: {
          total: airbnbReservations.length,
          dateRange: airbnbReservations.length > 0 ? {
            start: Math.min(...airbnbReservations.map(r => r.start.getTime())),
            end: Math.max(...airbnbReservations.map(r => r.end.getTime()))
          } : null,
          cabanas: [...new Set(airbnbReservations.map(r => r.cabana))]
        }
      }
    });

  } catch (error) {
    console.error('Error processing iCalendar:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar el archivo iCalendar',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Endpoint para sincronizar y guardar reservas directamente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookings } = body;

    if (!bookings || !Array.isArray(bookings)) {
      return NextResponse.json(
        { error: 'Se requiere array de bookings' },
        { status: 400 }
      );
    }

    // Aquí necesitaríamos una instancia del servicio de arriendos
    // Como los hooks no se pueden usar en API routes, necesitamos crear una instancia directa
    const results = {
      success: [] as string[],
      errors: [] as string[]
    };

    // Por ahora retornamos la estructura preparada
    // En la implementación real necesitaremos conectar directamente con Firestore
    return NextResponse.json({
      success: true,
      message: `Preparado para sincronizar ${bookings.length} reservas`,
      results,
      data: bookings
    });

  } catch (error) {
    console.error('Error syncing bookings:', error);
    return NextResponse.json(
      { 
        error: 'Error al sincronizar las reservas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}