/**
 * Motor de sonidos de interfaz con Web Audio.
 *
 * Los efectos de clic se decodifican una sola vez y se reproducen como
 * AudioBufferSourceNode. En móvil esto evita el retraso típico de crear un
 * HTMLAudioElement y esperar a que empiece a sonar.
 */
const RUTAS = {
    click1: '/audio/click1.mp3',
    click2: '/audio/click2.mp3',
    click3: '/audio/click3.mp3',
};

let contexto = null;
let desbloqueado = false;
let desbloqueoInstalado = false;

const buffers = new Map();
const promesas = new Map();

const obtenerContexto = () => {
    if (typeof window === 'undefined') return null;
    if (contexto) return contexto;

    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;

    try {
        contexto = new Ctor({ latencyHint: 'interactive' });
    } catch {
        contexto = null;
    }

    return contexto;
};

const decodificar = (ctx, datos) => new Promise((resolve, reject) => {
    let resuelto = false;

    const terminar = (buffer) => {
        if (resuelto) return;
        resuelto = true;
        resolve(buffer);
    };

    const fallar = (error) => {
        if (resuelto) return;
        resuelto = true;
        reject(error);
    };

    try {
        const promesa = ctx.decodeAudioData(datos, terminar, fallar);
        if (promesa && typeof promesa.then === 'function') {
            promesa.then(terminar).catch(fallar);
        }
    } catch (error) {
        fallar(error);
    }
});

export const cargarSonido = (tipo) => {
    if (!RUTAS[tipo]) return Promise.resolve(null);
    if (buffers.has(tipo)) return Promise.resolve(buffers.get(tipo));
    if (promesas.has(tipo)) return promesas.get(tipo);

    const ctx = obtenerContexto();
    if (!ctx) return Promise.resolve(null);

    const promesa = fetch(RUTAS[tipo])
        .then((respuesta) => {
            if (!respuesta.ok) throw new Error(`No se pudo cargar ${tipo}`);
            return respuesta.arrayBuffer();
        })
        .then((datos) => decodificar(ctx, datos))
        .then((buffer) => {
            buffers.set(tipo, buffer);
            return buffer;
        })
        .catch(() => {
            promesas.delete(tipo);
            return null;
        });

    promesas.set(tipo, promesa);
    return promesa;
};

export const precargarSonidos = (tipos = Object.keys(RUTAS)) => {
    tipos.forEach((tipo) => {
        cargarSonido(tipo);
    });
};

const reproducirSilencio = (ctx) => {
    try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const fuente = ctx.createBufferSource();
        fuente.buffer = buffer;
        fuente.connect(ctx.destination);
        fuente.start(0);
    } catch {
        // Es solo un intento de desbloqueo.
    }
};

export const desbloquearAudio = async () => {
    const ctx = obtenerContexto();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
    }

    if (!desbloqueado) {
        reproducirSilencio(ctx);
        desbloqueado = true;
    }

    await Promise.all(Object.keys(RUTAS).map((tipo) => cargarSonido(tipo)));
    return ctx.state === 'running';
};

export const instalarDesbloqueoAudio = () => {
    if (desbloqueoInstalado || typeof window === 'undefined') return;
    desbloqueoInstalado = true;

    const desbloquear = () => {
        desbloquearAudio().finally(() => {
            window.removeEventListener('pointerdown', desbloquear, true);
            window.removeEventListener('touchend', desbloquear, true);
            window.removeEventListener('keydown', desbloquear, true);
        });
    };

    window.addEventListener('pointerdown', desbloquear, { capture: true, passive: true });
    window.addEventListener('touchend', desbloquear, { capture: true, passive: true });
    window.addEventListener('keydown', desbloquear, { capture: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden || !desbloqueado) return;
        if (contexto?.state === 'suspended') {
            contexto.resume().catch(() => {});
        }
    });
};

/**
 * Reproduce un sonido ya decodificado. Devuelve false si todavía no hay
 * contexto activo o buffer listo, para que el llamador use el respaldo HTML.
 */
export const reproducirSonidoWeb = (tipo, { volumen = 0.6 } = {}) => {
    const ctx = obtenerContexto();
    const buffer = buffers.get(tipo);

    if (!ctx || !buffer || ctx.state !== 'running') {
        if (ctx?.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return false;
    }

    try {
        const fuente = ctx.createBufferSource();
        const ganancia = ctx.createGain();

        fuente.buffer = buffer;
        ganancia.gain.value = volumen;
        fuente.connect(ganancia).connect(ctx.destination);
        fuente.start(0);
        return true;
    } catch {
        return false;
    }
};
