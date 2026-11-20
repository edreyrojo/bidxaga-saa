import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { almacen } from '../utils/almacen.js';
import {
    CLAVES_LOCALES_VIDAS,
    VIDAS_POR_JUEGO,
    normalizarVidas,
    obtenerVidasJuego
} from '../utils/vidas';

const leerVidasLocales = (juego) => {
    const config = VIDAS_POR_JUEGO[juego];
    if (!config) return 0;
    try {
        const guardadas = parseInt(almacen.getItem(CLAVES_LOCALES_VIDAS[juego]), 10);
        if (Number.isFinite(guardadas)) {
            return Math.min(config.max, Math.max(0, guardadas));
        }
    } catch {
        // localStorage puede estar bloqueado; usamos el valor inicial.
    }
    return config.inicial;
};

/**
 * Fuente única de vidas para un juego.
 *
 * - Lee el saldo local (para invitados / sin conexión).
 * - Sincroniza con `usuarios/{uid}.vidas.{juego}`.
 * - Cada cambio se guarda en local y en Firestore con merge, sin pisar
 *   las vidas de los otros juegos.
 */
export function useVidasJuego(juego, user) {
    const config = VIDAS_POR_JUEGO[juego];
    const [vidas, setVidasState] = useState(() => leerVidasLocales(juego));
    const vidasRef = useRef(vidas);
    const colaEscrituraRef = useRef(Promise.resolve());

    useEffect(() => {
        vidasRef.current = vidas;
    }, [vidas]);

    useEffect(() => {
        let activo = true;
        let cancelarSuscripcion = null;
        const currentUser = user || auth.currentUser;

        if (!currentUser) {
            setVidasState(leerVidasLocales(juego));
            return undefined;
        }

        const userRef = doc(db, 'usuarios', currentUser.uid);

        // onSnapshot mantiene las vidas sincronizadas incluso si el jugador
        // compra una recarga en la tienda mientras la partida sigue abierta.
        cancelarSuscripcion = onSnapshot(
            userRef,
            (userSnap) => {
                if (!activo || !userSnap.exists() || userSnap.metadata?.hasPendingWrites) return;

                const data = userSnap.data();
                const mapa = normalizarVidas(data.vidas);
                const valorJuego = obtenerVidasJuego(mapa, juego);

                setVidasState(valorJuego);
                vidasRef.current = valorJuego;
                almacen.setItem(CLAVES_LOCALES_VIDAS[juego], String(valorJuego));

                const esFormatoAntiguo = !data.vidas || typeof data.vidas !== 'object' || Array.isArray(data.vidas);
                if (esFormatoAntiguo) {
                    setDoc(userRef, { vidas: mapa }, { merge: true }).catch((error) => {
                        console.error(`Error al migrar vidas de ${juego}:`, error);
                    });
                }
            },
            (error) => {
                console.error(`Error al escuchar vidas de ${juego}:`, error);
            }
        );

        return () => {
            activo = false;
            if (cancelarSuscripcion) cancelarSuscripcion();
        };
    }, [juego, user]);

    const guardarVidas = useCallback((nuevoValor) => {
        const valor = Math.min(config.max, Math.max(0, Math.floor(Number(nuevoValor) || 0)));

        setVidasState(valor);
        vidasRef.current = valor;
        almacen.setItem(CLAVES_LOCALES_VIDAS[juego], String(valor));

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            // No bloqueamos la UI esperando la red: el estado local ya cambió.
            // La cola conserva el orden si se pierden varias vidas seguidas.
            // merge anidado: solo actualiza la clave de este juego.
            colaEscrituraRef.current = colaEscrituraRef.current
                .catch(() => {})
                .then(() => setDoc(
                    doc(db, 'usuarios', currentUser.uid),
                    { vidas: { [juego]: valor } },
                    { merge: true }
                ))
                .catch((error) => {
                    console.error(`Error al guardar vidas de ${juego}:`, error);
                });
        }

        return valor;
    }, [juego, user, config.max]);

    const descontarVidas = useCallback(
        (cantidad = 1) => guardarVidas(vidasRef.current - cantidad),
        [guardarVidas]
    );

    const recargarVidas = useCallback(
        (cantidad) => guardarVidas(vidasRef.current + cantidad),
        [guardarVidas]
    );

    return {
        vidas,
        setVidas: guardarVidas,
        descontarVidas,
        recargarVidas,
        max: config.max,
        inicial: config.inicial
    };
}
