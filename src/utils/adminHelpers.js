/**
 * Helpers de apoyo para el panel de administración.
 * Se mantienen fuera de los componentes para poder probarlos con Node.
 */

export const esAnomaliaRanking = (registro, juego) => {
    if (!registro?.id) return true;

    if (juego === 'reto') {
        const aciertos = Number(registro.aciertos);
        const total = Number(registro.total);
        return !Number.isFinite(aciertos) || !Number.isFinite(total)
            || aciertos < 0 || total <= 0 || aciertos > total;
    }

    const nivel = Number(registro.level ?? registro.nivel);
    if (!Number.isFinite(nivel) || nivel < 1) return true;

    if (juego === 'memorama') {
        return !Number.isFinite(Number(registro.score)) || Number(registro.score) <= 0;
    }
    if (juego === 'trivia') {
        return !Number.isFinite(Number(registro.errores)) || Number(registro.errores) < 0;
    }
    return !Number.isFinite(Number(registro.intentos)) || Number(registro.intentos) <= 0;
};

export const normalizarPalabraSugerida = (palabra) => String(palabra || '').trim().toLowerCase();

/**
 * Devuelve los ids de sugerencias cuya palabra se repite en la lista cargada.
 */
export const detectarSugerenciasDuplicadas = (sugerencias = []) => {
    const grupos = new Map();

    sugerencias.forEach((sugerencia) => {
        const clave = normalizarPalabraSugerida(sugerencia.palabra);
        if (!clave) return;
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave).push(sugerencia);
    });

    const repetidas = new Set();
    grupos.forEach((grupo) => {
        if (grupo.length > 1) {
            grupo.forEach((sugerencia) => repetidas.add(sugerencia.id));
        }
    });

    return repetidas;
};
