import { useCallback, useRef, useEffect } from 'react';
import {
    desbloquearAudio,
    instalarDesbloqueoAudio,
    precargarSonidos,
    reproducirSonidoWeb,
} from '../utils/audioEngine.js';

const SONIDOS_CONOCIDOS = ['click1', 'click2', 'click3'];
const NOMBRES_SONIDO = { 1: 'click1', 2: 'click2', 3: 'click3' };

export function useSonido() {
    // Respaldo con HTMLAudio para navegadores sin Web Audio o cuando el
    // contexto todavía no está activo.
    const audiosRef = useRef({});

    const obtenerAudio = useCallback((tipo) => {
        if (!audiosRef.current[tipo]) {
            const audio = new Audio(`/audio/${tipo}.mp3`);
            audio.preload = 'auto';
            audio.playsInline = true;
            audiosRef.current[tipo] = audio;
        }
        return audiosRef.current[tipo];
    }, []);

    useEffect(() => {
        instalarDesbloqueoAudio();
        precargarSonidos();

        SONIDOS_CONOCIDOS.forEach((tipo) => {
            try {
                obtenerAudio(tipo).load();
            } catch {
                // La precarga es best-effort.
            }
        });

        // En iOS el primer gesto debe ocurrir dentro del contexto de audio.
        const desbloquearRespaldo = () => {
            desbloquearAudio().catch(() => {});
        };

        window.addEventListener('touchend', desbloquearRespaldo, { once: true, passive: true });
        window.addEventListener('click', desbloquearRespaldo, { once: true });

        return () => {
            window.removeEventListener('touchend', desbloquearRespaldo);
            window.removeEventListener('click', desbloquearRespaldo);
        };
    }, [obtenerAudio]);

    const reproducirRespaldo = useCallback((tipo) => {
        try {
            const audio = obtenerAudio(tipo);
            audio.currentTime = 0;
            audio.volume = 0.6;
            audio.play().catch(() => {
                // El navegador puede bloquearlo antes del primer gesto.
            });
        } catch {
            // Sin audio disponible.
        }
    }, [obtenerAudio]);

    const reproducirSonido = useCallback((tipo = 'click1') => {
        const nombre = NOMBRES_SONIDO[tipo] || tipo;
        if (reproducirSonidoWeb(nombre)) return;
        reproducirRespaldo(nombre);
    }, [reproducirRespaldo]);

    return { reproducirSonido };
}
