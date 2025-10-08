import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Booking } from '../types/booking-types';

const COLLECTION_NAME = 'arriendos';

// Función para convertir DocumentData a Booking
const convertDocToBooking = (doc: QueryDocumentSnapshot<DocumentData>): Booking => {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title || '',
    cabana: data.cabana || '',
    cantDias: Number(data.cantDias) || 0,
    cantPersonas: Number(data.cantPersonas) || 0,
    celular: data.celular || '',
    descuento: Boolean(data.descuento),
    end: data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end),
    start: data.start instanceof Timestamp ? data.start.toDate() : new Date(data.start),
    pago: Boolean(data.pago),
    ubicacion: data.ubicacion || '',
    valorNoche: Number(data.valorNoche) || 0,
    valorTotal: Number(data.valorTotal) || 0,
    
    // Nuevos campos opcionales
    esMensual: Boolean(data.esMensual),
    archivos: data.archivos ? data.archivos.map((archivo: any) => ({
      ...archivo,
      fechaSubida: archivo.fechaSubida instanceof Timestamp ? archivo.fechaSubida.toDate() : new Date(archivo.fechaSubida)
    })) : undefined,
    imagenes: data.imagenes ? data.imagenes.map((imagen: any) => ({
      ...imagen,
      fechaSubida: imagen.fechaSubida instanceof Timestamp ? imagen.fechaSubida.toDate() : new Date(imagen.fechaSubida)
    })) : undefined,
    comentarios: data.comentarios || undefined,
  };
};

// Función para convertir Booking a DocumentData
const convertBookingToDoc = (booking: Omit<Booking, 'id'>): DocumentData => {
  // Función auxiliar para validar y convertir fechas
  const convertToTimestamp = (date: any): Timestamp => {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error(`Fecha inválida: ${date}`);
      }
      return Timestamp.fromDate(date);
    }
    
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`No se pudo parsear la fecha: ${date}`);
      }
      return Timestamp.fromDate(parsedDate);
    }
    
    if (typeof date === 'number') {
      const dateFromNumber = new Date(date);
      if (isNaN(dateFromNumber.getTime())) {
        throw new Error(`Timestamp inválido: ${date}`);
      }
      return Timestamp.fromDate(dateFromNumber);
    }
    
    throw new Error(`Tipo de fecha no soportado: ${typeof date}, valor: ${date}`);
  };

  return {
    title: booking.title,
    cabana: booking.cabana,
    cantDias: booking.cantDias,
    cantPersonas: booking.cantPersonas,
    celular: booking.celular || '',
    descuento: booking.descuento,
    end: convertToTimestamp(booking.end),
    start: convertToTimestamp(booking.start),
    pago: booking.pago,
    ubicacion: booking.ubicacion || '',
    valorNoche: booking.valorNoche,
    valorTotal: booking.valorTotal,
    fechaCreacion: serverTimestamp(),
    
    // Nuevos campos opcionales
    esMensual: booking.esMensual,
    ...(booking.archivos && { 
      archivos: booking.archivos.map(archivo => ({
        ...archivo,
        fechaSubida: convertToTimestamp(archivo.fechaSubida)
      }))
    }),
    ...(booking.imagenes && { 
      imagenes: booking.imagenes.map(imagen => ({
        ...imagen,
        fechaSubida: convertToTimestamp(imagen.fechaSubida)
      }))
    }),
    ...(booking.comentarios && { comentarios: booking.comentarios }),
  };
};

// Crear un nuevo arriendo
export const crearArriendo = async (booking: Omit<Booking, 'id'>): Promise<string> => {
  try {
    const docData = convertBookingToDoc(booking);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    console.log('Arriendo creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear arriendo:', error);
    throw new Error('No se pudo crear el arriendo');
  }
};

