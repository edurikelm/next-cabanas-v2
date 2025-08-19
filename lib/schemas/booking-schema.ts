// components/booking-schema.ts
import { z } from "zod";

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
  descuento: z.boolean(),
  pago: z.boolean(),
  dateRange: z
    .object({ from: z.date({ message: "Selecciona inicio" }), to: z.date({ message: "Selecciona término" }) })
    .refine((v) => !!v.from && !!v.to, { message: "Selecciona un rango completo", path: ["from"] })
    .refine((v) => v.to && v.from && v.to >= v.from, { message: "El término debe ser ≥ al inicio", path: ["to"] }),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;