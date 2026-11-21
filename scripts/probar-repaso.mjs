// Prueba rápida del motor de repaso espaciado.
// Ejecutar con: npm run test:repaso

const memoria = new Map();

globalThis.__BIDXAGA_SIN_NUBE__ = true;

globalThis.localStorage = {
    getItem: (clave) => (memoria.has(clave) ? memoria.get(clave) : null),
    setItem: (clave, valor) => memoria.set(clave, String(valor)),
    removeItem: (clave) => memoria.delete(clave),
};

globalThis.window = {
    dispatchEvent: () => true,
};

const {
    registrarRespuesta,
    obtenerResumenRepaso,
    seleccionarConRepaso,
    fusionarRepasoNube,
    borrarRepaso,
} = await import('../src/utils/repaso.js');

let fallos = 0;

const comprobar = (nombre, condicion, detalle = '') => {
    if (condicion) {
        console.log(`  ✅ ${nombre}`);
    } else {
        fallos += 1;
        console.error(`  ❌ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    }
};

const itemA = { tipo: 'fauna', id: 901, palabra: 'Aaa', spanish: 'a' };
const itemB = { tipo: 'fauna', id: 902, palabra: 'Bbb', spanish: 'b' };
const itemC = { tipo: 'fauna', id: 903, palabra: 'Ccc', spanish: 'c' };

console.log('Repaso espaciado');

registrarRespuesta(itemA, true);
const resumenTrasAcierto = obtenerResumenRepaso();
const registroA = resumenTrasAcierto.palabras.find((p) => p.id === 901);
comprobar('un acierto sube la caja a 1', registroA?.caja === 1, JSON.stringify(registroA));
comprobar('un acierto no queda pendiente hoy', resumenTrasAcierto.pendientes === 0, `pendientes=${resumenTrasAcierto.pendientes}`);

for (let i = 0; i < 3; i += 1) registrarRespuesta(itemB, false);
const resumenTrasErrores = obtenerResumenRepaso();
const registroB = resumenTrasErrores.palabras.find((p) => p.id === 902);
comprobar('tres errores dejan la caja en 0', registroB?.caja === 0);
comprobar('tres errores acumulan el contador', registroB?.errores === 3);
comprobar('la palabra fallada queda pendiente', resumenTrasErrores.pendientes === 1);
comprobar('el resumen conserva etiquetas', registroB?.palabra === 'Bbb' && registroB?.spanish === 'b');

const lista = [itemA, itemB, itemC];
const conteo = { Aaa: 0, Bbb: 0, Ccc: 0 };
for (let i = 0; i < 3000; i += 1) {
    const [elegido] = seleccionarConRepaso(lista, 1, 'fauna');
    conteo[elegido.palabra] += 1;
}

console.log(`  Frecuencias: ${JSON.stringify(conteo)}`);
comprobar('la palabra fallada aparece más que una nueva', conteo.Bbb > conteo.Ccc);
comprobar('una palabra nueva aparece más que una dominada', conteo.Ccc > conteo.Aaa);

// --- Fusión con Firestore ---
memoria.delete('bidxaga:v1:guest:repasoPalabras');
memoria.delete('bidxaga:v1:guest:repasoBorradoEn');

const guardarLocal = (datos) => {
    memoria.set('bidxaga:v1:guest:repasoPalabras', JSON.stringify(datos));
};

const registro = (id, palabra, ultimaVez) => ({
    tipo: 'fauna',
    id,
    palabra,
    spanish: palabra.toLowerCase(),
    aciertos: 1,
    errores: 0,
    caja: 1,
    racha: 1,
    ultimaVez,
    proximoRepaso: ultimaVez + 1000,
});

guardarLocal({
    'fauna:1': registro(1, 'Aaa', 100),
    'fauna:2': registro(2, 'Bbb', 300),
    'fauna:4': registro(4, 'Ddd', 50),
});

const { fusionados, subir } = fusionarRepasoNube([
    { clave: 'fauna:1', ...registro(1, 'Aaa', 200) },
    { clave: 'fauna:2', ...registro(2, 'Bbb', 100) },
    { clave: 'fauna:3', ...registro(3, 'Ccc', 150) },
]);

comprobar('gana el registro remoto más reciente', fusionados['fauna:1'].ultimaVez === 200);
comprobar('el registro local más reciente se conserva', fusionados['fauna:2'].ultimaVez === 300);
comprobar('se descarga una palabra que solo estaba en la nube', fusionados['fauna:3'].ultimaVez === 150);
comprobar('se conserva una palabra que solo estaba local', fusionados['fauna:4'].ultimaVez === 50);
comprobar(
    'solo se suben los registros locales más nuevos o ausentes en la nube',
    subir.map((r) => r.clave).sort().join(',') === 'fauna:2,fauna:4',
    subir.map((r) => r.clave).join(',')
);

borrarRepaso();
comprobar('borrar el historial deja todo vacío', obtenerResumenRepaso().total === 0);
comprobar(
    'borrar deja un marcador para no revivir el historial',
    Number(memoria.get('bidxaga:v1:guest:repasoBorradoEn')) > 0
);

if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
}

console.log('\nTodas las pruebas de repaso pasaron.');
