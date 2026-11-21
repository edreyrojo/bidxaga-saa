import { auth, db } from '../firebaseConfig.js';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';

const LIMITE_LOTE = 400;

const coleccionRepaso = (uid) => collection(db, 'usuarios', uid, 'repaso');

export const descargarRepaso = async (uid) => {
    const snapshot = await getDocs(coleccionRepaso(uid));
    return snapshot.docs.map((documento) => ({
        clave: documento.id,
        ...documento.data(),
    }));
};

export const subirRegistros = async (uid, registros) => {
    for (let inicio = 0; inicio < registros.length; inicio += LIMITE_LOTE) {
        const lote = writeBatch(db);
        registros.slice(inicio, inicio + LIMITE_LOTE).forEach(({ clave, ...datos }) => {
            lote.set(doc(db, 'usuarios', uid, 'repaso', clave), datos, { merge: true });
        });
        await lote.commit();
    }
};

/** Se llama después de cada acierto o error, si hay una sesión activa. */
export const subirRegistroRepaso = async (clave, registro) => {
    const actual = auth.currentUser;
    if (!actual || !clave) return;

    await setDoc(doc(db, 'usuarios', actual.uid, 'repaso', clave), registro, { merge: true });
};

/** Borra el historial remoto para que no reaparezca al iniciar sesión en otro equipo. */
export const borrarRepasoRemoto = async (limite = Date.now()) => {
    const actual = auth.currentUser;
    if (!actual) return;

    const snapshot = await getDocs(coleccionRepaso(actual.uid));
    const obsoletos = snapshot.docs.filter((documento) => (documento.data().ultimaVez || 0) <= limite);
    if (obsoletos.length === 0) return;

    for (let inicio = 0; inicio < obsoletos.length; inicio += LIMITE_LOTE) {
        const lote = writeBatch(db);
        obsoletos.slice(inicio, inicio + LIMITE_LOTE).forEach((documento) => lote.delete(documento.ref));
        await lote.commit();
    }
};
