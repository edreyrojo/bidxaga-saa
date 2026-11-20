import { readdir, stat, readFile, writeFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import ffmpegPath from 'ffmpeg-static'

const ejecutar = promisify(execFile)
const RAIZ = process.cwd()
const CARPETA = path.join(RAIZ, 'public', 'audio')
const MANIFIESTO = path.join(RAIZ, 'scripts', '.audio-optimizado.json')

// Las pistas de fondo conservan estéreo; los efectos cortos van en mono.
const PERFILES = {
    pista: { bitrate: '112k', canales: 2 },
    efecto: { bitrate: '64k', canales: 1 },
}

const leerManifiesto = async () => {
    if (!existsSync(MANIFIESTO)) return {}
    try {
        return JSON.parse(await readFile(MANIFIESTO, 'utf8'))
    } catch {
        return {}
    }
}

const main = async () => {
    if (!existsSync(CARPETA)) {
        console.log('No existe public/audio; nada que optimizar.')
        return
    }

    const manifiesto = await leerManifiesto()
    const archivos = (await readdir(CARPETA)).filter((nombre) => nombre.endsWith('.mp3'))
    let antes = 0
    let despues = 0
    let procesados = 0

    for (const nombre of archivos) {
        const archivo = path.join(CARPETA, nombre)
        const relativa = path.relative(RAIZ, archivo)
        const info = await stat(archivo)
        const anterior = manifiesto[relativa]

        if (anterior && anterior.mtimeMs === info.mtimeMs && anterior.size === info.size) {
            antes += info.size
            despues += info.size
            continue
        }

        const perfil = nombre.startsWith('pista') ? PERFILES.pista : PERFILES.efecto
        const temporal = `${archivo}.tmp.mp3`

        await ejecutar(ffmpegPath, [
            '-hide_banner', '-loglevel', 'error', '-y',
            '-i', archivo,
            '-map_metadata', '-1',
            '-ac', String(perfil.canales),
            '-c:a', 'libmp3lame',
            '-b:a', perfil.bitrate,
            temporal,
        ])

        const infoTemporal = await stat(temporal)
        antes += info.size

        if (infoTemporal.size >= info.size) {
            // Si no se gana espacio, se conserva el archivo original.
            await ejecutar(process.env.ComSpec || 'cmd', ['/c', 'del', temporal])
            despues += info.size
            manifiesto[relativa] = { mtimeMs: info.mtimeMs, size: info.size, omitida: true }
            continue
        }

        await rename(temporal, archivo)
        const nuevaInfo = await stat(archivo)
        despues += nuevaInfo.size
        procesados += 1
        manifiesto[relativa] = {
            mtimeMs: nuevaInfo.mtimeMs,
            size: nuevaInfo.size,
            original: info.size,
        }
        console.log(`  ${relativa}  ${(info.size / 1024 / 1024).toFixed(2)} MB → ${(nuevaInfo.size / 1024 / 1024).toFixed(2)} MB`)
    }

    await writeFile(MANIFIESTO, JSON.stringify(manifiesto, null, 2))
    console.log(`\nPistas optimizadas: ${procesados}`)
    console.log(`Antes: ${(antes / 1024 / 1024).toFixed(2)} MB · después: ${(despues / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((error) => {
    console.error('No se pudo optimizar el audio:', error)
    process.exit(1)
})
