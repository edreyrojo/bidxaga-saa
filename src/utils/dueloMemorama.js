import { listaAnimales } from '../data/animales.js';
import { listaFlora } from '../data/flora.js';

export const PAREJAS_DUELO = 8;
export const DURACION_TURNO_MS = 30000;
export const DURACION_SALA_MS = 2 * 60 * 60 * 1000;

export const MODOS_DUELO = {
    RAPIDA: 'rapida',
    RELAJADA: 'relajada',
};

export const esModoValido = (modo) => Object.values(MODOS_DUELO).includes(modo);

export const siguienteJugador = (orden = [], turno) => (
    orden.find((uid) => uid !== turno) || orden[0] || null
);

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const normalizarCodigo = (texto) => String(texto || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

export const generarCodigoSala = () => {
    let codigo = '';
    for (let i = 0; i < 6; i += 1) {
        codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
    }
    return codigo;
};

export const mezclarCartas = (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
};

/**
 * Crea un mazo compartido de parejas imagen + palabra.
 * El mazo se genera una sola vez en el cliente anfitrión y se guarda en Firestore.
 */
export const crearMazoDuelo = (parejas = PAREJAS_DUELO) => {
    const pool = [
        ...listaAnimales.map((item) => ({ ...item, tipo: 'fauna', pairKey: `fauna-${item.id}` })),
        ...listaFlora.map((item) => ({ ...item, tipo: 'flora', pairKey: `flora-${item.id}` })),
    ];

    const seleccionados = mezclarCartas(pool).slice(0, Math.min(parejas, pool.length));
    const cartas = [];

    seleccionados.forEach((item) => {
        cartas.push({
            id: `img-${item.pairKey}`,
            pairId: item.pairKey,
            type: 'image',
            content: item.image,
            label: item.spanish,
            matched: false,
        });
        cartas.push({
            id: `word-${item.pairKey}`,
            pairId: item.pairKey,
            type: 'word',
            content: item.diidxaza,
            label: item.spanish,
            matched: false,
        });
    });

    return mezclarCartas(cartas);
};

export const calcularGanador = (puntajes = {}, orden = []) => {
    const jugadores = orden.length > 0 ? orden : Object.keys(puntajes || {});
    if (jugadores.length < 2) return 'empate';

    const [primero, segundo] = jugadores;
    const puntosPrimero = Number(puntajes?.[primero]) || 0;
    const puntosSegundo = Number(puntajes?.[segundo]) || 0;

    if (puntosPrimero === puntosSegundo) return 'empate';
    return puntosPrimero > puntosSegundo ? primero : segundo;
};
