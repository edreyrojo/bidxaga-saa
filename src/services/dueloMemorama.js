import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    runTransaction,
    setDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
    DURACION_SALA_MS,
    DURACION_TURNO_MS,
    MODOS_DUELO,
    PAREJAS_DUELO,
    calcularGanador,
    crearMazoDuelo,
    esModoValido,
    generarCodigoSala,
    normalizarCodigo,
    siguienteJugador,
} from '../utils/dueloMemorama.js';

const MAX_JUGADORES = 2;

const nombreSeguro = (nombre, user) => {
    const texto = String(
        nombre || user?.displayName || user?.email?.split('@')[0] || 'Jugador'
    ).trim();
    return texto.slice(0, 40) || 'Jugador';
};

const modoSeguro = (modo) => (esModoValido(modo) ? modo : MODOS_DUELO.RAPIDA);

const expiracionTurno = (modo) => (
    modo === MODOS_DUELO.RAPIDA
        ? Timestamp.fromMillis(Date.now() + DURACION_TURNO_MS)
        : null
);

const expiracionSala = () => Timestamp.fromMillis(Date.now() + DURACION_SALA_MS);

const referenciaPresencia = (codigo, uid) => doc(
    db,
    'salas',
    normalizarCodigo(codigo),
    'presencia',
    uid
);

const referenciaSala = (codigo) => doc(db, 'salas', normalizarCodigo(codigo));

export const crearSala = async ({ user, nombre, modo = MODOS_DUELO.RAPIDA }) => {
    if (!user?.uid) throw new Error('SIN_SESION');

    const modoFinal = modoSeguro(modo);

    for (let intento = 0; intento < 6; intento += 1) {
        const codigo = generarCodigoSala();
        const referencia = referenciaSala(codigo);
        const ahora = Date.now();

        try {
            await runTransaction(db, async (transaccion) => {
                const actual = await transaccion.get(referencia);
                if (actual.exists()) throw new Error('CODIGO_OCUPADO');

                transaccion.set(referencia, {
                    codigo,
                    version: 1,
                    estado: 'esperando',
                    modo: modoFinal,
                    anfitrion: user.uid,
                    jugadores: {
                        [user.uid]: {
                            nombre: nombreSeguro(nombre, user),
                            unidoEn: ahora,
                        },
                    },
                    orden: [user.uid],
                    turno: null,
                    turnoExpiraEn: null,
                    puntajes: { [user.uid]: 0 },
                    mazo: [],
                    volteadas: [],
                    bloqueado: false,
                    resuelto: null,
                    ganador: null,
                    creadoEn: ahora,
                    actualizadoEn: ahora,
                    expiraEn: expiracionSala(),
                });
            });

            return codigo;
        } catch (error) {
            if (!String(error?.message || '').includes('CODIGO_OCUPADO')) throw error;
        }
    }

    throw new Error('SIN_CODIGO');
};

export const unirseSala = async ({ codigo, user, nombre }) => {
    if (!user?.uid) throw new Error('SIN_SESION');

    const limpio = normalizarCodigo(codigo);
    if (limpio.length !== 6) throw new Error('CODIGO_INVALIDO');

    const referencia = referenciaSala(limpio);

    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) throw new Error('SALA_NO_EXISTE');

        const datos = actual.data();
        const jugadores = datos.jugadores || {};

        if (jugadores[user.uid]) return;
        if (datos.estado !== 'esperando') throw new Error('SALA_INICIADA');
        if (Object.keys(jugadores).length >= MAX_JUGADORES) throw new Error('SALA_LLENA');

        transaccion.update(referencia, {
            jugadores: {
                ...jugadores,
                [user.uid]: {
                    nombre: nombreSeguro(nombre, user),
                    unidoEn: Date.now(),
                },
            },
            actualizadoEn: Date.now(),
        });
    });

    return limpio;
};

export const iniciarDuelo = async ({ codigo, user }) => {
    if (!user?.uid) throw new Error('SIN_SESION');

    const referencia = referenciaSala(codigo);
    const mazo = crearMazoDuelo(PAREJAS_DUELO);

    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) throw new Error('SALA_NO_EXISTE');

        const datos = actual.data();
        if (datos.anfitrion !== user.uid) throw new Error('SOLO_ANFITRION');

        const jugadores = Object.keys(datos.jugadores || {});
        if (jugadores.length !== MAX_JUGADORES) throw new Error('FALTAN_JUGADORES');

        const rival = jugadores.find((uid) => uid !== user.uid);
        const orden = [user.uid, rival];
        const modo = modoSeguro(datos.modo);

        transaccion.update(referencia, {
            estado: 'jugando',
            orden,
            turno: orden[0],
            turnoExpiraEn: expiracionTurno(modo),
            puntajes: { [orden[0]]: 0, [orden[1]]: 0 },
            mazo,
            volteadas: [],
            bloqueado: false,
            resuelto: null,
            ganador: null,
            iniciadoEn: Date.now(),
            actualizadoEn: Date.now(),
            expiraEn: expiracionSala(),
        });
    });
};

