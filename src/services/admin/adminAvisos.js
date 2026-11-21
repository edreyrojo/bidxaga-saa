import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { crearLogAdmin } from './adminLogs';

const REFERENCIA = collection(db, 'avisos');

export const cargarAvisosAdmin = async (limite = 50) => {
    const q = query(REFERENCIA, orderBy('fecha', 'desc'), limit(limite));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
};

const datosAviso = ({ titulo, mensaje, prioridad, activo, expiraEn }) => ({
    titulo: String(titulo || '').trim().slice(0, 120),
    mensaje: String(mensaje || '').trim().slice(0, 2000),
    prioridad: prioridad === 'alta' ? 'alta' : 'normal',
    activo: activo !== false,
    expiraEn: expiraEn ? Number(expiraEn) : null,
    actualizadoEn: Date.now(),
});

export const crearAviso = async ({ titulo, mensaje, prioridad, activo, expiraEn, actor }) => {
    const datos = {
        ...datosAviso({ titulo, mensaje, prioridad, activo, expiraEn }),
        fecha: new Date().toISOString(),
    };

    const batch = writeBatch(db);
    const referencia = doc(REFERENCIA);
    batch.set(referencia, datos);
    const log = crearLogAdmin({
        user: actor,
        accion: 'aviso_creado',
        objetivo: `avisos/${referencia.id}`,
        detalle: { titulo: datos.titulo, prioridad: datos.prioridad, activo: datos.activo },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
    return referencia.id;
};

export const actualizarAviso = async ({ id, titulo, mensaje, prioridad, activo, expiraEn, actor }) => {
    if (!id) throw new Error('AVISO_SIN_ID');
    const datos = datosAviso({ titulo, mensaje, prioridad, activo, expiraEn });

    const batch = writeBatch(db);
    batch.update(doc(db, 'avisos', id), datos);
    const log = crearLogAdmin({
        user: actor,
        accion: 'aviso_editado',
        objetivo: `avisos/${id}`,
        detalle: { titulo: datos.titulo, prioridad: datos.prioridad, activo: datos.activo },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
};

export const cambiarActivoAviso = async ({ id, activo, actor }) => {
    if (!id) throw new Error('AVISO_SIN_ID');
    const batch = writeBatch(db);
    batch.update(doc(db, 'avisos', id), { activo: Boolean(activo), actualizadoEn: Date.now() });
    const log = crearLogAdmin({
        user: actor,
        accion: activo ? 'aviso_activado' : 'aviso_desactivado',
        objetivo: `avisos/${id}`,
        detalle: { activo: Boolean(activo) },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
};

export const eliminarAviso = async ({ id, titulo, actor }) => {
    if (!id) throw new Error('AVISO_SIN_ID');
    const batch = writeBatch(db);
    batch.delete(doc(db, 'avisos', id));
    const log = crearLogAdmin({
        user: actor,
        accion: 'aviso_eliminado',
        objetivo: `avisos/${id}`,
        detalle: { titulo: String(titulo || '').slice(0, 120) },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
};

// Se mantienen para compatibilidad con el panel anterior.
export const eliminarAvisoSimple = async (id) => {
    if (!id) throw new Error('AVISO_SIN_ID');
    await deleteDoc(doc(db, 'avisos', id));
};

export const actualizarAvisoSimple = async (id, datos) => {
    if (!id) throw new Error('AVISO_SIN_ID');
    await updateDoc(doc(db, 'avisos', id), datos);
};
