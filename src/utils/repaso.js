import { almacen } from './almacen.js';

const CLAVE = 'repasoPalabras';
const CLAVE_BORRADO = 'repasoBorradoEn';
const EVENTO = 'bidxaga:repaso-actualizado';
const DIA_MS = 24 * 60 * 60 * 1000;

// Sistema Leitner: cada caja indica en cuántos días volverá a aparecer la palabra.
const DIAS_POR_CAJA = [0, 1, 3, 7, 14, 30];
const CAJA_MAXIMA = DIAS_POR_CAJA.length - 1;

const leerTodo = () => {
    try {
        const crudo = almacen.getItem(CLAVE);
        if (!crudo) return {};
        const datos = JSON.parse(crudo);
        return datos && typeof datos === 'object' ? datos : {};
    } catch {
        return {};
    }
};

const guardarTodo = (datos) => {
    try {
        almacen.setItem(CLAVE, JSON.stringify(datos));
        window.dispatchEvent(new CustomEvent(EVENTO));
    } catch {
        // Sin almacenamiento la app sigue funcionando; solo no persiste el repaso.
    }
};

const puedeSincronizarNube = () => typeof window !== 'undefined' && !globalThis.__BIDXAGA_SIN_NUBE__;

const publicarEnNube = (clave, registro) => {
    if (!puedeSincronizarNube()) return;

    import('./repasoNube.js')
        .then(({ subirRegistroRepaso }) => subirRegistroRepaso(clave, registro))
        .catch(() => {
            // Sin conexión o sin sesión: el registro queda guardado localmente.
        });
};

export const claveRepaso = (tipo, id) => `${tipo}:${id}`;

/**
 * Guarda el resultado de una palabra.
 * @param {{tipo: string, id: number|string, palabra?: string, spanish?: string}} item
 * @param {boolean} correcto
 */
export const registrarRespuesta = (item, correcto) => {
    if (!item || item.id === undefined || item.id === null) return;

    const tipo = item.tipo || 'fauna';
    const clave = claveRepaso(tipo, item.id);
    const datos = leerTodo();
    const ahora = Date.now();
    const previo = datos[clave] || {
        aciertos: 0,
        errores: 0,
        caja: 0,
        racha: 0,
    };

    const caja = correcto
        ? Math.min((previo.caja || 0) + 1, CAJA_MAXIMA)
        : 0;

    datos[clave] = {
        tipo,
        id: item.id,
        palabra: item.palabra || previo.palabra || '',
        spanish: item.spanish || previo.spanish || '',
        aciertos: (previo.aciertos || 0) + (correcto ? 1 : 0),
        errores: (previo.errores || 0) + (correcto ? 0 : 1),
        caja,
        racha: correcto ? (previo.racha || 0) + 1 : 0,
        ultimaVez: ahora,
        proximoRepaso: ahora + DIAS_POR_CAJA[caja] * DIA_MS,
    };

    guardarTodo(datos);
    publicarEnNube(clave, datos[clave]);
};

export const obtenerRegistro = (clave) => leerTodo()[clave] || null;

export const estaPendiente = (registro, ahora = Date.now()) => {
    if (!registro) return true;
    return (registro.proximoRepaso || 0) <= ahora;
};

/**
 * Peso de una palabra para elegirla en el siguiente nivel.
 * Las palabras nuevas y las que toca repasar aparecen más seguido.
 */
export const pesoRepaso = (clave, ahora = Date.now()) => {
    const registro = leerTodo()[clave];
    if (!registro) return 2.2;

    const pendiente = estaPendiente(registro, ahora);
    let peso = pendiente ? 2.8 : 0.7;
    peso += Math.min(registro.errores || 0, 8) * 0.35;
    peso -= Math.min(registro.racha || 0, 8) * 0.1;

    return Math.max(0.35, peso);
};

/**
 * Elige `cantidad` elementos de la lista dando prioridad a:
 * 1. Palabras que ya toca repasar.
 * 2. Palabras con más errores acumulados.
 * 3. Palabras nuevas (para que se vayan presentando).
 */
