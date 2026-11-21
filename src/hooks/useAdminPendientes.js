import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Cuenta en tiempo real las sugerencias pendientes para mostrar un badge
 * en el acceso de administración. Solo se suscribe si el usuario es admin.
 */
export function useAdminPendientes(user, esAdmin) {
    const [pendientes, setPendientes] = useState(0);

    useEffect(() => {
        if (!esAdmin || !user?.uid) {
            setPendientes(0);
            return undefined;
        }

        const q = query(collection(db, 'sugerencias'), where('estado', '==', 'pendiente'));
        const cancelar = onSnapshot(
            q,
            (snapshot) => setPendientes(snapshot.size),
            (error) => {
                console.warn('No se pudo escuchar las sugerencias pendientes:', error?.code || error?.message);
                setPendientes(0);
            }
        );

        return cancelar;
    }, [esAdmin, user?.uid]);

    return pendientes;
}
