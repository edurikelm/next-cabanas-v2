#!/usr/bin/env node
/**
 * Script para configurar Firebase Storage para producción
 * Ejecutar: node scripts/setup-firebase-storage.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'app-cabanas';
const STORAGE_BUCKET = 'app-cabanas.firebasestorage.app';

console.log('🔧 Configurando Firebase Storage para producción...');

// 1. Verificar que Firebase CLI esté instalado
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI encontrado');
} catch (error) {
  console.error('❌ Firebase CLI no está instalado. Instala con: npm install -g firebase-tools');
  process.exit(1);
}

// 2. Configurar CORS
try {
  console.log('📡 Configurando CORS para Storage...');
  execSync(`gsutil cors set cors.json gs://${STORAGE_BUCKET}`, { stdio: 'inherit' });
  console.log('✅ CORS configurado correctamente');
} catch (error) {
  console.error('❌ Error configurando CORS. Asegúrate de tener gsutil instalado y autenticado.');
  console.error('   Instala Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
}

// 3. Configurar reglas de Storage
try {
  console.log('🔒 Configurando reglas de Storage...');
  execSync(`firebase deploy --only storage --project ${PROJECT_ID}`, { stdio: 'inherit' });
  console.log('✅ Reglas de Storage configuradas');
} catch (error) {
  console.error('❌ Error configurando reglas de Storage');
  console.error('   Ejecuta: firebase login && firebase use app-cabanas');
}

// 4. Mostrar siguiente pasos
console.log('\n🎉 Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configura las variables de entorno en Vercel:');
console.log('   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY');
console.log('   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
console.log('   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID');
console.log('   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
console.log('   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
console.log('   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID');
console.log('\n2. Despliega tu aplicación:');
console.log('   vercel --prod');
console.log('\n3. Prueba la funcionalidad en: https://tu-dominio.vercel.app/api/test-storage');
