# 🚀 Guía de Despliegue en Vercel

## Pasos para desplegar tu aplicación Next.js con Firestore en Vercel

### 1. **Subir código a GitHub** ✅
- ✅ Código ya subido al repositorio: `edurikelm/next-cabanas-v2`

### 2. **Crear proyecto en Vercel**

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Haz clic en **"New Project"**
3. Selecciona tu repositorio `edurikelm/next-cabanas-v2`
4. Vercel detectará automáticamente que es un proyecto Next.js

### 3. **Configurar Variables de Entorno**

⚠️ **IMPORTANTE**: Antes de hacer deploy, configura estas variables de entorno en Vercel:

#### Variables que necesitas agregar:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDLyuu3wJh-FzAAFkTC7POMJYxRPgMn8sA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app-cabanas.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=app-cabanas
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=app-cabanas.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=805240480334
NEXT_PUBLIC_FIREBASE_APP_ID=1:805240480334:web:e01444b8c6d296e683591f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NODE_ENV=production
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

#### Cómo agregar las variables en Vercel:
1. En la página de configuración del proyecto en Vercel
2. Ve a **"Settings"** → **"Environment Variables"**
3. Agrega cada variable una por una:
   - **Key**: Nombre de la variable (ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: Valor de la variable
   - **Environment**: Selecciona **Production**, **Preview**, y **Development**

### 4. **Configuración de Firebase para Producción**

#### Verificar reglas de Firestore:
Asegúrate de que las reglas de Firestore permitan lectura/escritura desde tu dominio de Vercel:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reservas/{document} {
      allow read, write: if true; // Temporal - cambiar por autenticación real
    }
  }
}
```

#### Configurar dominios autorizados:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `app-cabanas`
3. Ve a **Authentication** → **Settings** → **Authorized domains**
4. Agrega tu dominio de Vercel (será algo como `tu-app.vercel.app`)

### 5. **Deploy**

1. Haz clic en **"Deploy"** en Vercel
2. Espera a que termine el build (debería pasar sin errores)
3. ¡Tu aplicación estará disponible en línea!

### 6. **Verificación Post-Deploy**

Después del despliegue, verifica que:
- ✅ La página principal carga correctamente
- ✅ El calendario muestra las reservas de Firestore
- ✅ El formulario de reservas funciona
- ✅ No hay errores en la consola del navegador

### 7. **Configuración Adicional (Opcional)**

#### Dominio Personalizado:
Si tienes un dominio propio, puedes configurarlo en:
**Settings** → **Domains** en tu proyecto de Vercel

#### Monitoring:
Vercel te dará automáticamente:
- Analytics de rendimiento
- Logs de errores
- Métricas de uso

## 🔧 Troubleshooting

### Error: "Firebase not initialized"
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que `NODE_ENV=production`

### Error: "Firestore permission denied"
- Revisa las reglas de Firestore
- Verifica que el dominio de Vercel esté en dominios autorizados

### Error de build:
- Revisa los logs en Vercel
- Asegúrate de que el build local funcione: `npm run build`

## 📱 URLs Importantes

- **Proyecto GitHub**: https://github.com/edurikelm/next-cabanas-v2
- **Firebase Console**: https://console.firebase.google.com/project/app-cabanas
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**Estado actual**: ✅ Código listo para deploy
**Build local**: ✅ Exitoso
**TypeScript**: ✅ Sin errores
**Firestore**: ✅ Configurado y funcionando
