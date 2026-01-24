// Este archivo ahora usa datos dinámicos de Firestore
// Para obtener las cabañas disponibles, usar el hook useCabanasDisponibles

import { useCabanasDisponibles } from './hooks/useCabanas';

// Hook para obtener solo las cabañas disponibles
export function useAvailableCabanas() {
  // Lista estática de cabañas
  const cabanasNames = [
    "Regional Uno",
    "Regional Dos", 
    "Regional Tres",
    "Regional Cuatro",
    "Teja Uno",
    "Teja Dos",
    "Teja Tres"
  ];
  
  return {
    cabanas: cabanasNames,
    cabanasComplete: [], 
    loading: false,
    error: null,
    recargar: () => {}
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
