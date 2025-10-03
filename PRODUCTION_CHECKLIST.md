# ✅ Checklist de Configuración para Producción

## 🔧 Configuración Completada

### ✅ Archivos Agregados/Modificados:

1. **`.env.production.example`** - Variables de entorno para producción
2. **`vercel.json`** - Configuración de Vercel con headers y funciones
3. **`cors.json`** - Configuración CORS para Firebase Storage
4. **`storage.rules`** - Reglas de seguridad para Storage
5. **`firebase.json`** - Configuración del proyecto Firebase
6. **`next.config.ts`** - Optimizado para Vercel y Firebase
7. **`VERCEL_DEPLOYMENT.md`** - Documentación completa de deployment
8. **`scripts/setup-firebase-storage.js`** - Script de configuración automática
9. **`scripts/deploy-to-vercel.sh`** - Script de deployment automatizado
10. **`app/api/test-storage/route.ts`** - API para probar Firebase Storage
11. **`package.json`** - Scripts adicionales para deployment

## 📋 Pasos para Deploy en Producción

### 1. Preparación Local
```bash
# Verificar que todo funcione localmente
npm run dev
```

### 2. Configurar Variables en Vercel
```bash
# Opción A: CLI
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NODE_ENV production

# Opción B: Dashboard de Vercel
# https://vercel.com/tu-usuario/tu-proyecto/settings/environment-variables
```

### 3. Configurar Firebase Storage
```bash
# Configurar CORS
gsutil cors set cors.json gs://app-cabanas.firebasestorage.app

# Desplegar reglas
firebase deploy --only storage --project app-cabanas

# O usar script automatizado
npm run setup-firebase
```

### 4. Deploy a Vercel
```bash
# Opción A: Script automatizado
npm run deploy:vercel

# Opción B: Manual
npm run build
npm run deploy:prod
```

### 5. Verificación Post-Deploy
```bash
# Verificar que la app funcione
curl https://tu-dominio.vercel.app

# Probar Firebase Storage
curl https://tu-dominio.vercel.app/api/test-storage

# Verificar variables de entorno
npm run env:check
```

## 🔍 Verificaciones Importantes

### ✅ Firebase Configuration
- [ ] Proyecto Firebase creado y configurado
- [ ] Storage habilitado en Firebase Console
- [ ] Reglas de Storage configuradas
- [ ] CORS configurado para tu dominio

### ✅ Vercel Configuration  
- [ ] Proyecto vinculado a Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso localmente
- [ ] `vercel.json` configurado correctamente

### ✅ Funcionalidad
- [ ] Upload de archivos funciona
- [ ] Visualización de archivos funciona
- [ ] Eliminación de archivos funciona
- [ ] API de test responde correctamente

## 🚨 Solución de Problemas Comunes

### Error de CORS
```bash
# Reconfigurar CORS
gsutil cors set cors.json gs://app-cabanas.firebasestorage.app
```

### Variables de entorno no funcionan
```bash
# Verificar y reconfigurar
vercel env ls
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
vercel --prod --force
```

### Error en Firebase Storage
1. Verificar reglas en Firebase Console
2. Comprobar que el bucket existe
3. Revisar logs en Vercel Dashboard
4. Probar API: `/api/test-storage`

### Build fallido
```bash
# Limpiar cache y rebuildar
rm -rf .next
npm run build
```

## 📞 URLs Importantes

- **Vercel Dashboard**: https://vercel.com
- **Firebase Console**: https://console.firebase.google.com/project/app-cabanas
- **Tu App**: https://tu-dominio.vercel.app
- **Test Storage**: https://tu-dominio.vercel.app/api/test-storage

## 🎯 Comandos Útiles

```bash
# Desarrollo
npm run dev
npm run firebase:emulator

# Testing
npm run storage:test
curl https://tu-dominio.vercel.app/api/test-storage

# Deployment
npm run deploy:preview  # Deploy de prueba
npm run deploy:prod     # Deploy a producción
npm run deploy:vercel   # Script completo

# Debugging
vercel logs --follow
vercel env ls
firebase emulators:start
```

## ✨ ¡Listo para Producción!

Una vez completados todos los pasos del checklist, tu aplicación estará completamente configurada para Firebase Storage en Vercel con:

- ✅ Configuración optimizada de Next.js
- ✅ Variables de entorno seguras
- ✅ CORS configurado correctamente
- ✅ Reglas de Storage para producción
- ✅ Headers de seguridad
- ✅ Scripts de deployment automatizados
- ✅ API de testing funcional
- ✅ Documentación completa