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
            <div>{`$${booking.valorTotal} ($${booking.valorNoche} por noche)`}</div>
          </div>

          <div className="text-xs">Descuento: {booking.descuento ? "Sí" : "No"} · Pago: {booking.pago ? "Sí" : "No"}</div>
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