import { NextRequest, NextResponse } from 'next/server';
import { ICalendarService } from '@/lib/services/icalendar.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const reservations = await ICalendarService.parseICalendarFile(content);

    return NextResponse.json({
      success: true,
      message: `Se encontraron ${reservations.length} reservas para sincronizar`,
      reservations: reservations
    });
  } catch (error) {
    console.error('Error processing iCalendar file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error procesando archivo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Se requiere URL del calendario' },
        { status: 400 }
      );
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('No se pudo descargar el archivo desde la URL');
    }

    const content = await response.text();
    const reservations = await ICalendarService.parseICalendarFile(content);

    return NextResponse.json({
      success: true,
      message: `Se encontraron ${reservations.length} reservas para sincronizar`,
      reservations: reservations
    });
  } catch (error) {
    console.error('Error syncing from URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error sincronizando desde URL' },
      { status: 500 }
    );
  }
}