export const seleccionarConRepaso = (lista, cantidad, tipo, obtenerId = (item) => item.id) => {
    const disponibles = [...lista];
    const elegidos = [];
    const limite = Math.min(cantidad, disponibles.length);

    while (elegidos.length < limite && disponibles.length > 0) {
        const pesos = disponibles.map((item) => pesoRepaso(claveRepaso(tipo, obtenerId(item))));
        const total = pesos.reduce((suma, peso) => suma + peso, 0);

        let indice = disponibles.length - 1;
        if (total > 0) {
            let objetivo = Math.random() * total;
            for (let i = 0; i < disponibles.length; i++) {
                objetivo -= pesos[i];
                if (objetivo <= 0) {
                    indice = i;
                    break;
                }
            }
        }

        elegidos.push(disponibles.splice(indice, 1)[0]);
    }

    return elegidos;
};

export const obtenerResumenRepaso = (ahora = Date.now()) => {
    const datos = leerTodo();
    const registros = Object.entries(datos).map(([clave, registro]) => ({ clave, ...registro }));

    const pendientes = registros.filter((registro) => estaPendiente(registro, ahora));
    const dominadas = registros.filter((registro) => (registro.caja || 0) >= 4);

    const palabras = [...registros].sort((a, b) => {
        const pendienteA = estaPendiente(a, ahora) ? 1 : 0;
        const pendienteB = estaPendiente(b, ahora) ? 1 : 0;
        if (pendienteA !== pendienteB) return pendienteB - pendienteA;
        if ((b.errores || 0) !== (a.errores || 0)) return (b.errores || 0) - (a.errores || 0);
        return (b.ultimaVez || 0) - (a.ultimaVez || 0);
    });

    return {
        total: registros.length,
        pendientes: pendientes.length,
        dominadas: dominadas.length,
        errores: registros.reduce((suma, registro) => suma + (registro.errores || 0), 0),
        palabras,
    };
};

export const obtenerBorradoEn = () => Number(almacen.getItem(CLAVE_BORRADO) || 0);

export const borrarRepaso = () => {
    const borradoEn = Date.now();
    almacen.setItem(CLAVE_BORRADO, String(borradoEn));
    almacen.removeItem(CLAVE);
    try {
        window.dispatchEvent(new CustomEvent(EVENTO));
    } catch {
        // Ignorado.
    }

    if (puedeSincronizarNube()) {
        import('./repasoNube.js')
            .then(({ borrarRepasoRemoto }) => borrarRepasoRemoto(borradoEn))
            .then(() => {
                // Si la nube se limpió, ya no hace falta el marcador local.
                if (Number(almacen.getItem(CLAVE_BORRADO)) === borradoEn) {
                    almacen.removeItem(CLAVE_BORRADO);
                }
            })
            .catch(() => {
                // Sin conexión: el marcador evita que el historial reaparezca.
            });
    }
};

/**
 * Combina los registros descargados de Firestore con los locales.
 * Gana el registro con `ultimaVez` más reciente; los locales más nuevos
 * se devuelven en `subir` para enviarlos a la nube.
 */
export const fusionarRepasoNube = (remotos = []) => {
    const locales = leerTodo();
    const fusionados = { ...locales };
    const remotosPorClave = new Map();
    const borradoEn = Number(almacen.getItem(CLAVE_BORRADO) || 0);

    remotos.forEach((remoto) => {
        if (!remoto || !remoto.clave || remoto.id === undefined || remoto.id === null) return;
        // No revivir palabras que el usuario borró explícitamente.
        if (borradoEn > 0 && (remoto.ultimaVez || 0) <= borradoEn) return;

        remotosPorClave.set(remoto.clave, remoto);

        const local = locales[remoto.clave];
        if (!local || (remoto.ultimaVez || 0) > (local.ultimaVez || 0)) {
            const { clave, ...datos } = remoto;
            fusionados[clave] = datos;
        }
    });

    const subir = [];
    Object.entries(fusionados).forEach(([clave, registro]) => {
        if (borradoEn > 0 && (registro.ultimaVez || 0) <= borradoEn) return;
        const remoto = remotosPorClave.get(clave);
        if (!remoto || (registro.ultimaVez || 0) > (remoto.ultimaVez || 0)) {
            subir.push({ clave, ...registro });
        }
    });

    guardarTodo(fusionados);
    return { fusionados, subir };
};

export const EVENTO_REPASO = EVENTO;
