# Configuración de Firebase para Next Cabañas v2

## 🔥 Configuración de Firebase

### 1. Crear proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Ingresa el nombre de tu proyecto (ej: "next-cabanas-v2")
4. Configura Google Analytics (opcional)
5. Crea el proyecto

### 2. Configurar Firestore Database

1. En el panel lateral, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Empezar en modo de prueba" (puedes cambiar las reglas después)
4. Elige la ubicación más cercana a tus usuarios

### 3. Obtener configuración del proyecto

1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. En la pestaña "General", busca "Tus aplicaciones"
3. Haz clic en el ícono web `</>`
4. Registra tu app web con un nombre
5. Copia la configuración de Firebase

### 4. Configurar variables de entorno

1. Copia el archivo `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Completa las variables con los valores de tu proyecto Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### 5. Configurar reglas de seguridad de Firestore

Ve a "Firestore Database" > "Reglas" y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección de reservas
    match /reservas/{reservaId} {
      // Permitir lectura y escritura (ajustar según tus necesidades)
      allow read, write: if true; // ⚠️ Solo para desarrollo
      
      // Para producción, usar reglas más estrictas como:
      // allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Importante:** Las reglas actuales permiten acceso completo. En producción, implementa autenticación y reglas más estrictas.

## 🚀 Uso de la conexión

### Hooks disponibles

- `useReservas()` - Obtener todas las reservas
- `useReserva(id)` - Obtener una reserva específica
- `useReservaOperaciones()` - CRUD operations
- `useReservasPorCabana(cabana)` - Reservas por cabaña
- `useReservasPorFechas(inicio, fin)` - Reservas por rango de fechas (strings formato YYYY-MM-DD)
- `useEstadisticasReservas()` - Estadísticas básicas adaptadas
- `useEventosCalendario()` - Eventos para React Big Calendar

### Ejemplo de uso

```tsx
import { useReservas, useReservaOperaciones, useEventosCalendario } from '@/lib/hooks/useFirestore';

function MiComponente() {
  const { data: reservas, loading, error } = useReservas();
  const { crear, actualizar, eliminar } = useReservaOperaciones();
  const { data: eventos } = useEventosCalendario();

  // Crear una nueva reserva
  const nuevaReserva = {
    cabana: 'Teja Dos',
    cantDias: 3,
    cantPersonas: '4',
    celular: '+56 9 1234 5678',
    descuento: false,
    end: '2025-09-23',
    pago: false,
    start: '2025-09-20',
    title: 'Juan Pérez',
    ubicacion: 'Santiago',
    valorNoche: '50000',
    valorTotal: 150000,
  };

  await crear(nuevaReserva);
}
```

### Funciones directas disponibles

```tsx
import { 
  crearReserva,
  obtenerReservas,
  actualizarReserva,
  eliminarReserva,
  verificarDisponibilidad,
  obtenerEventosCalendario,
  convertirReservaAEvento
} from '@/lib/db/reservas';
```

## 🧪 Probar la conexión

- **Pruebas CRUD:** Visita `/firestore-test` para probar operaciones básicas
- **Calendario en vivo:** Visita `/calendario-firestore` para ver tus reservas reales en el calendario

## 📅 Funciones de conversión de fechas

```tsx
import { 
  convertirStringAFecha,   // "2024-02-18" → Date object
  convertirFechaAString,   // Date object → "2024-02-18"
  convertirReservaAEvento  // Reserva → EventoCalendario
} from '@/lib/db/reservas';
```

## 🧪 Probar la conexión

Visita `/firestore-test` para probar la conexión y realizar operaciones CRUD básicas.

## 📁 Estructura de datos

### Reserva (Adaptada a tu base de datos existente)

```typescript
interface Reserva {
  id?: string;
  cabana: string;          // Nombre de la cabaña (ej: "Teja Dos")
  cantDias: number;        // Cantidad de días de la reserva
  cantPersonas: string;    // Número de huéspedes como string (ej: "4")
  celular: string;         // Teléfono de contacto
  descuento: boolean;      // Si tiene descuento aplicado
  end: string;            // Fecha de fin formato "YYYY-MM-DD"
  pago: boolean;          // Estado del pago (true = pagado, false = pendiente)
  start: string;          // Fecha de inicio formato "YYYY-MM-DD"
  title: string;          // Nombre del huésped
  ubicacion: string;      // Ubicación del huésped
  valorNoche: string;     // Valor por noche como string (ej: "50000")
  valorTotal: number;     // Valor total de la reserva
}
```

### EventoCalendario (Para React Big Calendar)

```typescript
interface EventoCalendario {
  id: string;
  title: string;
  start: Date;            // Convertido automáticamente desde string
  end: Date;             // Convertido automáticamente desde string
  resource: {
    cabana: string;
    huespedes: string;
    telefono: string;
    valorTotal: number;
    pago: boolean;
    descuento: boolean;
  };
}
```

## 🔧 Desarrollo local con emuladores (opcional)

1. Instalar Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicializar Firebase en tu proyecto:
   ```bash
   firebase init
   ```

3. Configurar emuladores en `firebase.json`:
   ```json
   {
     "emulators": {
       "firestore": {
         "port": 8080
       },
       "auth": {
         "port": 9099
       },
       "storage": {
         "port": 9199
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```

4. Ejecutar emuladores:
   ```bash
   firebase emulators:start
   ```

5. Activar uso de emuladores en `.env.local`:
   ```env
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

## 🔐 Seguridad

- **Nunca** pongas las claves de Firebase en repositorios públicos
- Usa reglas de seguridad de Firestore apropiadas para producción
- Implementa autenticación antes de deploy a producción
- Considera usar variables de entorno del servidor para operaciones sensibles

## 📝 Próximos pasos

1. ✅ Configurar Firebase y Firestore
2. ✅ Crear funciones CRUD para reservas
3. ✅ Implementar hooks de React
4. ⬜ Integrar con el formulario de reservas existente
5. ⬜ Añadir autenticación de usuarios
6. ⬜ Implementar reglas de seguridad
7. ⬜ Configurar backup automático
8. ⬜ Optimizar queries con índices
