// Pruebas de helpers del panel de administración: CSV y orden de rankings.
// Ejecutar con: npm run test:admin

const { escaparCSV, generarCSV } = await import('../src/utils/csv.js');
const { ordenarRegistros } = await import('../src/utils/ordenRankings.js');
const {
    detectarSugerenciasDuplicadas,
    esAnomaliaRanking,
} = await import('../src/utils/adminHelpers.js');
const {
    analizarDuplicadosRanking,
    deduplicarRanking,
    esMejorRegistroRanking,
} = await import('../src/utils/rankingGlobal.js');

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
comprobar('Memorama ordena por nivel y menos turnos', memorama.map((r) => r.id).join(',') === 'c,b,d,a', memorama.map((r) => r.id).join(','));

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

comprobar('Memorama válido no es anomalía', !esAnomaliaRanking({ id: 'a', level: 2, score: 10 }, 'memorama'));
comprobar('Memorama sin puntaje es anomalía', esAnomaliaRanking({ id: 'a', level: 2, score: 0 }, 'memorama'));
comprobar('Nivel menor a 1 es anomalía', esAnomaliaRanking({ id: 'a', level: 0, score: 10 }, 'memorama'));
comprobar('Trivia con errores negativos es anomalía', esAnomaliaRanking({ id: 'a', level: 2, errores: -1 }, 'trivia'));
comprobar('Reto con más aciertos que el total es anomalía', esAnomaliaRanking({ id: 'a', aciertos: 6, total: 5 }, 'reto'));
comprobar('Reto válido no es anomalía', !esAnomaliaRanking({ id: 'a', aciertos: 5, total: 5 }, 'reto'));

const duplicadas = detectarSugerenciasDuplicadas([
    { id: '1', palabra: 'Bixid' },
    { id: '2', palabra: ' bixid ' },
    { id: '3', palabra: 'Guetu' },
    { id: '4', palabra: '' },
    { id: '5', palabra: '' },
]);
comprobar('Detecta palabras repetidas sin distinguir mayúsculas', duplicadas.has('1') && duplicadas.has('2'));
comprobar('No marca palabras únicas', !duplicadas.has('3'));
comprobar('Ignora palabras vacías', !duplicadas.has('4') && !duplicadas.has('5'));

const sinDuplicados = detectarSugerenciasDuplicadas([{ id: 'x', palabra: 'Niza' }]);
comprobar('Sin duplicados devuelve un conjunto vacío', sinDuplicados.size === 0);

const memoramaDuplicado = deduplicarRanking([
    { id: 'a', uid: 'u1', name: 'Efra', level: 5, score: 20 },
    { id: 'b', uid: 'u2', name: 'Efra', level: 6, score: 30 },
    { id: 'c', uid: 'u3', name: 'Efra', level: 6, score: 18 },
    { id: 'd', uid: 'u4', name: 'Tina', level: 4, score: 10 },
    { id: 'e', uid: 'u5', name: 'Invalido', level: 9, score: 0 },
], 'memorama');
comprobar('Memorama conserva un solo Efra', memoramaDuplicado.filter((r) => r.name === 'Efra').length === 1);
comprobar('Memorama conserva el mejor turno', memoramaDuplicado.find((r) => r.name === 'Efra')?.id === 'c');
comprobar('Memorama descarta turnos imposibles', !memoramaDuplicado.some((r) => r.name === 'Invalido'));

const triviaDuplicada = deduplicarRanking([
    { id: 'a', name: 'Dian', level: 10, errores: 4 },
    { id: 'b', name: 'Dian', level: 10, errores: 1 },
    { id: 'c', name: 'Dian', level: 9, errores: 0 },
], 'trivia');
comprobar('Trivia conserva el mejor intento', triviaDuplicada.length === 1 && triviaDuplicada[0].id === 'b');

const sopaDuplicada = deduplicarRanking([
    { id: 'a', name: 'Nanixhe', level: 3, intentos: 20 },
    { id: 'b', name: 'Nanixhe', level: 4, intentos: 18 },
    { id: 'c', name: 'Nanixhe', level: 4, intentos: 12 },
], 'sopa');
comprobar('Sopa conserva el mejor intento', sopaDuplicada.length === 1 && sopaDuplicada[0].id === 'c');

const retoMejor = [
    { id: 'a', name: 'Ana', aciertos: 4, total: 5, racha: 2, completadoEn: 100 },
    { id: 'b', name: 'Ana', aciertos: 4, total: 5, racha: 5, completadoEn: 200 },
];
comprobar('Reto prefiere más racha con los mismos aciertos', esMejorRegistroRanking(retoMejor[1], retoMejor[0], 'reto'));

const analisis = analizarDuplicadosRanking([
    { id: 'a', name: 'Efra', level: 5, score: 20 },
    { id: 'b', name: 'Efra', level: 6, score: 30 },
    { id: 'c', name: 'Tina', level: 4, score: 10 },
], 'memorama');
comprobar('El análisis conserva un registro por jugador', analisis.conservar.length === 2);
comprobar('El análisis elimina los sobrantes', analisis.eliminar.length === 1 && analisis.eliminar[0].id === 'a');

if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
}

console.log('\nTodas las pruebas de administración pasaron.');
