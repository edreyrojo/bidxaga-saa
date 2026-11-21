# Bidxaga Saa

Aplicación web para aprender **diidxazá** (zapoteco del Istmo de Tehuantepec) con cuatro juegos: Memorama, Reto Trivia, Crucigrama y Sopa de Letras. Incluye progreso por usuario, totopos, vidas, tienda, logros, rankings y una experiencia instalable tipo app (PWA).

## Hub principal

La pantalla de inicio se organiza en cuatro bloques para que la navegación sea directa:

- **Hoy**: recordatorio de racha, Reto Diario y Palabra del día.
- **Juega**: los cuatro juegos en una cuadrícula de 2×2 con su nivel actual.
- **Tu avance**: acceso al panel de progreso, que reúne estadísticas, Repaso Inteligente, actividad, niveles y logros.
- **Más**: instalar la app, **sugerir palabras o correcciones**, apoyar el proyecto y créditos.

## Panel de administración

- Acceso desde el icono de escudo de la barra superior (escritorio) o del menú móvil. Solo aparece para administradores.
- Nuevo panel a pantalla completa, cargado solo cuando se abre (no viaja en el bundle principal).
- Secciones actuales:
  - **Resumen**: usuarios totales, nuevos en 7 días, sugerencias pendientes, avisos, últimas sugerencias y actividad administrativa.
  - **Auditoría**: últimos 300 registros con filtros por acción, admin, texto y fechas; paginación y exportación CSV.
  - **Usuarios**: búsqueda por correo, nombre o UID; filtro por rol; paginación; detalle con vidas, progreso, logros, repaso espaciado, última actividad y reto/racha; copiar correo/UID; restablecimiento de contraseña; regalo de totopos con motivo y opción de contar para históricos; cambio de rol con protección del último administrador por rol; exportación CSV de la página o de todos los usuarios.
  - **Avisos**: crear, editar, duplicar, activar/desactivar, prioridad, programación de publicación, expiración, vista previa, borrado con confirmación y auditoría. Los avisos inactivos, programados a futuro o expirados no se muestran en la app.
  - **Rankings**: Memorama, Trivia, Sopa, Crucigrama y Reto Diario (por fecha); búsqueda, filtro de anomalías, paginación más allá de 100 registros, exportación CSV de lo filtrado o de todo, renombrado y borrado con auditoría.
  - **Sugerencias**: filtros por estado (incluye convertidas) y tipo, búsqueda, paginación, detección de duplicados, acciones masivas de aprobación/rechazo, marcado como convertida, exportación CSV, detalle, copia de datos y nota interna.
  - **Herramientas**: generador de avatares.
- Cada acción administrativa relevante se registra en `admin_logs` dentro del mismo lote que la escritura.
- El panel anterior se retiró: toda la administración vive ahora en esta pantalla.
- La verificación usa el custom claim `admin` o el campo `usuarios/{uid}.role`.
- El badge de avisos de la app ahora cuenta **avisos no leídos** y se marca como leído al abrir el panel de avisos.
- El acceso de administración muestra un contador en tiempo real de **sugerencias pendientes**.

## Seguridad sin backend

### App Check con reCAPTCHA v3 (gratuito)

1. En Firebase Console → **App Check** → aplicación web → **reCAPTCHA v3**, crea una site key.
2. Copia `.env.example` a `.env` y define:

```bash
VITE_RECAPTCHA_SITE_KEY=tu_site_key
```

3. En Vercel, agrega la misma variable de entorno.
4. Despliega y confirma que la app sigue funcionando.
5. Solo entonces activa **Enforcement** para Firestore en Firebase Console.

Sin site key, la app funciona sin App Check; no actives Enforcement antes de configurarla o las peticiones fallarán.

### Custom claim para administradores (gratuito)

Los cambios de rol ahora requieren el claim `admin`, no solo el campo `role`.

1. Descarga una cuenta de servicio desde Firebase Console → Configuración del proyecto → Cuentas de servicio.
2. Guárdala fuera del repositorio. `.gitignore` excluye `serviceAccount*.json`.
3. Ejecuta:

```bash
npm run admin:claim -- ruta/serviceAccount.json UID_DEL_USUARIO
```

4. Cierra sesión y vuelve a entrar para refrescar el token.

Para retirarlo:

```bash
npm run admin:claim -- ruta/serviceAccount.json UID_DEL_USUARIO quitar
```

El campo `role` sigue funcionando como respaldo para acceder al panel, pero **solo un administrador con custom claim puede cambiar roles**.

## Calidad y CI

