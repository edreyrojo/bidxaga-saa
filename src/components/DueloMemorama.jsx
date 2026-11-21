import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icono from './Icono.jsx';
import { useSonido } from '../hooks/useSonido.js';
import { almacen } from '../utils/almacen.js';
import { compartirTexto } from '../utils/compartir.js';
import {
    MODOS_DUELO,
    PAREJAS_DUELO,
    normalizarCodigo,
} from '../utils/dueloMemorama.js';
import {
    cerrarTurno,
    crearSala,
    eliminarPresencia,
    iniciarDuelo,
    latirPresencia,
    reclamarTurno,
    reiniciarDuelo,
    salirSala,
    suscribirPresencia,
    suscribirSala,
    unirseSala,
    voltearCarta,
} from '../services/dueloMemorama.js';

const CLAVE_SALA = 'dueloCodigo';

const MENSAJES_ERROR = {
    SIN_SESION: 'Inicia sesión para crear o unirte a una sala.',
    CODIGO_INVALIDO: 'El código debe tener 6 caracteres.',
    SALA_NO_EXISTE: 'Esa sala no existe. Revisa el código o crea una nueva.',
    SALA_INICIADA: 'La partida ya comenzó. Pide otro código al anfitrión.',
    SALA_LLENA: 'La sala ya tiene dos jugadores.',
    SOLO_ANFITRION: 'Solo el anfitrión puede iniciar o reiniciar el duelo.',
    FALTAN_JUGADORES: 'Falta que se una el segundo jugador.',
    NO_ES_TU_TURNO: 'Todavía no es tu turno.',
    PARTIDA_NO_ACTIVA: 'La partida no está activa.',
    SIN_CODIGO: 'No se pudo crear la sala. Inténtalo de nuevo.',
};

const mensajeDeError = (error) => (
    MENSAJES_ERROR[String(error?.message || '')] || 'No se pudo conectar con la sala. Inténtalo de nuevo.'
);

