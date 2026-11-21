import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig.js';
import { almacen } from '../utils/almacen.js';
import {
    calcularRacha,
    calcularRecompensa,
    fusionarRacha,
    fusionarReto,
    obtenerFechaLocal,
    rachaVigente,
} from '../utils/retoDiario.js';

const CLAVE_RETO = 'retoDiario';
const CLAVE_RACHA = 'rachaReto';

const leerJson = (clave) => {
    try {
        const crudo = almacen.getItem(clave);
        return crudo ? JSON.parse(crudo) : null;
    } catch {
        return null;
    }
};

const guardarJson = (clave, valor) => {
    try {
        if (valor) almacen.setItem(clave, JSON.stringify(valor));
        else almacen.removeItem(clave);
    } catch {
        // Sin almacenamiento, el estado en memoria sigue funcionando.
    }
};

/**
 * Reto diario y racha de días.
 *
 * - Invitado: todo vive en el almacenamiento local con espacio de nombres.
 * - Con cuenta: se sincroniza con `usuarios/{uid}` y gana el registro más reciente.
 * - La recompensa solo se entrega una vez por día.
 */
export function useRetoDiario(user) {
    const [hoy, setHoy] = useState(() => obtenerFechaLocal());
    const [reto, setReto] = useState(() => leerJson(CLAVE_RETO));
    const [racha, setRacha] = useState(() => leerJson(CLAVE_RACHA));

    // Detecta el cambio de día sin recargar la app.
    useEffect(() => {
        const intervalo = setInterval(() => {
            setHoy((actual) => {
                const nueva = obtenerFechaLocal();
                return actual === nueva ? actual : nueva;
            });
        }, 60 * 1000);
        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        let cancelado = false;

        const sincronizar = async () => {
            const localReto = leerJson(CLAVE_RETO);
            const localRacha = leerJson(CLAVE_RACHA);

            setReto(localReto);
            setRacha(localRacha);

            const currentUser = user || auth.currentUser;
            if (!currentUser) return;

            try {
                const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
                if (!snap.exists() || cancelado) return;

                // Releer por si el usuario completó el reto mientras llegaba la respuesta.
                const localRetoAhora = leerJson(CLAVE_RETO);
                const localRachaAhora = leerJson(CLAVE_RACHA);
                const data = snap.data();
                const { reto: retoElegido, subir: subirReto } = fusionarReto(localRetoAhora, data.retoDiario || null, hoy);
                const { racha: rachaElegida, subir: subirRacha } = fusionarRacha(localRachaAhora, data.rachaReto || null);

                if (cancelado) return;

                setReto(retoElegido);
                setRacha(rachaElegida);
                guardarJson(CLAVE_RETO, retoElegido);
                guardarJson(CLAVE_RACHA, rachaElegida);

                if (subirReto || subirRacha) {
                    const datos = {};
                    if (subirReto && retoElegido) datos.retoDiario = retoElegido;
                    if (subirRacha && rachaElegida) datos.rachaReto = rachaElegida;
                    await setDoc(doc(db, 'usuarios', currentUser.uid), datos, { merge: true });
                }
            } catch (error) {
                // Sin conexión: se conserva el reto local.
                console.warn('No se pudo sincronizar el reto diario:', error?.code || error?.message || error);
            }
        };

        sincronizar();
        return () => { cancelado = true; };
    }, [user, hoy]);

    const completarReto = useCallback((aciertos, total) => {
        const fecha = obtenerFechaLocal();
        const retoLocal = leerJson(CLAVE_RETO);

        if (retoLocal?.fecha === fecha) {
            return {
                yaCompletado: true,
                reto: retoLocal,
                recompensa: 0,
                racha: rachaVigente(leerJson(CLAVE_RACHA), fecha),
            };
        }

        const aciertosSeguros = Math.max(0, Math.min(Number(aciertos) || 0, Number(total) || 5));
        const recompensa = calcularRecompensa(aciertosSeguros);
        const rachaActual = leerJson(CLAVE_RACHA);
        const nuevaRacha = calcularRacha(rachaActual, fecha);
        const nuevoReto = {
            fecha,
            aciertos: aciertosSeguros,
            total: Number(total) || 5,
            recompensa,
            completadoEn: Date.now(),
        };

        guardarJson(CLAVE_RETO, nuevoReto);
        guardarJson(CLAVE_RACHA, nuevaRacha);
        setReto(nuevoReto);
        setRacha(nuevaRacha);
        setHoy(fecha);

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            setDoc(
                doc(db, 'usuarios', currentUser.uid),
                { retoDiario: nuevoReto, rachaReto: nuevaRacha },
                { merge: true }
            ).catch((error) => {
                console.warn('No se pudo guardar el reto diario en la nube:', error?.code || error?.message || error);
            });
        }

        return {
            yaCompletado: false,
            reto: nuevoReto,
            recompensa,
            racha: nuevaRacha.dias,
        };
    }, [user]);

    return {
        hoy,
        reto,
        racha,
        completadoHoy: reto?.fecha === hoy,
        rachaActual: rachaVigente(racha, hoy),
        recompensaMaxima: calcularRecompensa(5),
        completarReto,
    };
}
