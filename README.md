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
| `npm run build` | Auditoría de assets y compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | Revisión estática con Oxlint |
| `npm run check:assets` | Verifica que todas las imágenes y sonidos referenciados existan |
| `npm run optimizar:imagenes` | Recomprime PNG nuevos o modificados (máx. 256–512 px) |
| `npm run optimizar:audio` | Recomprime las pistas MP3 a 112 kbps y los efectos a 64 kbps |
| `npm run optimizar` | Ejecuta ambas optimizaciones |
| `npm run check:rules` | Valida las reglas de Firestore sin desplegarlas |
| `npm run deploy:rules` | Despliega las reglas de Firestore |

Los scripts de optimización guardan una caché local en `scripts/.imagenes-optimizadas.json` y `scripts/.audio-optimizado.json`, por lo que solo procesan archivos nuevos o modificados.

## PWA e instalación

- `public/manifest.json` define nombre, colores e iconos.
- `public/sw.js` guarda el shell de la app para que abra sin conexión después de la primera visita.
- Los iconos se generan en `public/icons/`.
- En Android/Chrome aparece la opción **Instalar aplicación**; en iPhone se usa **Compartir → Agregar a la pantalla de inicio**. La app también muestra estas instrucciones desde el menú principal.

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

## Datos y modo invitado

- Invitado: el progreso se guarda en `localStorage` con el prefijo `bidxaga:v1:guest:*`.
- Usuario autenticado: el progreso se sincroniza con Firestore y se guarda localmente con `bidxaga:v1:user:<uid>:*`.
- Los invitados no escriben en los rankings globales; la app les pide iniciar sesión.
- Si Firestore no está disponible, la app sigue funcionando en modo local.
