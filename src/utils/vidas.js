// ❤️ Modelo único de vidas por juego.
// La tienda recarga vidas en TODOS los juegos y cada juego persiste su propio saldo.
export const VIDAS_POR_JUEGO = Object.freeze({
    memorama: { max: 10, inicial: 10, etiqueta: 'Memorama' },
    trivia: { max: 3, inicial: 3, etiqueta: 'Trivia' },
    sopa: { max: 3, inicial: 3, etiqueta: 'Sopa' },
    crucigrama: { max: 5, inicial: 5, etiqueta: 'Crucigrama' }
});

// Claves locales existentes, para no perder el saldo de los usuarios actuales.
export const CLAVES_LOCALES_VIDAS = Object.freeze({
    memorama: 'memoramaVidas',
    trivia: 'triviaVidas',
    sopa: 'sopaLetrasVidas',
    crucigrama: 'crucigramaVidas'
});

const limitar = (valor, max) => Math.min(max, Math.max(0, Math.floor(Number(valor) || 0)));

export const crearVidasIniciales = () => Object.fromEntries(
    Object.entries(VIDAS_POR_JUEGO).map(([juego, config]) => [juego, config.inicial])
);

/**
 * Acepta el formato nuevo ({ memorama: 10, trivia: 3, ... }) y también el
 * formato antiguo (un número global). En el formato antiguo se respeta el
 * saldo sin bajar del valor inicial de cada juego.
 */
export const normalizarVidas = (valor) => {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        return Object.fromEntries(
            Object.entries(VIDAS_POR_JUEGO).map(([juego, config]) => {
                const guardadas = Number(valor[juego]);
                return [juego, Number.isFinite(guardadas) ? limitar(guardadas, config.max) : config.inicial];
            })
        );
    }

    const legado = Number(valor);
    return Object.fromEntries(
        Object.entries(VIDAS_POR_JUEGO).map(([juego, config]) => {
            if (!Number.isFinite(legado)) return [juego, config.inicial];
            return [juego, Math.min(config.max, Math.max(config.inicial, Math.floor(legado)))];
        })
    );
};

export const obtenerVidasJuego = (vidas, juego) => {
    const normalizadas = normalizarVidas(vidas);
    return normalizadas[juego] ?? VIDAS_POR_JUEGO[juego]?.inicial ?? 0;
};

export const actualizarVidasJuego = (vidas, juego, nuevoValor) => {
    const normalizadas = normalizarVidas(vidas);
    const max = VIDAS_POR_JUEGO[juego]?.max;
    if (max === undefined) return normalizadas;
    return { ...normalizadas, [juego]: limitar(nuevoValor, max) };
};

export const agregarVidasATodos = (vidas, cantidad) => {
    const normalizadas = normalizarVidas(vidas);
    const suma = Math.max(0, Math.floor(Number(cantidad) || 0));
    return Object.fromEntries(
        Object.entries(VIDAS_POR_JUEGO).map(([juego, config]) => [
            juego,
            Math.min(config.max, normalizadas[juego] + suma)
        ])
    );
};

export const totalVidas = (vidas) => Object.values(normalizarVidas(vidas))
    .reduce((total, cantidad) => total + cantidad, 0);
