import { CalendarRender } from "@/components/calendar-render";
import { obtenerReservas } from "@/lib/db/reservas";

import { Button } from "@/components/ui/button";

const PruebasPage = async () => {

  const data = await obtenerReservas();

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Calendario de Reservas
        </h1>
        <p className="text-gray-600">Gestión de reservas de cabañas</p>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Calendario</h2>
        <Button>Agregar arriendo</Button>
      </div>
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        <CalendarRender events={data} />
      </div>
    </div>
  );
};

export default PruebasPage;