function CartaDuelo({ card, flipped, disabled, onClick, esTurno }) {
    const textLength = card.content ? card.content.length : 0;
    const responsiveTextClass = () => {
        if (textLength > 12) return 'text-[10px] md:text-sm';
        if (textLength > 8) return 'text-xs md:text-base';
        return 'text-sm md:text-xl font-bold';
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || card.matched}
            aria-label={flipped ? `${card.label}` : 'Carta oculta'}
            className={`relative aspect-square perspective group text-left ${
                disabled || card.matched ? 'cursor-default' : 'cursor-pointer'
            }`}
        >
            <div className={`w-full h-full duration-500 preserve-3d relative ${flipped ? 'rotate-y-180' : ''}`}>
                <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white border-2 rounded-xl flex flex-col items-center justify-center p-2 shadow-inner ${
                    card.matched
                        ? 'border-emerald-400 ring-4 ring-emerald-200'
                        : 'border-amber-300'
                }`}>
                    {card.type === 'image' ? (
                        <img
                            src={card.content}
                            alt={card.label}
                            className="w-full h-full object-contain p-1 rounded-lg"
                            onError={(evento) => {
                                evento.target.style.display = 'none';
                                if (evento.target.nextSibling) evento.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}

                    <div className={`${card.type === 'image' ? 'hidden' : 'flex'} flex-col items-center justify-center h-full w-full text-center p-1`}>
                        <p className={`${responsiveTextClass()} text-amber-950 uppercase tracking-tight leading-tight break-words`}>
                            {card.type === 'word' ? card.content : card.label}
                        </p>
                        {card.type === 'word' && (
                            <span className="text-[9px] md:text-xs text-black mt-1 uppercase tracking-wider block">
                                ({card.label})
                            </span>
                        )}
                    </div>

                    {card.matched && (
                        <span className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                            <Icono nombre="check" className="w-3 h-3" />
                        </span>
                    )}
                </div>

                <div className={`absolute inset-0 w-full h-full backface-hidden bg-amber-600 border-2 border-white rounded-xl flex items-center justify-center shadow-lg transition-all ${
                    esTurno && !disabled && !card.matched ? 'group-hover:bg-amber-500 group-hover:scale-[1.02]' : ''
                }`}>
                    <span className="text-white/40 font-black text-3xl md:text-5xl select-none">?</span>
                </div>
            </div>
        </button>
    );
}

function TarjetaJugador({ nombre, puntos, activo, esYo, conectado = true }) {
    return (
        <div className={`rounded-2xl border-2 p-3 flex items-center gap-2.5 transition-colors ${
            activo
                ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-300'
                : 'bg-white border-amber-200'
        }`}>
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                activo ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
                {nombre?.charAt(0)?.toUpperCase() || 'J'}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 truncate flex items-center gap-1.5">
                    {esYo ? 'Tú' : 'Rival'}
                    <span
                        className={`w-2 h-2 rounded-full ${conectado ? 'bg-emerald-500' : 'bg-red-500'}`}
                        title={conectado ? 'En línea' : 'Desconectado'}
                    />
                </p>
                <p className="text-xs font-black text-amber-950 truncate">{nombre}</p>
            </div>
            <span className={`text-xl font-black ${activo ? 'text-amber-900' : 'text-amber-700'}`}>
                {puntos}
            </span>
        </div>
    );
}

export default function DueloMemorama({ user, nombreJugador = '', onLogin, onBack }) {
    const { reproducirSonido } = useSonido();
    const [codigo, setCodigo] = useState(() => almacen.getItem(CLAVE_SALA) || '');
    const [codigoInput, setCodigoInput] = useState('');
    const [nombre, setNombre] = useState(nombreJugador);
    const [sala, setSala] = useState(null);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [creando, setCreando] = useState(false);
    const [uniendose, setUniendose] = useState(false);
    const [iniciando, setIniciando] = useState(false);
    const [saliendo, setSaliendo] = useState(false);
    const [modo, setModo] = useState(MODOS_DUELO.RAPIDA);
    const [presencia, setPresencia] = useState({});
    const [ahora, setAhora] = useState(() => Date.now());
    const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    const [showConfirmSalir, setShowConfirmSalir] = useState(false);
    const [reclamando, setReclamando] = useState(false);
    const ultimoResultadoRef = useRef(null);
    const ultimoReclamoRef = useRef(0);

    useEffect(() => {
        if (nombreJugador && !nombre) setNombre(nombreJugador);
    }, [nombreJugador, nombre]);

    useEffect(() => {
        if (!aviso) return undefined;
        const timer = setTimeout(() => setAviso(''), 3500);
        return () => clearTimeout(timer);
    }, [aviso]);

    useEffect(() => {
        const actualizar = () => setOnline(navigator.onLine);
        window.addEventListener('online', actualizar);
        window.addEventListener('offline', actualizar);
        return () => {
            window.removeEventListener('online', actualizar);
            window.removeEventListener('offline', actualizar);
        };
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const salaParam = normalizarCodigo(params.get('sala') || '');
        if (salaParam.length === 6) {
            setCodigoInput(salaParam);
        }
    }, []);

    useEffect(() => {
        if (!sala || sala.estado === 'terminado') return undefined;
        setAhora(Date.now());
        const intervalo = setInterval(() => setAhora(Date.now()), 1000);
        return () => clearInterval(intervalo);
    }, [sala?.estado, sala?.codigo]);

    useEffect(() => {
        if (!user?.uid || !codigo) {
            setSala(null);
            return undefined;
        }

        const cancelar = suscribirSala(
            codigo,
            (datos) => {
                if (!datos) {
                    setSala(null);
                    setError('La sala ya no existe o fue cerrada.');
                    almacen.removeItem(CLAVE_SALA);
                    setCodigo('');
                    return;
                }
                setSala(datos);
                setError('');
            },
            (fallo) => {
                console.error('No se pudo escuchar la sala:', fallo);
                setError('No se pudo conectar con la sala.');
            }
        );

        return cancelar;
    }, [codigo, user?.uid]);

    const miUid = user?.uid;
    const jugadores = sala?.jugadores || {};
    const rivalUid = Object.keys(jugadores).find((uid) => uid !== miUid);
    const miNombre = jugadores[miUid]?.nombre || nombre || 'Jugador';
    const rivalNombre = rivalUid ? jugadores[rivalUid]?.nombre : 'Esperando rival…';
    const esAnfitrion = Boolean(sala && sala.anfitrion === miUid);
    const esMiTurno = Boolean(sala?.estado === 'jugando' && sala.turno === miUid);
    const miPuntaje = Number(sala?.puntajes?.[miUid]) || 0;
    const rivalPuntaje = Number(sala?.puntajes?.[rivalUid]) || 0;
    const parejasEncontradas = useMemo(
        () => (sala?.mazo || []).filter((carta) => carta.matched).length / 2,
        [sala?.mazo]
    );
    const terminado = sala?.estado === 'terminado';
    const empate = terminado && (sala?.ganador === 'empate' || !sala?.ganador);
    const gane = terminado && sala?.ganador === miUid;
    const modoSala = sala?.modo === MODOS_DUELO.RELAJADA ? MODOS_DUELO.RELAJADA : MODOS_DUELO.RAPIDA;
    const expiraTurnoMs = sala?.turnoExpiraEn?.toMillis?.() || Number(sala?.turnoExpiraEn) || 0;
    const segundosTurno = modoSala === MODOS_DUELO.RAPIDA && expiraTurnoMs > 0
        ? Math.max(0, Math.ceil((expiraTurnoMs - ahora) / 1000))
        : null;
    const tiempoAgotado = modoSala === MODOS_DUELO.RAPIDA && expiraTurnoMs > 0 && ahora >= expiraTurnoMs;
    const rivalPresencia = rivalUid ? presencia[rivalUid] : null;
    const rivalConectado = rivalPresencia
        ? (ahora - (Number(rivalPresencia.ultimaVez) || 0) < 60000)
        : true;

    useEffect(() => {
        if (!user?.uid || !codigo) {
            setPresencia({});
            return undefined;
        }

        return suscribirPresencia(
            codigo,
            setPresencia,
            (fallo) => console.warn('No se pudo escuchar la presencia:', fallo)
        );
    }, [codigo, user?.uid]);

    useEffect(() => {
        if (!user?.uid || !codigo || !sala) return undefined;

        let activo = true;
        const enviar = () => {
            if (!activo) return;
            latirPresencia({ codigo, user, nombre: miNombre }).catch(() => {});
        };

        enviar();
        const intervalo = setInterval(enviar, 20000);

        return () => {
            activo = false;
            clearInterval(intervalo);
            eliminarPresencia({ codigo, user }).catch(() => {});
        };
    }, [codigo, user?.uid, sala?.codigo, miNombre]);

    useEffect(() => {
        if (!sala || sala.estado !== 'jugando' || modoSala !== MODOS_DUELO.RAPIDA) return;
        if (!tiempoAgotado || reclamando) return;

        const ahoraMs = Date.now();
        if (ahoraMs - ultimoReclamoRef.current < 5000) return;

        ultimoReclamoRef.current = ahoraMs;
        setReclamando(true);
        reclamarTurno({ codigo: sala.codigo || codigo, user })
            .catch(() => {})
            .finally(() => setReclamando(false));
    }, [sala?.estado, sala?.turnoExpiraEn, sala?.codigo, modoSala, tiempoAgotado, reclamando, codigo, user]);

    useEffect(() => {
        if (!sala || sala.estado !== 'jugando' || !sala.bloqueado || sala.resuelto !== 'fallo') {
            return undefined;
        }

        const timer = setTimeout(() => {
            cerrarTurno({ codigo: sala.codigo || codigo }).catch(() => {});
        }, 1100);

        return () => clearTimeout(timer);
    }, [sala?.bloqueado, sala?.resuelto, sala?.codigo, codigo]);

    useEffect(() => {
        if (!sala?.resuelto) return;
        const clave = `${sala.actualizadoEn}-${sala.resuelto}`;
        if (ultimoResultadoRef.current === clave) return;
        ultimoResultadoRef.current = clave;
        reproducirSonido(sala.resuelto === 'acierto' ? 'click3' : 'click2');
    }, [sala?.actualizadoEn, sala?.resuelto, reproducirSonido]);

    const guardarCodigo = (nuevoCodigo) => {
        setCodigo(nuevoCodigo);
        setSala(null);
        setError('');
        if (nuevoCodigo) almacen.setItem(CLAVE_SALA, nuevoCodigo);
        else almacen.removeItem(CLAVE_SALA);
    };

    const crear = async () => {
        if (!user) {
            onLogin?.();
            return;
        }
        if (!online) {
            setError('No tienes conexión. Vuelve a intentarlo cuando estés en línea.');
            return;
        }

        setCreando(true);
        setError('');
        try {
            const nuevoCodigo = await crearSala({ user, nombre, modo });
            guardarCodigo(nuevoCodigo);
            setAviso('Sala creada. Comparte el código con tu rival.');
        } catch (fallo) {
            setError(mensajeDeError(fallo));
        } finally {
            setCreando(false);
        }
    };

    const unirse = async () => {
        if (!user) {
            onLogin?.();
            return;
        }
        if (!online) {
            setError('No tienes conexión. Vuelve a intentarlo cuando estés en línea.');
            return;
        }

        setUniendose(true);
        setError('');
        try {
            const nuevoCodigo = await unirseSala({ codigo: codigoInput, user, nombre });
            guardarCodigo(nuevoCodigo);
            setCodigoInput(nuevoCodigo);
        } catch (fallo) {
            setError(mensajeDeError(fallo));
        } finally {
            setUniendose(false);
        }
    };

    const iniciar = async () => {
        if (!sala) return;
        setIniciando(true);
        setError('');
        try {
            await iniciarDuelo({ codigo: sala.codigo || codigo, user });
            reproducirSonido('click3');
        } catch (fallo) {
            setError(mensajeDeError(fallo));
        } finally {
            setIniciando(false);
        }
    };

    const revancha = async () => {
        if (!sala) return;
        setIniciando(true);
        setError('');
        try {
            await reiniciarDuelo({ codigo: sala.codigo || codigo, user });
            reproducirSonido('click3');
        } catch (fallo) {
            setError(mensajeDeError(fallo));
        } finally {
            setIniciando(false);
        }
    };

    const salir = async () => {
        setSaliendo(true);
        setShowConfirmSalir(false);
        const codigoActivo = sala?.codigo || codigo;

        try {
            if (codigoActivo) {
                await salirSala({ codigo: codigoActivo, user });
            }
        } catch (fallo) {
            console.warn('No se pudo salir de la sala:', fallo);
        } finally {
            if (codigoActivo && user?.uid) {
                await eliminarPresencia({ codigo: codigoActivo, user }).catch(() => {});
            }
            guardarCodigo('');
            setSaliendo(false);
            onBack?.();
        }
    };

    const pedirSalir = () => {
        if (sala || codigo) {
            setShowConfirmSalir(true);
            return;
        }
        onBack?.();
    };

    const volver = () => {
        pedirSalir();
    };

    const copiarCodigo = async () => {
        const valor = sala?.codigo || codigo;
        if (!valor) return;
        try {
            await navigator.clipboard.writeText(valor);
            setAviso('Código copiado.');
        } catch {
            setAviso('No se pudo copiar el código.');
        }
    };

    const compartirSala = async () => {
        const valor = sala?.codigo || codigo;
        if (!valor) return;
        const resultado = await compartirTexto({
            titulo: 'Duelo de Memorama · Bidxaga Saa',
            texto: `Te reto a un duelo de Memorama en diidxazá. Entra a la app y usa el código ${valor}.`,
            url: `${window.location.origin}/?sala=${valor}`,
        });
        if (resultado === 'copiado') setAviso('Invitación copiada.');
        if (resultado === 'no-disponible') setAviso(`Código: ${valor}`);
    };

    const elegirCarta = (carta) => {
        if (!sala || sala.estado !== 'jugando' || !esMiTurno || sala.bloqueado) return;
        if (carta.matched || (sala.volteadas || []).includes(carta.id)) return;

        reproducirSonido('click1');
        voltearCarta({ codigo: sala.codigo || codigo, user, cartaId: carta.id }).catch((fallo) => {
            setError(mensajeDeError(fallo));
        });
    };

    const encabezado = (
        <>
            <div className="flex items-center justify-between gap-2 mb-4">
                <button
                    type="button"
                    onClick={volver}
                    disabled={saliendo}
                    className="bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                    <Icono nombre="arrowLeft" className="w-4 h-4" /> Salir
                </button>
                <div className="text-center min-w-0">
                    <h1 className="text-lg sm:text-xl font-black text-amber-950 truncate">Duelo de Memoria</h1>
                    <p className="text-[10px] font-bold text-amber-700">1 vs 1 · por turnos</p>
                </div>
                <span className="w-10" aria-hidden="true" />
            </div>

            {showConfirmSalir && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="salir-duelo-titulo" className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-2xl w-full max-w-sm text-center">
                        <Icono nombre="alert" className="w-9 h-9 text-amber-600 mx-auto mb-2" />
                        <h2 id="salir-duelo-titulo" className="text-lg font-black text-amber-950">¿Salir del duelo?</h2>
                        <p className="text-xs text-amber-800 font-medium mt-1 mb-4 leading-relaxed">
                            {esAnfitrion
                                ? 'Se cerrará la sala para los dos jugadores.'
                                : 'Tu rival seguirá en la sala y podrá cerrarla.'}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmSalir(false)}
                                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px] font-bold cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={salir}
                                disabled={saliendo}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl px-3 py-2.5 text-[11px] font-bold cursor-pointer"
                            >
                                {saliendo ? 'Saliendo…' : 'Salir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (!user) {
        return (
            <div className="max-w-lg mx-auto px-4 py-6">
                {encabezado}
                <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 text-center shadow-sm">
                    <Icono nombre="users" className="w-10 h-10 text-amber-700 mx-auto mb-2" />
                    <h2 className="text-lg font-black text-amber-950">Compite con un amigo</h2>
                    <p className="text-xs text-amber-800 font-medium mt-1 mb-4 leading-relaxed">
                        Inicia sesión para crear una sala, compartir el código y jugar por turnos.
                    </p>
                    <button
                        type="button"
                        onClick={() => onLogin?.()}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-black py-3 rounded-2xl text-sm cursor-pointer"
                    >
                        Iniciar sesión
                    </button>
                </div>
            </div>
        );
    }

    if (!sala) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                {encabezado}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl px-4 py-3 text-xs font-bold mb-3">
                        {error}
                    </div>
                )}

                {!online && (
                    <div className="bg-orange-50 border-2 border-orange-200 text-orange-900 rounded-2xl px-4 py-3 text-xs font-bold mb-3">
                        Sin conexión. Puedes seguir viendo la pantalla, pero crear o unirte requiere internet.
                    </div>
                )}

                <div className="bg-gradient-to-br from-amber-700 to-orange-800 text-white rounded-3xl p-5 border-2 border-amber-500 shadow-lg mb-4">
                    <div className="flex items-start gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                            <Icono nombre="trophy" className="w-7 h-7" />
                        </span>
                        <div>
                            <h2 className="text-lg font-black leading-tight">8 parejas, dos jugadores</h2>
                            <p className="text-[11px] text-amber-100 font-medium mt-1 leading-relaxed">
                                Si encuentras una pareja, sigues jugando. Si fallas, el turno pasa a tu rival.
                                Gana quien tenga más parejas al final.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <section className="bg-white border-2 border-amber-200 rounded-3xl p-4 shadow-sm">
                        <h3 className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                            <Icono nombre="plus" className="w-4 h-4 text-amber-700" /> Crear sala
                        </h3>
                        <p className="text-[11px] text-amber-700 font-medium mt-1 mb-3">
                            Tú serás el anfitrión y podrás iniciar la partida.
                        </p>
                        <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">
                            Tu nombre en el duelo
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(evento) => setNombre(evento.target.value.slice(0, 40))}
                            maxLength={40}
                            placeholder="Tu nombre"
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500 mb-3"
                        />

                        <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">
                            Modo de partida
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setModo(MODOS_DUELO.RAPIDA)}
                                className={`rounded-xl border-2 p-2 text-left cursor-pointer ${
                                    modo === MODOS_DUELO.RAPIDA
                                        ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-300'
                                        : 'bg-amber-50 border-amber-200'
                                }`}
                            >
                                <span className="block text-[11px] font-black text-amber-950">Rápida</span>
                                <span className="block text-[9px] font-bold text-amber-700">30 s por turno</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModo(MODOS_DUELO.RELAJADA)}
                                className={`rounded-xl border-2 p-2 text-left cursor-pointer ${
                                    modo === MODOS_DUELO.RELAJADA
                                        ? 'bg-emerald-100 border-emerald-500 ring-1 ring-emerald-300'
                                        : 'bg-amber-50 border-amber-200'
                                }`}
                            >
                                <span className="block text-[11px] font-black text-amber-950">Sin prisa</span>
                                <span className="block text-[9px] font-bold text-amber-700">Sin límite de tiempo</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={crear}
                            disabled={creando || !online}
                            className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-sm cursor-pointer"
                        >
                            {creando ? 'Creando…' : 'Crear sala'}
                        </button>
                    </section>

                    <section className="bg-white border-2 border-amber-200 rounded-3xl p-4 shadow-sm">
                        <h3 className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                            <Icono nombre="users" className="w-4 h-4 text-emerald-700" /> Unirme
                        </h3>
                        <p className="text-[11px] text-amber-700 font-medium mt-1 mb-3">
                            Pide el código de 6 caracteres al anfitrión.
                        </p>
                        <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">
                            Código de la sala
                        </label>
                        <input
                            type="text"
                            value={codigoInput}
                            onChange={(evento) => setCodigoInput(normalizarCodigo(evento.target.value))}
                            maxLength={6}
                            autoCapitalize="characters"
                            autoComplete="off"
                            spellCheck="false"
                            placeholder="ABC123"
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-center text-lg font-black tracking-[0.25em] text-amber-950 outline-none focus:border-amber-500 mb-3"
                        />
                        <button
                            type="button"
                            onClick={unirse}
                            disabled={uniendose || codigoInput.length !== 6 || !online}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-sm cursor-pointer"
                        >
                            {uniendose ? 'Entrando…' : 'Unirme a la sala'}
                        </button>
                    </section>
                </div>

                {aviso && (
                    <p className="text-[11px] font-bold text-emerald-700 text-center mt-3">{aviso}</p>
                )}
            </div>
        );
    }

    if (sala.estado === 'esperando') {
        const jugadoresListos = Object.keys(jugadores).length;
        return (
            <div className="max-w-xl mx-auto px-4 py-6">
                {encabezado}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl px-4 py-3 text-xs font-bold mb-3">
                        {error}
                    </div>
                )}

                <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Sala de espera</p>
                    <p className="text-4xl font-black tracking-[0.25em] text-amber-950 mt-1">{sala.codigo || codigo}</p>
                    <p className={`inline-block mt-2 text-[10px] font-black uppercase rounded-full px-2.5 py-1 border ${
                        modoSala === MODOS_DUELO.RAPIDA
                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                        {modoSala === MODOS_DUELO.RAPIDA ? 'Rápida · 30 s por turno' : 'Sin prisa · sin límite'}
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                        <button type="button" onClick={copiarCodigo} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer">
                            <Icono nombre="copy" className="w-3.5 h-3.5" /> Copiar código
                        </button>
                        <button type="button" onClick={compartirSala} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer">
                            <Icono nombre="share" className="w-3.5 h-3.5" /> Compartir
                        </button>
                    </div>
                    {aviso && <p className="text-[11px] font-bold text-emerald-700 mt-2">{aviso}</p>}

                    <div className="grid grid-cols-2 gap-2 mt-5">
                        <TarjetaJugador
                            nombre={miNombre}
                            puntos={0}
                            activo={esAnfitrion}
                            esYo
                            conectado
                        />
                        <TarjetaJugador
                            nombre={rivalNombre}
                            puntos={0}
                            activo={!esAnfitrion && Boolean(rivalUid)}
                            esYo={false}
                            conectado={!rivalUid || rivalConectado}
                        />
                    </div>

                    {rivalUid && !rivalConectado && (
                        <p className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">
                            Tu rival parece desconectado.
                        </p>
                    )}

                    <p className="text-[11px] font-bold text-amber-800 mt-4">
                        {jugadoresListos < 2
                            ? 'Comparte el código para que entre tu rival.'
                            : esAnfitrion
                                ? 'Tu rival ya está aquí. ¡Inicia el duelo!'
                                : 'Esperando que el anfitrión inicie el duelo…'}
                    </p>

                    {esAnfitrion && (
                        <button
                            type="button"
                            onClick={iniciar}
                            disabled={iniciando || jugadoresListos < 2}
                            className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-sm cursor-pointer inline-flex items-center justify-center gap-2"
                        >
                            <Icono nombre="play" className="w-4 h-4" />
                            {iniciando ? 'Iniciando…' : 'Iniciar duelo'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (sala.estado === 'jugando') {
        return (
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {encabezado}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl px-4 py-3 text-xs font-bold mb-3">
                        {error}
                    </div>
                )}

                {!rivalUid ? (
                    <div className="bg-white border-2 border-red-200 rounded-3xl p-5 text-center shadow-sm">
                        <Icono nombre="users" className="w-9 h-9 text-red-500 mx-auto mb-2" />
                        <h2 className="text-lg font-black text-amber-950">Tu rival salió</h2>
                        <p className="text-xs text-amber-800 font-medium mt-1 mb-4">
                            La sala ya no tiene dos jugadores. Puedes salir y crear otra.
                        </p>
                        <button type="button" onClick={salir} className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-sm cursor-pointer">
                            Salir de la sala
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <TarjetaJugador
                                nombre={miNombre}
                                puntos={miPuntaje}
                                activo={esMiTurno}
                                esYo
                                conectado
                            />
                            <TarjetaJugador
                                nombre={rivalNombre}
                                puntos={rivalPuntaje}
                                activo={!esMiTurno && Boolean(rivalUid)}
                                esYo={false}
                                conectado={!rivalUid || rivalConectado}
                            />
                        </div>

                        {!online && (
                            <div className="bg-orange-50 border-2 border-orange-200 text-orange-900 rounded-2xl px-4 py-2 text-xs font-bold mb-3">
                                Sin conexión. La partida se sincronizará cuando vuelvas.
                            </div>
                        )}

                        {rivalUid && !rivalConectado && (
                            <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl px-4 py-2 text-xs font-bold mb-3">
                                Tu rival parece desconectado. Puedes esperar o salir de la sala.
                            </div>
                        )}

                        <div
                            aria-live="polite"
                            className={`rounded-2xl px-3 py-2 mb-3 text-center border-2 ${
                                esMiTurno
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : 'bg-amber-50 border-amber-200'
                            }`}
                        >
                            <p className={`text-xs font-black ${esMiTurno ? 'text-emerald-900' : 'text-amber-900'}`}>
                                {sala.bloqueado
                                    ? 'Buscando pareja…'
                                    : sala.resuelto === 'acierto'
                                        ? '¡Pareja encontrada! Sigues jugando'
                                        : esMiTurno
                                            ? 'Tu turno: voltea dos cartas'
                                            : `Turno de ${rivalNombre}`}
                            </p>
                            <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                                {parejasEncontradas} de {PAREJAS_DUELO} parejas encontradas ·
                                {' '}
                                {modoSala === MODOS_DUELO.RAPIDA ? 'Modo rápido' : 'Modo sin prisa'}
                            </p>

                            {modoSala === MODOS_DUELO.RAPIDA && segundosTurno !== null && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-[10px] font-black text-amber-800 mb-1">
                                        <span>{tiempoAgotado ? 'Tiempo agotado' : `Quedan ${segundosTurno} s`}</span>
                                        <span>30 s por turno</span>
                                    </div>
                                    <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden border border-amber-200">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                segundosTurno <= 5 ? 'bg-red-500' : 'bg-amber-500'
                                            }`}
                                            style={{ width: `${Math.min(100, (segundosTurno / 30) * 100)}%` }}
                                        />
                                    </div>
                                    {tiempoAgotado && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                reclamarTurno({ codigo: sala.codigo || codigo, user }).catch(() => {});
                                            }}
                                            className="mt-2 text-[10px] font-black bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg cursor-pointer"
                                        >
                                            Reclamar turno
                                        </button>
                                    )}
                                </div>
                            )}

                            {modoSala === MODOS_DUELO.RELAJADA && (
                                <p className="text-[10px] font-bold text-emerald-700 mt-1">
                                    Sin límite de tiempo · juega con calma
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full max-w-xl mx-auto">
                            {(sala.mazo || []).map((carta) => (
                                <CartaDuelo
                                    key={carta.id}
                                    card={carta}
                                    flipped={carta.matched || (sala.volteadas || []).includes(carta.id)}
                                    disabled={!esMiTurno || sala.bloqueado}
                                    esTurno={esMiTurno}
                                    onClick={() => elegirCarta(carta)}
                                />
                            ))}
                        </div>

                        <p className="text-[10px] text-amber-700 font-medium text-center mt-3 leading-relaxed">
                            Código de sala: <strong>{sala.codigo || codigo}</strong> ·
                            Si aciertas, conservas el turno; si fallas, pasa al rival.
                        </p>
                    </>
                )}
            </div>
        );
    }

    if (terminado) {
        return (
            <div className="max-w-xl mx-auto px-4 py-6">
                {encabezado}

                <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-xl text-center">
                    <span className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3 ${
                        empate ? 'bg-amber-100 text-amber-700' : gane ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                        <Icono nombre={empate ? 'users' : 'trophy'} className="w-10 h-10" />
                    </span>
                    <h2 className="text-2xl font-black text-amber-950">
                        {empate ? '¡Empate!' : gane ? '¡Ganaste!' : `Ganó ${rivalNombre}`}
                    </h2>
                    <p className="text-xs text-amber-800 font-medium mt-1">
                        {empate
                            ? 'Los dos encontraron la misma cantidad de parejas.'
                            : gane
                                ? 'Encontraste más parejas que tu rival.'
                                : 'La próxima revancha puede ser tuya.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-5">
                        <TarjetaJugador nombre={miNombre} puntos={miPuntaje} activo={gane} esYo />
                        <TarjetaJugador nombre={rivalNombre} puntos={rivalPuntaje} activo={!gane && !empate} esYo={false} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-5">
                        {esAnfitrion ? (
                            <button
                                type="button"
                                onClick={revancha}
                                disabled={iniciando}
                                className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-sm cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                                <Icono nombre="refresh" className="w-4 h-4" /> {iniciando ? 'Preparando…' : 'Revancha'}
                            </button>
                        ) : (
                            <p className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-3 text-[11px] font-bold text-amber-800 flex items-center justify-center">
                                Esperando la revancha del anfitrión…
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={salir}
                            className="flex-1 bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-950 font-black py-3 rounded-2xl text-sm cursor-pointer"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto px-4 py-6">
            {encabezado}
            <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 text-center">
                <p className="text-sm font-bold text-amber-900">La sala está en un estado desconocido.</p>
                <button type="button" onClick={salir} className="mt-3 bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-sm cursor-pointer">
                    Salir
                </button>
            </div>
        </div>
    );
}
