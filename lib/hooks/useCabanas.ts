// lib/hooks/useCabanas.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/db/firebase';
import type { Cabana, CabanaFormValues } from '@/lib/types/cabana-types';

const COLLECTION_NAME = 'cabanas';

export function useCabanas() {
  const [data, setData] = useState<Cabana[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCabanas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cabañasRef = collection(db, COLLECTION_NAME);
      const q = query(cabañasRef, orderBy('nombre'));
      const snapshot = await getDocs(q);
      
      const cabanas: Cabana[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || '',
          arrendatario: data.arrendatario || '',
          detalles: data.detalles || '',
          esMensual: data.esMensual || '',
          estado: data.estado || '',
          fechaContrato: data.fechaContrato?.toDate() || new Date(),
          valor: data.valor || 0,
          imagenes: data.imagenes || [],
        } as Cabana;
      });
      
      setData(cabanas);
    } catch (err: any) {
      console.error('Error fetching cabañas:', err);
      
      // Manejo específico de errores de permisos
      if (err.code === 'permission-denied') {
        setError('Error de permisos: Las reglas de Firestore no permiten acceso a la colección "cabanas". Revisa el archivo FIRESTORE_SETUP.md para configurar los permisos.');
      } else {
        setError(err.message || 'Error al cargar las cabañas');
      }
    } finally {
      setLoading(false);
    }
  };

  const recargar = useCallback(() => {
    fetchCabanas();
  }, []);

  useEffect(() => {
    fetchCabanas();
  }, []);

  return { data, loading, error, recargar };
}

// Hook para cargar solo las cabañas disponibles
export function useCabanasDisponibles() {
  const [data, setData] = useState<Cabana[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCabanasDisponibles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cabañasRef = collection(db, COLLECTION_NAME);
      // Cargar todas las cabañas sin filtros
      const snapshot = await getDocs(cabañasRef);
      
      const cabanas: Cabana[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || '',
          arrendatario: data.arrendatario || '',
          detalles: data.detalles || '',
          esMensual: data.esMensual || '',
          estado: data.estado || '',
          fechaContrato: data.fechaContrato?.toDate() || new Date(),
          valor: data.valor || 0,
          imagenes: data.imagenes || [],
        } as Cabana;
      });
      
      // Ordenar manualmente por nombre en el cliente
      cabanas.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setData(cabanas);
    } catch (err: any) {
      console.error('Error fetching cabañas disponibles:', err);
      
      // Manejo específico de errores de permisos
      if (err.code === 'permission-denied') {
        setError('Error de permisos: Las reglas de Firestore no permiten acceso a la colección "cabanas". Revisa el archivo FIRESTORE_SETUP.md para configurar los permisos.');
      } else {
        setError(err.message || 'Error al cargar las cabañas disponibles');
      }
    } finally {
      setLoading(false);
    }
  };

  const recargar = useCallback(() => {
    fetchCabanasDisponibles();
  }, []);

  useEffect(() => {
    fetchCabanasDisponibles();
  }, []);

  return { data, loading, error, recargar };
}

export function useCabanaOperaciones() {
  const [loading, setLoading] = useState(false);

  const crear = async (cabanaData: CabanaFormValues): Promise<string> => {
    setLoading(true);
    try {
      const dataToSave = {
        ...cabanaData,
        fechaContrato: cabanaData.fechaContrato ? Timestamp.fromDate(cabanaData.fechaContrato) : Timestamp.now(),
        imagenes: cabanaData.imagenes || []
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating cabaña:', error);
      
      if (error.code === 'permission-denied') {
        throw new Error('Error de permisos: No tienes permisos para crear cabañas. Revisa la configuración de Firestore.');
      }
      throw new Error(error.message || 'Error al crear la cabaña');
    } finally {
      setLoading(false);
    }
  };

  const actualizar = async (id: string, cabanaData: Partial<CabanaFormValues>): Promise<void> => {
    setLoading(true);
    try {
      const cabanaRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { ...cabanaData };
      
      // Convertir fecha si existe
      if (cabanaData.fechaContrato) {
        updateData.fechaContrato = Timestamp.fromDate(cabanaData.fechaContrato);
      }
      
      await updateDoc(cabanaRef, updateData);
    } catch (error: any) {
      console.error('Error updating cabaña:', error);
      throw new Error(error.message || 'Error al actualizar la cabaña');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const cabanaRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(cabanaRef);
    } catch (error: any) {
      console.error('Error deleting cabaña:', error);
      throw new Error(error.message || 'Error al eliminar la cabaña');
    } finally {
      setLoading(false);
    }
  };

  return { crear, actualizar, eliminar, loading };
}