/**
 * Voltea una carta en el turno actual. Si completa la pareja, suma y conserva
 * el turno; si falla, bloquea la mesa hasta que se cierre el turno.
 */
export const voltearCarta = async ({ codigo, user, cartaId }) => {
    if (!user?.uid) throw new Error('SIN_SESION');

    const referencia = referenciaSala(codigo);

    return runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) throw new Error('SALA_NO_EXISTE');

        const datos = actual.data();
        if (datos.estado !== 'jugando') throw new Error('PARTIDA_NO_ACTIVA');
        if (datos.turno !== user.uid) throw new Error('NO_ES_TU_TURNO');
        if (datos.bloqueado) return { ignorada: true };

        const mazo = datos.mazo || [];
        const carta = mazo.find((item) => item.id === cartaId);
        const volteadas = datos.volteadas || [];

        if (!carta || carta.matched) return { ignorada: true };
        if (volteadas.includes(cartaId)) return { ignorada: true };
        if (volteadas.length >= 2) return { ignorada: true };

        const nuevas = [...volteadas, cartaId];

        if (nuevas.length === 1) {
            transaccion.update(referencia, {
                volteadas: nuevas,
                resuelto: null,
                actualizadoEn: Date.now(),
            });
            return { ignorada: false, acierto: null };
        }

        const [idPrimera, idSegunda] = nuevas;
        const primera = mazo.find((item) => item.id === idPrimera);
        const segunda = mazo.find((item) => item.id === idSegunda);

        if (!primera || !segunda) return { ignorada: true };

        const acierto = primera.pairId === segunda.pairId;

        if (!acierto) {
            transaccion.update(referencia, {
                volteadas: nuevas,
                bloqueado: true,
                resuelto: 'fallo',
                actualizadoEn: Date.now(),
            });
            return { ignorada: false, acierto: false };
        }

        const mazoActualizado = mazo.map((item) => (
            item.pairId === primera.pairId ? { ...item, matched: true } : item
        ));
        const puntajes = {
            ...(datos.puntajes || {}),
            [user.uid]: (Number(datos.puntajes?.[user.uid]) || 0) + 1,
        };
        const quedan = mazoActualizado.some((item) => !item.matched);

        transaccion.update(referencia, {
            mazo: mazoActualizado,
            puntajes,
            volteadas: [],
            bloqueado: false,
            resuelto: 'acierto',
            estado: quedan ? 'jugando' : 'terminado',
            turno: quedan ? user.uid : null,
            turnoExpiraEn: quedan ? expiracionTurno(modoSeguro(datos.modo)) : null,
            ganador: quedan ? null : calcularGanador(puntajes, datos.orden || []),
            actualizadoEn: Date.now(),
        });

        return { ignorada: false, acierto: true, terminado: !quedan };
    });
};

/**
 * Cierra el turno después de un fallo. Puede llamarlo cualquiera de los dos
 * jugadores; la transacción es idempotente.
 */
export const cerrarTurno = async ({ codigo }) => {
    const referencia = referenciaSala(codigo);

    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) return;

        const datos = actual.data();
        if (datos.estado !== 'jugando' || !datos.bloqueado || datos.resuelto !== 'fallo') return;

        const orden = datos.orden?.length === 2
            ? datos.orden
            : Object.keys(datos.jugadores || {});
        const siguiente = siguienteJugador(orden, datos.turno);

        transaccion.update(referencia, {
            volteadas: [],
            bloqueado: false,
            resuelto: null,
            turno: siguiente,
            turnoExpiraEn: expiracionTurno(modoSeguro(datos.modo)),
            actualizadoEn: Date.now(),
        });
    });
};

/**
 * Reclama el turno cuando el temporizador del modo rápido ya expiró.
 * Puede llamarlo cualquiera de los dos jugadores.
 */
