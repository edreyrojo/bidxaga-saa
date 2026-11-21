import { useEffect, useRef } from 'react';
import { fusionarRepasoNube, obtenerBorradoEn } from '../utils/repaso.js';
import { borrarRepasoRemoto, descargarRepaso, subirRegistros } from '../utils/repasoNube.js';

/**
 * Al iniciar sesión descarga el repaso de Firestore, lo combina con el local
 * y sube las palabras que este dispositivo tenga más actualizadas.
 */
export function useSyncRepaso(user) {
    const sincronizado = useRef(null);

    useEffect(() => {
        const uid = user?.uid;
        if (!uid || sincronizado.current === uid) return;

        sincronizado.current = uid;
        let cancelado = false;

        const sincronizar = async () => {
            try {
                // Si el usuario borró su historial sin conexión, se limpia ahora.
                const borradoEn = obtenerBorradoEn();
                if (borradoEn > 0) {
                    await borrarRepasoRemoto(borradoEn);
                }

                const remotos = await descargarRepaso(uid);
                if (cancelado) return;

                const { subir } = fusionarRepasoNube(remotos);
                if (subir.length > 0) {
                    await subirRegistros(uid, subir);
                }
            } catch (error) {
                // Sin conexión o sin permisos: se conserva el repaso local.
                sincronizado.current = null;
                console.warn('No se pudo sincronizar el repaso:', error?.code || error?.message || error);
            }
        };

        sincronizar();

        return () => {
            cancelado = true;
        };
    }, [user?.uid]);
}
