// components/booking-form.tsx
"use client";

import { useEffect, useRef, useMemo } from "react";
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
import { useArriendoOperaciones, useArriendos } from "@/lib/hooks/useFirestore";
import { useAvailableCabanas } from "@/lib/cabanas";
import { FileUploader, type FileUploaderRef } from "@/components/file-uploader";
import { eliminarMultiplesArchivos } from "@/lib/utils/archivo-utils";
import { generarContratoArrendamiento, type DatosContrato } from "@/lib/utils/contrato-generator";
import { Textarea } from "@/components/ui/textarea";

export interface BookingFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Omit<Booking, "id">) => void;
  onReload?: () => void;
  initial?: Partial<Booking>;
}

export function BookingForm({ open, onOpenChange, onSubmit, onReload, initial }: BookingFormProps) {
  const { crear, actualizar, loading: operationLoading } = useArriendoOperaciones();
  const { cabanas, loading: cabanasLoading, error: cabanasError, recargar: recargarCabanas } = useAvailableCabanas();
  const { data: arriendos, recargar: recargarArriendos } = useArriendos();
  
  // Referencias para los uploaders de archivos e imágenes
  const archivosUploaderRef = useRef<FileUploaderRef>(null);
  const imagenesUploaderRef = useRef<FileUploaderRef>(null);
  
  // Mostrar todas las cabañas sin filtros
  const cabanasDisponibles = cabanas;
  
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
      descuento: initial?.descuento ?? "sin-descuento",
      pago: initial?.pago ?? false,
      montoAbonado: initial?.montoAbonado ?? 0,
      dateRange: initialRange,
      notas: initial?.notas ?? "",
      esMensual: initial?.esMensual ?? false,
      esAirbnb: initial?.esAirbnb ?? false,
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
      descuento: initial?.descuento ?? "sin-descuento",
      pago: initial?.pago ?? false,
      montoAbonado: initial?.montoAbonado ?? 0,
      dateRange: newInitialRange,
      notas: initial?.notas ?? "",
      esMensual: initial?.esMensual ?? false,
      esAirbnb: initial?.esAirbnb ?? false,
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
          descuento: initial?.descuento ?? "sin-descuento",
          pago: initial?.pago ?? false,
          montoAbonado: initial?.montoAbonado ?? 0,
          esAirbnb: initial?.esAirbnb ?? false,
          dateRange: newInitialRange,
          notas: initial?.notas ?? "",
          esMensual: initial?.esMensual ?? false,
          archivos: initial?.archivos ?? [],
          imagenes: initial?.imagenes ?? [],
          comentarios: initial?.comentarios ?? "",
        });
      }, 100);
    }
  }, [open, initial, form]);

  // Efecto para recargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Recargar cabañas y arriendos para tener datos actualizados
      recargarCabanas();
      recargarArriendos();
    }
  }, [open]); // Removemos las funciones de las dependencias para evitar loops infinitos

  // Derivados en vivo para mostrar en la UI
  const range = form.watch("dateRange");
  const valorNoche = form.watch("valorNoche") ?? 0;
  const esMensual = form.watch("esMensual") ?? false;
  const descuento = form.watch("descuento") ?? "sin-descuento";
  const cantDias = range?.from && range?.to ? Math.max(1, differenceInCalendarDays(range.to, range.from) + 1) : 0;
  const cabanaSeleccionada = form.watch("cabana");
  
  // Calcular meses para arriendos mensuales
  const cantMeses = range?.from && range?.to ? Math.max(1, Math.round(cantDias / 30)) : 0;
  
  // Calcular fechas ocupadas para la cabaña seleccionada
  const fechasOcupadas = useMemo(() => {
    if (!cabanaSeleccionada || !arriendos) return [];
    
    return arriendos
      .filter(arriendo => {
        // Filtrar arriendos de la misma cabaña
        if (arriendo.cabana !== cabanaSeleccionada) return false;
        
        // Si estamos editando, excluir el arriendo actual
        if (initial?.id && arriendo.id === initial.id) return false;
        
        return true;
      })
      .map(arriendo => ({
        start: new Date(arriendo.start),
        end: new Date(arriendo.end)
      }));
  }, [cabanaSeleccionada, arriendos, initial?.id]);
  
  // Función para deshabilitar fechas ocupadas
  const isDateDisabled = (date: Date) => {
    return fechasOcupadas.some(({ start, end }) => {
      return date >= start && date <= end;
    });
  };
  
  // Calcular valor total con descuento si aplica
  // Si es mensual, multiplicar por meses; si no, por días
  const valorBase = esMensual 
    ? Math.max(0, (valorNoche || 0) * (cantMeses || 0))
    : Math.max(0, (valorNoche || 0) * (cantDias || 0));
  const porcentajeDescuento = descuento === "gringo" || descuento === "patricia" ? 0.20 : 0;
  const valorTotal = Math.round(valorBase * (1 - porcentajeDescuento));

  const submit = async (values: BookingFormValues) => {
    const { from, to } = values.dateRange || {};
    if (!from || !to) return; // protegido por zod

    const start = startOfDay(from);
    const end = endOfDay(to);
    const cantDias = Math.max(1, differenceInCalendarDays(to, from) + 1);

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
        montoAbonado: values.montoAbonado || 0,
        esAirbnb: values.esAirbnb,
        start,
        end,
        cantDias,
        valorNoche: values.valorNoche,
        valorTotal,
        notas: values.notas || "",
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
      <DialogContent className="max-w-[96vw] sm:max-w-4xl max-h-[96vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="mb-2 sm:mb-6">
          <DialogTitle className="text-base sm:text-xl">{initial?.id ? "Editar arriendo" : "Nuevo arriendo"}</DialogTitle>
          <DialogDescription className="text-xs sm:text-base hidden sm:block">
            Completa los datos de la reserva. {esMensual ? "Los campos adicionales aparecen porque seleccionaste arriendo mensual." : "Marca 'Arriendo Mensual' para campos adicionales."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="booking-form space-y-6">
            {/* Checkbox para Arriendo Mensual */}
            <FormField
              control={form.control}
              name="esMensual"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-row items-start gap-3 p-4 border-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                    onClick={() => field.onChange(!field.value)}
                  >
                    <FormControl>
                      <Checkbox 
                        checked={field.value ?? false} 
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="flex-1 space-y-1">
                      <FormLabel className="text-base font-semibold cursor-pointer leading-none">
                        Arriendo Mensual
                      </FormLabel>
                      <p className="text-sm text-muted-foreground leading-snug">
                        (habilitará campos adicionales)
                      </p>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* Sección: Información General */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Información General
              </h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel className="text-sm sm:text-base font-medium">Título / Nombre del Huésped</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Eduardo - Cabaña del Bosque" 
                        value={field.value || ""} 
                        onChange={field.onChange}
                        className="h-9 sm:h-11 text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cabana"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Cabaña</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 sm:h-11 text-sm sm:text-base">
                            <SelectValue 
                              placeholder={
                                cabanasLoading 
                                  ? "Cargando cabañas..." 
                                  : cabanasError 
                                    ? "Error cargando cabañas" 
                                    : cabanasDisponibles.length === 0
                                      ? "No hay cabañas disponibles"
                                      : "Seleccionar cabaña"
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {!cabanasLoading && !cabanasError && cabanasDisponibles
                              .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
                              .map((cabana) => (
                              <SelectItem key={cabana} value={cabana} className="text-sm sm:text-base py-1.5 sm:py-2">
                                {cabana}
                              </SelectItem>
                            ))}
                            {!cabanasLoading && !cabanasError && cabanasDisponibles.length === 0 && (
                              <div className="px-3 py-2 text-sm text-orange-600">
                                No hay cabañas disponibles
                              </div>
                            )}
                            {cabanasError && (
                              <div className="px-3 py-2 text-sm text-red-600">
                                Error al cargar cabañas
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Ubicación</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Pucón" 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          className="h-9 sm:h-11 text-sm sm:text-base"
                        />
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cantPersonas"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Cantidad de Personas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          inputMode="numeric" 
                          min={1} 
                          step={1} 
                          placeholder="2" 
                          value={field.value === 0 ? "" : field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : Number(value));
                          }}
                          className="h-9 sm:h-11 text-sm sm:text-base"
                        />
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Celular</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base flex items-center pointer-events-none">
                            +56 9
                          </span>
                          <Input 
                            inputMode="tel" 
                            placeholder="1234 5678" 
                            value={field.value?.replace(/^\+56 9/, '').trim() || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const limited = value.slice(0, 8);
                              field.onChange(limited ? `+56 9 ${limited}` : '');
                            }}
                            maxLength={9}
                            className="h-9 sm:h-11 text-sm sm:text-base pl-16"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección: Fechas y Duración */}
            <div className="space-y-4">
              <span className="flex">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Fechas y Duración
                </h3>
                
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Fechas (Inicio - Término)
                        {cabanaSeleccionada && fechasOcupadas.length > 0 && (
                          <p className="text-xs text-amber-200 mt-1">
                            Las fechas en gris están ocupadas
                          </p>
                        )}    
                      </FormLabel>
                      <FormControl>
                        <DateRangePicker 
                          value={field.value as DateRange | undefined} 
                          onChange={field.onChange}
                          disabled={cabanaSeleccionada ? isDateDisabled : undefined}
                          className="max-w-full"
                        />
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />

                <FormItem className="relative">
                  <FormLabel className="text-sm sm:text-base font-medium">
                    {esMensual ? 'Cantidad de Meses' : 'Cantidad de Noches'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      value={esMensual ? (cantMeses > 0 ? cantMeses : "0") : (cantDias > 0 ? cantDias : "0")}
                      disabled 
                      readOnly
                      className="h-9 sm:h-11 text-sm sm:text-base font-semibold bg-muted text-center"
                    />
                  </FormControl>
                </FormItem>
              </div>
            </div>

            {/* Sección: Información de Pago */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Información de Pago
              </h3>
              
              {/* Fila 1: Valor por Noche | Valor Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorNoche"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">
                        {esMensual ? 'Valor Mensual' : 'Valor por Noche'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base flex items-center">$</span>
                          <Input 
                            type="text" 
                            inputMode="numeric" 
                            placeholder={esMensual ? "400.000" : "50.000"}
                            value={field.value ? field.value.toLocaleString('es-CL') : ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value === "" ? 0 : Number(value));
                            }}
                            className="h-9 sm:h-11 text-sm sm:text-base pl-7"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />

                <FormItem className="relative">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm sm:text-base font-medium">Valor Total</FormLabel>
                    {porcentajeDescuento > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground line-through">
                          ${valorBase.toLocaleString('es-CL')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-green-500 text-white rounded-full font-semibold text-[10px]">
                          -{(porcentajeDescuento * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base font-semibold flex items-center">$</span>
                      <Input 
                        value={valorTotal.toLocaleString('es-CL')} 
                        disabled 
                        readOnly
                        className={`h-9 sm:h-11 text-sm sm:text-base font-semibold pl-7 ${
                          porcentajeDescuento > 0 
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-500 text-green-700 dark:text-green-400' 
                            : 'bg-muted'
                        }`}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              </div>

              {/* Fila 2: Monto Abonado | Descuento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="montoAbonado"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Monto Abonado</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base flex items-center">$</span>
                          <Input 
                            type="text" 
                            inputMode="numeric" 
                            placeholder="0"
                            value={field.value ? field.value.toLocaleString('es-CL') : ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value === "" ? 0 : Number(value));
                            }}
                            className="h-9 sm:h-11 text-sm sm:text-base pl-7"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descuento"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-sm sm:text-base font-medium">Descuento</FormLabel>
                      <FormControl>
                        <Select value={field.value || "sin-descuento"} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 sm:h-11 text-sm sm:text-base">
                            <SelectValue placeholder="Seleccionar descuento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sin-descuento" className="text-sm sm:text-base py-1.5 sm:py-2">
                              Sin descuento
                            </SelectItem>
                            <SelectItem value="gringo" className="text-sm sm:text-base py-1.5 sm:py-2">
                              Gringo (20%)
                            </SelectItem>
                            <SelectItem value="patricia" className="text-sm sm:text-base py-1.5 sm:py-2">
                              Ruta Valdiviana (20%)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="absolute left-0 -bottom-0 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-6 p-4 border rounded-lg bg-muted/30"
              >
                <FormField
                  control={form.control}
                  name="pago"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-row items-center gap-3 cursor-pointer"
                        onClick={() => field.onChange(!field.value)}
                      >
                        <FormControl>
                          <Checkbox 
                            checked={!!field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm sm:text-base font-medium cursor-pointer leading-none">
                          Pago realizado
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="esAirbnb"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-row items-center gap-3 cursor-pointer"
                        onClick={() => field.onChange(!field.value)}
                      >
                        <FormControl>
                          <Checkbox 
                            checked={!!field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm sm:text-base font-medium cursor-pointer leading-none">
                          Arriendo por Airbnb
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Campo de notas opcional */}
            <div>
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-medium">Notas del Arriendo</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value || ''}
                        placeholder="Agrega cualquier nota o información adicional sobre este arriendo..."
                        className="min-h-[60px] sm:min-h-[80px] text-sm sm:text-base resize-y"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos condicionales para arriendos mensuales */}
            {esMensual && (
              <div className="space-y-4 pt-4 border-t-2">
                <h3 className="text-sm sm:text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  📋 Información Adicional del Arriendo Mensual
                </h3>

                {/* Subida de archivos */}
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

                {/* Subida de imágenes */}
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

                {/* Campo de comentarios */}
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
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base font-medium"
              >
                Cancelar
              </Button>
              
              {/* Botón Generar Contrato - solo para arriendos mensuales nuevos */}
              {esMensual && !initial?.id && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    const values = form.getValues();
                    
                    // Validar que los campos necesarios estén llenos
                    if (!values.title || !values.cabana || !values.celular || !values.dateRange?.from || !values.dateRange?.to || !values.valorNoche) {
                      alert('Por favor, completa todos los campos obligatorios antes de generar el contrato (Arrendatario, Cabaña, Celular, Fechas y Valor).');
                      return;
                    }

                    try {
                      const datosContrato: DatosContrato = {
                        arrendatario: values.title,
                        cabana: values.cabana,
                        celular: values.celular,
                        fechaInicio: values.dateRange.from,
                        fechaFin: values.dateRange.to,
                        valorMensual: values.valorNoche,
                        comentarios: values.comentarios || undefined,
                      };

                      generarContratoArrendamiento(datosContrato);
                    } catch (error) {
                      console.error('Error generando contrato:', error);
                      alert('Error al generar el contrato. Por favor, intenta nuevamente.');
                    }
                  }}
                  className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base font-medium"
                >
                  📄 Generar Contrato
                </Button>
              )}
              
              <Button 
                type="submit" 
                disabled={operationLoading}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base font-medium min-w-[140px]"
              >
                {operationLoading ? '⏳ Guardando...' : (initial?.id ? "💾 Guardar Cambios" : "Guardar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ComentariosField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <FormLabel className="text-sm sm:text-base font-medium">Comentarios</FormLabel>
      <Textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder || "Comentarios adicionales..."} 
        className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-y"
      />
    </div>
  );
}