export const reclamarTurno = async ({ codigo, user }) => {
    if (!user?.uid) throw new Error('SIN_SESION');

    const referencia = referenciaSala(codigo);

    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) throw new Error('SALA_NO_EXISTE');

        const datos = actual.data();
        if (datos.estado !== 'jugando') return;
        if (modoSeguro(datos.modo) !== MODOS_DUELO.RAPIDA) throw new Error('MODO_SIN_TIEMPO');

        const expira = datos.turnoExpiraEn?.toMillis?.() || 0;
        if (!expira || expira > Date.now()) throw new Error('TURNO_NO_EXPIRADO');

        const orden = datos.orden?.length === 2
            ? datos.orden
            : Object.keys(datos.jugadores || {});
        const siguiente = siguienteJugador(orden, datos.turno);

        transaccion.update(referencia, {
            volteadas: [],
            bloqueado: false,
            resuelto: null,
            turno: siguiente,
            turnoExpiraEn: expiracionTurno(MODOS_DUELO.RAPIDA),
            actualizadoEn: Date.now(),
        });
    });
};

export const reiniciarDuelo = async ({ codigo, user }) => {
    if (!user?.uid) throw new Error('SIN_SESION');

    const referencia = referenciaSala(codigo);
    const mazo = crearMazoDuelo(PAREJAS_DUELO);

    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) throw new Error('SALA_NO_EXISTE');

        const datos = actual.data();
        if (datos.anfitrion !== user.uid) throw new Error('SOLO_ANFITRION');

        const jugadores = Object.keys(datos.jugadores || {});
        if (jugadores.length !== MAX_JUGADORES) throw new Error('FALTAN_JUGADORES');

        const rival = jugadores.find((uid) => uid !== user.uid);
        const orden = [user.uid, rival];
        const modo = modoSeguro(datos.modo);

        transaccion.update(referencia, {
            estado: 'jugando',
            orden,
            turno: orden[0],
            turnoExpiraEn: expiracionTurno(modo),
            puntajes: { [orden[0]]: 0, [orden[1]]: 0 },
            mazo,
            volteadas: [],
            bloqueado: false,
            resuelto: null,
            ganador: null,
            iniciadoEn: Date.now(),
            actualizadoEn: Date.now(),
            expiraEn: expiracionSala(),
        });
    });
};

export const salirSala = async ({ codigo, user }) => {
    if (!user?.uid) return;

    const referencia = referenciaSala(codigo);

    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(referencia);
        if (!actual.exists()) return;

        const datos = actual.data();

        if (datos.anfitrion === user.uid) {
            transaccion.delete(referencia);
            return;
        }

        if (!datos.jugadores?.[user.uid]) return;

        const jugadores = { ...datos.jugadores };
        delete jugadores[user.uid];

        transaccion.update(referencia, {
            jugadores,
            actualizadoEn: Date.now(),
        });
    });

    await eliminarPresencia({ codigo, user });
};

export const latirPresencia = async ({ codigo, user, nombre }) => {
    if (!user?.uid) return;

    await setDoc(
        referenciaPresencia(codigo, user.uid),
        {
            uid: user.uid,
            nombre: nombreSeguro(nombre, user),
            ultimaVez: Date.now(),
            conectado: true,
        },
        { merge: true }
    );
};

export const eliminarPresencia = async ({ codigo, user }) => {
    if (!user?.uid) return;

    try {
        await deleteDoc(referenciaPresencia(codigo, user.uid));
    } catch {
        // La presencia es best-effort.
    }
};

export const suscribirPresencia = (codigo, alCambiar, alFallar) => {
    const limpio = normalizarCodigo(codigo);
    if (limpio.length !== 6) {
        alCambiar?.({});
        return () => {};
    }

    return onSnapshot(
        collection(db, 'salas', limpio, 'presencia'),
        (instantanea) => {
            const mapa = {};
            instantanea.forEach((documento) => {
                mapa[documento.id] = documento.data();
            });
            alCambiar?.(mapa);
        },
        (error) => {
            alFallar?.(error);
        }
    );
};

export const suscribirSala = (codigo, alCambiar, alFallar) => {
    const limpio = normalizarCodigo(codigo);
    if (limpio.length !== 6) {
        alCambiar?.(null);
        return () => {};
    }

    return onSnapshot(
        doc(collection(db, 'salas'), limpio),
        (instantanea) => {
            if (!instantanea.exists()) {
                alCambiar?.(null);
                return;
            }
            alCambiar?.({ id: instantanea.id, ...instantanea.data() });
        },
        (error) => {
            alFallar?.(error);
        }
    );
};
