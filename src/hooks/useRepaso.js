import { useCallback, useEffect, useState } from 'react';
import { EVENTO_REPASO, obtenerResumenRepaso } from '../utils/repaso';

/**
 * Lee el resumen de repaso del usuario actual y se actualiza cuando
 * los juegos registran aciertos o errores.
 */
export function useRepaso(user) {
    const [resumen, setResumen] = useState(() => obtenerResumenRepaso());

    const refrescar = useCallback(() => {
        setResumen(obtenerResumenRepaso());
    }, []);

    useEffect(() => {
        refrescar();

        const alActualizar = () => refrescar();
        window.addEventListener(EVENTO_REPASO, alActualizar);
        window.addEventListener('storage', alActualizar);

        return () => {
            window.removeEventListener(EVENTO_REPASO, alActualizar);
            window.removeEventListener('storage', alActualizar);
        };
    }, [refrescar, user?.uid]);

    return { ...resumen, refrescar };
}
