// components/booking-types.ts
export type BookingId = string;

// Tipo de período de arriendo
export type PeriodoTipo = 'dia' | 'mes';

// Estructura para archivos adjuntos
export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  url: string;
  tipo: string; // MIME type
  tamaño: number; // en bytes
  fechaSubida: Date;
}

// Estructura para imágenes
export interface ImagenAdjunta {
  id: string;
  nombre: string;
  url: string;
  urlThumbnail?: string; // URL de miniatura opcional
  tamaño: number; // en bytes
  fechaSubida: Date;
}

export interface Booking {
  id: BookingId;
  title: string;          // Título o nombre de la reserva/huésped
  cabana: string;         // Nombre/identificador de la cabaña
  cantDias: number;       // Nº de días (calculado desde start/end)
  cantPersonas: number;   // Nº de personas
  celular?: string;        // Teléfono de contacto
  descuento: "sin-descuento" | "gringo" | "patricia"; // Tipo de descuento aplicado
  end: Date;              // Fecha fin (inclusive, fin del día)
  start: Date;            // Fecha inicio (inicio del día)
  pago: boolean;          // ¿Pagado?
  ubicacion?: string;      // Ubicación / sector de la cabaña
  valorNoche: number;     // Tarifa por noche
  valorTotal: number;     // Total = valorNoche * cantDias (puedes modificar la lógica si hay descuento)
  
  // Nuevos campos opcionales
  esMensual: boolean;      // Indica si es arriendo mensual (determina si aparecen campos extra)
  archivos?: ArchivoAdjunto[]; // Documentos adjuntos (solo para arriendos mensuales)
  imagenes?: ImagenAdjunta[];  // Fotos adjuntas (solo para arriendos mensuales)
  comentarios?: string;    // Comentarios o notas adicionales (solo para arriendos mensuales)
}