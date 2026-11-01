# Active Personalizados

Aplicación web para planificaciones de Active, con acceso por correo y contraseña y guardado compartido en Firebase. No requiere instalar una app en Android ni usar la API de Gemini.

## Estado y activación

El código requiere que se publiquen las reglas de `firestore.rules` en el proyecto Firebase `active-personalizados`. Crear Firestore o registrar una app web por sí solo no conecta el prototipo publicado. Después de integrar estos cambios hay que publicar una nueva versión web.

1. Firebase Authentication: habilitar correo/contraseña. El usuario administrador ya creado tiene UID `vgh76zcWT2cmLeSVK7hpdMOMvNn2`.
2. Firestore → Reglas: reemplazar todo el contenido por `firestore.rules` y publicar, o ejecutar `npx firebase-tools deploy --only firestore:rules --project active-personalizados` desde una sesión autorizada.
3. Instalar con `npm ci` y compilar con `npm run build`.
4. Publicar `dist` en un servidor HTTPS con fallback a `index.html`. Para Firebase Hosting: `npx firebase-tools deploy --only hosting --project active-personalizados` después de autorizar la cuenta. Esto crea una dirección distinta de la publicación previa en AI Studio.
5. Si se conserva el alojamiento en AI Studio, importar los cambios de GitHub en el editor y publicar de nuevo desde allí. Comprobar que el editor tiene esta versión antes de volver a enviar cambios al repositorio.

No hace falta habilitar Analytics, Gemini, SMS ni copias programadas para estas funciones. El uso de Firebase tiene cuotas y límites propios; no se promete uso ilimitado o ausencia de costos futuros.

## Uso

- El administrador ingresa con su correo y contraseña de Firebase.
- Registra el correo real de cada alumno, en minúsculas, y le asigna una rutina. Las plantillas anteriores siguen disponibles desde el planificador, pero no se cargan alumnos de demostración automáticamente.
- Comparte el enlace de la ficha. El enlace contiene un identificador, sin nombre, teléfono, PIN ni copia de la planificación.
- El alumno crea su cuenta con el mismo correo, confirma el enlace de verificación enviado a su casilla y entra. Crear una cuenta no otorga acceso a ningún alumno distinto ni al panel de profesores.
- Pesos, repeticiones, RIR, marcas de completado y comentarios de la sesión en curso se guardan automáticamente con una espera de 700 ms desde la última edición. La copia local de cambios pendientes está separada por usuario, rutina, semana y día.
- Al finalizar, “Guardar y enviar al profe” confirma el entrenamiento en el historial. Hay un registro por alumno/rutina/semana/día: volver a guardar actualiza ese registro. Para múltiples sesiones del mismo día en una semana se requiere ampliar este modelo.
- Una copia local pendiente se prioriza al recuperar una sesión; editar el mismo borrador simultáneamente en varios dispositivos usa la última escritura del documento. No hay resolución colaborativa campo por campo.
- Los registros del alumno no modifican los objetivos del profesor. Las proyecciones usan los registros disponibles.

Otros profesores: desde una sesión de administrador, crear en Firestore `coaches/UID_DEL_PROFESOR` con un campo `name` de tipo texto. Ese profesor necesita una cuenta de Authentication y correo verificado. Solo el UID administrador puede conceder o quitar permisos.

Las reglas son la autoridad de acceso. Los indicadores de rol del navegador no conceden permisos. Un alumno con email compartido por error en dos fichas podría acceder a ambas: registrar correos individuales. La interfaz evita duplicados en los datos cargados, pero no hay un índice de unicidad transaccional entre profesores.

## Verificación

Requiere Node 22, y Java 17 o superior con la versión 14 del CLI incluida. Para versiones nuevas del CLI puede ser necesario Java 21.

```sh
npm ci
npm run lint
npm run build
npm run test:rules
npx playwright install chromium
npm run test:ui
```

Las pruebas usan el proyecto local `demo-active` y no escriben en Firebase de producción. El modo emulador solo se habilita en desarrollo con `VITE_USE_FIREBASE_EMULATORS=true`.

## Datos del prototipo

Los alumnos anteriores eran de prueba. Esta versión no importa su almacenamiento local ni los perfiles codificados de enlaces antiguos. Elimina esas copias del prototipo al ingresar. Las copias JSON pueden importarse por un profesor, hasta 450 registros por archivo; se normalizan los correos y se vacían los PIN. Las rutinas importadas deben tener `studentId` y estar asignadas en la ficha.
