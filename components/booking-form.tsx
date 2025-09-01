// components/booking-form.tsx
"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import type { Booking } from "../lib/types/booking-types";
import { DateRangePicker } from "@/components/date-range-picker";
import { bookingFormSchema, type BookingFormValues } from "@/lib/schemas/booking-schema";
import { useArriendoOperaciones } from "@/lib/hooks/useFirestore";
import { useAvailableCabanas } from "@/lib/cabanas";

export interface BookingFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Omit<Booking, "id">) => void;
  onReload?: () => void;
  initial?: Partial<Booking>;
}

export function BookingForm({ open, onOpenChange, onSubmit, onReload, initial }: BookingFormProps) {
  const { crear, actualizar, loading: operationLoading } = useArriendoOperaciones();
  const { cabanas, loading: cabanasLoading, error: cabanasError } = useAvailableCabanas();
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

  // Efecto para actualizar el formulario cuando cambien los datos iniciales
  useEffect(() => {
    // console.log('BookingForm: updating with initial data:', initial);
    
    const newInitialRange: DateRange | undefined =
      initial?.start && initial?.end ? { from: initial.start, to: initial.end } : undefined;
    
    const resetData = {
      title: initial?.title ?? "",
      cabana: initial?.cabana ?? "",
      ubicacion: initial?.ubicacion ?? "",
      cantPersonas: initial?.cantPersonas ?? 1,
      celular: initial?.celular ?? "",
      valorNoche: initial?.valorNoche ?? 0,
      descuento: initial?.descuento ?? false,
      pago: initial?.pago ?? false,
      dateRange: newInitialRange,
    };
    
    // console.log('BookingForm: resetting form with:', resetData);
    form.reset(resetData);
  }, [initial, form]);

  // Efecto adicional para cuando se abre el modal
  useEffect(() => {
    if (open && initial) {
      // console.log('BookingForm: Modal opened with initial data, forcing reset');
      const newInitialRange: DateRange | undefined =
        initial?.start && initial?.end ? { from: initial.start, to: initial.end } : undefined;
      
      setTimeout(() => {
        form.reset({
          title: initial?.title ?? "",
          cabana: initial?.cabana ?? "",
          ubicacion: initial?.ubicacion ?? "",
          cantPersonas: initial?.cantPersonas ?? 1,
          celular: initial?.celular ?? "",
          valorNoche: initial?.valorNoche ?? 0,
          descuento: initial?.descuento ?? false,
          pago: initial?.pago ?? false,
          dateRange: newInitialRange,
        });
      }, 100);
    }
  }, [open, initial, form]);

  // Derivados en vivo para mostrar en la UI
  const range = form.watch("dateRange");
  const valorNoche = form.watch("valorNoche") ?? 0;
  const cantDias = range?.from && range?.to ? Math.max(1, differenceInCalendarDays(endOfDay(range.to), startOfDay(range.from))) : 0;
  const valorTotal = Math.max(0, (valorNoche || 0) * (cantDias || 0));

  const submit = async (values: BookingFormValues) => {
    const { from, to } = values.dateRange || {};
    if (!from || !to) return; // protegido por zod

    const start = startOfDay(from);
    const end = endOfDay(to);
    const cantDias = Math.max(1, differenceInCalendarDays(end, start));

    const payload: Omit<Booking, "id"> = {
      title: values.title,
      cabana: values.cabana,
      ubicacion: values.ubicacion || '',
      cantPersonas: values.cantPersonas,
      celular: values.celular || '',
      descuento: values.descuento,
      pago: values.pago,
      start,
      end,
      cantDias,
      valorNoche: values.valorNoche,
      valorTotal,
    };

    try {
      if (initial?.id) {
        // Editar arriendo existente
        await actualizar(initial.id, payload);
        console.log('Arriendo actualizado exitosamente');
      } else {
        // Crear nuevo arriendo
        await crear(payload);
        console.log('Arriendo creado exitosamente');
      }
      
      onSubmit(payload);
      onReload?.(); // Recargar datos
      onOpenChange(false);
      form.reset(); // Limpiar formulario
      
    } catch (error) {
      console.error('Error al guardar arriendo:', error);
      // Aquí podrías mostrar un toast de error
      alert('Error al guardar el arriendo. Por favor, intenta nuevamente.');
    }
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            cabanasLoading 
                              ? "Cargando cabañas..." 
                              : cabanasError 
                                ? "Error cargando cabañas" 
                                : "Seleccionar cabaña disponible"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!cabanasLoading && !cabanasError && cabanas.map((cabana) => (
                          <SelectItem key={cabana} value={cabana}>
                            {cabana}
                          </SelectItem>
                        ))}
                        {cabanasError && cabanas.length === 0 && (
                          <div className="px-2 py-1 text-sm text-red-600">
                            No hay cabañas disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
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
                    <Input 
                      type="number" 
                      inputMode="numeric" 
                      min={1} 
                      step={1} 
                      placeholder="2" 
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 1 : Number(value));
                      }}
                    />
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
                    <Input 
                      type="number" 
                      inputMode="decimal" 
                      min={0} 
                      step={1} 
                      placeholder="50000" 
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : Number(value));
                      }}
                    />
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
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={operationLoading}>
                {operationLoading ? 'Guardando...' : (initial?.id ? "Guardar cambios" : "Agregar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}