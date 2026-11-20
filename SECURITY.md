# Seguridad de Bidxaga Saa

Este proyecto ya incluye reglas de Firestore en `firestore.rules` y configuración de Firebase CLI en `firebase.json` / `.firebaserc`.

## Qué protegen las reglas

- Cada usuario solo puede leer y editar su propio documento `usuarios/{uid}`.
- Un usuario **no puede cambiarse el rol, el correo ni la fecha de creación**.
- Solo un administrador puede listar todos los usuarios y crear/editar/eliminar avisos.
- Los rankings son públicos para lectura, pero solo se pueden escribir con una sesión autenticada y únicamente en el documento del propio usuario.
- Los récords deben incluir `completado: true` y puntajes válidos:
  - Memorama: `score > 0`.
  - Sopa y Crucigrama: `intentos > 0`.
  - Trivia: `errores >= 0`.
- Los invitados ya no guardan récords globales; conservan su progreso local y se les pide iniciar sesión.

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

## Limitaciones actuales

Las reglas protegen el rol de administrador, los avisos y los rankings, pero **totopos, vidas, progreso, categorías, avatares y logros todavía se escriben desde el cliente**. Un usuario con conocimientos técnicos podría modificar su propio saldo o progreso.

Para una integridad total habría que mover esas operaciones a Cloud Functions o a un backend propio, por ejemplo:

- `abonarTotopos`
- `comprarAvatar`
- `desbloquearCategoria`
- `guardarRecord`
- `desbloquearLogro`

Mientras eso no exista, las reglas validan tipos y evitan valores negativos, pero no pueden demostrar que un premio o una compra sean legítimos.

## Recomendaciones adicionales

- Activar **Firebase App Check** con reCAPTCHA Enterprise para reducir abuso desde clientes no autorizados.
- Restringir la API key de Firebase por dominios permitidos en Google Cloud.
- No publicar reglas permisivas de prueba (`allow read, write: if true`).
- Revisar periódicamente los usuarios con `role: "admin"` y los registros de ranking.
