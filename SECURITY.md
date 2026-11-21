# Seguridad de Bidxaga Saa

Este proyecto ya incluye reglas de Firestore en `firestore.rules` y configuración de Firebase CLI en `firebase.json` / `.firebaserc`.

> **Estado:** las reglas están desplegadas en el proyecto `bidxaga-saa` (20/11/2026).

## Qué protegen las reglas

- Cada usuario solo puede leer y editar su propio documento `usuarios/{uid}`.
- Un usuario **no puede cambiarse el rol, el correo ni la fecha de creación**.
- Solo un administrador puede listar todos los usuarios y crear/editar/eliminar avisos.
- Los rankings son públicos para lectura, pero solo se pueden escribir con una sesión autenticada y únicamente en el documento del propio usuario.
- El ranking diario del reto vive en `ranking_reto/{fecha}/jugadores/{uid}`: lectura pública y escritura limitada al propio usuario, con validación de fecha, nombre, aciertos y racha.
- Las sugerencias de hablantes viven en `sugerencias`: cualquiera puede crear una con campos validados y estado `pendiente`; solo un administrador puede leerlas, aprobarlas o rechazarlas. Al revisar, solo se pueden modificar estado, fecha, revisor y nota interna.
- Los avisos validan título, mensaje, prioridad, estado activo y fecha de expiración desde las reglas.
- El campo `role` solo acepta `""` o `"admin"`; el dueño no puede cambiarlo y un administrador solo puede alternar entre esos dos valores.
- `admin_logs` es una colección de auditoría: solo los administradores pueden leerla y agregar registros; nadie puede editarla ni borrarla desde la app.
- Los récords deben incluir `completado: true` y puntajes válidos:
  - Memorama: `score > 0`.
  - Sopa y Crucigrama: `intentos > 0`.
  - Trivia: `errores >= 0`.
- Los invitados ya no guardan récords globales; conservan su progreso local y se les pide iniciar sesión.
- El historial de repaso vive en `usuarios/{uid}/repaso/{clave}`: cada usuario solo puede leer y escribir sus propios registros, y cada registro valida tipo, contadores, caja y fechas.

## Cómo validar las reglas sin desplegar

```bash
firebase deploy --only firestore:rules --dry-run --project bidxaga-saa
```

## Cómo desplegar las reglas

```bash
firebase login
firebase deploy --only firestore:rules --project bidxaga-saa
```

Después de desplegar, prueba:

1. Un usuario normal no debe poder entrar al panel de administración.
2. Un usuario normal no debe poder escribir en `ranking`, `ranking_trivia`, `ranking_sopa` o `ranking_crucigrama` de otra persona.
3. Un invitado no debe poder guardar un récord global.
4. Un administrador sí debe poder listar usuarios y administrar avisos.

## Administradores

El panel acepta dos formas de administrador:

1. **Custom claim** `admin: true` en el token.
2. **Campo `role: "admin"`** en `usuarios/{uid}`.

El campo `role` ya no puede ser modificado por el propio usuario desde la app.

### Opción recomendada: custom claim

Con Firebase Admin SDK, por ejemplo desde una máquina segura:

```js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({
  credential: cert('serviceAccount.json'),
  projectId: 'bidxaga-saa'
});

await getAuth(app).setCustomUserClaims('UID_DEL_ADMIN', { admin: true });
```

El administrador debe cerrar sesión y volver a entrar, o refrescar su token, para que el claim aparezca.

No subas el archivo `serviceAccount.json` al repositorio.

### Opción alternativa: campo `role`

Puedes editar manualmente `usuarios/{uid}.role = "admin"` desde la consola de Firebase o con Admin SDK. Las reglas impiden que el usuario se lo asigne a sí mismo desde el cliente.

## Endurecimiento sin backend

- **App Check** está preparado con reCAPTCHA v3. La site key se define con `VITE_RECAPTCHA_SITE_KEY`; la aplicación no activa Enforcement por sí sola. Debe activarse en Firebase Console después de verificar que la app funciona.
- Los **cambios de rol** requieren el custom claim `admin`; el campo `role` sigue sirviendo como respaldo para acceder al panel, pero no para modificar roles.
- El script `npm run admin:claim` permite asignar o retirar el claim usando una cuenta de servicio local. La cuenta no se sube al repositorio.
- Las sugerencias tienen un límite local de 5 minutos entre envíos; App Check es la protección principal contra abuso automatizado.

