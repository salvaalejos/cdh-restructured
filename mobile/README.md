# CDH Mobile App (Encuestadores)

Esta es la aplicación móvil desarrollada en **React Native (Expo)** para los encuestadores de campo del sistema CDH.

## Arquitectura y Stack Tecnológico
- **Framework:** Expo (Custom Dev Clients / Prebuild).
- **Lenguaje:** TypeScript.
- **Base de Datos Local:** WatermelonDB (Offline-first, sincronizado con el backend Prisma).
- **Estilos:** NativeWind (TailwindCSS para React Native).
- **Diseño UI:** Shadcn Dark Mode estricto (Vectores con `lucide-react-native`, prohibido el uso de emojis).
- **Estado UI:** Zustand.

## Contexto Actual de Desarrollo
*Basado en `REQUIREMENTS-APK.md` y el plan de implementación.*

### Tareas Completadas:
- [x] Análisis del esquema de Prisma para espejar las entidades locales.
- [x] Inicialización del proyecto con `create-expo-app` (TypeScript).

### Próximos Pasos (En progreso):
1. Configurar `app.json` con `expo-build-properties` para Android 14.
2. Instalar y configurar NativeWind y Zustand.
3. Instalar WatermelonDB y módulos nativos (`notifee`, `vision-camera`).
4. Definir esquema y modelos locales (Survey, Question, Option, SubOption, Respondent, Answer).

## Flujo Offline-First
La aplicación está diseñada para descargar la estructura de la encuesta mientras hay red, y luego operar totalmente offline (guardando coordenadas GPS, audio de fondo y capturando fotos) para luego sincronizar (`multipart/form-data`) de regreso al servidor.
