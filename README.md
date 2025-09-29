# Sistema de Gestión de Cabañas v2

Este es un sistema de gestión de arriendos de cabañas construido con [Next.js](https://nextjs.org) y Firebase.

## Características Principales

### 🏠 Gestión de Arriendos
- Registro completo de arriendos con fechas, huéspedes y pagos
- Calendario visual para visualizar disponibilidad
- Cálculo automático de días y montos totales

### 📊 Nuevos Campos Agregados
- **Período**: Tipo de arriendo (diario o mensual)
- **Archivos**: Subida de documentos adjuntos (PDF, Word, TXT)
- **Imágenes**: Galería de fotos relacionadas al arriendo
- **Comentarios**: Notas y observaciones adicionales

### 🔥 Integración Firebase
- **Firestore**: Base de datos para arriendos
- **Storage**: Almacenamiento de archivos e imágenes
- **Authentication**: Sistema de autenticación (opcional)

## Estructura de Datos

### Modelo de Arriendo (Booking)
```typescript
interface Booking {
  id: string;
  title: string;          // Nombre del huésped
  cabana: string;         // Identificador de cabaña
  cantDias: number;       // Número de días
  cantPersonas: number;   // Cantidad de personas
  celular?: string;       // Teléfono de contacto
  descuento: boolean;     // Aplicación de descuento
  end: Date;              // Fecha de fin
  start: Date;            // Fecha de inicio
  pago: boolean;          // Estado de pago
  ubicacion?: string;     // Ubicación/sector
  valorNoche: number;     // Tarifa por noche
  valorTotal: number;     // Monto total

  // Nuevos campos opcionales
  periodo?: 'dia' | 'mes';        // Tipo de período
  archivos?: ArchivoAdjunto[];    // Documentos
  imagenes?: ImagenAdjunta[];     // Fotografías
  comentarios?: string;           // Observaciones
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuración Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Configura las variables de entorno en `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

3. Configura las reglas de Firestore y Storage según tus necesidades

## Estructura del Proyecto

```
components/
├── booking-form.tsx           # Formulario de arriendos
├── booking-fields-extra.tsx   # Campos adicionales
├── file-uploader.tsx          # Subida de archivos
└── ui/                        # Componentes base

lib/
├── types/
│   └── booking-types.ts       # Definiciones de tipos
├── schemas/
│   └── booking-schema.ts      # Esquemas de validación
├── db/
│   ├── firebase.ts           # Configuración Firebase
│   └── arriendos.ts          # Operaciones de base de datos
└── utils/
    └── archivo-utils.ts       # Utilidades para archivos
```

## Funcionalidades de Archivos

### Subida de Documentos
- Tipos permitidos: PDF, Word, TXT
- Tamaño máximo: 10MB por archivo
- Máximo 5 archivos por arriendo

### Subida de Imágenes
- Formatos: JPG, PNG, GIF, WebP
- Tamaño máximo: 5MB por imagen
- Máximo 5 imágenes por arriendo

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