## Duelo de Memorama

- Las salas viven en `salas/{codigo}` y solo pueden leerlas usuarios autenticados: las salas en espera son legibles para permitir unirse; las partidas activas solo para sus jugadores.
- Solo el anfitrión crea, inicia, reinicia o elimina la sala.
- Solo el jugador en turno puede voltear cartas y resolver parejas. Cualquiera de los dos puede cerrar un turno fallido, lo que evita que un fallo deje la mesa bloqueada.
- El mazo completo se guarda en Firestore para sincronizar ambos clientes. Esto permite competencia amistosa, pero no anti-trampas fuerte: un jugador con conocimientos técnicos podría inspeccionar el documento.
- No hay presencia server-side ni expulsión automática. Si un jugador cierra la pestaña sin salir, el otro puede salir y crear otra sala.
- Para una competencia con validación totalmente server-side haría falta Cloud Functions o un backend propio.

## Limitaciones actuales

Las reglas protegen el rol de administrador, los avisos y los rankings, pero **totopos, vidas, progreso, categorías, avatares, logros, repaso y reto diario todavía se escriben desde el cliente**. Un usuario con conocimientos técnicos podría modificar su propio saldo o progreso.

Para una integridad total habría que mover esas operaciones a Cloud Functions o a un backend propio, por ejemplo:

- `abonarTotopos`
- `comprarAvatar`
- `desbloquearCategoria`
- `guardarRecord`
- `guardarRankingReto`
- `desbloquearLogro`

Mientras eso no exista, las reglas validan tipos y evitan valores negativos, pero no pueden demostrar que un premio, una compra o un puntaje de ranking sean legítimos. El ranking diario del reto, en particular, recibe los aciertos reportados por el cliente.

Las sugerencias aceptan escrituras públicas con validación de longitud y tipo, pero no tienen limitación de frecuencia ni verificación de identidad. Si el volumen crece, conviene añadir App Check o un Cloud Function con límite por IP/usuario.

La auditoría de `admin_logs` también se escribe desde el cliente. Un administrador comprometido podría omitir el registro; para no repudio real habría que mover las acciones administrativas a Cloud Functions.

Además:

- La protección del “último administrador” es del cliente; las reglas permiten a un administrador con custom claim cambiar roles. Para una garantía total haría falta una Cloud Function con validación server-side.
- El límite de 10 000 totopos por regalo también es del cliente; las reglas solo validan que el saldo no sea negativo.
- Los totopos, compras y recompensas siguen siendo client-side. Sin Cloud Functions no se puede demostrar su legitimidad.
- No hay borrado/desactivación de cuentas desde el panel. Eliminar un usuario de Firestore no elimina su cuenta de Firebase Auth ni sus subcolecciones.
- La lista de usuarios se pagina por correo; la búsqueda por nombre es por prefijo y distingue mayúsculas.
- Los rankings del panel cargan 100 registros por página; la exportación completa se detiene en 2000 registros para no agotar la cuota gratuita.
- El renombrado de rankings solo puede cambiar el nombre visible; no corrige puntajes ni niveles. Esas anomalías se detectan y se deben borrar.
- La programación de avisos y la detección de duplicados de sugerencias se evalúan en el cliente; un cambio de reloj puede adelantar o retrasar la visibilidad.
- Las acciones masivas de sugerencias y el restablecimiento de contraseña quedan auditados, pero dependen del cliente.
- La compactación de rankings agrupa por nombre visible. Si dos personas distintas usan el mismo nombre, se consideran un solo jugador; el panel muestra una vista previa antes de eliminar y la acción queda auditada.
- El récord de cada jugador se conserva por juego. Si en el futuro se quieren récords por nivel o temporadas, conviene guardarlos en una subcolección aparte para no volver a llenar la tabla global.

## Recomendaciones adicionales

- Activar **Firebase App Check** con reCAPTCHA Enterprise para reducir abuso desde clientes no autorizados.
- Restringir la API key de Firebase por dominios permitidos en Google Cloud.
- No publicar reglas permisivas de prueba (`allow read, write: if true`).
- Revisar periódicamente los usuarios con `role: "admin"` y los registros de ranking.
