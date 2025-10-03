#!/bin/bash

# Script para desplegar a Vercel con todas las configuraciones necesarias
# Ejecutar: bash scripts/deploy-to-vercel.sh

echo "🚀 Iniciando deployment a Vercel..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instala con: npm i -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI encontrado${NC}"

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️ Firebase CLI no encontrado. Algunas funciones pueden no funcionar correctamente${NC}"
else
    echo -e "${GREEN}✅ Firebase CLI encontrado${NC}"
fi

# Configurar variables de entorno si no existen
echo -e "\n${YELLOW}📋 Configurando variables de entorno...${NC}"

# Lista de variables requeridas
variables=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
    "NODE_ENV"
)

# Verificar si las variables ya existen
echo "Verificando variables existentes..."
vercel env ls

echo -e "\n${YELLOW}Si las variables no están configuradas, agregalas manualmente:${NC}"
for var in "${variables[@]}"; do
    echo "vercel env add $var"
done

# Build y deploy
echo -e "\n${YELLOW}🔨 Construyendo proyecto...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Error en build${NC}"
    exit 1
fi

# Deploy a producción
echo -e "\n${YELLOW}🚀 Desplegando a producción...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ¡Deployment exitoso!${NC}"
    echo -e "\n${YELLOW}📋 Próximos pasos:${NC}"
    echo "1. Verifica que la aplicación funcione correctamente"
    echo "2. Prueba Firebase Storage en: https://tu-dominio.vercel.app/api/test-storage"
    echo "3. Configura CORS si es necesario: node scripts/setup-firebase-storage.js"
else
    echo -e "${RED}❌ Error en deployment${NC}"
    exit 1
fi