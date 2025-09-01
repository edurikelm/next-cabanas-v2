# Configuración de Reglas de Firestore

## Problema
Error: `FirebaseError: Missing or insufficient permissions.`

## Solución
Las reglas de Firestore necesitan ser actualizadas para permitir acceso a las colecciones `arriendos` y `cabanas`.

## Pasos para configurar en Firebase Console:

### 1. Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en "Firestore Database"
4. Ve a la pestaña "Reglas" (Rules)

### 2. Actualizar las reglas
Reemplaza las reglas existentes con el siguiente código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección arriendos
    match /arriendos/{document} {
      allow read, write: if true;
    }
    
    // Reglas para la colección cabanas
    match /cabanas/{document} {
      allow read, write: if true;
    }
    
    // Denegar acceso por defecto a otras colecciones
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Publicar las reglas
1. Haz clic en "Publicar" (Publish)
2. Confirma los cambios

## Verificación
Después de actualizar las reglas:
1. Recarga la página de cabañas en tu aplicación
2. Haz clic en "Agregar Datos Ejemplo"
3. Verifica que las cabañas se carguen correctamente

## Índices Compuestos Necesarios

La aplicación requiere índices compuestos para consultas optimizadas. Si ves errores sobre índices faltantes:

### Índice para cabañas disponibles
**Colección:** `cabanas`
**Campos:**
- `estado` (Ascending)
- `nombre` (Ascending)

**Crear automáticamente:**
Cuando veas el error en la consola, haz clic en el enlace proporcionado para crear el índice automáticamente.

**Crear manualmente:**
1. Ve a Firebase Console > Firestore Database > Índices
2. Haz clic en "Crear índice"
3. Configuración:
   - Colección: `cabanas`
   - Campo 1: `estado` (Ascendente)
   - Campo 2: `nombre` (Ascendente)
4. Haz clic en "Crear"

### Nota sobre rendimiento
- Los índices pueden tardar unos minutos en crearse
- Una vez creados, las consultas serán más rápidas
- Sin índices, las consultas complejas fallarán

## Para Producción
⚠️ **IMPORTANTE**: Las reglas actuales permiten acceso completo sin autenticación.

Para producción, considera implementar reglas más seguras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /arriendos/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /cabanas/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Alternativa usando Firebase CLI
Si tienes Firebase CLI instalado, puedes usar el archivo `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

## Troubleshooting
- Si el error persiste, verifica que estés conectado al proyecto correcto
- Asegúrate de que las reglas se hayan publicado correctamente
- Revisa la consola del navegador para errores adicionales
