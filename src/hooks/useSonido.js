import { useCallback, useRef, useEffect } from 'react';
const SONIDOS_CONOCIDOS = ['click1', 'click2', 'click3'];

export function useSonido() {
    // Referencia para cachear los objetos de audio en memoria y evitar que el recolector los elimine
    const audiosRef = useRef({});
    const desbloqueadoRef = useRef(false);

    const obtenerAudio = useCallback((tipo) => {
        if (!audiosRef.current[tipo]) {
            const audio = new Audio(`/audio/${tipo}.mp3`);
            audio.preload = 'auto';
            audiosRef.current[tipo] = audio;
        }
        return audiosRef.current[tipo];
    }, []);

    // 📱 Precarga los 3 sonidos apenas se monta el componente que usa este hook
    useEffect(() => {
        SONIDOS_CONOCIDOS.forEach((tipo) => {
            try {
                obtenerAudio(tipo).load();
            } catch (e) {
                // Precarga best-effort: si falla, reproducirSonido igual lo crea al vuelo después
            }
        });
    }, [obtenerAudio]);
    useEffect(() => {
        if (desbloqueadoRef.current) return;

        const desbloquear = () => {
            if (desbloqueadoRef.current) return;
            desbloqueadoRef.current = true;

            SONIDOS_CONOCIDOS.forEach((tipo) => {
                try {
                    const audio = obtenerAudio(tipo);
                    const volumenOriginal = audio.volume;
                    audio.volume = 0;
                    audio.play()
                        .then(() => {
                            audio.pause();
                            audio.currentTime = 0;
                            audio.volume = volumenOriginal;
                        })
                        .catch(() => {
                            audio.volume = volumenOriginal;
                        });
                } catch (e) {
                    // Ignorado: el desbloqueo es best-effort
                }
            });

            window.removeEventListener('touchend', desbloquear);
            window.removeEventListener('click', desbloquear);
        };

        window.addEventListener('touchend', desbloquear, { once: true, passive: true });
        window.addEventListener('click', desbloquear, { once: true });

        return () => {
            window.removeEventListener('touchend', desbloquear);
            window.removeEventListener('click', desbloquear);
        };
    }, [obtenerAudio]);

    const reproducirSonido = useCallback((tipo) => {
        try {
            const audio = obtenerAudio(tipo);
            audio.currentTime = 0;
            audio.volume = 0.6;
            audio.play().catch((error) => {
                // Manejo silencioso si el navegador bloquea la reproduccion sin interaccion previa
            });
        } catch (e) {
            // Error al inicializar el objeto de audio
        }
    }, [obtenerAudio]);

    return { reproducirSonido };
}