// components/booking-form.tsx
"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import type { Booking } from "../lib/types/booking-types";
import { DateRangePicker } from "@/components/date-range-picker";
import { bookingFormSchema, type BookingFormValues } from "@/lib/schemas/booking-schema";

export interface BookingFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Omit<Booking, "id">) => void;
  initial?: Partial<Booking>;
}

export function BookingForm({ open, onOpenChange, onSubmit, initial }: BookingFormProps) {
  const initialRange: DateRange | undefined =
    initial?.start && initial?.end ? { from: initial.start, to: initial.end } : undefined;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      title: initial?.title ?? "",
      cabana: initial?.cabana ?? "",
      ubicacion: initial?.ubicacion ?? "",
      cantPersonas: initial?.cantPersonas ?? 1,
      celular: initial?.celular ?? "",
      valorNoche: initial?.valorNoche ?? 0,
      descuento: initial?.descuento ?? false,
      pago: initial?.pago ?? false,
      dateRange: initialRange,
    },
  });

  // Derivados en vivo para mostrar en la UI
  const range = form.watch("dateRange");
  const valorNoche = form.watch("valorNoche") ?? 0;
  const cantDias = range?.from && range?.to ? Math.max(1, differenceInCalendarDays(endOfDay(range.to), startOfDay(range.from))) : 0;
  const valorTotal = Math.max(0, (valorNoche || 0) * (cantDias || 0));

  const submit = (values: BookingFormValues) => {
    const { from, to } = values.dateRange || {};
    if (!from || !to) return; // protegido por zod

    const start = startOfDay(from);
    const end = endOfDay(to);
    const cantDias = Math.max(1, differenceInCalendarDays(end, start));

    const payload: Omit<Booking, "id"> = {
      title: values.title,
      cabana: values.cabana,
      ubicacion: values.ubicacion,
      cantPersonas: values.cantPersonas,
      celular: values.celular,
      descuento: values.descuento,
      pago: values.pago,
      start,
      end,
      cantDias,
      valorNoche: values.valorNoche,
      valorTotal,
    };

    onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar arriendo" : "Nuevo arriendo"}</DialogTitle>
          <DialogDescription>Completa los datos de la reserva.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Eduardo - Cabaña del Bosque" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cabana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cabaña</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cabaña del Bosque" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ubicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pucón" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cantPersonas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personas</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" min={1} step={1} placeholder="2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input inputMode="tel" placeholder="+56 9 1234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Fechas (Check-in / Check-out)</FormLabel>
                  <FormControl>
                    <DateRangePicker value={field.value as DateRange | undefined} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valorNoche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por noche</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="decimal" min={0} step={1} placeholder="50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo derivado solo de lectura */}
            <FormItem>
              <FormLabel>Total</FormLabel>
              <FormControl>
                <Input value={valorTotal.toString()} disabled readOnly />
              </FormControl>
            </FormItem>

            {/* Checkboxes (booleans) */}
            <FormField
              control={form.control}
              name="descuento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormLabel className="m-0">Descuento</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pago"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormLabel className="m-0">Pago realizado</FormLabel>
                </FormItem>
              )}
            />

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{initial?.id ? "Guardar cambios" : "Agregar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}