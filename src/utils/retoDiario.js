import { listaAnimales } from '../data/animales.js';
import { listaFlora } from '../data/flora.js';
import { fechaAnterior, obtenerFechaLocal } from './fechas.js';

export { fechaAnterior, obtenerFechaLocal };

const TOTAL_PREGUNTAS = 5;

const TODAS_LAS_PALABRAS = [
    ...listaAnimales.map((item) => ({ ...item, tipo: 'fauna' })),
    ...listaFlora.map((item) => ({ ...item, tipo: 'flora' })),
];

export const calcularRecompensa = (aciertos) => {
    if (aciertos >= 5) return 50;
    if (aciertos === 4) return 30;
    if (aciertos === 3) return 15;
    if (aciertos === 2) return 8;
    return 5;
};

export const calcularRacha = (racha, hoy) => {
    const dias = Math.max(0, Number(racha?.dias) || 0);

    if (!racha?.ultimoDia) return { dias: 1, ultimoDia: hoy };
    if (racha.ultimoDia === hoy) return { dias: Math.max(1, dias), ultimoDia: hoy };
    if (racha.ultimoDia === fechaAnterior(hoy)) return { dias: dias + 1, ultimoDia: hoy };

    return { dias: 1, ultimoDia: hoy };
};

export const rachaVigente = (racha, hoy) => {
    if (!racha?.ultimoDia) return 0;
    if (racha.ultimoDia === hoy || racha.ultimoDia === fechaAnterior(hoy)) {
        return Math.max(0, Number(racha.dias) || 0);
    }
    return 0;
};

const hashFecha = (texto) => {
    let hash = 2166136261;
    for (let i = 0; i < texto.length; i += 1) {
        hash ^= texto.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

// Generador pseudoaleatorio determinista: el mismo día produce el mismo reto.
const crearAzar = (semilla) => {
    let estado = semilla >>> 0;
    return () => {
        estado += 0x6d2b79f5;
        let valor = estado;
        valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
        valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
        return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
    };
};

const mezclar = (lista, azar) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(azar() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
};

const crearOpciones = (objetivo, campo, azar) => {
    const delMismoTipo = TODAS_LAS_PALABRAS.filter(
        (item) => item.tipo === objetivo.tipo && !(item.id === objetivo.id && item.tipo === objetivo.tipo)
    );

    const valores = new Set([objetivo[campo]]);
    const opciones = [objetivo[campo]];

    for (const item of mezclar(delMismoTipo, azar)) {
        if (!valores.has(item[campo])) {
            valores.add(item[campo]);
            opciones.push(item[campo]);
        }
        if (opciones.length === 4) break;
    }

    return mezclar(opciones, azar);
};

/**
 * Reto diario determinista: todas las personas reciben las mismas preguntas
 * durante el mismo día. Alterna preguntas de español a diidxazá y viceversa.
 */
export const generarRetoDiario = (fecha = obtenerFechaLocal()) => {
    const azar = crearAzar(hashFecha(fecha));
    const seleccionados = mezclar(TODAS_LAS_PALABRAS, azar).slice(0, TOTAL_PREGUNTAS);

    return seleccionados.map((objetivo, indice) => {
        const aDiidxaza = indice % 2 === 0;
        const campo = aDiidxaza ? 'diidxaza' : 'spanish';

        return {
            id: `${objetivo.tipo}:${objetivo.id}`,
            tipo: objetivo.tipo,
            objetivo,
            direccion: aDiidxaza ? 'aDiidxaza' : 'aSpanish',
            pregunta: aDiidxaza
                ? `¿Cómo se dice «${objetivo.spanish}» en diidxazá?`
                : `¿Qué significa «${objetivo.diidxaza}»?`,
            opciones: crearOpciones(objetivo, campo, azar),
            correcta: objetivo[campo],
            diidxaza: objetivo.diidxaza,
            spanish: objetivo.spanish,
            image: objetivo.image,
            categoria: objetivo.categoria,
        };
    });
};

/**
 * Palabra del día: determinista y distinta de las preguntas del reto.
 */
export const generarPalabraDelDia = (fecha = obtenerFechaLocal()) => {
    const azar = crearAzar(hashFecha(`palabra-del-dia-${fecha}`));
    const [objetivo] = mezclar(TODAS_LAS_PALABRAS, azar);

    return {
        fecha,
        tipo: objetivo.tipo,
        id: objetivo.id,
        diidxaza: objetivo.diidxaza,
        spanish: objetivo.spanish,
        image: objetivo.image,
        categoria: objetivo.categoria,
    };
};

/**
 * Elige el reto local o el de la nube. Da prioridad al reto de hoy y,
 * si ambos son del mismo día, al que se completó más tarde.
 */
export const fusionarReto = (local, nube, hoy = obtenerFechaLocal()) => {
    if (!nube) return { reto: local || null, subir: Boolean(local) };
    if (!local) return { reto: nube, subir: false };

    const localEsHoy = local.fecha === hoy;
    const nubeEsHoy = nube.fecha === hoy;
    if (localEsHoy !== nubeEsHoy) {
        return { reto: localEsHoy ? local : nube, subir: localEsHoy };
    }

    if ((local.fecha || '') !== (nube.fecha || '')) {
        const localMasReciente = (local.fecha || '') > (nube.fecha || '');
        return { reto: localMasReciente ? local : nube, subir: localMasReciente };
    }

    if ((local.completadoEn || 0) > (nube.completadoEn || 0)) {
        return { reto: local, subir: true };
    }
    if ((local.completadoEn || 0) < (nube.completadoEn || 0)) {
        return { reto: nube, subir: false };
    }

    return { reto: local, subir: false };
};

/** Conserva la racha con el último día más reciente y, si empatan, la mayor. */
export const fusionarRacha = (local, nube) => {
    if (!nube) return { racha: local || null, subir: Boolean(local) };
    if (!local) return { racha: nube, subir: false };

    if ((local.ultimoDia || '') !== (nube.ultimoDia || '')) {
        const localMasReciente = (local.ultimoDia || '') > (nube.ultimoDia || '');
        return { racha: localMasReciente ? local : nube, subir: localMasReciente };
    }

    if ((local.dias || 0) > (nube.dias || 0)) return { racha: local, subir: true };
    if ((local.dias || 0) < (nube.dias || 0)) return { racha: nube, subir: false };
    return { racha: local, subir: false };
};
