import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Construye el registro de auditoría de una acción administrativa.
 * Devuelve null si no hay usuario (no debería ocurrir en el panel).
 */
export const crearLogAdmin = ({ user, accion, objetivo = '', detalle = {} }) => {
    if (!user?.uid) return null;

    return {
        actorUid: user.uid,
        actorNombre: (user.displayName || user.email?.split('@')[0] || 'Admin').slice(0, 80),
        accion: String(accion || '').slice(0, 60),
        objetivo: String(objetivo || '').slice(0, 200),
        detalle: detalle && typeof detalle === 'object' ? detalle : {},
        creadoEn: Date.now(),
    };
};

export const registrarLogAdmin = async (datos) => {
    const log = crearLogAdmin(datos);
    if (!log) return null;
    const referencia = await addDoc(collection(db, 'admin_logs'), log);
    return referencia.id;
};

export const cargarLogsAdmin = async (limite = 20) => {
    const q = query(collection(db, 'admin_logs'), orderBy('creadoEn', 'desc'), limit(limite));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
};
