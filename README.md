# Bidxaga Saa

Aplicación web para aprender **diidxazá** (zapoteco del Istmo de Tehuantepec) con cuatro juegos: Memorama, Reto Trivia, Crucigrama y Sopa de Letras. Incluye progreso por usuario, totopos, vidas, tienda, logros, rankings y una experiencia instalable tipo app (PWA).

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
| `npm test` | Ejecuta todas las pruebas |
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
src/components/    Pantallas, juegos y modales
src/hooks/         Totopos, vidas, progreso, logros y repaso
src/data/          Vocabulario, catálogo de logros y activos
src/utils/         Almacenamiento con espacio de nombres y utilidades
firestore.rules    Reglas de seguridad de Firestore
```

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
