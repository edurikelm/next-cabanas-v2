// app/estadisticas/page.tsx
"use client";

import { useMemo } from "react";
import { useBookings } from "@/components/bookings-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EstadisticasPage() {
  const { bookings } = useBookings();

  const stats = useMemo(() => {
    const byCabana = new Map<string, number>();
    const byMonth = new Map<string, number>();
    let totalIngresos = 0;

    for (const b of bookings) {
      byCabana.set(b.cabana, (byCabana.get(b.cabana) ?? 0) + 1);
      const key = `${b.start.getFullYear()}-${String(b.start.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      totalIngresos += b.valorTotal || 0;
    }

    return {
      total: bookings.length,
      totalIngresos,
      byCabana: Array.from(byCabana.entries()).sort((a, b) => b[1] - a[1]),
      byMonth: Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Estadísticas</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Reservas totales</div>
            <div className="text-3xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Ingresos (Total)</div>
            <div className="text-3xl font-semibold">${stats.totalIngresos}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl md:col-span-2">
          <CardContent className="p-6 space-y-3">
            <div className="text-sm font-medium">Reservas por cabaña</div>
            <div className="flex flex-wrap gap-2">
              {stats.byCabana.length === 0 && (
                <div className="text-muted-foreground text-sm">Aún no hay datos.</div>
              )}
              {stats.byCabana.map(([cabana, count]) => (
                <Badge key={cabana} className="text-base rounded-xl px-3 py-1">{cabana}: {count}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-2">
          <div className="text-sm font-medium">Reservas por mes</div>
          {stats.byMonth.length === 0 ? (
            <div className="text-muted-foreground text-sm">Aún no hay datos.</div>
          ) : (
            <ul className="grid md:grid-cols-3 gap-2">
              {stats.byMonth.map(([month, count]) => (
                <li key={month} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm">{formatMonth(month)}</span>
                  <span className="text-lg font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}