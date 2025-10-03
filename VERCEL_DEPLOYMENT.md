# Guía de Deployment en Vercel

## 🚀 Configuración Completa para Firebase Storage

### 1. Requisitos Previos

```bash
# Instalar herramientas necesarias
npm install -g vercel firebase-tools

# Autenticarse
vercel login
firebase login
```

### 2. Configurar Variables de Entorno

#### Opción A: Desde el Dashboard de Vercel
1. Ve a tu proyecto en https://vercel.com
2. Settings > Environment Variables
3. Agrega cada variable:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDLyuu3wJh-FzAAFkTC7POMJYxRPgMn8sA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app-cabanas.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=app-cabanas
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=app-cabanas.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=805240480334
NEXT_PUBLIC_FIREBASE_APP_ID=1:805240480334:web:e01444b8c6d296e683591f
NODE_ENV=production
```

#### Opción B: Desde CLI
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NODE_ENV
```

### 3. Configurar Firebase Storage

```bash
# Configurar CORS
gsutil cors set cors.json gs://app-cabanas.firebasestorage.app

# Desplegar reglas de Storage
firebase deploy --only storage --project app-cabanas
```

### 4. Desplegar Aplicación

#### Opción A: Script Automatizado
```bash
bash scripts/deploy-to-vercel.sh
```

#### Opción B: Manual
```bash
# Build
npm run build

# Deploy
vercel --prod
```

### 5. Verificación

1. **Prueba la aplicación**: https://tu-dominio.vercel.app
2. **Prueba Firebase Storage**: https://tu-dominio.vercel.app/api/test-storage
3. **Verifica subida de archivos** en la sección de arriendos

### 6. Solución de Problemas

#### Error de CORS
```bash
# Reconfigurar CORS
gsutil cors set cors.json gs://app-cabanas.firebasestorage.app
```

#### Variables de entorno no funcionan
```bash
# Verificar variables
vercel env ls

# Redeployar
vercel --prod --force
```

#### Error en Firebase Storage
1. Verifica las reglas en Firebase Console
2. Asegúrate de que el bucket existe
3. Revisa los logs en Vercel Dashboard

### 7. Monitoring

- **Logs de Vercel**: https://vercel.com/tu-usuario/tu-proyecto/functions
- **Firebase Console**: https://console.firebase.google.com/project/app-cabanas
- **Storage Usage**: Firebase Console > Storage

### 8. Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs --follow

# Redeploy sin cache
vercel --prod --force

# Ver estado del proyecto
vercel ls

# Ver dominios
vercel domains ls
```

### 9. Configuración de Dominio Personalizado

```bash
# Agregar dominio
vercel domains add tu-dominio.com

# Configurar DNS según las instrucciones
```

### 10. Actualizaciones

Para actualizar la aplicación:

```bash
# 1. Hacer cambios al código
# 2. Commit y push
git add .
git commit -m "Update: descripción"
git push

# 3. Deploy
vercel --prod
```

### 📞 Soporte

Si tienes problemas:

1. Revisa esta documentación
2. Consulta los logs de Vercel
3. Verifica la configuración de Firebase
4. Prueba la API de test: `/api/test-storage`