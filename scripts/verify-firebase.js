// scripts/verify-firebase.js
// Script para verificar la configuración de Firebase antes del deploy

// Cargar variables de entorno del archivo .env.local
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando configuración de Firebase...\n');

// Verificar variables de entorno
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let allVarsPresent = true;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Configurado`);
  } else {
    console.log(`❌ ${varName}: FALTANTE`);
    allVarsPresent = false;
  }
});

console.log('\n📋 Configuración Firebase:');
console.log(`   Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NO CONFIGURADO'}`);
console.log(`   Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NO CONFIGURADO'}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

if (allVarsPresent) {
  console.log('\n✅ Todas las variables de entorno están configuradas');
  console.log('🚀 Listo para deploy en Vercel');
} else {
  console.log('\n❌ Faltan variables de entorno');
  console.log('⚠️  Configura las variables faltantes antes del deploy');
}

console.log('\n📝 Checklist para Vercel:');
console.log('   □ Variables de entorno configuradas en Vercel');
console.log('   □ Reglas de Firestore actualizadas');
console.log('   □ Dominio de Vercel agregado a Firebase Auth');
console.log('   □ Build local exitoso (npm run build)');

console.log('\n🔗 URLs importantes:');
console.log('   • Vercel: https://vercel.com/dashboard');
console.log('   • Firebase Console: https://console.firebase.google.com/project/app-cabanas');
console.log('   • GitHub Repo: https://github.com/edurikelm/next-cabanas-v2');
