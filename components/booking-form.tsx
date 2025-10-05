// components/booking-form.tsx
"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

import type { Booking, ArchivoAdjunto, ImagenAdjunta } from "../lib/types/booking-types";
import { DateRangePicker } from "@/components/date-range-picker";
import { bookingFormSchema, type BookingFormValues } from "@/lib/schemas/booking-schema";
import { useArriendoOperaciones } from "@/lib/hooks/useFirestore";
import { useAvailableCabanas } from "@/lib/cabanas";
import { FileUploader, type FileUploaderRef } from "@/components/file-uploader";
import { ComentariosField } from "@/components/booking-fields-extra";
import { eliminarMultiplesArchivos } from "@/lib/utils/archivo-utils";

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
  
  // Referencias para los uploaders de archivos e imágenes
  const archivosUploaderRef = useRef<FileUploaderRef>(null);
  const imagenesUploaderRef = useRef<FileUploaderRef>(null);
  
  // Asegurar que initialRange tenga una estructura válida
  const initialRange: DateRange = initial?.start && initial?.end 
    ? { from: initial.start, to: initial.end } 
    : { from: undefined, to: undefined };

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
      esMensual: initial?.esMensual ?? false,
      archivos: initial?.archivos ?? [],
      imagenes: initial?.imagenes ?? [],
      comentarios: initial?.comentarios ?? "",
    },
  });

  // Efecto para actualizar el formulario cuando cambien los datos iniciales
  useEffect(() => {
    // console.log('BookingForm: updating with initial data:', initial);
    
    const newInitialRange: DateRange = initial?.start && initial?.end 
      ? { from: initial.start, to: initial.end } 
      : { from: undefined, to: undefined };
    
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
      esMensual: initial?.esMensual ?? false,
      archivos: initial?.archivos ?? [],
      imagenes: initial?.imagenes ?? [],
      comentarios: initial?.comentarios ?? "",
    };
    
    // console.log('BookingForm: resetting form with:', resetData);
    form.reset(resetData);
  }, [initial, form]);

  // Efecto adicional para cuando se abre el modal
  useEffect(() => {
    if (open && initial) {
      // console.log('BookingForm: Modal opened with initial data, forcing reset');
      const newInitialRange: DateRange = initial?.start && initial?.end 
        ? { from: initial.start, to: initial.end } 
        : { from: undefined, to: undefined };
      
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
          esMensual: initial?.esMensual ?? false,
          archivos: initial?.archivos ?? [],
          imagenes: initial?.imagenes ?? [],
          comentarios: initial?.comentarios ?? "",
        });
      }, 100);
    }
  }, [open, initial, form]);

  // Derivados en vivo para mostrar en la UI
  const range = form.watch("dateRange");
  const valorNoche = form.watch("valorNoche") ?? 0;
  const esMensual = form.watch("esMensual") ?? false;
  const cantDias = range?.from && range?.to ? Math.max(1, differenceInCalendarDays(endOfDay(range.to), startOfDay(range.from))) : 0;
  const valorTotal = Math.max(0, (valorNoche || 0) * (cantDias || 0));

  const submit = async (values: BookingFormValues) => {
    const { from, to } = values.dateRange || {};
    if (!from || !to) return; // protegido por zod

    const start = startOfDay(from);
    const end = endOfDay(to);
    const cantDias = Math.max(1, differenceInCalendarDays(end, start));

    try {
      let finalBookingId: string;
      
      // Crear o actualizar el booking primero para obtener un ID
      const basePayload: Omit<Booking, "id"> = {
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
        esMensual: values.esMensual,
        archivos: values.archivos || [],
        imagenes: values.imagenes || [],
        comentarios: values.comentarios || "",
      };

      if (initial?.id) {
        // Editar arriendo existente
        await actualizar(initial.id, basePayload);
        finalBookingId = initial.id;
        console.log('Arriendo actualizado exitosamente');
      } else {
        // Crear nuevo arriendo
        const bookingId = await crear(basePayload);
        finalBookingId = bookingId;
        console.log('Arriendo creado exitosamente');
      }

      // Subir archivos pendientes solo si es arriendo mensual
      if (values.esMensual) {
        try {
          // Eliminar archivos que fueron eliminados del formulario
          const archivosEliminados = archivosUploaderRef.current?.obtenerArchivosEliminados() || [];
          const imagenesEliminadas = imagenesUploaderRef.current?.obtenerArchivosEliminados() || [];
          
          if (archivosEliminados.length > 0 || imagenesEliminadas.length > 0) {
            console.log('Eliminando archivos del Storage:', { archivosEliminados, imagenesEliminadas });
            
            // Eliminar archivos del Storage
            if (archivosEliminados.length > 0) {
              await eliminarMultiplesArchivos(archivosEliminados);
            }
            if (imagenesEliminadas.length > 0) {
              await eliminarMultiplesArchivos(imagenesEliminadas);
            }
            
            console.log('Archivos eliminados del Storage exitosamente');
          }
          
          // Subir archivos pendientes
          const archivosFinales = await archivosUploaderRef.current?.subirArchivosPendientes(finalBookingId) || [];
          const imagenesFinales = await imagenesUploaderRef.current?.subirArchivosPendientes(finalBookingId) || [];

          // Actualizar el booking con los archivos subidos
          if (archivosFinales.length > 0 || imagenesFinales.length > 0) {
            const payloadConArchivos: Omit<Booking, "id"> = {
              ...basePayload,
              archivos: archivosFinales as ArchivoAdjunto[],
              imagenes: imagenesFinales as ImagenAdjunta[],
            };
            
            await actualizar(finalBookingId, payloadConArchivos);
            console.log('Archivos subidos y booking actualizado');
          }
        } catch (uploadError) {
          console.error('Error subiendo archivos:', uploadError);
          // El booking ya fue creado, solo falla la subida de archivos
          alert('El arriendo fue guardado, pero hubo un error subiendo algunos archivos. Puedes editarlo para volver a intentar.');
        }
      }

      onSubmit(basePayload);
      onReload?.(); // Recargar datos
      onOpenChange(false);
      form.reset(); // Limpiar formulario
      
      // Limpiar archivos pendientes de los uploaders
      archivosUploaderRef.current?.limpiarArchivosPendientes();
      imagenesUploaderRef.current?.limpiarArchivosPendientes();
      
    } catch (error) {
      console.error('Error al guardar arriendo:', error);
      alert('Error al guardar el arriendo. Por favor, intenta nuevamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-4xl max-h-[98vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader className="mb-3 sm:mb-6">
          <DialogTitle className="text-base sm:text-xl">{initial?.id ? "Editar arriendo" : "Nuevo arriendo"}</DialogTitle>
          <DialogDescription className="text-xs sm:text-base hidden sm:block">
            Completa los datos de la reserva. {esMensual ? "Los campos adicionales aparecen porque seleccionaste arriendo mensual." : "Marca 'Arriendo Mensual' para campos adicionales."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="booking-form grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Checkbox para Arriendo Mensual */}
            <FormField
              control={form.control}
              name="esMensual"
              render={({ field }) => (
                <FormItem className="lg:col-span-2 flex flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <FormControl>
                    <Checkbox 
                      checked={field.value ?? false} 
                      onCheckedChange={field.onChange}
                      className="mt-1 sm:mt-0 h-5 w-5"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium cursor-pointer leading-tight">
                      Arriendo Mensual
                    </FormLabel>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Marcar si este es un arriendo por mes (habilitará campos adicionales)
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel className="text-sm sm:text-base font-medium">Título</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Eduardo - Cabaña del Bosque" 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      className="h-10 sm:h-11 text-base"
                    />
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
                  <FormLabel className="text-sm sm:text-base font-medium">Cabaña</FormLabel>
                  <FormControl>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 sm:h-11 text-base">
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
                          <SelectItem key={cabana} value={cabana} className="text-base py-2">
                            {cabana}
                          </SelectItem>
                        ))}
                        {cabanasError && cabanas.length === 0 && (
                          <div className="px-3 py-2 text-sm text-red-600">
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
                  <FormLabel className="text-sm sm:text-base font-medium">Ubicación</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Pucón" 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      className="h-10 sm:h-11 text-base"
                    />
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
                  <FormLabel className="text-sm sm:text-base font-medium">Personas</FormLabel>
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
                      className="h-10 sm:h-11 text-base"
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
                  <FormLabel className="text-sm sm:text-base font-medium">Celular</FormLabel>
                  <FormControl>
                    <Input 
                      inputMode="tel" 
                      placeholder="+56 9 1234 5678" 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      className="h-10 sm:h-11 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel className="text-sm sm:text-base font-medium">Fechas (Check-in / Check-out)</FormLabel>
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
                  <FormLabel className="text-sm sm:text-base font-medium">Valor por noche</FormLabel>
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
                      className="h-10 sm:h-11 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo derivado solo de lectura */}
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-medium">Total</FormLabel>
              <FormControl>
                <Input 
                  value={valorTotal.toLocaleString()} 
                  disabled 
                  readOnly
                  className="h-10 sm:h-11 text-base font-semibold bg-muted"
                />
              </FormControl>
            </FormItem>

            {/* Checkboxes (booleans) */}
            <FormField
              control={form.control}
              name="descuento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <FormControl>
                    <Checkbox 
                      checked={!!field.value} 
                      onCheckedChange={field.onChange}
                      className="h-5 w-5"
                    />
                  </FormControl>
                  <FormLabel className="text-sm sm:text-base font-medium cursor-pointer flex-1">Descuento aplicado</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pago"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <FormControl>
                    <Checkbox 
                      checked={!!field.value} 
                      onCheckedChange={field.onChange}
                      className="h-5 w-5"
                    />
                  </FormControl>
                  <FormLabel className="text-sm sm:text-base font-medium cursor-pointer flex-1">Pago realizado</FormLabel>
                </FormItem>
              )}
            />

            {/* Campos condicionales para arriendos mensuales */}
            {esMensual && (
              <>
                {/* Separador visual */}
                <div className="lg:col-span-2 border-t pt-2 sm:pt-4 mt-2 sm:mt-4">
                  <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    📋 Información Adicional
                    <span className="text-xs font-normal text-muted-foreground hidden sm:inline">(Arriendo Mensual)</span>
                  </h3>
                </div>

                {/* Subida de archivos */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="archivos"
                    render={({ field }) => (
                      <FormItem>
                        <FileUploader
                          ref={archivosUploaderRef}
                          bookingId={initial?.id || 'temp'}
                          tipo="archivos"
                          archivosExistentes={field.value || []}
                          onArchivosChange={field.onChange}
                          maxArchivos={5}
                        />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subida de imágenes */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="imagenes"
                    render={({ field }) => (
                      <FormItem>
                        <FileUploader
                          ref={imagenesUploaderRef}
                          bookingId={initial?.id || 'temp'}
                          tipo="imagenes"
                          archivosExistentes={field.value || []}
                          onArchivosChange={field.onChange}
                          maxArchivos={5}
                        />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo de comentarios */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="comentarios"
                    render={({ field }) => (
                      <FormItem>
                        <ComentariosField
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Agregar observaciones sobre el arriendo mensual..."
                        />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <div className="lg:col-span-2 flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-11 text-base font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={operationLoading}
                className="w-full sm:w-auto h-11 text-base font-medium min-w-[140px]"
              >
                {operationLoading ? 'Guardando...' : (initial?.id ? "Guardar cambios" : "Agregar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}