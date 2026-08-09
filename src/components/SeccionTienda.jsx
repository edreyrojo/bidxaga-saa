import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';

// 🛍️ Catálogo extendido a 10 Avatares
const CATALOGO_AVATARES = [
    { id: 'default', nombre: 'Totopo Clásico', costo: 0 },
    { id: 'iguana', nombre: 'Iguana Istmeña', costo: 50 },
    { id: 'tortuga', nombre: 'Tortuga Lagunera', costo: 75 },
    { id: 'huipil', nombre: 'Flor de Huipil', costo: 100 },
    { id: 'colibri', nombre: 'Colibrí Dorado', costo: 150 },
    { id: 'jaguar', nombre: 'Jaguar Zapoteco', costo: 200 },
    { id: 'mezcal', nombre: 'Copa de Mezcal', costo: 250 },
    { id: 'sol', nombre: 'Sol del Istmo', costo: 300 },
    { id: 'guiechachi', nombre: 'Guiechachi', costo: 350 },
    { id: 'palmera', nombre: 'Palmera Real', costo: 400 },
];

// ❤️ Catálogo de Vidas Extras optimizado en espacio
const CATALOGO_VIDAS = [
    { id: 'vida_1', costo: 15, cantidad: 1 },
    { id: 'vida_3', costo: 40, cantidad: 3 },
    { id: 'vida_5', costo: 60, cantidad: 5 },
];

