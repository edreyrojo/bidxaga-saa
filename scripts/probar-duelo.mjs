// Pruebas del modo Duelo de Memorama: mazo, código y ganador.
// Ejecutar con: npm run test:duelo

const {
    PAREJAS_DUELO,
    calcularGanador,
    crearMazoDuelo,
    esModoValido,
    normalizarCodigo,
    siguienteJugador,
} = await import('../src/utils/dueloMemorama.js');

let fallos = 0;

const comprobar = (nombre, condicion, detalle = '') => {
    if (condicion) {
        console.log(`  ✅ ${nombre}`);
    } else {
        fallos += 1;
        console.error(`  ❌ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    }
};

console.log('Duelo de Memorama');

comprobar('normaliza un código con espacios y guiones', normalizarCodigo(' ab-c123 ') === 'ABC123');
comprobar('recorta el código a 6 caracteres', normalizarCodigo('ABCDEFG') === 'ABCDEF');
comprobar('ignora caracteres no permitidos', normalizarCodigo('A B_C-1!2') === 'ABC12');

const mazo = crearMazoDuelo(PAREJAS_DUELO);
comprobar('el mazo tiene 16 cartas para 8 parejas', mazo.length === 16);
comprobar('hay 8 parejas distintas', new Set(mazo.map((c) => c.pairId)).size === 8);
comprobar('cada pareja tiene imagen y palabra', mazo.every((c) => c.type === 'image' || c.type === 'word'));
comprobar('los ids de carta son únicos', new Set(mazo.map((c) => c.id)).size === mazo.length);

const porPareja = new Map();
mazo.forEach((carta) => {
    if (!porPareja.has(carta.pairId)) porPareja.set(carta.pairId, []);
    porPareja.get(carta.pairId).push(carta.type);
});
comprobar(
    'cada pareja tiene exactamente una imagen y una palabra',
    [...porPareja.values()].every((tipos) => tipos.length === 2 && tipos.includes('image') && tipos.includes('word'))
);

const mazoCorto = crearMazoDuelo(3);
comprobar('se puede crear un mazo más pequeño', mazoCorto.length === 6);

comprobar('gana quien tiene más parejas', calcularGanador({ a: 5, b: 3 }, ['a', 'b']) === 'a');
comprobar('gana el segundo si tiene más', calcularGanador({ a: 2, b: 4 }, ['a', 'b']) === 'b');
comprobar('empate cuando hay los mismos puntos', calcularGanador({ a: 4, b: 4 }, ['a', 'b']) === 'empate');
comprobar('empate sin jugadores suficientes', calcularGanador({ a: 9 }, ['a']) === 'empate');

comprobar('el siguiente turno alterna al rival', siguienteJugador(['a', 'b'], 'a') === 'b');
comprobar('el siguiente turno alterna al primero', siguienteJugador(['a', 'b'], 'b') === 'a');
comprobar('sin turno actual toma el primero', siguienteJugador(['a', 'b'], null) === 'a');
comprobar('valida el modo rápido', esModoValido('rapida') === true);
comprobar('valida el modo sin prisa', esModoValido('relajada') === true);
comprobar('rechaza un modo inventado', esModoValido('turbo') === false);

if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
}

console.log('\nTodas las pruebas del duelo pasaron.');
