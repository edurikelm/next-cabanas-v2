import { useState, useEffect } from 'react';
import { 
  crearArriendo, 
  obtenerArriendos, 
  obtenerArriendoPorId, 
  actualizarArriendo, 
  eliminarArriendo,
  verificarDisponibilidadCabana
} from '../db/arriendos';
import { Booking } from '../types/booking-types';

// Hook para manejar el estado de carga y errores
interface UseFirestoreState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook para obtener todos los arriendos
export const useArriendos = () => {
  const [state, setState] = useState<UseFirestoreState<Booking[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const [refetch, setRefetch] = useState(0);

  useEffect(() => {
    const cargarArriendos = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const arriendos = await obtenerArriendos();
        setState({ data: arriendos, loading: false, error: null });
      } catch (error) {
        setState({ 
          data: null, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    };

    cargarArriendos();
  }, [refetch]);

  const recargarArriendos = () => setRefetch(prev => prev + 1);

  return { ...state, recargar: recargarArriendos };
};

// Hook para obtener un arriendo por ID
export const useArriendo = (id: string | null) => {
  const [state, setState] = useState<UseFirestoreState<Booking>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const cargarArriendo = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const arriendo = await obtenerArriendoPorId(id);
        setState({ data: arriendo, loading: false, error: null });
      } catch (error) {
        setState({ 
          data: null, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    };

    cargarArriendo();
  }, [id]);

  return state;
};

// Hook para operaciones CRUD
export const useArriendoOperaciones = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = async (arriendoData: Omit<Booking, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const id = await crearArriendo(arriendoData);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear arriendo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const actualizar = async (id: string, datos: Partial<Omit<Booking, 'id'>>) => {
    try {
      setLoading(true);
      setError(null);
      await actualizarArriendo(id, datos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar arriendo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await eliminarArriendo(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar arriendo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verificarDisponibilidad = async (
    cabana: string,
    fechaInicio: Date,
    fechaFin: Date,
    excluirId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const disponible = await verificarDisponibilidadCabana(cabana, fechaInicio, fechaFin, excluirId);
      return disponible;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar disponibilidad';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { crear, actualizar, eliminar, verificarDisponibilidad, loading, error };
};