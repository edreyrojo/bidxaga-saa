import { auth, db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const rutaRanking = (fecha) => collection(db, 'ranking_reto', fecha, 'jugadores');

const compararEntradas = (a, b) => {
    if ((b.aciertos || 0) !== (a.aciertos || 0)) return (b.aciertos || 0) - (a.aciertos || 0);
    if ((b.racha || 0) !== (a.racha || 0)) return (b.racha || 0) - (a.racha || 0);
    return (a.completadoEn || 0) - (b.completadoEn || 0);
};

/**
 * Lee el ranking del reto de una fecha. Se ordena en el cliente para no
 * necesitar índices compuestos en Firestore.
 */
export const cargarRankingReto = async (fecha, limite = 10) => {
    const snapshot = await getDocs(rutaRanking(fecha));
    const entradas = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
    }));

    return entradas.sort(compararEntradas).slice(0, limite);
};

/**
 * Guarda o actualiza la participación del usuario autenticado.
 * Conserva el mejor intento del día: no reemplaza un récord por uno peor.
 * Devuelve false si no hay sesión.
 */
export const guardarRankingReto = async ({ fecha, aciertos, total, racha, nombre }) => {
    const actual = auth.currentUser;
    if (!actual) return false;

    const nombreLimpio = (nombre || actual.displayName || actual.email?.split('@')[0] || 'Jugador')
        .trim()
        .slice(0, 60);

    const referencia = doc(db, 'ranking_reto', fecha, 'jugadores', actual.uid);
    const nuevo = {
        uid: actual.uid,
        fecha,
        nombre: nombreLimpio || 'Jugador',
        aciertos: Math.max(0, Math.min(5, Number(aciertos) || 0)),
        total: Math.max(1, Number(total) || 5),
        racha: Math.max(0, Number(racha) || 0),
        completadoEn: Date.now(),
    };

    const existente = await getDoc(referencia);

    if (existente.exists()) {
        const anterior = existente.data();
        const ratio = (entrada) => {
            const totalEntrada = Number(entrada.total) || 1;
            return (Number(entrada.aciertos) || 0) / totalEntrada;
        };

        const esMejor = ratio(nuevo) > ratio(anterior)
            || (ratio(nuevo) === ratio(anterior) && nuevo.racha > (Number(anterior.racha) || 0));

        if (!esMejor) return true;
    }

    await setDoc(referencia, nuevo, { merge: true });

    return true;
};
