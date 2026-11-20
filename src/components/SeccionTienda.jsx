import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { CATALOGO_AVATARES, CATALOGO_ACCESORIOS } from '../data/catalogoActivos.js';
import { VIDAS_POR_JUEGO, agregarVidasATodos, normalizarVidas, totalVidas } from '../utils/vidas.js';
import SeccionColapsable from './SeccionColapsable.jsx';

const CATALOGO_VIDAS = [
    { id: 'vida_1', costo: 15, cantidad: 1 },
    { id: 'vida_3', costo: 40, cantidad: 3 },
    { id: 'vida_5', costo: 60, cantidad: 5 },
];

export default function SeccionTienda({
    user,
    comprar,
    vidas,
    setVidas,
    avatarActual,
    setAvatarActual,
    avataresDesbloqueados,
    setAvataresDesbloqueados,
    accesoriosDesbloqueados = [],
    setAccesoriosDesbloqueados = () => {},
    setMensaje,
    tiendaAbierta,
    setTiendaAbierta
}) {
    const [pestanaActiva, setPestanaActiva] = useState('avatares');
    const vidasNormalizadas = normalizarVidas(vidas);
    const todasAlMaximo = Object.entries(VIDAS_POR_JUEGO)
        .every(([juego, config]) => vidasNormalizadas[juego] >= config.max);

    const handleComprarOEquiparAvatar = async (avatar) => {
        if (avatar.disponible === false) {
            setMensaje(`${avatar.nombre} estará disponible próximamente.`);
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        const desbloqueado = avataresDesbloqueados.includes(avatar.id);

        if (desbloqueado) {
            setAvatarActual(avatar.id);
            if (user) {
                try {
                    const userRef = doc(db, 'usuarios', user.uid);
                    await updateDoc(userRef, { avatar: avatar.id });
                } catch (error) {
                    console.error("Error al equipar avatar en Firestore:", error);
                }
            }
            setMensaje(`Has equipado a ${avatar.nombre}.`);
            setTimeout(() => setMensaje(''), 3000);
        } else {
            const resultado = await comprar(avatar.costo, (data) => {
                const actuales = Array.isArray(data?.avataresDesbloqueados)
                    ? data.avataresDesbloqueados
                    : avataresDesbloqueados;
                const nuevos = actuales.includes(avatar.id) ? actuales : [...actuales, avatar.id];
                return { avataresDesbloqueados: nuevos, avatar: avatar.id };
            });

            if (!resultado.ok) {
                setMensaje(resultado.motivo === 'SALDO_INSUFICIENTE'
                    ? 'No tienes suficientes totopos para este avatar.'
                    : 'No se pudo completar la compra. Intenta de nuevo.');
                setTimeout(() => setMensaje(''), 3000);
                return;
            }

            setAvataresDesbloqueados(resultado.extra.avataresDesbloqueados);
            setAvatarActual(avatar.id);
            setMensaje(`Has comprado y equipado a ${avatar.nombre}.`);
            setTimeout(() => setMensaje(''), 3000);
        }
    };

    const handleComprarAccesorio = async (accesorio) => {
        const desbloqueado = accesoriosDesbloqueados.includes(accesorio.id);

        if (desbloqueado) {
            setMensaje(`Ya cuentas con ${accesorio.nombre} en tu inventario.`);
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        const resultado = await comprar(accesorio.costo, (data) => {
            const actuales = Array.isArray(data?.accesoriosDesbloqueados)
                ? data.accesoriosDesbloqueados
                : accesoriosDesbloqueados;
            const nuevos = actuales.includes(accesorio.id) ? actuales : [...actuales, accesorio.id];
            return { accesoriosDesbloqueados: nuevos };
        });

        if (!resultado.ok) {
            setMensaje(resultado.motivo === 'SALDO_INSUFICIENTE'
                ? 'No tienes suficientes totopos para este accesorio.'
                : 'No se pudo completar la compra. Intenta de nuevo.');
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        setAccesoriosDesbloqueados(resultado.extra.accesoriosDesbloqueados);
        setMensaje(`Has comprado ${accesorio.nombre}.`);
        setTimeout(() => setMensaje(''), 3000);
    };

    const handleComprarVidas = async (paquete) => {
        if (todasAlMaximo) {
            setMensaje('Todas tus vidas ya están al máximo. ¡Sigue jugando!');
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        const resultado = await comprar(paquete.costo, (data) => {
            const actuales = normalizarVidas(data?.vidas ?? vidas);
            const nuevas = agregarVidasATodos(actuales, paquete.cantidad);
            const algunJuegoGano = Object.keys(VIDAS_POR_JUEGO)
                .some((juego) => nuevas[juego] > actuales[juego]);

            if (!algunJuegoGano) {
                const error = new Error('VIDAS_AL_MAXIMO');
                error.codigo = 'VIDAS_AL_MAXIMO';
                throw error;
            }

            return { vidas: nuevas };
        });

        if (!resultado.ok) {
            const mensajeError = resultado.motivo === 'SALDO_INSUFICIENTE'
                ? 'No tienes suficientes totopos para comprar vidas.'
                : resultado.motivo === 'VIDAS_AL_MAXIMO'
                    ? 'Todas tus vidas ya están al máximo. ¡Sigue jugando!'
                    : 'No se pudo completar la compra. Intenta de nuevo.';
            setMensaje(mensajeError);
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        setVidas(resultado.extra.vidas);
        setMensaje(`Recargaste hasta ${paquete.cantidad} vida(s) en cada juego. Total: ${totalVidas(resultado.extra.vidas)} vidas.`);
        setTimeout(() => setMensaje(''), 4000);
    };

    return (
        <SeccionColapsable
            icono="/tehuana.png"
            titulo="Mercado Istmeño"
            abierto={tiendaAbierta}
            setAbierto={setTiendaAbierta}
        >
            <div className="flex border-b border-amber-200 bg-amber-100/30">
                        <button
                            onClick={() => setPestanaActiva('avatares')}
                            className={`flex-1 py-2.5 text-xs font-black transition-colors cursor-pointer ${
                                pestanaActiva === 'avatares'
                                    ? 'bg-white text-amber-900 border-b-2 border-amber-600 shadow-sm'
                                    : 'text-amber-700 hover:bg-amber-100/50'
                            }`}
                        >
                            Avatares
                        </button>
                        <button
                            onClick={() => setPestanaActiva('accesorios')}
                            className={`flex-1 py-2.5 text-xs font-black transition-colors cursor-pointer ${
                                pestanaActiva === 'accesorios'
                                    ? 'bg-white text-amber-900 border-b-2 border-amber-600 shadow-sm'
                                    : 'text-amber-700 hover:bg-amber-100/50'
                            }`}
                        >
                            Accesorios
                        </button>
                        <button
                            onClick={() => setPestanaActiva('vidas')}
                            className={`flex-1 py-2.5 text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                pestanaActiva === 'vidas'
                                    ? 'bg-white text-amber-900 border-b-2 border-amber-600 shadow-sm'
                                    : 'text-amber-700 hover:bg-amber-100/50'
                            }`}
                        >
                            <img src="/tuna-vida.png" alt="Vida" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                            Vidas
                        </button>
                    </div>

                    {pestanaActiva === 'avatares' && (
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
                            {CATALOGO_AVATARES.map((avatar) => {
                                const desbloqueado = avataresDesbloqueados.includes(avatar.id);
                                const equipado = avatarActual === avatar.id;
                                const disponible = avatar.disponible !== false;

                                return (
                                    <div
                                        key={avatar.id}
                                        className={`p-3 rounded-3xl border-2 flex flex-col items-center justify-between transition-all duration-200 ${
                                            equipado
                                                ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-400 shadow-lg'
                                                : 'border-amber-300 bg-white hover:border-amber-400'
                                        }`}
                                    >
                                        <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 rounded-full flex items-center justify-center border-4 shadow-inner overflow-hidden ${
                                            equipado ? 'border-amber-500 bg-white' : 'border-amber-200 bg-amber-50'
                                        }`}>
                                            {disponible ? (
                                                <img
                                                    src={`/avatares/${avatar.id}.png`}
                                                    alt={avatar.nombre}
                                                    className="w-full h-full object-contain p-1"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-4xl" aria-hidden="true">{avatar.emoji || '🌴'}</span>
                                            )}
                                        </div>

                                        <div className="font-black text-xs text-center text-amber-950 mb-1 leading-tight h-8 flex items-center justify-center">
                                            {avatar.nombre}
                                        </div>

                                        <div className={`text-[11px] font-black mb-2 px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            !disponible
                                                ? 'text-gray-700 bg-gray-100 border border-gray-300'
                                                : desbloqueado
                                                    ? 'text-green-900 bg-green-100 border border-green-300'
                                                    : 'text-amber-800 bg-amber-100 border border-amber-300'
                                        }`}>
                                            {!disponible ? (
                                                'Próximamente'
                                            ) : desbloqueado ? (
                                                'Adquirido'
                                            ) : (
                                                <>
                                                    {avatar.costo}
                                                    <img src="/totopo.png" alt="Totopo" className="w-3.5 h-3.5 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleComprarOEquiparAvatar(avatar)}
                                            disabled={equipado || !disponible}
                                            className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 shadow ${
                                                !disponible
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : equipado
                                                        ? 'bg-amber-500 text-white opacity-90 cursor-default'
                                                        : desbloqueado
                                                            ? 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer'
                                                            : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                                            }`}
                                        >
                                            {!disponible ? 'Próximamente' : equipado ? 'Equipado' : desbloqueado ? 'Equipar' : 'Comprar'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {pestanaActiva === 'accesorios' && (
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
                            {CATALOGO_ACCESORIOS.map((accesorio) => {
                                const desbloqueado = accesoriosDesbloqueados.includes(accesorio.id);

                                return (
                                    <div
                                        key={accesorio.id}
                                        className="p-3 rounded-3xl border-2 border-amber-300 bg-white hover:border-amber-400 flex flex-col items-center justify-between transition-all duration-200"
                                    >
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 rounded-full flex items-center justify-center border-4 border-amber-200 bg-amber-50 shadow-inner overflow-hidden">
                                            <img
                                                src={`/avatares/mercado/${accesorio.id}.svg`}
                                                alt={accesorio.nombre}
                                                className="w-full h-full object-contain p-1"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>

                                        <div className="font-black text-xs text-center text-amber-950 mb-1 leading-tight h-8 flex items-center justify-center">
                                            {accesorio.nombre}
                                        </div>

                                        <div className={`text-[11px] font-black mb-2 px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            desbloqueado
                                                ? 'text-green-900 bg-green-100 border border-green-300'
                                                : 'text-amber-800 bg-amber-100 border border-amber-300'
                                        }`}>
                                            {desbloqueado ? (
                                                'Adquirido'
                                            ) : (
                                                <>
                                                    {accesorio.costo}
                                                    <img src="/totopo.png" alt="Totopo" className="w-3.5 h-3.5 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleComprarAccesorio(accesorio)}
                                            disabled={desbloqueado}
                                            className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 shadow ${
                                                desbloqueado
                                                    ? 'bg-green-700 text-white opacity-90 cursor-default'
                                                    : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                                            }`}
                                        >
                                            {desbloqueado ? 'Adquirido' : 'Comprar'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {pestanaActiva === 'vidas' && (
                        <div className="p-4 flex flex-col gap-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-amber-800 font-medium text-center mb-1">
                                Las vidas se recargan en todos los juegos, hasta el máximo de cada uno.
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 mb-1">
                                {Object.entries(VIDAS_POR_JUEGO).map(([juego, config]) => (
                                    <div key={juego} className="bg-white/80 border border-red-200 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-red-800">
                                        <span>{config.etiqueta}</span>
                                        <span>{vidasNormalizadas[juego]}/{config.max}</span>
                                    </div>
                                ))}
                            </div>

                            {CATALOGO_VIDAS.map((paquete) => (
                                <div
                                    key={paquete.id}
                                    className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center justify-between shadow-sm hover:border-amber-400 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                                            <img src="/tuna-vida.png" alt="Vida" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                        </div>
                                        <div>
                                            <div className="font-black text-amber-950 text-sm">
                                                +{paquete.cantidad} {paquete.cantidad === 1 ? 'vida' : 'vidas'} para cada juego
                                            </div>
                                            <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                                Costo: {paquete.costo}
                                                <img src="/totopo.png" alt="Totopo" className="w-3.5 h-3.5 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleComprarVidas(paquete)}
                                        disabled={todasAlMaximo}
                                        className={`font-bold px-4 py-2 rounded-xl text-xs shadow transition-transform active:scale-95 ${
                                            todasAlMaximo
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                                        }`}
                                    >
                                        {todasAlMaximo ? 'Máximo' : 'Adquirir'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
        </SeccionColapsable>
    );
}