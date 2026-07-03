# Documento de Requerimientos y Arquitectura: App Móvil CDH

## 1. Visión General
Aplicación móvil de uso exclusivo para encuestadores en campo. Su objetivo es permitir la descarga, ejecución y carga de encuestas de manera fluida, operando bajo un paradigma estrictamente **offline-first**. El sistema está diseñado para procesar **una sola encuesta a la vez**, optimizando el uso de recursos y garantizando la integridad de los datos en hardware de entrada.

## 2. Arquitectura Tecnológica
* **Frontend Móvil:** React Native (TypeScript).
* **Backend y API:** ElysiaTS (apoyandonos del actual).
* **Base de Datos Local:** WatermelonDB (sobre SQLite) para carga reactiva y persistencia eficiente.
* **Transferencia de Archivos:** Cargas al servidor mediante `multipart/form-data` (evitando Base64 para salida de archivos pesados).
* **Formatos Multimedia:** 
  * Audio: `.m4a` (Códec AAC, compresión nativa).
  * Imagen de salida: `.jpg` (Resolución controlada, ej. 720p/480p).
  * Imagen de entrada: La que envíe el servidor < 3mb

## 3. Entorno de Ejecución Objetivo (Hardware y OS)
* **Dispositivo:** LENOVO Tab One.
* **Procesador:** MediaTek Helio G85.
* **Memoria:** 4GB RAM.
* **Almacenamiento:** 128GB.
* **Sistema Operativo:** Android 14.

## 4. Stack de Librerías Nativas Críticas
Para sortear las limitaciones de 4GB de RAM y las restricciones de Android 14, se establecen las siguientes dependencias:
* **Cámara:** `react-native-vision-camera` (comunicación JSI directa, evita el JS Bridge).
* **Audio:** `react-native-audio-recorder-player` (soporte de compresión nativa).
* **Servicios en Segundo Plano:** `@notifee/react-native` (requerido para mantener el micrófono activo en Android 14).
* **Sistema de Archivos:** `react-native-fs` (o equivalente expo-file-system) para gestión y borrado local.
* **Ubicación:** `react-native-geolocation-service` (o expo-location, capaz de utilizar el chip GPS físico en modo offline).

---

## 5. Requerimientos Funcionales

### 5.1. Módulo de Autenticación (Online)
* **REQ-AUTH-01:** El sistema debe permitir el inicio de sesión únicamente con credenciales válidas generadas en la plataforma web.
* **REQ-AUTH-02:** El acceso está restringido exclusivamente al rol "Encuestador".

### 5.2. Sincronización de Descarga / Pull (Online)
* **REQ-SYNC-01:** La interfaz debe presentar un botón "Sincronizar" que consulte al backend por la campaña/encuesta asignada.
* **REQ-SYNC-02:** El sistema descargará y almacenará la estructura dinámica (plantilla JSON) de **una (1) sola campaña a la vez** en WatermelonDB, junto con sus parámetros de metas o cuotas (cuotas por género).
* **REQ-SYNC-03:** Si se tiene una campaña activa en el dispositivo y el usuario intenta sincronizar otra, se hará la validación que si es una encuesta diferente avisar que se subira el progreso actual y se cambiara la encuesta, si es la misma encuesta no hacer nada.

