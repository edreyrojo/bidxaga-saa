import {
    collection,
    doc,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { crearLogAdmin } from './adminLogs';

const REFERENCIA = collection(db, 'sugerencias');

export const cargarSugerencias = async (limite = 100) => {
    const q = query(REFERENCIA, orderBy('creadoEn', 'desc'), limit(limite));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
};

export const contarSugerenciasPendientes = async () => {
    const q = query(REFERENCIA, where('estado', '==', 'pendiente'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
};

/**
 * Actualiza el estado de una sugerencia y registra la acción en el mismo lote.
 * Si falla cualquiera de las dos escrituras, no se aplica ninguna.
 */
export const revisarSugerencia = async ({ id, estado, nota = '', user }) => {
    if (!id) throw new Error('SUGERENCIA_SIN_ID');

    const batch = writeBatch(db);
    batch.update(doc(db, 'sugerencias', id), {
        estado,
        revisadoEn: Date.now(),
        revisadoPor: user?.uid || '',
        revisorNombre: (user?.displayName || user?.email?.split('@')[0] || 'Admin').slice(0, 80),
        notaAdmin: String(nota || '').trim().slice(0, 500),
    });

    const log = crearLogAdmin({
        user,
        accion: estado === 'aprobada' ? 'sugerencia_aprobada' : 'sugerencia_rechazada',
        objetivo: `sugerencias/${id}`,
        detalle: { estado, nota: String(nota || '').trim().slice(0, 500) },
    });

    if (log) {
        batch.set(doc(collection(db, 'admin_logs')), log);
    }

    await batch.commit();
};
