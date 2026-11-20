import { readdir, stat, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ = process.cwd()
const MANIFIESTO = path.join(RAIZ, 'scripts', '.imagenes-optimizadas.json')

const OBJETIVOS = [
    { carpeta: 'public', archivo: true, max: 256 },
    { carpeta: 'public/images', max: 512, maxPanoramica: 1400 },
    { carpeta: 'public/avatares', max: 256 },
    { carpeta: 'public/icons', max: 512 },
]

const EXTENSIONES = new Set(['.png'])

const listarPng = async (ruta, soloArchivos = false) => {
    const info = await stat(ruta)
    if (info.isFile()) {
        return EXTENSIONES.has(path.extname(ruta).toLowerCase()) ? [ruta] : []
    }
    const entradas = await readdir(ruta, { withFileTypes: true })
    const archivos = await Promise.all(
        entradas
            .filter((entrada) => !soloArchivos || entrada.isFile())
            .map((entrada) => listarPng(path.join(ruta, entrada.name), soloArchivos))
    )
    return archivos.flat()
}

const leerManifiesto = async () => {
    if (!existsSync(MANIFIESTO)) return {}
    try {
        return JSON.parse(await readFile(MANIFIESTO, 'utf8'))
    } catch {
        return {}
    }
}

const formatear = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

const main = async () => {
    const manifiesto = await leerManifiesto()
    const resultados = []
    let antesTotal = 0
    let despuesTotal = 0
    let procesadas = 0
    let omitidas = 0

    for (const objetivo of OBJETIVOS) {
        const rutaObjetivo = path.join(RAIZ, objetivo.carpeta)
        if (!existsSync(rutaObjetivo)) continue

        const archivos = await listarPng(rutaObjetivo, Boolean(objetivo.archivo))
        for (const archivo of archivos) {
            const relativa = path.relative(RAIZ, archivo)
            const info = await stat(archivo)
            const anterior = manifiesto[relativa]

            if (anterior && anterior.mtimeMs === info.mtimeMs && anterior.size === info.size) {
                omitidas += 1
                continue
            }

            const metadatos = await sharp(archivo).metadata()
            const esPanoramica = metadatos.width && metadatos.height && metadatos.width / metadatos.height > 2
            const limite = esPanoramica && objetivo.maxPanoramica
                ? objetivo.maxPanoramica
                : objetivo.max

            // Si ya está por debajo del límite y pesa poco por píxel, no se vuelve a comprimir.
            const yaOptimizada = metadatos.width
                && metadatos.width <= limite
                && info.size < metadatos.width * metadatos.height * 0.45
            if (yaOptimizada) {
                omitidas += 1
                continue
            }

            const escala = metadatos.width && metadatos.width > limite
                ? limite / metadatos.width
                : 1
            const ancho = Math.max(1, Math.round(metadatos.width * escala))

            const salida = await sharp(archivo)
                .resize({ width: ancho, withoutEnlargement: true })
                .png({ compressionLevel: 9, effort: 10, palette: true, quality: 85, colours: 256 })
                .toBuffer()

            antesTotal += info.size
            if (salida.length >= info.size) {
                // No vale la pena reemplazar si no se gana espacio.
                despuesTotal += info.size
                manifiesto[relativa] = { mtimeMs: info.mtimeMs, size: info.size, omitida: true }
                omitidas += 1
                continue
            }

            await writeFile(archivo, salida)
            const nuevaInfo = await stat(archivo)
            despuesTotal += nuevaInfo.size
            manifiesto[relativa] = {
                mtimeMs: nuevaInfo.mtimeMs,
                size: nuevaInfo.size,
                original: info.size,
            }
            procesadas += 1
            resultados.push({
                archivo: relativa,
                antes: info.size,
                despues: nuevaInfo.size,
                ancho,
            })
        }
    }

    await writeFile(MANIFIESTO, JSON.stringify(manifiesto, null, 2))

    resultados
        .sort((a, b) => (b.antes - b.despues) - (a.antes - a.despues))
        .slice(0, 10)
        .forEach(({ archivo, antes, despues, ancho }) => {
            console.log(`  ${archivo} → ${ancho}px  ${formatear(antes)} a ${formatear(despues)}`)
        })

    const ahorro = antesTotal - despuesTotal
    console.log(`\nImágenes procesadas: ${procesadas} · omitidas: ${omitidas}`)
    console.log(`Antes: ${formatear(antesTotal)} · después: ${formatear(despuesTotal)} · ahorro: ${formatear(ahorro)}`)
}

main().catch((error) => {
    console.error('No se pudieron optimizar las imágenes:', error)
    process.exit(1)
})