export default function SeccionTienda({ 
    user,
    totopos,
    setTotopos,
    vidas,
    setVidas,
    avatarActual,
    setAvatarActual,
    avataresDesbloqueados,
    setAvataresDesbloqueados,
    setMensaje,
    tiendaAbierta, 
    setTiendaAbierta
}) {
    const [pestanaActiva, setPestanaActiva] = useState('avatares'); // 'avatares' o 'vidas'

    // Lógica para comprar o equipar avatares
    const handleComprarOEquiparAvatar = async (avatar) => {
        const desbloqueado = avataresDesbloqueados.includes(avatar.id);

        if (desbloqueado) {
            // Equipar avatar
            setAvatarActual(avatar.id);
            if (user) {
                try {
                    const userRef = doc(db, 'usuarios', user.uid);
                    await updateDoc(userRef, { avatar: avatar.id });
                } catch (error) {
                    console.error("Error al equipar avatar en Firestore:", error);
                }
            }
            setMensaje(`¡Has equipado a ${avatar.nombre}!`);
            setTimeout(() => setMensaje(''), 3000);
        } else {
            // Intentar comprar avatar
            if (totopos < avatar.costo) {
                setMensaje('No tienes suficientes totopos para este avatar.');
                setTimeout(() => setMensaje(''), 3000);
                return;
            }

            const nuevosTotopos = totopos - avatar.costo;
            const nuevosDesbloqueados = [...avataresDesbloqueados, avatar.id];

            setTotopos(nuevosTotopos);
            setAvataresDesbloqueados(nuevosDesbloqueados);
            setAvatarActual(avatar.id);

            if (user) {
                try {
                    const userRef = doc(db, 'usuarios', user.uid);
                    await updateDoc(userRef, {
                        totopos: nuevosTotopos,
                        avataresDesbloqueados: nuevosDesbloqueados,
                        avatar: avatar.id
                    });
                } catch (error) {
                    console.error("Error al guardar compra de avatar en Firestore:", error);
                }
            }

            setMensaje(`¡Has comprado y equipado a ${avatar.nombre}!`);
            setTimeout(() => setMensaje(''), 3000);
        }
    };

    // Lógica para comprar paquetes de vidas
    const handleComprarVidas = async (paquete) => {
        if (totopos < paquete.costo) {
            setMensaje('No tienes suficientes totopos para comprar vidas.');
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        const nuevosTotopos = totopos - paquete.costo;
        const nuevasVidas = vidas + paquete.cantidad;

        setTotopos(nuevosTotopos);
        setVidas(nuevasVidas);

        if (user) {
            try {
                const userRef = doc(db, 'usuarios', user.uid);
                await updateDoc(userRef, {
                    totopos: nuevosTotopos,
                    vidas: nuevasVidas
                });
            } catch (error) {
                console.error("Error al actualizar vidas en Firestore:", error);
            }
        }

        setMensaje(`¡Has adquirido ${paquete.cantidad} vida(s) extra!`);
        setTimeout(() => setMensaje(''), 3000);
    };

    return (
        <div className="mb-6 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setTiendaAbierta(!tiendaAbierta)}
                className="w-full p-4 flex items-center justify-between bg-amber-100/50 hover:bg-amber-100 transition-colors cursor-pointer"
            >
                <span className="font-black text-amber-900 text-base flex items-center gap-2">
                    <img 
                        src="/tehuana.png" 
                        alt="Tehuana" 
                        className="w-6 h-6 object-contain" 
                        onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                    Mercado Istmeño
                </span>
                <span className="text-amber-950 font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                    {tiendaAbierta ? '▲ Ocultar Mercado' : '▼ Ver Mercado'}
                </span>
            </button>

            {tiendaAbierta && (
                <div className="border-t border-amber-200 bg-amber-50/40">
                    {/* Selector de pestañas internas */}
                    <div className="flex border-b border-amber-200 bg-amber-100/30">
                        <button
                            onClick={() => setPestanaActiva('avatares')}
                            className={`flex-1 py-2.5 text-xs font-black transition-colors cursor-pointer ${
                                pestanaActiva === 'avatares'
                                    ? 'bg-white text-amber-900 border-b-2 border-amber-600 shadow-sm'
                                    : 'text-amber-700 hover:bg-amber-100/50'
                            }`}
                        >
                            Avatares (10)
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
                            Comprar Vidas
                        </button>
                    </div>

                    {/* Contenido de la Pestaña Avatares */}
                    {pestanaActiva === 'avatares' && (
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
                            {CATALOGO_AVATARES.map((avatar) => {
                                const desbloqueado = avataresDesbloqueados.includes(avatar.id);
                                const equipado = avatarActual === avatar.id;

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
                                            <img 
                                                src={`/avatares/${avatar.id}.png`} 
                                                alt={avatar.nombre} 
                                                className="w-full h-full object-contain p-1" 
                                                onError={(e) => { 
                                                    e.target.onerror = null; 
                                                    e.target.style.display = 'none'; 
                                                }} 
                                            />
                                        </div>

                                        <div className="font-black text-xs text-center text-amber-950 mb-1 leading-tight h-8 flex items-center justify-center">
                                            {avatar.nombre}
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
                                                    {avatar.costo}
                                                    <img src="/totopp.png" alt="Totopo" className="w-3.5 h-3.5 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleComprarOEquiparAvatar(avatar)}
                                            disabled={equipado}
                                            className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 shadow ${
                                                equipado 
                                                    ? 'bg-amber-500 text-white opacity-90 cursor-default' 
                                                    : desbloqueado 
                                                        ? 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer' 
                                                        : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                                            }`}
                                        >
                                            {equipado ? 'Equipado' : desbloqueado ? 'Equipar' : 'Comprar'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Contenido de la Pestaña Vidas (Optimizado en espacio) */}
                    {pestanaActiva === 'vidas' && (
                        <div className="p-4 flex flex-col gap-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-amber-800 font-medium text-center mb-1">
                                Intercambia tus totopos por vidas adicionales para continuar tus partidas.
                            </p>
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
                                                {paquete.cantidad} {paquete.cantidad === 1 ? 'Vida Extra' : 'Vidas Extras'}
                                            </div>
                                            <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                                Costo: {paquete.costo} 
                                                <img src="/totopp.png" alt="Totopo" className="w-3.5 h-3.5 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleComprarVidas(paquete)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-transform active:scale-95 cursor-pointer"
                                    >
                                        Adquirir
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}