const numero = (valor) => Number(valor) || 0;
const nombre = (registro) => String(registro.name ?? registro.nombre ?? '').toLowerCase();

/**
 * Ordena registros de ranking según las reglas de cada juego.
 * Se usa tanto en el panel admin como en las pruebas.
 */
export const ordenarRegistros = (registros, juego) => {
    const copia = [...registros];

    if (juego === 'reto') {
        return copia.sort((a, b) => (
            numero(b.aciertos) - numero(a.aciertos)
            || numero(b.racha) - numero(a.racha)
            || numero(a.completadoEn) - numero(b.completadoEn)
            || nombre(a).localeCompare(nombre(b))
        ));
    }

    return copia.sort((a, b) => {
        const nivel = numero(b.level ?? b.nivel) - numero(a.level ?? a.nivel);
        if (nivel !== 0) return nivel;

        if (juego === 'memorama') {
            // En Memorama `score` guarda los turnos: menos turnos es mejor.
            const score = numero(a.score) - numero(b.score);
            if (score !== 0) return score;
            const turnos = numero(a.turnos ?? a.turns) - numero(b.turnos ?? b.turns);
            if (turnos !== 0) return turnos;
            return nombre(a).localeCompare(nombre(b));
        }

        if (juego === 'trivia') {
            return numero(a.errores) - numero(b.errores) || nombre(a).localeCompare(nombre(b));
        }

        return numero(a.intentos) - numero(b.intentos) || nombre(a).localeCompare(nombre(b));
    });
};
