import {
    collection,
    doc,
    documentId,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { crearLogAdmin } from './adminLogs';
import { ordenarRegistros } from '../../utils/ordenRankings.js';
import { analizarDuplicadosRanking } from '../../utils/rankingGlobal.js';

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

const referenciaRanking = (juego, fecha) => {
    if (juego === 'reto') {
        return collection(db, 'ranking_reto', fecha, 'jugadores');
    }

    const nombre = COLECCIONES_RANKING[juego];
    if (!nombre) throw new Error('JUEGO_INVALIDO');
    return collection(db, nombre);
};

/**
 * Carga una página del ranking. Usa el identificador del documento como
 * cursor estable para poder pasar de 100 registros sin duplicados.
 */
export const cargarRankingAdmin = async ({ juego, fecha, limite = 100, despues = null }) => {
    const referencia = referenciaRanking(juego, fecha);
    const restricciones = [orderBy(documentId())];

    if (despues) restricciones.push(startAfter(despues));
    restricciones.push(limit(limite + 1));

    const snapshot = await getDocs(query(referencia, ...restricciones));
    const documentos = snapshot.docs.slice(0, limite);
    const registros = documentos.map((documento) => ({ id: documento.id, ...documento.data() }));

    return {
        registros: ordenarRegistros(registros, juego),
        ultimo: documentos.length > 0 ? documentos[documentos.length - 1] : null,
        hayMas: snapshot.docs.length > limite,
    };
};

export const cargarTodoRankingAdmin = async ({ juego, fecha, limiteTotal = 2000 }) => {
    const acumulado = [];
    let despues = null;
    let hayMas = true;

    while (hayMas && acumulado.length < limiteTotal) {
        const pagina = await cargarRankingAdmin({
            juego,
            fecha,
            limite: 100,
            despues,
        });
        acumulado.push(...pagina.registros);
        despues = pagina.ultimo;
        hayMas = pagina.hayMas && Boolean(despues);
    }

    return ordenarRegistros(acumulado, juego).slice(0, limiteTotal);
};

const camposNombre = (juego) => (juego === 'reto' ? 'nombre' : 'name');

export const renombrarRegistroRanking = async ({ juego, fecha, id, nuevoNombre, nombreAnterior, actor }) => {
    if (!id) throw new Error('REGISTRO_SIN_ID');

    const limpio = String(nuevoNombre || '').trim().slice(0, 60);
    if (!limpio) throw new Error('NOMBRE_VACIO');

    const referencia = juego === 'reto'
        ? doc(db, 'ranking_reto', fecha, 'jugadores', id)
        : doc(db, COLECCIONES_RANKING[juego], id);

    const batch = writeBatch(db);
    batch.update(referencia, { [camposNombre(juego)]: limpio });

    const log = crearLogAdmin({
        user: actor,
        accion: 'ranking_renombrado',
        objetivo: referencia.path,
        detalle: {
            juego,
            anterior: String(nombreAnterior || '').slice(0, 60),
            nuevo: limpio,
        },
    });
    if (log) batch.set(doc(collection(db, 'admin_logs')), log);
    await batch.commit();
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

/**
 * Analiza cuántos documentos se conservarían y cuántos se eliminarían al
 * dejar un solo récord por jugador. No modifica nada.
 */
export const analizarCompactacionRanking = async ({ juego, fecha, limiteTotal = 2000 }) => {
    const registros = await cargarTodoRankingAdmin({ juego, fecha, limiteTotal });
    return analizarDuplicadosRanking(registros, juego);
};

/**
 * Elimina los documentos sobrantes de cada jugador y conserva el mejor.
 * Se ejecuta en lotes de 400 para respetar el límite de Firestore.
 */
export const compactarRankingAdmin = async ({ juego, fecha, actor, limiteTotal = 2000 }) => {
    const analisis = await analizarCompactacionRanking({ juego, fecha, limiteTotal });

    if (analisis.eliminar.length === 0) {
        return { ...analisis, eliminados: 0 };
    }

    const referencia = referenciaRanking(juego, fecha);

    for (let inicio = 0; inicio < analisis.eliminar.length; inicio += 400) {
        const lote = analisis.eliminar.slice(inicio, inicio + 400);
        const batch = writeBatch(db);
        lote.forEach((registro) => {
            batch.delete(doc(referencia, registro.id));
        });
        await batch.commit();
    }

    const log = crearLogAdmin({
        user: actor,
        accion: 'ranking_compactado',
        objetivo: juego === 'reto' ? `ranking_reto/${fecha}` : COLECCIONES_RANKING[juego],
        detalle: {
            juego,
            fecha: juego === 'reto' ? fecha : null,
            eliminados: analisis.eliminar.length,
            conservados: analisis.conservar.length,
            gruposDuplicados: analisis.duplicados.length,
        },
    });

    if (log) {
        const batch = writeBatch(db);
        batch.set(doc(collection(db, 'admin_logs')), log);
        await batch.commit();
    }

    return { ...analisis, eliminados: analisis.eliminar.length };
};
