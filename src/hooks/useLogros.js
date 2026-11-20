import { useCallback, useEffect, useRef, useState } from 'react';
import { arrayUnion, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { buscarLogro } from '../data/logros.js';

/**
 * Lee y desbloquea logros del usuario.
 *
 * - Escucha `usuarios/{uid}.logrosDesbloqueados`.
 * - Usa `arrayUnion` para que no haya duplicados aunque se guarde dos veces.
 * - Dispara un evento global para que App muestre el aviso de logro.
 */
export function useLogros(user) {
    const [logrosDesbloqueados, setLogrosDesbloqueados] = useState([]);
    const [listo, setListo] = useState(false);
    const logrosRef = useRef([]);

    useEffect(() => {
        const currentUser = user || auth.currentUser;
        setListo(false);
        setLogrosDesbloqueados([]);
        logrosRef.current = [];

        if (!currentUser) {
            setListo(true);
            return undefined;
        }

        const userRef = doc(db, 'usuarios', currentUser.uid);
        const cancelar = onSnapshot(
            userRef,
            (snap) => {
                if (!snap.exists()) {
                    setListo(true);
                    return;
                }
                const data = snap.data();
                const logros = Array.isArray(data.logrosDesbloqueados)
                    ? data.logrosDesbloqueados
                    : [];
                logrosRef.current = logros;
                setLogrosDesbloqueados(logros);
                setListo(true);
            },
            (error) => {
                console.error('Error al escuchar logros:', error);
                setListo(true);
            }
        );

        return cancelar;
    }, [user]);

    const desbloquear = useCallback(async (logroId) => {
        const currentUser = user || auth.currentUser;
        const logro = buscarLogro(logroId);
        if (!currentUser || !logro || logrosRef.current.includes(logroId)) {
            return false;
        }

        // Optimista: el perfil y el banner se actualizan al instante.
        logrosRef.current = [...logrosRef.current, logroId];
        setLogrosDesbloqueados(logrosRef.current);

        try {
            await setDoc(
                doc(db, 'usuarios', currentUser.uid),
                { logrosDesbloqueados: arrayUnion(logroId) },
                { merge: true }
            );

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('logro-desbloqueado', { detail: logro }));
            }
            return true;
        } catch (error) {
            console.error(`Error al desbloquear el logro ${logroId}:`, error);
            logrosRef.current = logrosRef.current.filter((id) => id !== logroId);
            setLogrosDesbloqueados(logrosRef.current);
            return false;
        }
    }, [user]);

    return { logrosDesbloqueados, desbloquear, listo };
}
