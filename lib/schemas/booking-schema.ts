// components/booking-schema.ts
import { z } from "zod";

export const bookingFormSchema = z.object({
  title: z.string().min(1, "Requerido"),
  cabana: z.string().min(1, "Requerido"),
  ubicacion: z.string().min(1, "Requerido"),
  cantPersonas: z.coerce.number().int().min(1, "Mínimo 1"),
  celular: z
    .string()
    .min(8, "Teléfono inválido")
    .max(20)
    .regex(/^\+?[0-9\s-]{7,}$/i, "Teléfono inválido"),
  valorNoche: z.coerce.number().nonnegative("No puede ser negativo"),
  descuento: z.boolean().default(false),
  pago: z.boolean().default(false),
  dateRange: z
    .object({ from: z.date({ invalid_type_error: "Selecciona inicio" }), to: z.date({ invalid_type_error: "Selecciona término" }) })
    .refine((v) => !!v.from && !!v.to, { message: "Selecciona un rango completo", path: ["from"] })
    .refine((v) => v.to && v.from && v.to >= v.from, { message: "El término debe ser ≥ al inicio", path: ["to"] }),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;