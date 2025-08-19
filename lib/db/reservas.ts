import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Tipos para las reservas basados en tu estructura de datos
export interface Reserva {
  id?: string;
  cabana: string;
  cantDias: number;
  cantPersonas: string;
  celular: string;
  descuento: boolean;
  end: string; // Formato "YYYY-MM-DD"
  pago: boolean;
  start: string; // Formato "YYYY-MM-DD"
  title: string;
  ubicacion: string;
  valorNoche: string;
  valorTotal: number;
}

// Función para convertir string de fecha a Date object
export const convertirStringAFecha = (fechaString: string): Date => {
  return new Date(fechaString + 'T00:00:00');
};

// Función para convertir Date a string formato YYYY-MM-DD
export const convertirFechaAString = (fecha: Date): string => {
  return fecha.toISOString().split('T')[0];
};

// Función para convertir datos de Firestore a nuestro tipo
export const convertirFirestoreAReserva = (doc: QueryDocumentSnapshot<DocumentData>): Reserva => {
  const data = doc.data();
  return {
    id: doc.id,
    cabana: data.cabana || '',
    cantDias: data.cantDias || 0,
    cantPersonas: data.cantPersonas || '',
    celular: data.celular || '',
    descuento: data.descuento || false,
    end: data.end || '',
    pago: data.pago || false,
    start: data.start || '',
    title: data.title || '',
    ubicacion: data.ubicacion || '',
    valorNoche: data.valorNoche || '',
    valorTotal: data.valorTotal || 0,
  };
};

// Función para convertir reserva a formato para calendario
export interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    cabana: string;
    huespedes: string;
    telefono: string;
    valorTotal: number;
    pago: boolean;
    descuento: boolean;
  };
}

export const convertirReservaAEvento = (reserva: Reserva): EventoCalendario => {
  return {
    id: reserva.id || '',
    title: reserva.title,
    start: convertirStringAFecha(reserva.start),
    end: convertirStringAFecha(reserva.end),
    resource: {
      cabana: reserva.cabana,
      huespedes: reserva.cantPersonas,
      telefono: reserva.celular,
      valorTotal: reserva.valorTotal,
      pago: reserva.pago,
      descuento: reserva.descuento,
    },
  };
};

// CRUD Operations para Reservas

// Crear una nueva reserva
export const crearReserva = async (reservaData: Omit<Reserva, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'arriendos'), reservaData);
    console.log('Reserva creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw new Error('No se pudo crear la reserva');
  }
};

// Obtener todas las reservas
export const obtenerReservas = async (): Promise<Reserva[]> => {
  try {
    const q = query(
      collection(db, 'arriendos'),
      orderBy('start', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertirFirestoreAReserva);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw new Error('No se pudieron obtener las reservas');
  }
};

// Obtener una reserva por ID
export const obtenerReservaPorId = async (id: string): Promise<Reserva | null> => {
  try {
    const docRef = doc(db, 'reservas', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertirFirestoreAReserva(docSnap);
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    throw new Error('No se pudo obtener la reserva');
  }
};

// Actualizar una reserva
export const actualizarReserva = async (id: string, datosActualizados: Partial<Omit<Reserva, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'reservas', id);
    await updateDoc(docRef, datosActualizados);
    console.log('Reserva actualizada con ID:', id);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    throw new Error('No se pudo actualizar la reserva');
  }
};

// Eliminar una reserva
export const eliminarReserva = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'reservas', id);
    await deleteDoc(docRef);
    console.log('Reserva eliminada con ID:', id);
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    throw new Error('No se pudo eliminar la reserva');
  }
};

// Obtener reservas por cabaña
export const obtenerReservasPorCabana = async (cabana: string): Promise<Reserva[]> => {
  try {
    const q = query(
      collection(db, 'reservas'),
      where('cabana', '==', cabana),
      orderBy('start', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertirFirestoreAReserva);
  } catch (error) {
    console.error('Error al obtener reservas por cabaña:', error);
    throw new Error('No se pudieron obtener las reservas de la cabaña');
  }
};

// Obtener reservas por rango de fechas
export const obtenerReservasPorFechas = async (fechaInicio: string, fechaFin: string): Promise<Reserva[]> => {
  try {
    const q = query(
      collection(db, 'reservas'),
      where('start', '>=', fechaInicio),
      where('start', '<=', fechaFin),
      orderBy('start', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertirFirestoreAReserva);
  } catch (error) {
    console.error('Error al obtener reservas por fechas:', error);
    throw new Error('No se pudieron obtener las reservas en el rango de fechas');
  }
};

// Verificar disponibilidad de cabaña
export const verificarDisponibilidad = async (
  cabana: string, 
  fechaInicio: string, 
  fechaFin: string,
  excluirReservaId?: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'reservas'),
      where('cabana', '==', cabana)
    );
    
    const querySnapshot = await getDocs(q);
    const reservasExistentes = querySnapshot.docs.map(convertirFirestoreAReserva);
    
    // Filtrar la reserva que se está editando si se proporciona el ID
    const reservasAVerificar = excluirReservaId 
      ? reservasExistentes.filter(r => r.id !== excluirReservaId)
      : reservasExistentes;
    
    // Verificar si hay conflictos de fechas
    const hayConflicto = reservasAVerificar.some(reserva => {
      const inicioExistente = new Date(reserva.start);
      const finExistente = new Date(reserva.end);
      const inicioNueva = new Date(fechaInicio);
      const finNueva = new Date(fechaFin);
      
      // Verificar si las fechas se solapan
      return (inicioNueva < finExistente && finNueva > inicioExistente);
    });
    
    return !hayConflicto;
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    throw new Error('No se pudo verificar la disponibilidad');
  }
};

// Obtener todas las reservas como eventos para el calendario
export const obtenerEventosCalendario = async (): Promise<EventoCalendario[]> => {
  try {
    const reservas = await obtenerReservas();
    return reservas
      .filter(reserva => reserva.start && reserva.end) // Filtrar reservas con fechas válidas
      .map(convertirReservaAEvento);
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error);
    throw new Error('No se pudieron obtener los eventos del calendario');
  }
};
