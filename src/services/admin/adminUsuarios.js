import {
    collection,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
    writeBatch,
    increment,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { crearLogAdmin } from './adminLogs';

const REFERENCIA = collection(db, 'usuarios');

const mapear = (documento) => ({ id: documento.id, ...documento.data() });

export const cargarUsuariosPagina = async ({ limite = 25, despues = null } = {}) => {
    const restricciones = [orderBy('email')];
    if (despues) restricciones.push(startAfter(despues));
    restricciones.push(limit(limite));

    const snapshot = await getDocs(query(REFERENCIA, ...restricciones));
    return {
        usuarios: snapshot.docs.map(mapear),
        ultimo: snapshot.docs[snapshot.docs.length - 1] || null,
        hayMas: snapshot.size === limite,
    };
};

export const buscarUsuarios = async (texto) => {
    const limpio = texto.trim();
    if (!limpio) return [];

    const encontrados = new Map();
    const agregar = (documento) => encontrados.set(documento.id, mapear(documento));

    if (limpio.includes('@')) {
        const exacto = await getDocs(query(REFERENCIA, where('email', '==', limpio.toLowerCase()), limit(5)));
        exacto.docs.forEach(agregar);
    } else if (/^[A-Za-z0-9]{20,}$/.test(limpio)) {
        const porId = await getDoc(doc(db, 'usuarios', limpio));
        if (porId.exists()) agregar(porId);
    }

    const termino = limpio.toLowerCase();
    const fin = `${termino}\uf8ff`;

    const [porEmail, porNombre] = await Promise.all([
        getDocs(query(REFERENCIA, where('email', '>=', termino), where('email', '<=', fin), limit(25))),
        getDocs(query(REFERENCIA, where('nombre', '>=', limpio), where('nombre', '<=', `${limpio}\uf8ff`), limit(25))),
    ]);

    porEmail.docs.forEach(agregar);
    porNombre.docs.forEach(agregar);

    return [...encontrados.values()].sort((a, b) => (
        String(a.email || '').localeCompare(String(b.email || ''))
    ));
};

export const cargarUsuarioDetalle = async (uid) => {
    if (!uid) return null;
    const snapshot = await getDoc(doc(db, 'usuarios', uid));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const cargarRepasoUsuario = async (uid, limite = 100) => {
    if (!uid) return [];
    const snapshot = await getDocs(query(collection(db, 'usuarios', uid, 'repaso'), limit(limite)));
    return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
};

export const cargarTodosLosUsuarios = async (limiteTotal = 2000) => {
    const todos = [];
    let despues = null;
    let hayMas = true;

    while (hayMas && todos.length < limiteTotal) {
        const pagina = await cargarUsuariosPagina({ limite: 100, despues });
        todos.push(...pagina.usuarios);
        despues = pagina.ultimo;
        hayMas = pagina.hayMas;
        if (!despues) break;
    }

    return todos.slice(0, limiteTotal);
};

export const contarAdminsPorRol = async () => {
    const snapshot = await getCountFromServer(query(REFERENCIA, where('role', '==', 'admin')));
    return snapshot.data().count;
};

export const actualizarRolUsuario = async ({ uid, rol, actor }) => {
    if (!uid) throw new Error('USUARIO_SIN_UID');
    if (!['', 'admin'].includes(rol)) throw new Error('ROL_INVALIDO');

    if (rol !== 'admin') {
        const admins = await contarAdminsPorRol();
        if (admins <= 1) throw new Error('ULTIMO_ADMIN');
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'usuarios', uid), { role: rol });
    const log = crearLogAdmin({
        user: actor,
        accion: rol === 'admin' ? 'rol_admin_asignado' : 'rol_admin_removido',
        objetivo: `usuarios/${uid}`,
        detalle: { rol },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
};

export const regalarTotoposUsuario = async ({ uid, cantidad, motivo = '', contarHistorico = false, actor }) => {
    const monto = Math.floor(Number(cantidad));
    if (!uid) throw new Error('USUARIO_SIN_UID');
    if (!Number.isFinite(monto) || monto <= 0 || monto > 10000) throw new Error('CANTIDAD_INVALIDA');

    const datos = { totopos: increment(monto) };
    if (contarHistorico) datos.totoposHistoricos = increment(monto);

    const batch = writeBatch(db);
    batch.update(doc(db, 'usuarios', uid), datos);
    const log = crearLogAdmin({
        user: actor,
        accion: 'totopos_regalados',
        objetivo: `usuarios/${uid}`,
        detalle: { cantidad: monto, motivo: String(motivo || '').slice(0, 300), contarHistorico: Boolean(contarHistorico) },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
};
