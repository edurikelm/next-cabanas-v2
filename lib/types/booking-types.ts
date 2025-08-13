// components/booking-types.ts
export type BookingId = string;

export interface Booking {
  id: BookingId;
  title: string;          // Título o nombre de la reserva/huésped
  cabana: string;         // Nombre/identificador de la cabaña
  cantDias: number;       // Nº de días (calculado desde start/end)
  cantPersonas: number;   // Nº de personas
  celular?: string;        // Teléfono de contacto
  descuento?: boolean;     // ¿Aplica descuento? (bandera)
  end: Date;              // Fecha fin (inclusive, fin del día)
  start: Date;            // Fecha inicio (inicio del día)
  pago?: boolean;          // ¿Pagado?
  ubicacion?: string;      // Ubicación / sector de la cabaña
  valorNoche: number;     // Tarifa por noche
  valorTotal: number;     // Total = valorNoche * cantDias (puedes modificar la lógica si hay descuento)
}