// components/booking-detail.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Home, MapPin, Phone, Users, Pencil, Trash2, Wallet, CheckCircle2, XCircle, Tag, Moon, MessageCircle } from "lucide-react";
import type { Booking } from "../lib/types/booking-types";

export interface BookingDetailProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking?: Booking;
  onEdit: () => void;
  onDelete: () => void;
}

export function BookingDetail({ open, onOpenChange, booking, onEdit, onDelete }: BookingDetailProps) {

  if (!booking) return null;

  // Helper para verificar si tiene descuento
  const tieneDescuento = 
    booking.descuento === "gringo" || 
    booking.descuento === "patricia";
  
  const tipoDescuento = 
    booking.descuento === "gringo" ? "Gringo" : 
    booking.descuento === "patricia" ? "Patricia" : 
    null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-xl">{booking.title}</DialogTitle>
              <DialogDescription className="text-sm">
                Detalles del arriendo
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {booking.esMensual && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs px-2 py-0">
                  Mensual
                </Badge>
              )}
              {booking.esAirbnb && (
                <Badge variant="outline" className="bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 text-xs px-2 py-0">
                  Airbnb
                </Badge>
              )}
              <Badge variant={booking.pago ? "default" : "outline"} 
                className={`text-xs px-2 py-0 ${booking.pago 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "border-orange-500 text-orange-600 dark:text-orange-400"
                }`}>
                {booking.pago ? (
                  <><CheckCircle2 className="size-3 mr-1" />Pagado</>
                ) : (
                  <><XCircle className="size-3 mr-1" />Pendiente</>
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Información del Huésped */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Información del Huésped
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Users className="size-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Personas</p>
                  <p className="text-sm font-semibold">{booking.cantPersonas}</p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Phone className="size-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Celular</p>
                    <p className="text-sm font-semibold">{booking.celular}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {booking.celular && (
                    <a 
                      href={`https://wa.me/${booking.celular.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                    >
                      <MessageCircle className="size-3" />
                      WhatsApp
                    </a>
                  )}
                  <a 
                    href={`tel:${booking.celular}`}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Phone className="size-3" />
                    Llamar
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Cabaña */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Información de la Cabaña
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Home className="size-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Cabaña</p>
                  <p className="text-sm font-semibold">{booking.cabana}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <MapPin className="size-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Ubicación</p>
                  <p className="text-sm font-semibold">{booking.ubicacion}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Fechas */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Fechas de Estadía
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 rounded-lg border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="size-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase mb-0.5">Inicio</p>
                      <p className="text-xs font-medium">{formatLong(booking.start)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg border-2 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="size-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase mb-0.5">Término</p>
                      <p className="text-xs font-medium">{formatLong(booking.end)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <Moon className="size-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {booking.cantDias} {booking.cantDias === 1 ? 'noche' : 'noches'}
                </span>
              </div>
            </div>
          </div>

          {/* Información de Pago */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Información de Pago
            </h3>
            <div className="space-y-2">
              {tieneDescuento ? (
                <>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      <span className="text-xs">Valor original</span>
                    </div>
                    <span className="line-through text-muted-foreground text-sm font-medium">
                      ${(booking.valorNoche * booking.cantDias).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Tag className="size-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          Descuento {tipoDescuento}
                        </span>
                        <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">-20%</Badge>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 ml-5">
                        ${booking.valorNoche.toLocaleString('es-CL')} por noche
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">
                        ${booking.valorTotal.toLocaleString('es-CL')}
                      </p>
                      <p className="text-[10px] text-green-600 dark:text-green-400">
                        Ahorro: ${((booking.valorNoche * booking.cantDias) - booking.valorTotal).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total a pagar</p>
                      <p className="text-xs text-muted-foreground">
                        ${booking.valorNoche.toLocaleString('es-CL')} por noche
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    ${booking.valorTotal.toLocaleString('es-CL')}
                  </p>
                </div>
              )}              
              {/* Mostrar monto abonado si existe */}
              {booking.montoAbonado && booking.montoAbonado > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Monto abonado</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    ${booking.montoAbonado.toLocaleString('es-CL')}
                  </span>
                </div>
              )}
              
              {/* Mostrar saldo pendiente si hay abono */}
              {booking.montoAbonado && booking.montoAbonado > 0 && booking.montoAbonado < booking.valorTotal && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">Saldo pendiente</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    ${(booking.valorTotal - booking.montoAbonado).toLocaleString('es-CL')}
                  </span>
                </div>
              )}            </div>
          </div>

          {/* Notas del arriendo */}
          {booking.notas && (
            <div className="border rounded-lg p-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MessageCircle className="size-3.5" />
                Notas del Arriendo
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words bg-muted/30 p-2.5 rounded-md">
                {booking.notas}
              </p>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        <DialogFooter className="gap-2 flex-col sm:flex-row pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-9">
            Cerrar
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={onEdit} className="flex-1 sm:flex-none h-9">
              <Pencil className="size-4 mr-2" />Editar
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1 sm:flex-none h-9">
              <Trash2 className="size-4 mr-2" />Eliminar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatLong(d: Date) {
  return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}