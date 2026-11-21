import {
    collection,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const valorConteo = (resultado) => (
    resultado.status === 'fulfilled' ? resultado.value.data().count : null
);

const listaDeDocumentos = (resultado) => (
    resultado.status === 'fulfilled'
        ? resultado.value.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
        : []
);

export const cargarResumenAdmin = async () => {
    const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const resultados = await Promise.allSettled([
        getCountFromServer(collection(db, 'usuarios')),
        getCountFromServer(query(collection(db, 'usuarios'), where('createdAt', '>=', haceSieteDias))),
        getCountFromServer(query(collection(db, 'sugerencias'), where('estado', '==', 'pendiente'))),
        getCountFromServer(collection(db, 'avisos')),
        getDocs(query(collection(db, 'sugerencias'), orderBy('creadoEn', 'desc'), limit(5))),
        getDocs(query(collection(db, 'admin_logs'), orderBy('creadoEn', 'desc'), limit(8))),
    ]);

    return {
        usuarios: valorConteo(resultados[0]),
        usuariosNuevos: valorConteo(resultados[1]),
        sugerenciasPendientes: valorConteo(resultados[2]),
        avisos: valorConteo(resultados[3]),
        sugerenciasRecientes: listaDeDocumentos(resultados[4]),
        logsRecientes: listaDeDocumentos(resultados[5]),
        hayErrores: resultados.some((resultado) => resultado.status === 'rejected'),
    };
};
