import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(raiz, 'public');

const faltantes = [];
const advertencias = [];

const existe = (rutaPublica) => {
    const limpia = rutaPublica.replace(/^\//, '');
    return fs.existsSync(path.join(publicDir, limpia));
};

const revisar = (ruta, contexto) => {
    if (!ruta) {
        faltantes.push(`${contexto}: ruta vacía`);
        return;
    }
    if (/^https?:\/\//i.test(ruta)) return;
    if (!existe(ruta)) faltantes.push(`${contexto}: ${ruta}`);
};

const importar = async (relativo) => {
    const url = pathToFileURL(path.join(raiz, relativo)).href;
    return import(url);
};

const { listaAnimales } = await importar('src/data/animales.js');
const { listaFlora } = await importar('src/data/flora.js');
const { CATALOGO_AVATARES, CATALOGO_ACCESORIOS } = await importar('src/data/catalogoActivos.js');

for (const animal of [...listaAnimales, ...listaFlora]) {
    revisar(animal.image, `Palabra "${animal.spanish}"`);
    if (animal.imagenPendiente) {
        advertencias.push(`Ilustración pendiente: ${animal.spanish} (${animal.image})`);
    }
}

for (const avatar of CATALOGO_AVATARES) {
    if (avatar.disponible === false) {
        advertencias.push(`Avatar marcado como próximamente: ${avatar.nombre}`);
        continue;
    }
    revisar(`/avatares/${avatar.archivo}.png`, `Avatar "${avatar.nombre}"`);
}

for (const accesorio of CATALOGO_ACCESORIOS) {
    revisar(`/avatares/mercado/${accesorio.archivo}`, `Accesorio "${accesorio.nombre}"`);
}

const estaticos = [
    '/favicon.png',
    '/manifest.json',
    '/totopo.png',
    '/tuna-vida.png',
    '/engrane.png',
    '/guiechachi.png',
    '/tehuana.png',
    '/images/banner.png',
    '/images/bannerinicio.png',
    '/images/zina.png',
    '/audio/click1.mp3',
    '/audio/click2.mp3',
    '/audio/click3.mp3',
    '/audio/pista1.mp3',
    '/audio/pista2.mp3'
];

for (const ruta of estaticos) {
    revisar(ruta, 'Asset estático');
}

if (advertencias.length > 0) {
    console.log('\nAdvertencias:');
    advertencias.forEach((a) => console.log(`  ⚠️  ${a}`));
}

if (faltantes.length > 0) {
    console.error(`\n❌ Faltan ${faltantes.length} asset(s):`);
    faltantes.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
}

console.log('\n✅ Todos los assets referenciados existen.');
