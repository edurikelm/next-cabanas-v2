// components/booking-detail.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Home, MapPin, Phone, Users, Pencil, Trash2, Wallet } from "lucide-react";
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
      <DialogContent className="max-w-[95vw] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalle del Arriendo</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <section className="space-y-2 text-sm">
          <h3 className="text-sm font-medium">Información del Huésped</h3>
          <div className="flex items-center gap-2"><Users className="size-4" /> {booking.cantPersonas} persona(s)</div>
          <div className="flex items-center gap-2"><Phone className="size-4" /> {booking.celular}</div>
        </section>

        <Separator />

        <section className="space-y-3 text-sm">
          <h3 className="text-sm font-medium">Información del Arriendo</h3>
          <div className="flex items-center gap-2"><Home className="size-4" /> {booking.cabana}</div>
          <div className="flex items-center gap-2"><MapPin className="size-4" /> {booking.ubicacion}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <CalendarDays className="size-4 mt-0.5" />
              <div>
                <div className="font-semibold">Check-in:</div>
                <div className="text-muted-foreground">{formatLong(booking.start)}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="size-4 mt-0.5" />
              <div>
                <div className="font-semibold">Check-out:</div>
                <div className="text-muted-foreground">{formatLong(booking.end)}</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">{booking.cantDias} día(s)</div>

          <div className="flex items-center gap-2">
            <Wallet className="size-4" />
            <div>
              {tieneDescuento ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-muted-foreground">
                      ${(booking.valorNoche * booking.cantDias).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-[10px] font-semibold">
                      -20%
                    </span>
                  </div>
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    ${booking.valorTotal.toLocaleString()} (${booking.valorNoche.toLocaleString()} por noche)
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Ahorro: ${((booking.valorNoche * booking.cantDias) - booking.valorTotal).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div>${booking.valorTotal.toLocaleString()} (${booking.valorNoche.toLocaleString()} por noche)</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Descuento:</span>
              {tieneDescuento ? (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                  {tipoDescuento} (20%)
                </span>
              ) : (
                <span className="text-muted-foreground">No</span>
              )}
            </div>
            <span className="text-muted-foreground">·</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Pago:</span>
              <span className={booking.pago ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}>
                {booking.pago ? "Sí" : "No"}
              </span>
            </div>
          </div>
        </section>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onEdit}><Pencil className="size-4 mr-2" />Editar</Button>
          <Button variant="destructive" onClick={onDelete}><Trash2 className="size-4 mr-2" />Eliminar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatLong(d: Date) {
  return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}