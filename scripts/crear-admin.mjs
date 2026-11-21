// Asigna o quita el custom claim `admin` a un usuario de Firebase Auth.
// Uso:
//   npm run admin:claim -- ruta/al/serviceAccount.json UID_DEL_USUARIO
//   npm run admin:claim -- ruta/al/serviceAccount.json UID_DEL_USUARIO quitar

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [rutaCuenta, uid, accion] = process.argv.slice(2);

if (!rutaCuenta || !uid) {
    console.error('Uso: npm run admin:claim -- <serviceAccount.json> <UID> [quitar]');
    process.exit(1);
}

const cuenta = JSON.parse(readFileSync(rutaCuenta, 'utf8'));

initializeApp({
    credential: cert(cuenta),
    projectId: cuenta.project_id || 'bidxaga-saa',
});

try {
    await getAuth().setCustomUserClaims(uid, { admin: accion !== 'quitar' });
    console.log(
        accion === 'quitar'
            ? `Custom claim admin retirado a ${uid}.`
            : `Custom claim admin asignado a ${uid}.`
    );
    console.log('Cierra sesión y vuelve a entrar en la app para refrescar el token.');
} catch (error) {
    console.error('No se pudo actualizar el custom claim:', error);
    process.exit(1);
}
