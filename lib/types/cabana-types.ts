// lib/types/cabana-types.ts
export type CabanaId = string;

export interface Cabana {
  id: CabanaId;
  nombre: string;
  arrendatario: string;
  detalles: string;
  periodo: string; // "mensual" o "diario"
  estado: string;
  fechaContrato: Date;
  valor: number;
  imagenes: string[]; // arreglo de URLs de imágenes
}

export interface CabanaFormValues {
  nombre: string;
  arrendatario: string;
  detalles: string;
  periodo: string; // "mensual" o "diario"
  estado: string;
  fechaContrato?: Date;
  valor: number;
  imagenes?: string[];
}