// Obtener todos los arriendos
export const obtenerArriendos = async (): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('start', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const arriendos: Booking[] = [];
    
    querySnapshot.forEach((doc) => {
      arriendos.push(convertDocToBooking(doc));
    });
    
    console.log(`Se obtuvieron ${arriendos.length} arriendos`);
    return arriendos;
  } catch (error) {
    console.error('Error al obtener arriendos:', error);
    throw new Error('No se pudieron cargar los arriendos');
  }
};

// Obtener un arriendo por ID
export const obtenerArriendoPorId = async (id: string): Promise<Booking | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertDocToBooking(docSnap as QueryDocumentSnapshot<DocumentData>);
    } else {
      console.log('No se encontró el arriendo con ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener arriendo:', error);
    throw new Error('No se pudo cargar el arriendo');
  }
};

// Actualizar un arriendo
export const actualizarArriendo = async (
  id: string, 
  datos: Partial<Omit<Booking, 'id'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Partial<DocumentData> = {};
    
    // Convertir solo los campos que se están actualizando
    Object.entries(datos).forEach(([key, value]) => {
      if (key === 'start' || key === 'end') {
        updateData[key] = Timestamp.fromDate(value as Date);
      } else {
        updateData[key] = value;
      }
    });
    
    updateData.fechaActualizacion = serverTimestamp();
    
    await updateDoc(docRef, updateData);
    console.log('Arriendo actualizado:', id);
  } catch (error) {
    console.error('Error al actualizar arriendo:', error);
    throw new Error('No se pudo actualizar el arriendo');
  }
};

// Eliminar un arriendo
export const eliminarArriendo = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Iniciando eliminación del arriendo:', id);
    
    // Primero obtener el arriendo para acceder a sus archivos
    const arriendo = await obtenerArriendoPorId(id);
    
    if (arriendo) {
      // Eliminar archivos asociados si existen
      const archivosParaEliminar = [
        ...(arriendo.archivos || []),
        ...(arriendo.imagenes || [])
      ];

      if (archivosParaEliminar.length > 0) {
        console.log(`📁 Eliminando ${archivosParaEliminar.length} archivos asociados...`);
        
        // Importar dinámicamente la función de eliminación
        const { eliminarMultiplesArchivos } = await import('@/lib/utils/archivo-utils');
        
        try {
          await eliminarMultiplesArchivos(archivosParaEliminar);
          console.log('✅ Archivos eliminados exitosamente');
        } catch (error) {
          console.error('⚠️ Error eliminando archivos (continuando con eliminación del arriendo):', error);
          // No interrumpir la eliminación del arriendo si falla la eliminación de archivos
        }
      }
    }

    // Eliminar el documento del arriendo
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    console.log('✅ Arriendo eliminado exitosamente:', id);
  } catch (error) {
    console.error('❌ Error al eliminar arriendo:', error);
    throw new Error('No se pudo eliminar el arriendo');
  }
};

// Verificar disponibilidad de una cabaña en un rango de fechas
export const verificarDisponibilidadCabana = async (
  cabana: string,
  fechaInicio: Date,
  fechaFin: Date,
  excluirId?: string
): Promise<boolean> => {
  try {
    const arriendos = await obtenerArriendos();
    
    const conflictos = arriendos.filter(arriendo => {
      // Excluir el arriendo actual si se está editando
      if (excluirId && arriendo.id === excluirId) return false;
      
      // Solo verificar la misma cabaña
      if (arriendo.cabana !== cabana) return false;
      
      // Verificar solapamiento de fechas
      const inicioExistente = arriendo.start;
      const finExistente = arriendo.end;
      
      return !(fechaFin < inicioExistente || fechaInicio > finExistente);
    });
    
    return conflictos.length === 0;
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    throw new Error('No se pudo verificar la disponibilidad');
  }
};

// Función para convertir Booking a evento del calendario
export const convertirBookingAEvento = (booking: Booking) => {
  return {
    id: booking.id,
    title: booking.title,
    start: booking.start,
    end: booking.end,
    allDay: true,
    resource: {
      ...booking,
      // Datos adicionales para mostrar en el calendario
      huespedes: booking.cantPersonas.toString(),
      telefono: booking.celular,
    }
  };
};
