// Pruebas de economía, vidas, niveles de cuenta y almacenamiento por usuario.
// Ejecutar con: npm run test:calidad

const memoria = new Map();

globalThis.localStorage = {
    getItem: (clave) => (memoria.has(clave) ? memoria.get(clave) : null),
    setItem: (clave, valor) => memoria.set(clave, String(valor)),
    removeItem: (clave) => memoria.delete(clave),
};

globalThis.window = {
    dispatchEvent: () => true,
};

const {
    VIDAS_POR_JUEGO,
    agregarVidasATodos,
    actualizarVidasJuego,
    crearVidasIniciales,
    normalizarVidas,
    totalVidas,
} = await import('../src/utils/vidas.js');

const { calcularNivelCuenta } = await import('../src/utils/Nivelcuenta.js');
const { almacen, configurarScope, obtenerScopeActual } = await import('../src/utils/almacen.js');

let fallos = 0;

const comprobar = (nombre, condicion, detalle = '') => {
    if (condicion) {
        console.log(`  ✅ ${nombre}`);
    } else {
        fallos += 1;
        console.error(`  ❌ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    }
};

console.log('Calidad y economía');

const iniciales = crearVidasIniciales();
comprobar(
    'las vidas iniciales respetan cada juego',
    Object.entries(VIDAS_POR_JUEGO).every(([juego, config]) => iniciales[juego] === config.inicial)
);
comprobar('el total de vidas iniciales es correcto', totalVidas(iniciales) === 21);

const normalizadas = normalizarVidas({ memorama: 99, trivia: -3, sopa: 2, crucigrama: 4 });
comprobar('las vidas se limitan al máximo', normalizadas.memorama === VIDAS_POR_JUEGO.memorama.max);
comprobar('las vidas no bajan de cero', normalizadas.trivia === 0);
comprobar('se conservan los valores válidos', normalizadas.sopa === 2 && normalizadas.crucigrama === 4);

const legado = normalizarVidas(7);
comprobar(
    'el formato antiguo de vidas sigue funcionando',
    legado.memorama === 10 && legado.trivia === 3 && legado.sopa === 3 && legado.crucigrama === 5,
    JSON.stringify(legado)
);

const actualizadas = actualizarVidasJuego({ memorama: 5 }, 'memorama', 50);
comprobar('actualizar un juego respeta el máximo', actualizadas.memorama === VIDAS_POR_JUEGO.memorama.max);
comprobar('actualizar un juego ignora juegos inexistentes', actualizarVidasJuego({}, 'noexiste', 5).noexiste === undefined);

const recargadas = agregarVidasATodos({ memorama: 9, trivia: 2, sopa: 3, crucigrama: 4 }, 5);
comprobar('la tienda recarga todos los juegos sin pasarse', recargadas.memorama === 10 && recargadas.trivia === 3 && recargadas.sopa === 3 && recargadas.crucigrama === 5);

comprobar('Nivel 1 hasta 99 totopos', calcularNivelCuenta(99) === 1);
comprobar('Nivel 2 desde 100', calcularNivelCuenta(100) === 2);
comprobar('Nivel 3 desde 300', calcularNivelCuenta(300) === 3);
comprobar('Nivel 4 desde 600', calcularNivelCuenta(600) === 4);
comprobar('Nivel 5 desde 1000', calcularNivelCuenta(1000) === 5);

configurarScope(null);
almacen.setItem('prueba', 'invitado');
comprobar('el invitado guarda en su espacio', obtenerScopeActual() === 'guest');
comprobar('el invitado lee su propio valor', almacen.getItem('prueba') === 'invitado');

configurarScope({ uid: 'u1' });
almacen.setItem('prueba', 'usuario');
comprobar('el usuario guarda en su espacio', obtenerScopeActual() === 'user:u1');
comprobar('el usuario lee su propio valor', almacen.getItem('prueba') === 'usuario');
comprobar('el valor del invitado queda aislado', memoria.get('bidxaga:v1:guest:prueba') === 'invitado');

configurarScope(null);
comprobar('al volver a invitado se recupera su valor', almacen.getItem('prueba') === 'invitado');
almacen.removeItem('prueba');
comprobar('removeItem borra solo el espacio actual', almacen.getItem('prueba') === null && memoria.get('bidxaga:v1:user:u1:prueba') === 'usuario');

if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
}

console.log('\nTodas las pruebas de calidad pasaron.');
