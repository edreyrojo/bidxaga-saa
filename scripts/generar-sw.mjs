import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const DIST = path.join(RAIZ, 'dist');
const RUTA_SW = path.join(DIST, 'sw.js');

const EXT_JS = new Set(['.js', '.css']);
const EXT_IMAGEN = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

const listar = (carpeta, extensiones) => {
    const resultado = [];
    if (!existsSync(carpeta)) return resultado;

    const recorrer = (directorio) => {
        for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
            const ruta = path.join(directorio, entrada.name);
            if (entrada.isDirectory()) {
                recorrer(ruta);
            } else if (extensiones.has(path.extname(entrada.name).toLowerCase())) {
                resultado.push(ruta);
            }
        }
    };

    recorrer(carpeta);
    return resultado;
};

const aUrl = (ruta) => `/${path.relative(DIST, ruta).split(path.sep).join('/')}`;
const peso = (ruta) => statSync(ruta).size;

if (!existsSync(RUTA_SW)) {
    console.error('❌ No existe dist/sw.js. Ejecuta primero `npm run build`.');
    process.exit(1);
}

const buildAssets = listar(path.join(DIST, 'assets'), EXT_JS).map(aUrl);
const imagenes = [
    ...listar(path.join(DIST, 'images'), EXT_IMAGEN),
    ...listar(path.join(DIST, 'avatares'), EXT_IMAGEN),
];
const imageAssets = imagenes.map(aUrl);
const bytesImagenes = imagenes.reduce((total, ruta) => total + peso(ruta), 0);

if (buildAssets.length === 0) {
    console.error('❌ No se encontraron chunks en dist/assets.');
    process.exit(1);
}

const plantilla = readFileSync(RUTA_SW, 'utf8');

const huella = createHash('sha1')
    .update(plantilla)
    .update('|')
    .update(buildAssets.join('|'))
    .update('|')
    .update(imagenes.map((ruta) => `${aUrl(ruta)}:${peso(ruta)}`).join('|'))
    .digest('hex')
    .slice(0, 10);

let sw = plantilla;

const reemplazar = (marcador, valor) => {
    if (!sw.includes(marcador)) {
        console.error(`❌ Falta el marcador ${marcador} en public/sw.js.`);
        process.exit(1);
    }
    sw = sw.replace(marcador, JSON.stringify(valor, null, 2));
};

reemplazar('/* __PRECACHE__ */ []', buildAssets);
reemplazar('/* __IMAGENES__ */ []', imageAssets);
reemplazar('/* __BUILD_TS__ */', Date.now());

if (!sw.includes('/* __VERSION__ */')) {
    console.error('❌ Falta el marcador /* __VERSION__ */ en public/sw.js.');
    process.exit(1);
}
sw = sw.replace('/* __VERSION__ */', huella);
writeFileSync(RUTA_SW, sw);

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
console.log(`✅ Service worker listo (${huella}):`);
console.log(`   ${buildAssets.length} chunks de la app`);
console.log(`   ${imageAssets.length} imágenes (${mb(bytesImagenes)}) para uso sin conexión`);
