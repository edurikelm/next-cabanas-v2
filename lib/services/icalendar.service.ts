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
      
      // Extraer información de la cabaña desde location, summary y description
      const cabanaInfo = this.extractCabanaInfo(event.location, event.summary, event.description);
      
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
   * Extrae información de la cabaña desde múltiples campos del evento iCalendar
   */
  private static extractCabanaInfo(location?: string, summary?: string, description?: string) {
    let nombre = 'Cabaña Externa';
    
    // Array de posibles fuentes de información
    const sources = [location, summary, description].filter(Boolean);
    
    for (const source of sources) {
      if (!source) continue;
      
      // 1. Buscar patrones específicos de nombres de cabañas
      const cabanaPatterns = [
        // Patrones para "Regional Uno", "Teja Dos", etc.
        /(?:cabaña\s+)?([Rr]egional\s+(?:Uno|Dos|Tres|Cuatro|1|2|3|4))/i,
        /(?:cabaña\s+)?([Tt]eja\s+(?:Uno|Dos|Tres|Cuatro|1|2|3|4))/i,
        
        // Patrones más generales
        /(?:cabaña\s+)([A-Za-z]+\s+(?:Uno|Dos|Tres|Cuatro|Norte|Sur|Este|Oeste|1|2|3|4|5|6|7|8|9|10))/i,
        /(?:property:?\s+)([^,\n\r]+)/i,
        /(?:listing:?\s+)([^,\n\r]+)/i,
        /(?:unit:?\s+)([^,\n\r]+)/i,
        
        // Nombres específicos al inicio
        /^([A-Za-z\s]+(?:Villa|House|Cottage|Lodge|Cabin|Cabaña))/i,
        /^([A-Za-z\s]+\s+\d+[A-Za-z]?)/i,
        
        // Patrones de Airbnb
        /(?:Entire\s+.*?at\s+)([^,\n\r]+)/i,
        /(?:Private\s+.*?at\s+)([^,\n\r]+)/i,
        /(?:Room\s+in\s+)([^,\n\r]+)/i,
        
        // Patrones generales al inicio de la línea
        /^([A-Z][a-zA-Z\s]{2,30})(?:\s*[-–—]\s*|\s*,\s*)/,
      ];
      
      for (const pattern of cabanaPatterns) {
        const match = source.match(pattern);
        if (match && match[1]) {
          nombre = match[1].trim();
          
          // Limpiar el nombre extraído
          nombre = this.cleanCabanaName(nombre);
          
          console.log(`Cabaña extraída: "${nombre}" desde: "${source.substring(0, 100)}"`);
          return { nombre, source: 'pattern', field: sources.indexOf(source) === 0 ? 'location' : sources.indexOf(source) === 1 ? 'summary' : 'description' };
        }
      }
    }
    
    // 2. Si no se encontró patrón específico, usar location limpio
    if (location) {
      nombre = this.cleanCabanaName(location.split(/[,\-–—]/)[0].trim());
      if (nombre && nombre.length > 2) {
        console.log(`Cabaña extraída desde location: "${nombre}"`);
        return { nombre, source: 'location', field: 'location' };
      }
    }
    
    // 3. Último recurso: usar summary limpio
    if (summary) {
      nombre = this.cleanCabanaName(summary.split(/[,\-–—]/)[0].trim());
      if (nombre && nombre.length > 2) {
        console.log(`Cabaña extraída desde summary: "${nombre}"`);
        return { nombre, source: 'summary', field: 'summary' };
      }
    }
    
    console.log(`No se pudo extraer nombre de cabaña. Location: "${location}", Summary: "${summary}"`);
    return { nombre: 'Cabaña Externa', source: 'default', field: null };
  }

  /**
   * Limpia y normaliza el nombre de la cabaña extraído
   */
  private static cleanCabanaName(rawName: string): string {
    if (!rawName) return '';
    
    let cleaned = rawName.trim();
    
    // Remover prefijos comunes
    cleaned = cleaned.replace(/^(?:cabaña\s+|cabin\s+|house\s+|villa\s+|property\s+)/i, '');
    
    // Remover sufijos comunes
    cleaned = cleaned.replace(/\s+(?:house|cabin|villa|cottage|lodge|property|unit)$/i, '');
    
    // Normalizar espacios
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Capitalizar correctamente
    cleaned = this.capitalizePropertyName(cleaned);
    
    return cleaned;
  }

  /**
   * Capitaliza correctamente nombres de propiedades
   */
  private static capitalizePropertyName(name: string): string {
    if (!name) return '';
    
    // Palabras que deben mantenerse en minúscula
    const lowercaseWords = ['de', 'del', 'la', 'el', 'y', 'e', 'o', 'u', 'a', 'an', 'the', 'and', 'or', 'of', 'at', 'in', 'on'];
    
    return name.split(' ')
      .map((word, index) => {
        const lowerWord = word.toLowerCase();
        
        // Primera palabra siempre va capitalizada
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        // Palabras especiales en minúscula (excepto si están al inicio)
        if (lowercaseWords.includes(lowerWord)) {
          return lowerWord;
        }
        
        // Números romanos o palabras especiales
        if (/^(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|i{1,3}|iv|v|vi{1,3}|ix|x)$/i.test(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        // Resto de palabras normalmente
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Mapea nombres de cabañas extraídos a nombres del sistema local
   */
  static mapCabanaName(extractedName: string, availableCabanas?: string[]): string {
    if (!extractedName) return extractedName;
    
    const normalizedExtracted = extractedName.toLowerCase().trim();
    
    // Mapeos explícitos comunes
    const mappings: { [key: string]: string } = {
      'regional 1': 'Regional Uno',
      'regional 2': 'Regional Dos',
      'regional 3': 'Regional Tres',
      'regional 4': 'Regional Cuatro',
      'regional i': 'Regional Uno',
      'regional ii': 'Regional Dos',
      'regional iii': 'Regional Tres',
      'regional iv': 'Regional Cuatro',
      'teja 1': 'Teja Uno',
      'teja 2': 'Teja Dos',
      'teja 3': 'Teja Tres',
      'teja 4': 'Teja Cuatro',
      'teja i': 'Teja Uno',
      'teja ii': 'Teja Dos',
      'teja iii': 'Teja Tres',
      'teja iv': 'Teja Cuatro',
    };
    
    // Buscar mapeo directo
    if (mappings[normalizedExtracted]) {
      return mappings[normalizedExtracted];
    }
    
    // Si tenemos lista de cabañas disponibles, buscar coincidencia aproximada
    if (availableCabanas && availableCabanas.length > 0) {
      const bestMatch = this.findBestCabanaMatch(normalizedExtracted, availableCabanas);
      if (bestMatch) {
        return bestMatch;
      }
    }
    
    // Retornar el nombre extraído limpio
    return extractedName;
  }

  /**
   * Encuentra la mejor coincidencia entre el nombre extraído y las cabañas disponibles
   */
  private static findBestCabanaMatch(extractedName: string, availableCabanas: string[]): string | null {
    const normalized = extractedName.toLowerCase().replace(/\s+/g, '');
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    for (const cabana of availableCabanas) {
      const cabanaLower = cabana.toLowerCase().replace(/\s+/g, '');
      
      // Coincidencia exacta
      if (normalized === cabanaLower) {
        return cabana;
      }
      
      // Coincidencia parcial
      const score = this.calculateSimilarity(normalized, cabanaLower);
      if (score > bestScore && score > 0.6) { // Umbral de similitud
        bestScore = score;
        bestMatch = cabana;
      }
    }
    
    return bestMatch;
  }

  /**
   * Calcula similitud entre dos strings usando algoritmo simple
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calcula distancia de Levenshtein entre dos strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + cost  // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
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
  static convertAirbnbToBooking(airbnbReservation: AirbnbReservation, availableCabanas?: string[]): Omit<Booking, 'id'> {
    const nights = Math.ceil(
      (airbnbReservation.end.getTime() - airbnbReservation.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Mapear el nombre de la cabaña a uno del sistema local
    const mappedCabanaName = this.mapCabanaName(airbnbReservation.cabana, availableCabanas);

    return {
      title: airbnbReservation.cliente,
      cabana: mappedCabanaName,
      cantDias: nights,
      cantPersonas: 2, // Default, puede ajustarse
      celular: airbnbReservation.celular,
      descuento: "sin-descuento",
      start: airbnbReservation.start,
      end: airbnbReservation.end,
      pago: true, // Asumimos que las reservas de Airbnb están pagadas
      esAirbnb: true, // Marcamos como reserva de Airbnb
      ubicacion: mappedCabanaName,
      valorNoche: airbnbReservation.valorNoche,
      valorTotal: airbnbReservation.valorTotal,
      esMensual: false, // Reservas de iCalendar son típicamente por días, no mensuales
      archivos: [], // Reservas de iCalendar no incluyen archivos adjuntos
      imagenes: [], // Reservas de iCalendar no incluyen imágenes adjuntas
      comentarios: '' // Sin comentarios adicionales por defecto
    };
  }
}