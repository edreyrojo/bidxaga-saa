import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import CreadorAvatar from './CreadorAvatar';

// 🛍️ Catálogo extendido a 10 Avatares
const CATALOGO_AVATARES = [
    { id: 'default', nombre: 'Totopo Clásico', emoji: '🌽', costo: 0 },
    { id: 'iguana', nombre: 'Iguana Istmeña', emoji: '🦎', costo: 50 },
    { id: 'tortuga', nombre: 'Tortuga Lagunera', emoji: '🐢', costo: 75 },
    { id: 'huipil', nombre: 'Flor de Huipil', emoji: '🌸', costo: 100 },
    { id: 'colibri', nombre: 'Colibrí Dorado', emoji: '🐦', costo: 150 },
    { id: 'jaguar', nombre: 'Jaguar Zapoteco', emoji: '🐆', costo: 200 },
    { id: 'mezcal', nombre: 'Copa de Mezcal', emoji: '🥃', costo: 250 },
    { id: 'sol', nombre: 'Sol del Istmo', emoji: '☀️', costo: 300 },
    { id: 'bandera', nombre: 'Orgullo Istmeño', emoji: '🧵', costo: 400 },
    { id: 'corona', nombre: 'Rey Zapoteco', emoji: '👑', costo: 500 },
];

// ❤️ Catálogo de Vidas Extras
const CATALOGO_VIDAS = [
    { id: 'vida_1', nombre: '1 Vida', emoji: '❤️', costo: 15, cantidad: 1 },
    { id: 'vida_3', nombre: '3 Vidas', emoji: '❤️', costo: 40, cantidad: 3 },
    { id: 'vida_5', nombre: '5 Vidas', emoji: '❤️', costo: 60, cantidad: 5 },
];

// 🏆 Catálogo de Logros e Insignias
const CATALOGO_LOGROS = [
    { id: 'logro_memoria_1', juego: 'Memorama', nombre: 'Memoria de Rayo', desc: 'Completa cualquier nivel de Memorama sin fallar.', emoji: '🧠' },
    { id: 'logro_crucigrama_5', juego: 'Crucigrama', nombre: 'Erudito del Crucigrama', desc: 'Alcanza el Nivel 5 o superior en Crucigrama.', emoji: '🧩' },
    { id: 'logro_sopa_10', juego: 'Sopa de Letras', nombre: 'Ojo de Águila', desc: 'Llega al Nivel 10 en Sopa de Letras.', emoji: '🔍' },
    { id: 'logro_trivia_maestro', juego: 'Trivia', nombre: 'Sabio Zapoteco', desc: 'Termina la Trivia en Modo Difícil sin errores.', emoji: '⚡' },
];

// 📊 Funciones de Nivel y Progreso
const calcularNivelYTitulo = (totalHistorico) => {
    if (totalHistorico < 100) return { nivel: 1, titulo: "Recién Llegado 🌱" };
    if (totalHistorico < 300) return { nivel: 2, titulo: "Explorador Istmeño 🚶🏽" };
    if (totalHistorico < 600) return { nivel: 3, titulo: "Estudiante Zapoteco 📖" };
    if (totalHistorico < 1000) return { nivel: 4, titulo: "Conocedor Diidxazá 🗣️" };
    return { nivel: 5, titulo: "Maestro Zapoteco 👑" };
};

const calcularProgresoNivel = (totalHistorico) => {
    if (totalHistorico < 100) {
        return { necesario: 100, porcentaje: Math.min(100, (totalHistorico / 100) * 100) };
    } else if (totalHistorico < 300) {
        return { necesario: 300, porcentaje: Math.min(100, ((totalHistorico - 100) / 200) * 100) };
    } else if (totalHistorico < 600) {
        return { necesario: 600, porcentaje: Math.min(100, ((totalHistorico - 300) / 300) * 100) };
    } else if (totalHistorico < 1000) {
        return { necesario: 1000, porcentaje: Math.min(100, ((totalHistorico - 600) / 400) * 100) };
    } else {
        return { necesario: totalHistorico, porcentaje: 100 };
    }
};

/* ==========================================
   🎨 COMPONENTE AUXILIAR: RENDERIZADOR DE AVATAR (Soporta Objeto y Texto)
   ========================================== */
