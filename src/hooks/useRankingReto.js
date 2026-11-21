import { useCallback, useEffect, useState } from 'react';
import { cargarRankingReto } from '../utils/rankingReto.js';

export function useRankingReto(fecha) {
    const [ranking, setRanking] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const refrescar = useCallback(async () => {
        setCargando(true);
        setError(null);

        try {
            const entradas = await cargarRankingReto(fecha);
            setRanking(entradas);
        } catch (err) {
            console.warn('No se pudo cargar el ranking del reto:', err?.code || err?.message || err);
            setError(err?.code || 'ERROR');
        } finally {
            setCargando(false);
        }
    }, [fecha]);

    useEffect(() => {
        refrescar();
    }, [refrescar]);

    return { ranking, cargando, error, refrescar };
}
