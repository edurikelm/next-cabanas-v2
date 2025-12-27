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
  
  // Filtrar cabañas que no tienen arriendos mensuales activos
  const cabanasDisponibles = cabanas.filter((cabana) => {
    if (!arriendos) return true; // Si no hay arriendos cargados, mostrar todas las cabañas
    
    // Verificar si hay arriendos mensuales activos para esta cabaña
    const tieneArriendoMensualActivo = arriendos.some((arriendo) => {
      if (!arriendo.esMensual || arriendo.cabana !== cabana) return false;
      
      const hoy = new Date();
      const inicio = new Date(arriendo.start);
      const fin = new Date(arriendo.end);
      
      // Si estamos editando un arriendo existente, excluirlo del filtro
      if (initial?.id && arriendo.id === initial.id) return false;
      
      // Verificar si el arriendo mensual está activo (en curso)
      return hoy >= inicio && hoy <= fin;
    });
    
    return !tieneArriendoMensualActivo;
  });
  
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
      descuento: initial?.descuento ?? "sin-descuento",
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
          descuento: initial?.descuento ?? "sin-descuento",
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
  const cantDias = range?.from && range?.to ? Math.max(1, differenceInCalendarDays(endOfDay(range.to), startOfDay(range.from))) : 0;
  
  // Calcular valor total con descuento si aplica
  const valorBase = Math.max(0, (valorNoche || 0) * (cantDias || 0));
  const porcentajeDescuento = descuento === "gringo" || descuento === "patricia" ? 0.20 : 0;
  const valorTotal = Math.round(valorBase * (1 - porcentajeDescuento));

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
      <DialogContent className="max-w-[96vw] sm:max-w-4xl max-h-[96vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="mb-2 sm:mb-6">
          <DialogTitle className="text-base sm:text-xl">{initial?.id ? "Editar arriendo" : "Nuevo arriendo"}</DialogTitle>
          <DialogDescription className="text-xs sm:text-base hidden sm:block">
            Completa los datos de la reserva. {esMensual ? "Los campos adicionales aparecen porque seleccionaste arriendo mensual." : "Marca 'Arriendo Mensual' para campos adicionales."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="booking-form grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {/* Checkbox para Arriendo Mensual */}
            <FormField
              control={form.control}
              name="esMensual"
              render={({ field }) => (
                <FormItem className="xl:col-span-2">
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
                        Marcar si este es un arriendo por mes (habilitará campos adicionales)
                      </p>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="xl:col-span-2">
                  <FormLabel className="text-sm sm:text-base font-medium">Título</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Eduardo - Cabaña del Bosque" 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      className="h-9 sm:h-11 text-sm sm:text-base"
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
                      <SelectTrigger className="h-9 sm:h-11 text-sm sm:text-base">
                        <SelectValue 
                          placeholder={
                            cabanasLoading 
                              ? "Cargando cabañas..." 
                              : cabanasError 
                                ? "Error cargando cabañas" 
                                : cabanasDisponibles.length === 0
                                  ? "No hay cabañas disponibles"
                                  : "Seleccionar cabaña disponible"
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
                            No hay cabañas disponibles - Todas tienen arriendos mensuales registrados
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
                      className="h-9 sm:h-11 text-sm sm:text-base"
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
                      value={field.value === 0 ? "" : field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : Number(value));
                      }}
                      className="h-9 sm:h-11 text-sm sm:text-base"
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
                      className="h-9 sm:h-11 text-sm sm:text-base"
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
                <FormItem className="xl:col-span-2">
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base flex items-center">$</span>
                      <Input 
                        type="text" 
                        inputMode="numeric" 
                        placeholder="50.000" 
                        value={field.value ? field.value.toLocaleString('es-CL') : ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remover todo excepto dígitos
                          field.onChange(value === "" ? 0 : Number(value));
                        }}
                        className="h-9 sm:h-11 text-sm sm:text-base pl-7"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo derivado solo de lectura */}
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-sm sm:text-base font-medium">Total</FormLabel>
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

            {/* Select de descuento */}
            <FormField
              control={form.control}
              name="descuento"
              render={({ field }) => (
                <FormItem>
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
                          Patricia (20%)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkbox de pago */}
            <FormField
              control={form.control}
              name="pago"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-row items-center gap-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => field.onChange(!field.value)}
                  >
                    <FormControl>
                      <Checkbox 
                        checked={!!field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm sm:text-base font-medium cursor-pointer flex-1 leading-none">Pago realizado</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Campos condicionales para arriendos mensuales */}
            {esMensual && (
              <>
                {/* Separador visual */}
                <div className="xl:col-span-2 border-t pt-2 sm:pt-4 mt-2 sm:mt-4">
                  <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    📋 Información Adicional
                    <span className="text-xs font-normal text-muted-foreground hidden sm:inline">(Arriendo Mensual)</span>
                  </h3>
                </div>

                {/* Subida de archivos */}
                <div className="xl:col-span-2">
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
                <div className="xl:col-span-2">
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
                <div className="xl:col-span-2">
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

            <div className="xl:col-span-2 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-9 sm:h-11 text-sm sm:text-base font-medium"
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
                        valorMensual: values.valorNoche, // En arriendos mensuales, valorNoche representa el valor mensual
                        comentarios: values.comentarios || undefined,
                      };

                      generarContratoArrendamiento(datosContrato);
                    } catch (error) {
                      console.error('Error generando contrato:', error);
                      alert('Error al generar el contrato. Por favor, intenta nuevamente.');
                    }
                  }}
                  className="w-full sm:w-auto h-9 sm:h-11 text-sm sm:text-base font-medium"
                >
                  Generar contrato
                </Button>
              )}
              
              <Button 
                type="submit" 
                disabled={operationLoading}
                className="w-full sm:w-auto h-9 sm:h-11 text-sm sm:text-base font-medium min-w-[120px] sm:min-w-[140px]"
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