function RenderAvatarVisual({ avatar }) {
    const esPersonalizado = typeof avatar === 'object' && avatar !== null;

    if (esPersonalizado) {
        const personaje = avatar.tipo || 'personaje1';
        return (
            <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
                {/* 1. Silueta */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.silueta || '#1A1A1A',
                        WebkitMaskImage: `url(/avatares/${personaje}/1silueta.svg)`,
                        maskImage: `url(/avatares/${personaje}/1silueta.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 2. Piel */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.piel || '#F5C6A0',
                        WebkitMaskImage: `url(/avatares/${personaje}/1piel.svg)`,
                        maskImage: `url(/avatares/${personaje}/1piel.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 3. Cabello */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.cabello || '#4A3525',
                        WebkitMaskImage: `url(/avatares/${personaje}/1cabello.svg)`,
                        maskImage: `url(/avatares/${personaje}/1cabello.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
            </div>
        );
    }

    // Avatar estándar del catálogo (String)
    return (
        <img 
            src={`/avatares/${avatar}.png`} 
            alt="Avatar Equipado"
            className="w-full h-full object-contain p-1 bg-amber-50"
            onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.className = "text-4xl";
                fallback.innerText = '🎨';
                e.target.parentNode.appendChild(fallback);
            }}
        />
    );
}

/* ==========================================
   SUB-COMPONENTE: SECCIÓN DE TIENDA
   ========================================== */
function SeccionTienda({ tiendaAbierta, setTiendaAbierta, CATALOGO_AVATARES, avataresDesbloqueados, avatarActual, handleComprarOEquipar }) {
    return (
        <div className="mb-6 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setTiendaAbierta(!tiendaAbierta)}
                className="w-full p-4 flex items-center justify-between bg-amber-100/50 hover:bg-amber-100 transition-colors cursor-pointer"
            >
                <span className="font-black text-amber-900 text-base flex items-center gap-2">
                    <img src="/tehuana.png" alt="Tehuana" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                    Tienda de Avatares
                </span>
                <span className="text-amber-950 font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                    {tiendaAbierta ? '▲ Ocultar Tienda' : '▼'}
                </span>
            </button>
            {tiendaAbierta && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar border-t border-amber-200 bg-amber-50/40">
                    {CATALOGO_AVATARES.map((avatar) => {
                        const desbloqueado = avataresDesbloqueados.includes(avatar.id);
                        const equipado = avatarActual === avatar.id;

                        return (
                            <div key={avatar.id} className={`p-3 rounded-3xl border-2 flex flex-col items-center justify-between transition-all duration-200 ${equipado ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-400 shadow-lg' : 'border-amber-300 bg-white hover:border-amber-400'}`}>
                                <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 rounded-full flex items-center justify-center border-4 shadow-inner overflow-hidden ${equipado ? 'border-amber-500 bg-white' : 'border-amber-200 bg-amber-50'}`}>
                                    <img src={`/avatares/${avatar.id}.png`} alt={avatar.nombre} className="w-full h-full object-contain p-1" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                                </div>
                                <div className="font-black text-xs text-center text-amber-950 mb-1 leading-tight h-8 flex items-center justify-center">{avatar.nombre}</div>
                                <div className={`text-[11px] font-black mb-2 px-2.5 py-0.5 rounded-full ${desbloqueado ? 'text-green-900 bg-green-100 border border-green-300' : 'text-amber-800 bg-amber-100 border border-amber-300'}`}>
                                    {desbloqueado ? '✓ Adquirido' : `${avatar.costo} 🌽`}
                                </div>
                                <button
                                    onClick={() => handleComprarOEquipar(avatar)}
                                    disabled={equipado}
                                    className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 shadow ${equipado ? 'bg-amber-500 text-white opacity-90' : desbloqueado ? 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer' : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'}`}
                                >
                                    {equipado ? 'Equipado' : desbloqueado ? 'Equipar' : 'Comprar'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ==========================================
   SUB-COMPONENTE: SECCIÓN DE LOGROS
   ========================================== */
function SeccionLogros({ logrosAbiertos, setLogrosAbiertos, CATALOGO_LOGROS, logrosDesbloqueados }) {
    return (
        <div className="mb-6 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setLogrosAbiertos(!logrosAbiertos)}
                className="w-full p-4 flex items-center justify-between bg-amber-100/50 hover:bg-amber-100 transition-colors cursor-pointer"
            >
                <span className="font-black text-amber-900 text-base flex items-center gap-2">
                    <img src="/guiechachi.png" alt="Guiechachi" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                    Logros y Trofeos de Juegos
                </span>
                <span className="text-amber-950 font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                    {logrosAbiertos ? '▲ Ocultar Logros' : '▼'}
                </span>
            </button>
            {logrosAbiertos && (
                <div className="p-4 space-y-2 max-h-72 overflow-y-auto custom-scrollbar border-t border-amber-200 bg-amber-50/40">
                    {CATALOGO_LOGROS.map((logro) => {
                        const conseguido = logrosDesbloqueados.includes(logro.id);
                        return (
                            <div key={logro.id} className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${conseguido ? 'bg-white border-amber-300 shadow-sm' : 'bg-gray-100 border-gray-300 opacity-60 grayscale'}`}>
                                <div className="text-3xl bg-amber-100 p-2 rounded-xl border border-amber-200 flex-shrink-0">
                                    {conseguido ? logro.emoji : '🔒'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${conseguido ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-700'}`}>{logro.juego}</span>
                                        <span className={`text-xs font-bold ${conseguido ? 'text-green-700' : 'text-gray-500'}`}>{conseguido ? '¡Conseguido! ✅' : 'Bloqueado'}</span>
                                    </div>
                                    <h4 className={`font-black text-sm mt-1 truncate ${conseguido ? 'text-amber-950' : 'text-gray-600'}`}>{logro.nombre}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{logro.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ==========================================
   COMPONENTE PRINCIPAL: PERFIL MODAL
   ========================================== */
export default function PerfilModal({ user, onClose, onProfileUpdate }) {
    const [nombre, setNombre] = useState('');
    const [totopos, setTotopos] = useState(0);
    const [totoposHistoricos, setTotoposHistoricos] = useState(0);
    const [vidas, setVidas] = useState(3);
    const [avatarActual, setAvatarActual] = useState('default');
    const [avataresDesbloqueados, setAvataresDesbloqueados] = useState(['default']);
    const [logrosDesbloqueados, setLogrosDesbloqueados] = useState([]);

    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    const [showCreador, setShowCreador] = useState(false);

    const [tiendaAbierta, setTiendaAbierta] = useState(false);
    const [logrosAbiertos, setLogrosAbiertos] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) { setLoading(false); return; }
            try {
                const docRef = doc(db, 'usuarios', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const avatarId = data.avatar !== undefined ? data.avatar : 'default';
                    setNombre(data.nombre || '');
                    setTotopos(data.totopos || 0);
                    setVidas(data.vidas !== undefined ? data.vidas : 3);
                    setAvatarActual(avatarId);
                    setAvataresDesbloqueados(data.avataresDesbloqueados || ['default']);
                    setLogrosDesbloqueados(data.logrosDesbloqueados || []);

                    let historico = data.totoposHistoricos;
                    if (historico === undefined || historico < (data.totopos || 0)) {
                        historico = data.totopos || 0;
                        await updateDoc(docRef, { totoposHistoricos: historico });
                    }
                    setTotoposHistoricos(historico);

                    if (onProfileUpdate) {
                        const calc = calcularNivelYTitulo(historico);
                        const emojiAvatar = typeof avatarId === 'object' ? '🎨' : (CATALOGO_AVATARES.find(a => a.id === avatarId)?.emoji || '🌽');
                        onProfileUpdate({
                            nombre: data.nombre || '',
                            avatar: avatarId,
                            emoji: emojiAvatar,
                            nivel: calc.nivel
                        });
                    }
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    const handleActualizarNombre = async (e) => {
        e.preventDefault();
        const nombreLimpio = nombre.trim();
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { nombre: nombreLimpio });
            setMensaje('¡Nombre actualizado con éxito!');
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error actualizando nombre:", error);
            setMensaje('Error al actualizar el nombre.');
        }
    };

    const handleComprarVidas = async (paquete) => {
        if (totopos < paquete.costo) {
            setMensaje(`¡Te faltan ${paquete.costo - totopos} totopos para comprar este paquete!`);
            setTimeout(() => setMensaje(''), 4000);
            return;
        }
        const nuevosTotopos = totopos - paquete.costo;
        const nuevasVidas = vidas + paquete.cantidad;
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { totopos: nuevosTotopos, vidas: nuevasVidas });
            setTotopos(nuevosTotopos);
            setVidas(nuevasVidas);
            setMensaje(`¡Compraste ${paquete.cantidad} vida(s) extra! ❤️`);
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error comprando vidas:", error);
        }
    };

    const handleComprarOEquipar = async (avatarItem) => {
        const yaDesbloqueado = avataresDesbloqueados.includes(avatarItem.id);
        if (!yaDesbloqueado) {
            if (totopos < avatarItem.costo) {
                setMensaje(`¡Te faltan ${avatarItem.costo - totopos} totopos!`);
                setTimeout(() => setMensaje(''), 4000);
                return;
            }
            const nuevosTotopos = totopos - avatarItem.costo;
            const nuevosDesbloqueados = [...avataresDesbloqueados, avatarItem.id];
            try {
                const docRef = doc(db, 'usuarios', user.uid);
                await updateDoc(docRef, { totopos: nuevosTotopos, avataresDesbloqueados: nuevosDesbloqueados, avatar: avatarItem.id });
                setTotopos(nuevosTotopos);
                setAvataresDesbloqueados(nuevosDesbloqueados);
                setAvatarActual(avatarItem.id);
                setMensaje(`¡Compraste y equipaste ${avatarItem.nombre}! 🎉`);
                setTimeout(() => setMensaje(''), 3000);
            } catch (error) {
                console.error("Error en compra:", error);
            }
        } else {
            try {
                const docRef = doc(db, 'usuarios', user.uid);
                await updateDoc(docRef, { avatar: avatarItem.id });
                setAvatarActual(avatarItem.id);
                setMensaje(`Avatar cambiado a ${avatarItem.nombre} 👍`);
                setTimeout(() => setMensaje(''), 3000);
            } catch (error) {
                console.error("Error equipando:", error);
            }
        }
    };

    const handleGuardarAvatarPersonalizado = async (configuracionAvatar) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { avatar: configuracionAvatar });
            setAvatarActual(configuracionAvatar);
            setMensaje('¡Avatar personalizado guardado con éxito! ✨');
            
            const calc = calcularNivelYTitulo(totoposHistoricos);
            if (onProfileUpdate) {
                onProfileUpdate({
                    nombre,
                    avatar: configuracionAvatar,
                    emoji: '🎨',
                    nivel: calc.nivel
                });
            }
            setTimeout(() => setMensaje(''), 3000);
            setShowCreador(false);
        } catch (error) {
            console.error("Error al guardar avatar personalizado:", error);
            setMensaje('Error al guardar el avatar personalizado.');
        }
    };

    const handleCerrarSesion = async () => {
        try {
            await signOut(auth);
            onClose();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const { nivel, titulo } = calcularNivelYTitulo(totoposHistoricos);
    const progresoInfo = calcularProgresoNivel(totoposHistoricos);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600 w-full max-w-lg relative overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">

                <div className="absolute top-3 right-3 z-20">
                    <button onClick={onClose} className="text-amber-900 hover:bg-amber-200/80 font-bold text-xl w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors border border-amber-200 shadow-sm cursor-pointer">
                        ✕
                    </button>
                </div>

                {showConfirmLogout && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="text-5xl mb-3">⚠️</div>
                        <h3 className="text-2xl font-bold text-red-600 mb-2">¿Cerrar Sesión?</h3>
                        <p className="text-amber-900 text-sm mb-6 font-medium">Tendrás que volver a ingresar para conservar tu progreso en la nube.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowConfirmLogout(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleCerrarSesion} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors cursor-pointer">Sí, salir</button>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto custom-scrollbar p-5 pb-6 relative">

                    {loading && (
                        <div className="absolute inset-x-0 top-0 bg-amber-600/90 text-white text-[11px] font-bold py-1 text-center z-10 flex items-center justify-center gap-1.5 shadow-sm animate-pulse">
                            <span>🔄 Sincronizando datos con la nube...</span>
                        </div>
                    )}

                    {/* ENCABEZADO DE PERFIL */}
                    <div className="text-center mb-6 mt-2 relative">
                        <div className="relative inline-block mx-auto">
                            {/* Círculo contenedor del avatar */}
                            <div className="w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden relative">
                                <RenderAvatarVisual avatar={avatarActual} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-md z-10">
                                Lvl {nivel}
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-amber-950 mt-3">
                            {nombre ? nombre : (user?.email || 'Mi Perfil Istmeño')}
                        </h2>
                        <p className="text-amber-700 text-sm font-medium mb-2">
                            {!nombre ? 'Explorador' : titulo}
                        </p>

                        {user && (
                            <div className="max-w-xs mx-auto mb-3">
                                <button
                                    onClick={() => setShowCreador(true)}
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md transition-transform transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-amber-500"
                                >
                                    🎨 Diseñar mi Avatar
                                </button>
                            </div>
                        )}

                        {/* BARRA DE PROGRESO */}
                        <div className="max-w-xs mx-auto mb-3 bg-white/80 p-3 rounded-2xl border border-amber-200 shadow-sm">
                            <div className="flex justify-between items-center text-xs font-black text-amber-900 mb-1.5">
                                <span>Progreso Nivel {nivel}</span>
                                <span className="text-amber-700 flex items-center gap-1">
                                    {totoposHistoricos} / {progresoInfo.necesario} 🌽
                                </span>
                            </div>
                            <div className="w-full bg-amber-100 rounded-full h-3.5 overflow-hidden border border-amber-300 shadow-inner">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: `${progresoInfo.porcentaje}%` }}></div>
                            </div>
                        </div>

                        {/* CONTADORES */}
                        <div className="flex justify-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 bg-amber-200/80 px-3 py-1.5 rounded-xl border border-amber-400 shadow-sm">
                                <span>🌽</span>
                                <span className="font-black text-amber-900 text-sm">{totopos}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-100/80 px-3 py-1.5 rounded-xl border border-red-300 shadow-sm">
                                <span>❤️</span>
                                <span className="font-black text-red-700 text-sm">{vidas} Vidas</span>
                            </div>
                        </div>
                    </div>

                    {mensaje && (
                        <div className="bg-amber-200 border border-amber-500 text-amber-900 px-4 py-2 rounded-xl mb-4 text-center font-bold text-sm shadow-sm animate-pop">
                            {mensaje}
                        </div>
                    )}

                    {/* CAMBIAR NOMBRE */}
                    <form onSubmit={handleActualizarNombre} className="mb-6 bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                        <label className="block text-amber-900 font-bold text-sm mb-2">Nombre de usuario o apodo</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej. Chepe Zapoteco"
                                className="flex-1 px-3 py-2 rounded-xl border-2 border-amber-200 focus:outline-none focus:border-amber-500 font-medium text-sm bg-amber-50/50 text-amber-950"
                            />
                            <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-transform active:scale-95 shadow cursor-pointer">
                                Guardar
                            </button>
                        </div>
                    </form>

                    {/* COMPRAR VIDAS */}
                    <div className="mb-6">
                        <h3 className="font-black text-amber-900 mb-3 text-base flex items-center gap-2">❤️ Comprar Vidas Extras</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {CATALOGO_VIDAS.map((paquete) => (
                                <button
                                    key={paquete.id}
                                    onClick={() => handleComprarVidas(paquete)}
                                    className="p-2.5 bg-white rounded-xl border border-amber-200 flex flex-col items-center justify-center hover:bg-amber-50 hover:border-amber-400 transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <div className="flex items-center gap-1 font-black text-red-600 text-sm mb-1">
                                        <span>❤️ × {paquete.cantidad}</span>
                                    </div>
                                    <div className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-center w-full">
                                        {paquete.costo} 🌽
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TIENDA DE AVATARES */}
                    <SeccionTienda 
                        tiendaAbierta={tiendaAbierta}
                        setTiendaAbierta={setTiendaAbierta}
                        CATALOGO_AVATARES={CATALOGO_AVATARES}
                        avataresDesbloqueados={avataresDesbloqueados}
                        avatarActual={avatarActual}
                        handleComprarOEquipar={handleComprarOEquipar}
                    />

                    {/* LOGROS Y TROFEOS */}
                    <SeccionLogros 
                        logrosAbiertos={logrosAbiertos}
                        setLogrosAbiertos={setLogrosAbiertos}
                        CATALOGO_LOGROS={CATALOGO_LOGROS}
                        logrosDesbloqueados={logrosDesbloqueados}
                    />

                    <button
                        onClick={() => setShowConfirmLogout(true)}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold py-3 px-4 rounded-2xl shadow-sm transition-transform active:scale-95 text-sm cursor-pointer"
                    >
                        Cerrar Sesión
                    </button>

                </div>
            </div>

            {/* CREADOR DE AVATAR */}
            {showCreador && (
                <CreadorAvatar 
                    user={user}
                    onClose={() => setShowCreador(false)}
                    onGuardar={handleGuardarAvatarPersonalizado}
                />
            )}
        </div>
    );
}