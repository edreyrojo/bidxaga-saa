const PREFIJO = 'bidxaga:v1';
const CLAVE_MIGRACION_LEGADO = 'bidxaga:v1:legacyMigrated';
const CLAVE_GUEST_MIGRADO = 'bidxaga:v1:guestMigratedTo';

// Claves que manejaba la versión anterior sin espacio de nombres.
const CLAVES_CONOCIDAS = [
    'totopos',
    'totoposHistoricos',
    'tipoContenidoJuego',
    'categoriasFaunaDesbloqueadas',
    'categoriasFloraDesbloqueadas',
    'memoramaNivel',
    'memoramaModoDificil',
    'memoramaPlayerName',
    'memoramaVidas',
    'memoramaCategoriasFaunaActivas',
    'memoramaCategoriasFloraActivas',
    'triviaNivel',
    'triviaErrores',
    'triviaModoDificil',
    'triviaPlayerName',
    'triviaVidas',
    'triviaCategoriasFaunaActivas',
    'sopaLetrasNivel',
    'sopaLetrasIntentos',
    'sopaLetrasVidas',
    'sopaLetrasModoDificil',
    'sopaLetrasPlayerName',
    'sopaLetrasCategoriasFaunaActivas',
    'sopaLetrasCategoriasFloraActivas',
    'crucigramaNivel',
    'crucigramaIntentos',
    'crucigramaVidas',
    'crucigramaModoDificil',
    'crucigramaPlayerName',
    'crucigramaCategoriasFaunaActivas',
    'crucigramaCategoriasFloraActivas'
];

let scopeActual = 'guest';

const existe = (clave) => {
    try {
        return localStorage.getItem(clave) !== null;
    } catch {
        return false;
    }
};

const leerCrudo = (clave) => {
    try {
        return localStorage.getItem(clave);
    } catch {
        return null;
    }
};

const escribirCrudo = (clave, valor) => {
    try {
        localStorage.setItem(clave, valor);
    } catch {
        // Sin localStorage: la app sigue funcionando en memoria.
    }
};

const borrarCrudo = (clave) => {
    try {
        localStorage.removeItem(clave);
    } catch {
        // Ignorado.
    }
};

const claveDe = (clave, scope = scopeActual) => `${PREFIJO}:${scope}:${clave}`;
const claveGuest = (clave) => claveDe(clave, 'guest');
const claveUsuario = (uid, clave) => claveDe(clave, `user:${uid}`);

const copiarSiFalta = (origen, destino) => {
    if (!existe(destino) && existe(origen)) {
        const valor = leerCrudo(origen);
        if (valor !== null) escribirCrudo(destino, valor);
    }
};

/** Migra las claves globales antiguas al espacio de nombres actual. */
const migrarLegado = () => {
    if (existe(CLAVE_MIGRACION_LEGADO)) return;

    CLAVES_CONOCIDAS.forEach((clave) => {
        copiarSiFalta(clave, claveDe(clave));
    });

    escribirCrudo(CLAVE_MIGRACION_LEGADO, 'true');
};

/**
 * Copia el progreso de invitado al usuario, una sola vez por uid.
 * No borra el progreso de invitado para que se pueda seguir usando en modo invitado.
 */
const copiarGuestAUsuario = (uid) => {
    const yaMigradoA = leerCrudo(CLAVE_GUEST_MIGRADO);
    if (yaMigradoA === uid) return;
    if (yaMigradoA && yaMigradoA !== uid) {
        // El progreso de invitado ya se asignó a otra cuenta en este dispositivo.
        return;
    }

    CLAVES_CONOCIDAS.forEach((clave) => {
        copiarSiFalta(claveGuest(clave), claveUsuario(uid, clave));
    });

    // Timestamps de progreso por juego, si existen.
    ['memorama', 'trivia', 'sopa', 'crucigrama'].forEach((juego) => {
        const claveTs = `progreso_${juego}_actualizadoEn`;
        copiarSiFalta(claveGuest(claveTs), claveUsuario(uid, claveTs));
    });

    escribirCrudo(CLAVE_GUEST_MIGRADO, uid);
};

export const configurarScope = (user) => {
    const nuevoScope = user?.uid ? `user:${user.uid}` : 'guest';
    const anterior = scopeActual;
    scopeActual = nuevoScope;

    migrarLegado();

    if (user?.uid && anterior === 'guest') {
        copiarGuestAUsuario(user.uid);
    }
};

export const obtenerScopeActual = () => scopeActual;

export const almacen = {
    getItem(clave) {
        return leerCrudo(claveDe(clave));
    },
    setItem(clave, valor) {
        escribirCrudo(claveDe(clave), String(valor));
    },
    removeItem(clave) {
        borrarCrudo(claveDe(clave));
    }
};

// Utilidades para la migración de invitado desde servicios/hooks.
export const leerInvitado = (clave) => leerCrudo(claveGuest(clave));
export const borrarInvitado = (clave) => borrarCrudo(claveGuest(clave));
export const leerUsuario = (uid, clave) => leerCrudo(claveUsuario(uid, clave));
export const escribirUsuario = (uid, clave, valor) => escribirCrudo(claveUsuario(uid, clave), String(valor));
export const CLAVES_PROGRESO = CLAVES_CONOCIDAS;