- `.github/workflows/calidad.yml` ejecuta en cada push y pull request:
  - `npm run lint`
  - `npm test`
  - `npm run build`
- `npm run ci` reproduce la misma secuencia en local.
- `npm test` ejecuta las pruebas de repaso, reto diario y calidad/economía.
- `ErrorBoundary` evita pantallas en blanco y ofrece recargar.
- La PWA avisa cuando hay una nueva versión y permite recargar.
- En Android/Chrome se usa la instalación nativa si el navegador la ofrece; si no, se muestran las instrucciones.

## Sugerencias de hablantes

- Desde **Más → Sugerir** cualquier persona puede enviar:
  - Palabra nueva.
  - Corrección.
  - Disponibilidad para aportar audio.
  - Otra observación.
- No requiere cuenta; si hay sesión, se guarda el `uid`.
- Las sugerencias se guardan en Firestore (`sugerencias`) con estado `pendiente`.
- Solo un administrador puede leerlas y aprobarlas o rechazarlas desde el Panel de Administración.
- Aprobar no publica automáticamente la palabra: el administrador copia los datos al catálogo para revisarlos antes de incorporarlos.
- Hay un campo trampa para reducir bots; no se implementó limitación de frecuencia.

## Requisitos

- Node.js 20 o superior
- npm

## Desarrollo

```bash
npm install
npm run dev
```

Vite abre la app en `http://localhost:5173`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Auditoría de assets, compilación de producción y generación del service worker |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | Revisión estática con Oxlint |
| `npm run check:assets` | Verifica que todas las imágenes y sonidos referenciados existan |
| `npm run optimizar:imagenes` | Recomprime PNG nuevos o modificados (máx. 256–512 px) |
| `npm run optimizar:audio` | Recomprime las pistas MP3 a 112 kbps y los efectos a 64 kbps |
| `npm run optimizar` | Ejecuta ambas optimizaciones |
| `npm run test:repaso` | Prueba el motor de repaso espaciado |
| `npm run test:reto` | Prueba el reto diario, rachas, palabra del día y compartir |
| `npm run test:calidad` | Prueba vidas, niveles y almacenamiento por usuario |
| `npm run test:admin` | Prueba CSV, orden de rankings y helpers administrativos |
| `npm test` | Ejecuta todas las pruebas |
| `npm run admin:claim` | Asigna o retira el custom claim `admin` con Firebase Admin SDK |
| `npm run ci` | Lint + pruebas + build, igual que GitHub Actions |
| `npm run check:rules` | Valida las reglas de Firestore sin desplegarlas |
| `npm run deploy:rules` | Despliega las reglas de Firestore |

Los scripts de optimización guardan una caché local en `scripts/.imagenes-optimizadas.json` y `scripts/.audio-optimizado.json`, por lo que solo procesan archivos nuevos o modificados.

## PWA e instalación

- `public/manifest.json` define nombre, colores e iconos.
- `public/sw.js` guarda el shell de la app y, al compilar, recibe la lista de chunks e imágenes para que los cuatro juegos funcionen sin conexión.
- Los iconos se generan en `public/icons/`.
- En Android/Chrome aparece la opción **Instalar aplicación**; en iPhone se usa **Compartir → Agregar a la pantalla de inicio**. La app también muestra estas instrucciones desde el menú principal.

El service worker se genera con `scripts/generar-sw.mjs` después de `vite build` (script `postbuild`). Por eso conviene compilar siempre con:

```bash
npm run build
```

El precache incluye los chunks de Memorama, Trivia, Crucigrama, Sopa, las imágenes de vocabulario, los avatares y los sonidos de interacción. La música de fondo no se precarga para no consumir datos: se guarda cuando el usuario la reproduce por primera vez.

El service worker solo se registra en producción (`npm run build` + `npm run preview` o el sitio desplegado).

## Despliegue

### Vercel

El proyecto se despliega como sitio estático. `vercel.json` define caché larga para assets con hash y caché corta para `sw.js` y `manifest.json`.

```bash
npm run build
```

Configura la carpeta de salida como `dist`.

### Firebase

El proyecto de Firebase es `bidxaga-saa`. Para activar las reglas de seguridad:

```bash
firebase deploy --only firestore:rules --project bidxaga-saa
```

Consulta `SECURITY.md` antes de desplegar: las reglas asumen que los administradores tienen el custom claim `admin` o el campo protegido `usuarios/{uid}.role = "admin"`.

## Estructura

