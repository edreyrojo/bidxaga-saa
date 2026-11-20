import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { almacen } from '../utils/almacen.js';

const claveTimestamp = (juego) => `progreso_${juego}_actualizadoEn`;

/**
 * Sincroniza el progreso de un juego (nivel, modo, categorías activas, etc.)
 * entre dispositivos usando `usuarios/{uid}.progreso.{juego}`.
 *
 * - Si no hay sesión, el progreso se queda en el almacenamiento local del invitado.
 * - Si la nube es más nueva, se devuelve `progresoRemoto` para aplicarlo.
 * - Si lo local es más nuevo, se conserva y el juego lo empuja a la nube.
 */
export function useProgresoJuego(juego, user) {
    const [progresoRemoto, setProgresoRemoto] = useState(null);
    const [listo, setListo] = useState(false);

    useEffect(() => {
        let activo = true;
        setListo(false);
        setProgresoRemoto(null);

        const currentUser = user || auth.currentUser;
        if (!currentUser) {
            setListo(true);
            return undefined;
        }

        const cargar = async () => {
            try {
                const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
                if (!activo) return;

                if (!snap.exists()) {
                    setListo(true);
                    return;
                }

                const data = snap.data();
                const nube = data.progreso?.[juego] || null;
                const timestampLocal = Number(almacen.getItem(claveTimestamp(juego))) || 0;
                const timestampNube = Number(nube?.actualizadoEn) || 0;

                if (nube && timestampNube >= timestampLocal) {
                    setProgresoRemoto(nube);
                }

                setListo(true);
            } catch (error) {
                console.error(`Error al cargar progreso de ${juego}:`, error);
                if (activo) setListo(true);
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, [juego, user]);

    const guardarProgreso = useCallback((datos) => {
        const actualizadoEn = Date.now();

        // Timestamp local: permite saber si el progreso de este dispositivo
        // es más nuevo que el de la nube la próxima vez que se abra el juego.
        almacen.setItem(claveTimestamp(juego), actualizadoEn);

        const currentUser = user || auth.currentUser;
        if (!currentUser) return;

        setDoc(
            doc(db, 'usuarios', currentUser.uid),
            { progreso: { [juego]: { ...datos, actualizadoEn } } },
            { merge: true }
        ).catch((error) => {
            console.error(`Error al guardar progreso de ${juego}:`, error);
        });
    }, [juego, user]);

    return { progresoRemoto, listo, guardarProgreso };
}
