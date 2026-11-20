import { useCallback, useEffect, useRef, useState } from 'react';
import {
    doc,
    getDoc,
    increment,
    onSnapshot,
    runTransaction,
    setDoc
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { almacen } from '../utils/almacen.js';

const CLAVE_TOTOPOS = 'totopos';
const CLAVE_HISTORICOS = 'totoposHistoricos';
const migracionesEnCurso = new Set();

const leerNumeroLocal = (clave, defecto = 0) => {
    try {
        const valor = parseInt(almacen.getItem(clave), 10);
        return Number.isFinite(valor) ? Math.max(0, valor) : defecto;
    } catch {
        return defecto;
    }
};

const normalizarNumero = (valor) => Math.max(0, Math.floor(Number(valor) || 0));

const normalizarHistoricos = (historicos, totopos) => {
    const h = normalizarNumero(historicos);
    return Math.max(h, normalizarNumero(totopos));
};

/**
 * 💰 Fuente única de totopos.
 *
 * - Invitado: vive en el almacenamiento local.
 * - Con cuenta: Firestore es la autoridad y se escucha con onSnapshot.
 * - Los premios usan `increment` (nunca un total absoluto).
 * - Los gastos usan una transacción: verifican saldo y descuentan de forma atómica.
 */
export function useTotopos(user) {
    const [totopos, setTotoposState] = useState(() => leerNumeroLocal(CLAVE_TOTOPOS));
    const [totoposHistoricos, setTotoposHistoricosState] = useState(() => (
        normalizarHistoricos(leerNumeroLocal(CLAVE_HISTORICOS), leerNumeroLocal(CLAVE_TOTOPOS))
    ));

    const totoposRef = useRef(totopos);
    const historicosRef = useRef(totoposHistoricos);

    const aplicarLocal = useCallback((nuevoTotal, nuevoHistorico = historicosRef.current) => {
        const total = normalizarNumero(nuevoTotal);
        const historico = normalizarHistoricos(nuevoHistorico, total);

        totoposRef.current = total;
        historicosRef.current = historico;

        setTotoposState(total);
        setTotoposHistoricosState(historico);

        try {
            almacen.setItem(CLAVE_TOTOPOS, String(total));
            almacen.setItem(CLAVE_HISTORICOS, String(historico));
        } catch {
            // Sin localStorage: el estado en memoria sigue funcionando.
        }
    }, []);

    useEffect(() => {
        const currentUser = user || auth.currentUser;

        if (!currentUser) {
            aplicarLocal(
                leerNumeroLocal(CLAVE_TOTOPOS),
                leerNumeroLocal(CLAVE_HISTORICOS)
            );
            return undefined;
        }

        const userRef = doc(db, 'usuarios', currentUser.uid);

        const cancelar = onSnapshot(
            userRef,
            (snap) => {
                if (!snap.exists() || snap.metadata?.hasPendingWrites) return;

                const data = snap.data();
                const total = normalizarNumero(data.totopos);
                const historico = normalizarHistoricos(data.totoposHistoricos, total);

                // Migración única: si la cuenta está vacía y este dispositivo
                // tiene totopos de invitado, los sumamos a la cuenta.
                const localTotal = normalizarNumero(almacen.getItem(CLAVE_TOTOPOS));
                const localHistorico = normalizarNumero(almacen.getItem(CLAVE_HISTORICOS));
                const puedeMigrarInvitado = !data.invitadoMigrado
                    && total === 0
                    && localTotal > 0
                    && !migracionesEnCurso.has(currentUser.uid);

                if (puedeMigrarInvitado) {
                    migracionesEnCurso.add(currentUser.uid);
                    const userRef = doc(db, 'usuarios', currentUser.uid);

                    runTransaction(db, async (transaction) => {
                        const actual = await transaction.get(userRef);
                        if (!actual.exists()) return;

                        const datosActuales = actual.data();
                        if (datosActuales.invitadoMigrado || normalizarNumero(datosActuales.totopos) > 0) {
                            return;
                        }

                        transaction.update(userRef, {
                            totopos: localTotal,
                            totoposHistoricos: Math.max(
                                normalizarNumero(datosActuales.totoposHistoricos),
                                localHistorico,
                                localTotal
                            ),
                            invitadoMigrado: true
                        });
                    }).catch((error) => {
                        console.error('Error al migrar totopos de invitado:', error);
                    }).finally(() => {
                        migracionesEnCurso.delete(currentUser.uid);
                    });

                    // Mantener el saldo local mientras la transacción termina.
                    return;
                }

                aplicarLocal(total, historico);
            },
            (error) => {
                console.error('Error al escuchar totopos:', error);
            }
        );

        return cancelar;
    }, [user, aplicarLocal]);

    const recargar = useCallback(async () => {
        const currentUser = user || auth.currentUser;

        if (!currentUser) {
            aplicarLocal(
                leerNumeroLocal(CLAVE_TOTOPOS),
                leerNumeroLocal(CLAVE_HISTORICOS)
            );
            return;
        }

        try {
            const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
            if (!snap.exists()) return;

            const data = snap.data();
            const total = normalizarNumero(data.totopos);
            aplicarLocal(total, normalizarHistoricos(data.totoposHistoricos, total));
        } catch (error) {
            console.error('Error al recargar totopos:', error);
        }
    }, [user, aplicarLocal]);

    /**
     * Suma totopos de forma atómica. `historico` controla si también cuenta
     * para el nivel de cuenta (los premios sí; los regalos pueden no hacerlo).
     */
    const abonar = useCallback(async (cantidad, { historico = true } = {}) => {
        const suma = normalizarNumero(cantidad);
        if (suma === 0) return totoposRef.current;

        const nuevosTotopos = totoposRef.current + suma;
        const nuevosHistoricos = historico
            ? historicosRef.current + suma
            : historicosRef.current;

        aplicarLocal(nuevosTotopos, nuevosHistoricos);

        const currentUser = user || auth.currentUser;
        if (!currentUser) return nuevosTotopos;

        try {
            const datos = { totopos: increment(suma) };
            if (historico) datos.totoposHistoricos = increment(suma);

            await setDoc(doc(db, 'usuarios', currentUser.uid), datos, { merge: true });
        } catch (error) {
            console.error('Error al abonar totopos:', error);
            await recargar();
        }

        return nuevosTotopos;
    }, [user, aplicarLocal, recargar]);

    /**
     * Ejecuta una compra/gasto:
     * - Verifica el saldo.
     * - Descuenta los totopos.
     * - Aplica campos extra (avatar, categoría, vidas) en la misma transacción.
     *
     * `construirExtra(data)` recibe el documento actual y devuelve los campos
     * adicionales que se deben escribir. Para invitados recibe `null`.
     */
    const comprar = useCallback(async (costo, construirExtra) => {
        const gasto = normalizarNumero(costo);
        const currentUser = user || auth.currentUser;

        if (!currentUser) {
            if (totoposRef.current < gasto) {
                return { ok: false, motivo: 'SALDO_INSUFICIENTE', saldo: totoposRef.current };
            }

            const nuevoSaldo = totoposRef.current - gasto;
            const extra = typeof construirExtra === 'function' ? (construirExtra(null) || {}) : {};
            aplicarLocal(nuevoSaldo);
            return { ok: true, saldo: nuevoSaldo, extra, data: null };
        }

        try {
            const userRef = doc(db, 'usuarios', currentUser.uid);

            const resultado = await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(userRef);
                if (!snap.exists()) throw new Error('USUARIO_NO_ENCONTRADO');

                const data = snap.data();
                const saldoActual = normalizarNumero(data.totopos);
                if (saldoActual < gasto) {
                    const error = new Error('SALDO_INSUFICIENTE');
                    error.saldo = saldoActual;
                    throw error;
                }

                const extra = typeof construirExtra === 'function' ? (construirExtra(data) || {}) : {};
                const nuevoSaldo = saldoActual - gasto;

                transaction.update(userRef, {
                    totopos: nuevoSaldo,
                    ...extra
                });

                return { saldo: nuevoSaldo, extra, data };
            });

            aplicarLocal(resultado.saldo);
            return { ok: true, ...resultado };
        } catch (error) {
            if (error?.saldo !== undefined) {
                return { ok: false, motivo: 'SALDO_INSUFICIENTE', saldo: error.saldo };
            }

            if (error?.codigo) {
                return { ok: false, motivo: error.codigo, error };
            }

            console.error('Error al gastar totopos:', error);
            await recargar();
            return { ok: false, motivo: 'ERROR', error };
        }
    }, [user, aplicarLocal, recargar]);

    const gastar = useCallback((costo) => comprar(costo), [comprar]);

    return {
        totopos,
        totoposHistoricos,
        abonar,
        gastar,
        comprar,
        recargar,
        setTotopos: aplicarLocal
    };
}
