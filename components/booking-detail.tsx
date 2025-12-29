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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-xl sm:text-2xl">{booking.title}</DialogTitle>
              <DialogDescription className="text-base">
                Información completa del arriendo
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-2">
              {booking.esMensual && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  Arriendo Mensual
                </Badge>
              )}
              <Badge variant={booking.pago ? "default" : "outline"} 
                className={booking.pago 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "border-orange-500 text-orange-600 dark:text-orange-400"
                }>
                {booking.pago ? (
                  <><CheckCircle2 className="size-3 mr-1" />Pagado</>
                ) : (
                  <><XCircle className="size-3 mr-1" />Pendiente</>
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del Huésped */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Información del Huésped
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-background">
                    <Users className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Personas</p>
                    <p className="font-semibold">{booking.cantPersonas}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-background">
                      <Phone className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Celular</p>
                      <p className="font-semibold">{booking.celular}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {/* Ensure booking.celular is defined before using it */}
                    {booking.celular && (
                      <a 
                        href={`https://wa.me/${booking.celular.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        <MessageCircle className="size-3.5" />
                        WhatsApp
                      </a>
                    )}
                    <a 
                      href={`tel:${booking.celular}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <Phone className="size-3.5" />
                      Llamar
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Cabaña */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Información de la Cabaña
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-background">
                    <Home className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cabaña</p>
                    <p className="font-semibold">{booking.cabana}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-background">
                    <MapPin className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="font-semibold">{booking.ubicacion}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Fechas */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Fechas de Estadía
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="size-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">Inicio</p>
                        <p className="text-sm font-medium">{formatLong(booking.start)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="size-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase mb-1">Termino</p>
                        <p className="text-sm font-medium">{formatLong(booking.end)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Moon className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {booking.cantDias} {booking.cantDias === 1 ? 'noche' : 'noches'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Información de Pago
              </h3>
              <div className="space-y-4">
                {tieneDescuento ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Wallet className="size-4 text-muted-foreground" />
                        <span className="text-sm">Valor original</span>
                      </div>
                      <span className="line-through text-muted-foreground font-medium">
                        ${(booking.valorNoche * booking.cantDias).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Tag className="size-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Con descuento {tipoDescuento}
                          </span>
                          <Badge className="bg-green-500 text-white text-xs">-20%</Badge>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 ml-6">
                          ${booking.valorNoche.toLocaleString('es-CL')} por noche
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          ${booking.valorTotal.toLocaleString('es-CL')}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Ahorro: ${((booking.valorNoche * booking.cantDias) - booking.valorTotal).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-background">
                        <Wallet className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total a pagar</p>
                        <p className="text-sm text-muted-foreground">
                          ${booking.valorNoche.toLocaleString('es-CL')} por noche
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ${booking.valorTotal.toLocaleString('es-CL')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cerrar
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={onEdit} className="flex-1 sm:flex-none">
              <Pencil className="size-4 mr-2" />Editar
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1 sm:flex-none">
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