```text
public/            Assets estáticos, iconos, audio, manifest y service worker
scripts/           Auditoría de assets y optimización de imágenes/audio
src/components/    Pantallas, juegos y modales; Icono.jsx centraliza los SVG
src/hooks/         Totopos, vidas, progreso, logros, repaso, reto y panel
src/data/          Vocabulario, catálogo de logros y activos
src/utils/         Almacenamiento, fechas, repaso, reto y utilidades
firestore.rules    Reglas de seguridad de Firestore
```

## Iconos SVG

- La interfaz usa **iconos SVG** de `lucide-react` a través del componente `src/components/Icono.jsx`.
- Las categorías y los logros guardan un nombre de icono (`icono: 'dog'`, `icono: 'trophy'`, etc.) en lugar de emojis.
- Para añadir un icono nuevo, se registra en el mapa de `Icono.jsx` y se usa con `<Icono nombre="..." />`.
- Los iconos decorativos se marcan como `aria-hidden`; los botones sin texto conservan su `aria-label`.

## Panel de progreso

Accesible desde **Mi progreso** en el menú principal:

- Palabras practicadas, dominadas, por reforzar y precisión.
- Actividad de los últimos 7 días (respuestas de los juegos y del reto diario).
- Niveles actuales de Memorama, Trivia, Crucigrama y Sopa.
- Dominio por categoría de fauna y flora.
- Progreso de logros y estado del reto diario.
- La actividad diaria se guarda por usuario/dispositivo y conserva los últimos 90 días.

## Palabra del día y compartir

- El menú muestra una **Palabra del día** determinista: cambia cada día y alterna entre fauna y flora.
- Incluye imagen, palabra en diidxazá, traducción y categoría.
- El botón **Compartir** usa la Web Share API del dispositivo; si no está disponible, copia el texto y el enlace al portapapeles.
- El resultado del **Reto Diario** también se puede compartir con la puntuación y la racha.
- El texto compartido incluye el enlace de la app para invitar a otras personas.

## Reto diario y rachas

- Cada día hay **5 preguntas** generadas de forma determinista: todas las personas reciben el mismo reto durante ese día.
- Alterna preguntas de español a diidxazá y de diidxazá a español.
- La recompensa va de **5 a 50 totopos** según los aciertos y se entrega **una sola vez al día**.
- Puedes repetirlo en modo práctica, sin recompensa, para seguir repasando.
- La **racha** cuenta los días seguidos completando el reto. Si pasas un día sin completarlo, vuelve a 1.
- Las respuestas también alimentan el **Repaso Inteligente**.
- Con sesión iniciada, el reto y la racha se sincronizan con `usuarios/{uid}.retoDiario` y `usuarios/{uid}.rachaReto`. Los invitados los guardan localmente.
- Hay logros para el primer reto, 7 días y 30 días de racha.
- **Ranking diario**: los usuarios con sesión aparecen en `ranking_reto/{fecha}/jugadores`. Se ordena por aciertos, luego racha y luego hora de finalización. Los invitados pueden consultarlo, pero no aparecer.
- **Recordatorio de racha**: si el reto de hoy está pendiente, el menú muestra un aviso con la racha en juego y un botón directo al reto. Se puede ocultar por ese día. Es un recordatorio dentro de la app; las notificaciones push requieren un backend.

## Repaso inteligente

Cada acierto o error al resolver una palabra se guarda en el espacio del usuario actual (`repasoPalabras`). La app usa un sistema de cajas tipo Leitner:

- Un acierto sube la palabra de caja y la programa para dentro de 1, 3, 7, 14 o 30 días.
- Un error la devuelve a la caja 0 y la marca como pendiente de inmediato.
- Las palabras nuevas y las pendientes tienen más probabilidad de aparecer en el siguiente nivel.
- El resumen está disponible en el menú principal (**Repaso Inteligente**) y en el perfil.
- El historial se puede borrar desde esa misma sección.

Para usuarios con sesión, el repaso se sincroniza con la subcolección `usuarios/{uid}/repaso` de Firestore. Al iniciar sesión se combinan los registros locales y remotos quedándose con el más reciente de cada palabra. Los invitados guardan su repaso solo en el dispositivo.

## Datos y modo invitado

- Invitado: el progreso se guarda en `localStorage` con el prefijo `bidxaga:v1:guest:*`.
- Usuario autenticado: el progreso se sincroniza con Firestore y se guarda localmente con `bidxaga:v1:user:<uid>:*`.
- Los invitados no escriben en los rankings globales; la app les pide iniciar sesión.
- Si Firestore no está disponible, la app sigue funcionando en modo local.
