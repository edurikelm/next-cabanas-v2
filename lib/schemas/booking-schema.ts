// components/booking-schema.ts
import { z } from "zod";
import type { PeriodoTipo, ArchivoAdjunto, ImagenAdjunta } from "@/lib/types/booking-types";

// Schema para archivos adjuntos
export const archivoAdjuntoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  url: z.string().url(),
  tipo: z.string(),
  tamaño: z.number().positive(),
  fechaSubida: z.date()
});

// Schema para imágenes adjuntas
export const imagenAdjuntaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  url: z.string().url(),
  urlThumbnail: z.string().url().optional(),
  tamaño: z.number().positive(),
  fechaSubida: z.date()
});

// Schema para tipo de período
export const periodoTipoSchema = z.enum(['dia', 'mes']);

export const bookingFormSchema = z.object({
  title: z.string().min(1, "Requerido"),
  cabana: z.string().min(1, "Requerido"),
  ubicacion: z.string().min(1, "Requerido"),
  cantPersonas: z.number().int().min(1, "Mínimo 1"),
  celular: z
    .string()
    .min(8, "Teléfono inválido")
    .max(20)
    .regex(/^\+?[0-9\s-]{7,}$/i, "Teléfono inválido"),
  valorNoche: z.number().nonnegative("No puede ser negativo"),
  descuento: z.enum(["sin-descuento", "gringo", "patricia"]),
  pago: z.boolean(),
  esAirbnb: z.boolean(),
  dateRange: z
    .object({ from: z.date({ message: "Selecciona inicio" }), to: z.date({ message: "Selecciona término" }) })
    .refine((v) => !!v.from && !!v.to, { message: "Selecciona un rango completo", path: ["from"] })
    .refine((v) => v.to && v.from && v.to >= v.from, { message: "El término debe ser ≥ al inicio", path: ["to"] }),
  
  // Campo principal para identificar si es arriendo mensual
  esMensual: z.boolean(),
  
  // Campos opcionales que solo aparecen si esMensual es true
  archivos: z.array(archivoAdjuntoSchema).optional(),
  imagenes: z.array(imagenAdjuntaSchema).optional(),
  comentarios: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;