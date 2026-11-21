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

const ACCION_POR_ESTADO = {
    aprobada: 'sugerencia_aprobada',
    rechazada: 'sugerencia_rechazada',
    convertida: 'sugerencia_convertida',
};

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

const datosRevision = ({ estado, nota, user }) => {
    const comunes = {
        estado,
        revisadoEn: Date.now(),
        revisadoPor: user?.uid || '',
        revisorNombre: (user?.displayName || user?.email?.split('@')[0] || 'Admin').slice(0, 80),
        notaAdmin: String(nota || '').trim().slice(0, 500),
    };

    if (estado === 'convertida') {
        comunes.convertidoEn = Date.now();
    }

    return comunes;
};

/**
 * Actualiza el estado de una sugerencia y registra la acción en el mismo lote.
 * Si falla cualquiera de las dos escrituras, no se aplica ninguna.
 */
export const revisarSugerencia = async ({ id, estado, nota = '', user }) => {
    if (!id) throw new Error('SUGERENCIA_SIN_ID');

    const batch = writeBatch(db);
    batch.update(doc(db, 'sugerencias', id), datosRevision({ estado, nota, user }));

    const log = crearLogAdmin({
        user,
        accion: ACCION_POR_ESTADO[estado] || 'sugerencia_actualizada',
        objetivo: `sugerencias/${id}`,
        detalle: { estado, nota: String(nota || '').trim().slice(0, 500) },
    });

    if (log) {
        batch.set(doc(collection(db, 'admin_logs')), log);
    }

    await batch.commit();
};

/**
 * Revisa varias sugerencias a la vez (aprobación/rechazo masivo).
 * Escribe todas las actualizaciones y un solo registro de auditoría por lote.
 */
export const revisarSugerenciasLote = async ({ ids = [], estado, nota = '', user }) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('SIN_SUGERENCIAS');

    const batch = writeBatch(db);

    ids.forEach((id) => {
        if (!id) return;
        batch.update(doc(db, 'sugerencias', id), datosRevision({ estado, nota, user }));
    });

    const log = crearLogAdmin({
        user,
        accion: estado === 'aprobada' ? 'sugerencias_aprobadas_lote' : 'sugerencias_rechazadas_lote',
        objetivo: `sugerencias (${ids.length})`,
        detalle: {
            estado,
            total: ids.length,
            ids,
            nota: String(nota || '').trim().slice(0, 500),
        },
    });

    if (log) {
        batch.set(doc(collection(db, 'admin_logs')), log);
    }

    await batch.commit();
};
