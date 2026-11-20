// 🏆 Catálogo central de logros.
// Las condiciones se evalúan en cada juego y se guardan en
// usuarios/{uid}.logrosDesbloqueados.
export const CATALOGO_LOGROS = [
    {
        id: 'logro_memoria_1',
        juego: 'Memorama',
        nombre: 'Memoria de Rayo',
        desc: 'Completa cualquier nivel de Memorama sin fallar.',
        emoji: '🧠'
    },
    {
        id: 'logro_crucigrama_5',
        juego: 'Crucigrama',
        nombre: 'Erudito del Crucigrama',
        desc: 'Alcanza el Nivel 5 o superior en Crucigrama.',
        emoji: '🧩'
    },
    {
        id: 'logro_sopa_10',
        juego: 'Sopa de Letras',
        nombre: 'Ojo de Águila',
        desc: 'Llega al Nivel 10 en Sopa de Letras.',
        emoji: '🔍'
    },
    {
        id: 'logro_trivia_maestro',
        juego: 'Trivia',
        nombre: 'Sabio Zapoteco',
        desc: 'Termina un nivel de Trivia en Modo Difícil sin errores.',
        emoji: '🌟'
    }
];

export const buscarLogro = (id) => CATALOGO_LOGROS.find((logro) => logro.id === id) || null;
