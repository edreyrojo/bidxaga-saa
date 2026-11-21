// 🏆 Catálogo central de logros.
// Las condiciones se evalúan en cada juego y se guardan en
// usuarios/{uid}.logrosDesbloqueados.
export const CATALOGO_LOGROS = [
    {
        id: 'logro_memoria_1',
        juego: 'Memorama',
        nombre: 'Memoria de Rayo',
        desc: 'Completa cualquier nivel de Memorama sin fallar.',
        icono: 'brain'
    },
    {
        id: 'logro_crucigrama_5',
        juego: 'Crucigrama',
        nombre: 'Erudito del Crucigrama',
        desc: 'Alcanza el Nivel 5 o superior en Crucigrama.',
        icono: 'puzzle'
    },
    {
        id: 'logro_sopa_10',
        juego: 'Sopa de Letras',
        nombre: 'Ojo de Águila',
        desc: 'Llega al Nivel 10 en Sopa de Letras.',
        icono: 'search'
    },
    {
        id: 'logro_trivia_maestro',
        juego: 'Trivia',
        nombre: 'Sabio Zapoteco',
        desc: 'Termina un nivel de Trivia en Modo Difícil sin errores.',
        icono: 'star'
    },
    {
        id: 'logro_reto_diario',
        juego: 'Reto Diario',
        nombre: 'Constancia Istmeña',
        desc: 'Completa tu primer reto diario.',
        icono: 'flame'
    },
    {
        id: 'logro_racha_7',
        juego: 'Reto Diario',
        nombre: 'Semana Zapoteca',
        desc: 'Completa el reto diario 7 días seguidos.',
        icono: 'calendar'
    },
    {
        id: 'logro_racha_30',
        juego: 'Reto Diario',
        nombre: 'Luna Completa',
        desc: 'Completa el reto diario 30 días seguidos.',
        icono: 'moon'
    }
];

export const buscarLogro = (id) => CATALOGO_LOGROS.find((logro) => logro.id === id) || null;
