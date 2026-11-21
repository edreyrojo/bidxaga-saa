const numero = (valor) => Number(valor) || 0;

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
        ));
    }

    return copia.sort((a, b) => {
        const nivel = numero(b.level ?? b.nivel) - numero(a.level ?? a.nivel);
        if (nivel !== 0) return nivel;

        if (juego === 'memorama') {
            const score = numero(b.score) - numero(a.score);
            if (score !== 0) return score;
            return numero(a.turnos ?? a.turns) - numero(b.turnos ?? b.turns);
        }

        if (juego === 'trivia') {
            return numero(a.errores) - numero(b.errores);
        }

        return numero(a.intentos) - numero(b.intentos);
    });
};
