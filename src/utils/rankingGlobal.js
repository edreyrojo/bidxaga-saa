import { ordenarRegistros } from './ordenRankings.js';

const numero = (valor) => {
    const resultado = Number(valor);
    return Number.isFinite(resultado) ? resultado : 0;
};

export const normalizarNombreRanking = (nombre) => String(nombre ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/**
 * Identidad visible del jugador. Mientras existan documentos antiguos sin UID,
 * se agrupa por nombre para que la tabla no repita a la misma persona.
 */
export const claveJugadorRanking = (registro) => {
    const nombre = normalizarNombreRanking(registro?.name ?? registro?.nombre);
    if (nombre) return `nombre:${nombre}`;
    const uid = registro?.uid || registro?.id;
    return uid ? `uid:${uid}` : 'anonimo';
};

export const esRegistroRankingValido = (registro, juego) => {
    if (!registro) return false;

    if (juego === 'reto') {
        const aciertos = numero(registro.aciertos);
        const total = numero(registro.total);
        return total > 0 && aciertos >= 0 && aciertos <= total;
    }

    const nivel = numero(registro.level ?? registro.nivel);
    if (nivel < 1) return false;
    if (registro.completado === false) return false;

    if (juego === 'memorama') return numero(registro.score) > 0;
    if (juego === 'trivia') return numero(registro.errores) >= 0;
    return numero(registro.intentos) > 0;
};

const turnosMemorama = (registro) => numero(registro.turnos ?? registro.turns ?? registro.score);

/**
 * Devuelve true si `candidato` es mejor que `actual` para el mismo jugador.
 */
export const esMejorRegistroRanking = (candidato, actual, juego) => {
    if (!actual) return true;

    if (juego === 'reto') {
        const ratio = (registro) => {
            const total = numero(registro.total);
            return total > 0 ? numero(registro.aciertos) / total : 0;
        };
        const diferenciaRatio = ratio(candidato) - ratio(actual);
        if (diferenciaRatio !== 0) return diferenciaRatio > 0;

        const diferenciaRacha = numero(candidato.racha) - numero(actual.racha);
        if (diferenciaRacha !== 0) return diferenciaRacha > 0;

        return numero(candidato.completadoEn) < numero(actual.completadoEn);
    }

    const nivelCandidato = numero(candidato.level ?? candidato.nivel);
    const nivelActual = numero(actual.level ?? actual.nivel);
    if (nivelCandidato !== nivelActual) return nivelCandidato > nivelActual;

    if (juego === 'memorama') {
        const turnosCandidato = turnosMemorama(candidato);
        const turnosActual = turnosMemorama(actual);
        if (turnosCandidato !== turnosActual) return turnosCandidato < turnosActual;
        return numero(candidato.turnos ?? candidato.turns) < numero(actual.turnos ?? actual.turns);
    }

    if (juego === 'trivia') {
        return numero(candidato.errores) < numero(actual.errores);
    }

    // Sopa y crucigrama: menos intentos es mejor.
    return numero(candidato.intentos) < numero(actual.intentos);
};

/**
 * Conserva un solo registro por jugador (el mejor) y lo ordena para la tabla.
 */
export const deduplicarRanking = (registros = [], juego) => {
    const mejores = new Map();

    registros.forEach((registro) => {
        if (!esRegistroRankingValido(registro, juego)) return;

        const clave = claveJugadorRanking(registro);
        const actual = mejores.get(clave);

        if (!actual || esMejorRegistroRanking(registro, actual, juego)) {
            mejores.set(clave, registro);
        }
    });

    return ordenarRegistros([...mejores.values()], juego);
};

export const prepararRankingGlobal = (registros = [], juego, limite = 10) => (
    deduplicarRanking(registros, juego).slice(0, limite)
);

/**
 * Devuelve los grupos que tienen más de un documento y los que se conservarían.
 * Se usa en la herramienta de limpieza del panel.
 */
export const analizarDuplicadosRanking = (registros = [], juego) => {
    const grupos = new Map();

    registros.forEach((registro) => {
        const clave = claveJugadorRanking(registro);
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave).push(registro);
    });

    const conservar = [];
    const eliminar = [];
    const sinValidos = [];
    const duplicados = [];

    grupos.forEach((items, clave) => {
        const validos = items.filter((registro) => esRegistroRankingValido(registro, juego));

        if (validos.length === 0) {
            sinValidos.push({ clave, total: items.length });
            return;
        }

        const mejor = validos.reduce(
            (actual, registro) => (esMejorRegistroRanking(registro, actual, juego) ? registro : actual),
            validos[0]
        );

        conservar.push(mejor);

        const sobrantes = items.filter((registro) => registro.id !== mejor.id);
        eliminar.push(...sobrantes);

        if (items.length > 1) {
            duplicados.push({
                clave,
                nombre: mejor.name || mejor.nombre || 'Anónimo',
                total: items.length,
                conservado: mejor.id,
                eliminados: sobrantes.map((registro) => registro.id),
            });
        }
    });

    return {
        total: registros.length,
        grupos: grupos.size,
        conservar,
        eliminar,
        sinValidos,
        duplicados,
    };
};
