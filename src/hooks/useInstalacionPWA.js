import { useEffect, useState } from 'react';

/**
 * Captura el evento `beforeinstallprompt` para poder lanzar la instalación
 * nativa en Android/Chrome. Si no está disponible, la app muestra instrucciones.
 */
export function useInstalacionPWA() {
    const [evento, setEvento] = useState(null);
    const [instalada, setInstalada] = useState(false);

    useEffect(() => {
        const alPreguntar = (event) => {
            event.preventDefault();
            setEvento(event);
        };

        const alInstalar = () => {
            setInstalada(true);
            setEvento(null);
        };

        window.addEventListener('beforeinstallprompt', alPreguntar);
        window.addEventListener('appinstalled', alInstalar);

        return () => {
            window.removeEventListener('beforeinstallprompt', alPreguntar);
            window.removeEventListener('appinstalled', alInstalar);
        };
    }, []);

    const instalar = async () => {
        if (!evento) return 'no-disponible';

        evento.prompt();
        const { outcome } = await evento.userChoice;
        setEvento(null);
        return outcome;
    };

    return { disponible: Boolean(evento), instalada, instalar };
}
