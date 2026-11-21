// Prueba del reto diario: determinismo, opciones, rachas y fusión con la nube.
// Ejecutar con: npm run test:reto

const {
    calcularRacha,
    calcularRecompensa,
    fechaAnterior,
    fusionarRacha,
    fusionarReto,
    generarPalabraDelDia,
    generarRetoDiario,
    obtenerFechaLocal,
    rachaVigente,
} = await import('../src/utils/retoDiario.js');

let fallos = 0;

const comprobar = (nombre, condicion, detalle = '') => {
    if (condicion) {
        console.log(`  ✅ ${nombre}`);
    } else {
        fallos += 1;
        console.error(`  ❌ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    }
};

console.log('Reto diario');

comprobar(
    'la fecha local usa el día del calendario',
    obtenerFechaLocal(new Date(2026, 10, 21, 23, 59)) === '2026-11-21'
);
comprobar('la fecha anterior cruza el cambio de mes', fechaAnterior('2026-03-01') === '2026-02-28');

comprobar('5 aciertos dan 50 totopos', calcularRecompensa(5) === 50);
comprobar('4 aciertos dan 30 totopos', calcularRecompensa(4) === 30);
comprobar('3 aciertos dan 15 totopos', calcularRecompensa(3) === 15);
comprobar('0 aciertos dan 5 totopos de participación', calcularRecompensa(0) === 5);

const hoy = '2026-11-21';
comprobar('sin racha previa empieza en 1', calcularRacha(null, hoy).dias === 1);
comprobar(
    'completar al día siguiente suma uno',
    calcularRacha({ dias: 3, ultimoDia: '2026-11-20' }, hoy).dias === 4
);
comprobar(
    'completar el mismo día no suma',
    calcularRacha({ dias: 3, ultimoDia: hoy }, hoy).dias === 3
);
comprobar(
    'saltarse un día reinicia la racha',
    calcularRacha({ dias: 8, ultimoDia: '2026-11-19' }, hoy).dias === 1
);
comprobar('la racha de hoy está vigente', rachaVigente({ dias: 4, ultimoDia: hoy }, hoy) === 4);
comprobar('la racha de ayer sigue vigente', rachaVigente({ dias: 4, ultimoDia: '2026-11-20' }, hoy) === 4);
comprobar('una racha vieja ya no está vigente', rachaVigente({ dias: 4, ultimoDia: '2026-11-19' }, hoy) === 0);

const retoA = generarRetoDiario('2026-11-21');
const retoB = generarRetoDiario('2026-11-21');
const otroDia = generarRetoDiario('2026-11-22');

comprobar('el reto tiene 5 preguntas', retoA.length === 5);
comprobar(
    'cada pregunta tiene 4 opciones únicas',
    retoA.every((p) => p.opciones.length === 4 && new Set(p.opciones).size === 4)
);
comprobar(
    'la respuesta correcta está entre las opciones',
    retoA.every((p) => p.opciones.includes(p.correcta))
);
comprobar(
    'alterna español→diidxazá y diidxazá→español',
    retoA.map((p) => p.direccion).join(',') === 'aDiidxaza,aSpanish,aDiidxaza,aSpanish,aDiidxaza'
);
comprobar('el mismo día genera el mismo reto', JSON.stringify(retoA) === JSON.stringify(retoB));
comprobar('otro día genera un reto distinto', JSON.stringify(retoA) !== JSON.stringify(otroDia));
comprobar(
    'cada pregunta conserva su tipo y su palabra',
    retoA.every((p) => ['fauna', 'flora'].includes(p.tipo) && p.diidxaza && p.spanish)
);

const localViejo = { fecha: '2026-11-20', completadoEn: 100, aciertos: 2 };
const nubeHoy = { fecha: hoy, completadoEn: 200, aciertos: 3 };
comprobar(
    'si la nube tiene el reto de hoy, se adopta',
    fusionarReto(localViejo, nubeHoy, hoy).reto.fecha === hoy
);
comprobar(
    'si el local tiene el reto de hoy, se sube',
    fusionarReto(nubeHoy, localViejo, hoy).subir === true
);
comprobar(
    'si ambos son de hoy gana el completado más tarde',
    fusionarReto(
        { fecha: hoy, completadoEn: 300 },
        { fecha: hoy, completadoEn: 200 },
        hoy
    ).reto.completadoEn === 300
);

comprobar(
    'la racha más reciente gana',
    fusionarRacha(
        { dias: 2, ultimoDia: '2026-11-20' },
        { dias: 1, ultimoDia: '2026-11-19' }
    ).subir === true
);
comprobar(
    'con el mismo día gana la racha mayor',
    fusionarRacha(
        { dias: 5, ultimoDia: hoy },
        { dias: 3, ultimoDia: hoy }
    ).racha.dias === 5
);

const palabraA = generarPalabraDelDia('2026-11-21');
const palabraB = generarPalabraDelDia('2026-11-21');
const palabraOtroDia = generarPalabraDelDia('2026-11-22');

comprobar('la palabra del día es determinista', JSON.stringify(palabraA) === JSON.stringify(palabraB));
comprobar('otro día cambia la palabra del día', JSON.stringify(palabraA) !== JSON.stringify(palabraOtroDia));
comprobar(
    'la palabra del día tiene palabra, traducción e imagen',
    Boolean(palabraA.diidxaza && palabraA.spanish && palabraA.image && palabraA.tipo)
);

let textoCopiado = '';
try {
    Object.defineProperty(globalThis, 'navigator', {
        value: {
            clipboard: {
                writeText: async (texto) => { textoCopiado = texto; },
            },
        },
        configurable: true,
    });
    globalThis.window = { location: { origin: 'https://bidxaga.example' } };

    const { compartirTexto } = await import('../src/utils/compartir.js');
    const resultadoCompartir = await compartirTexto({ titulo: 'Palabra', texto: 'Hola' });

    comprobar(
        'sin Web Share se copia el texto con enlace',
        resultadoCompartir === 'copiado' && textoCopiado.includes('https://bidxaga.example')
    );
} catch (error) {
    comprobar('sin Web Share se copia el texto con enlace', false, error.message);
}

if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
}

console.log('\nTodas las pruebas del reto diario pasaron.');