### 5.3. Ejecución de Encuestas y Control de Metas (Offline)
* **REQ-EXEC-01 (Múltiples Registros):** El usuario utilizará la plantilla descargada para generar múltiples registros independientes (uno por cada persona encuestada), sin necesidad de conexión a internet.
* **REQ-EXEC-02 (Autoguardado):** El progreso de cada registro individual debe persistirse instantáneamente en WatermelonDB para evitar pérdida de datos ante cierres forzados.
* **REQ-EXEC-02.1 (Progreso durante la encuesta):** Se debe terminar de contestar cada pregunta para poder pasar a la siguiente, no se puede saltar preguntas pero si se puede volver a una pregunta anterior para corregir o confirmar respuesta, en caso de querer cancelar la encuesta se debe presionar un boton de "Cancelar" pero no se debe perder el registro actual, solo que obligatoriamente se tomará una foto que servirá de prueba y se guardará, todas las preguntas se responderán con la primera opción o si es abierta se pondra como cancelada (esto para tener evidencia que se canceló).
* **REQ-EXEC-03 (Ubicación):** Al iniciar o finalizar cada registro, el sistema obtendrá las coordenadas vía chip GPS y las adjuntará a ese registro específico.
* **REQ-EXEC-04 (Multimedia por Registro):** Cada nueva encuesta iniciada disparará una grabación de audio en segundo plano. Al finalizar, el audio `.m4a` y la fotografía `.jpg` opcional se guardarán en el almacenamiento local, vinculados al ID de ese registro específico.
* **REQ-EXEC-05 (Progreso de Metas):** La interfaz debe mostrar en tiempo real el progreso de las encuestas completadas localmente contra la meta asignada (ej. "Progreso: 45/50 hombres y 0/50 mujeres").
* **REQ-EXEC-06 (Respaldo local):** En cualquier momento como opción algo oculta para el encuestador, se podrá descargar un json con toda la bdd local al dispositivo, para que en caso de cualquier error o perdida de información, algún técnico o programador pueda recuperar la información aún existente, se descargara solo al ingresar una contraseña especial.
* **REQ-EXEC-07 (Recuperación por errores):** En caso de que se pierda visualmente el progreso, se tendrá un botón de recuperar progreso, esto sincronizará localmente nuevamente, pero de preferencia no se debería llegar a esto y es una opción también algo oculta para el encuestador promedio. 

### 5.4. Carga de Resultados / Push (Online)
* **REQ-UPLOAD-01 (Cola de Subida):** Al presionar el botón "Subir Encuestas", el sistema identificará todos los registros completados localmente y los enviará al servidor mediante un proceso en cola (batch o iterativo), para evitar tiempos de espera (timeouts) en caso de volúmenes altos (ej. 100 encuestas juntas), pero se hará dentro de una transacción para mantener la integridad de los datos.
* **REQ-UPLOAD-02:** El JSON con las respuestas y el ID de cada registro se enviará al endpoint, acompañado de sus archivos multimedia correspondientes mediante `multipart/form-data`, y se guardará en la base de datos del servidor la ubicación de cada archivo para posteriormente poder acceder a ellos.

### 5.5. Ciclo de Reconciliación y Limpieza (Post-Subida)
* **REQ-CLEAN-01:** Por cada registro que reciba un HTTP 200 OK del servidor de manera individual, la aplicación eliminará ese registro específico de WatermelonDB.
* **REQ-CLEAN-02:** Inmediatamente después, se eliminarán los archivos multimedia (audio y foto) vinculados a ese registro del almacenamiento del dispositivo.
* **REQ-CLEAN-03:** El sistema recalculará automáticamente la meta pendiente. Si el servidor confirma que la meta total de la campaña se ha cumplido, la aplicación eliminará la plantilla de la campaña local, dejando el sistema en blanco para una nueva sincronización. En caso de fallas de conexión o errores en algún registro, este permanecerá en el dispositivo para reintentar la subida posteriormente.


---

## 6. Requerimientos No Funcionales

### 6.1. Android 14 y Permisos
* **REQ-NF-01 (Onboarding):** La aplicación debe contar con una pantalla inicial de solicitud de permisos (Micrófono, Cámara, Ubicación precisa).
* **REQ-NF-02 (Foreground Service):** Para evitar que el OS detenga la grabación de audio si la pantalla se apaga o se minimiza la app, se debe implementar un servicio en primer plano (Foreground Service) mostrando una notificación persistente mientras el micrófono esté en uso.

### 6.2. Rendimiento y Hardware
* **REQ-NF-03:** La gestión de la memoria no debe exceder los límites de las tabletas de 4GB de RAM. Se prohíbe estrictamente la carga y conversión de archivos multimedia de gran tamaño a cadenas Base64.