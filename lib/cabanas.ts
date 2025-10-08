// Este archivo ahora usa datos dinámicos de Firestore
// Para obtener las cabañas disponibles, usar el hook useCabanasDisponibles

import { useCabanasDisponibles } from './hooks/useCabanas';

// Hook para obtener solo las cabañas disponibles
export function useAvailableCabanas() {
  const { data: cabanas, loading, error, recargar } = useCabanasDisponibles();
  
  // Retornar solo los nombres de las cabañas disponibles para compatibilidad
  const cabanasNames = cabanas?.map(cabana => cabana.nombre) || [];
  
  return {
    cabanas: cabanasNames,
    cabanasComplete: cabanas, // Datos completos si se necesitan
    loading,
    error,
    recargar // Agregar función de recarga
  };
}

// Lista estática legacy (mantener para compatibilidad temporal)
const cabanasLegacy = [
  "Regional Uno",
  "Regional Dos", 
  "Regional Tres",
  "Regional Cuatro",
  "Teja Uno",
  "Teja Dos",
  "Teja Tres",
];

export default cabanasLegacy;
