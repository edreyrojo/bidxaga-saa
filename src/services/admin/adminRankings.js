import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { crearLogAdmin } from './adminLogs';
import { ordenarRegistros } from '../../utils/ordenRankings.js';

export const COLECCIONES_RANKING = {
    memorama: 'ranking',
    trivia: 'ranking_trivia',
    sopa: 'ranking_sopa',
    crucigrama: 'ranking_crucigrama',
};

export const JUEGOS_RANKING = [
    { id: 'memorama', nombre: 'Memorama' },
    { id: 'trivia', nombre: 'Reto Trivia' },
    { id: 'sopa', nombre: 'Sopa de Letras' },
    { id: 'crucigrama', nombre: 'Crucigrama' },
    { id: 'reto', nombre: 'Reto Diario' },
];

export const cargarRankingAdmin = async ({ juego, fecha, limite = 100 }) => {
    if (juego === 'reto') {
        const snapshot = await getDocs(query(collection(db, 'ranking_reto', fecha, 'jugadores'), limit(limite)));
        const registros = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        return ordenarRegistros(registros, juego);
    }

    const nombre = COLECCIONES_RANKING[juego];
    if (!nombre) throw new Error('JUEGO_INVALIDO');

    const snapshot = await getDocs(query(collection(db, nombre), orderBy('level', 'desc'), limit(limite)));
    const registros = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
    return ordenarRegistros(registros, juego);
};

export const eliminarRegistroRanking = async ({ juego, fecha, id, nombre, actor }) => {
    if (!id) throw new Error('REGISTRO_SIN_ID');

    const referencia = juego === 'reto'
        ? doc(db, 'ranking_reto', fecha, 'jugadores', id)
        : doc(db, COLECCIONES_RANKING[juego], id);

    const batch = writeBatch(db);
    batch.delete(referencia);
    const log = crearLogAdmin({
        user: actor,
        accion: 'ranking_eliminado',
        objetivo: referencia.path,
        detalle: { juego, nombre: String(nombre || '').slice(0, 60) },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
};
