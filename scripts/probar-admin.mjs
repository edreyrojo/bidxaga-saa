// Pruebas de helpers del panel de administración: CSV y orden de rankings.
// Ejecutar con: npm run test:admin

const { escaparCSV, generarCSV } = await import('../src/utils/csv.js');
const { ordenarRegistros } = await import('../src/utils/ordenRankings.js');

let fallos = 0;

const comprobar = (nombre, condicion, detalle = '') => {
    if (condicion) {
        console.log(`  ✅ ${nombre}`);
    } else {
        fallos += 1;
        console.error(`  ❌ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    }
};

console.log('Administración');

comprobar('escapa comas', escaparCSV('Hola, mundo') === '"Hola, mundo"');
comprobar('escapa comillas', escaparCSV('Di "hola"') === '"Di ""hola"""');
comprobar('escapa saltos de línea', escaparCSV('linea1\nlinea2') === '"linea1\nlinea2"');
comprobar('deja texto simple intacto', escaparCSV('Bidxaga') === 'Bidxaga');

const csv = generarCSV(
    [
        { nombre: 'Ana, la mayor', correo: 'ana@example.com' },
        { nombre: 'Luis "el profe"', correo: 'luis@example.com' },
    ],
    [
        { titulo: 'Nombre', clave: 'nombre' },
        { titulo: 'Correo', clave: 'correo' },
    ]
);

comprobar('el CSV inicia con BOM', csv.startsWith('\uFEFF'));
comprobar('el CSV incluye encabezados', csv.includes('Nombre,Correo'));
comprobar('el CSV escapa valores', csv.includes('"Ana, la mayor"') && csv.includes('"Luis ""el profe"""'));

const memorama = ordenarRegistros([
    { id: 'a', level: 2, score: 100, turnos: 10 },
    { id: 'b', level: 3, score: 50, turnos: 8 },
    { id: 'c', level: 3, score: 50, turnos: 5 },
    { id: 'd', level: 3, score: 120, turnos: 12 },
], 'memorama');
comprobar('Memorama ordena por nivel, puntos y turnos', memorama.map((r) => r.id).join(',') === 'd,c,b,a', memorama.map((r) => r.id).join(','));

const trivia = ordenarRegistros([
    { id: 'a', level: 2, errores: 1 },
    { id: 'b', level: 3, errores: 4 },
    { id: 'c', level: 3, errores: 0 },
], 'trivia');
comprobar('Trivia ordena por nivel y menos errores', trivia.map((r) => r.id).join(',') === 'c,b,a', trivia.map((r) => r.id).join(','));

const sopa = ordenarRegistros([
    { id: 'a', level: 1, intentos: 10 },
    { id: 'b', level: 2, intentos: 20 },
    { id: 'c', level: 2, intentos: 8 },
], 'sopa');
comprobar('Sopa ordena por nivel y menos intentos', sopa.map((r) => r.id).join(',') === 'c,b,a', sopa.map((r) => r.id).join(','));

const reto = ordenarRegistros([
    { id: 'a', aciertos: 4, racha: 2, completadoEn: 300 },
    { id: 'b', aciertos: 5, racha: 1, completadoEn: 200 },
    { id: 'c', aciertos: 5, racha: 3, completadoEn: 400 },
    { id: 'd', aciertos: 5, racha: 3, completadoEn: 100 },
], 'reto');
comprobar(
    'Reto Diario ordena por aciertos, racha y hora',
    reto.map((r) => r.id).join(',') === 'd,c,b,a',
    reto.map((r) => r.id).join(',')
);

if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
}

console.log('\nTodas las pruebas de administración pasaron.');
