// app/page.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Bienvenido 👋</h2>
      <p className="text-muted-foreground">Usa el menú para navegar entre las secciones. Puedes gestionar reservas en la página Calendario y ver métricas en Estadísticas.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-2">
            <h3 className="font-medium">Calendario</h3>
            <p className="text-sm text-muted-foreground">Crea, edita, elimina y visualiza reservas.</p>
            <Badge>CRUD completo</Badge>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-2">
            <h3 className="font-medium">Estadísticas</h3>
            <p className="text-sm text-muted-foreground">Resumen por mes y por cabaña.</p>
            <Badge variant="secondary">Beta</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}