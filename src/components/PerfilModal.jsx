import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// 🛍️ Catálogo de Avatares
const CATALOGO_AVATARES = [
    { id: 'default', nombre: 'Totopo Clásico', emoji: '🌽', costo: 0 },
    { id: 'iguana', nombre: 'Iguana Istmeña', emoji: '🦎', costo: 50 },
    { id: 'tortuga', nombre: 'Tortuga Lagunera', emoji: '🐢', costo: 75 },
    { id: 'huipil', nombre: 'Flor de Huipil', emoji: '🌸', costo: 100 },
];

// ❤️ Catálogo de Vidas Extras
const CATALOGO_VIDAS = [
    { id: 'vida_1', nombre: '1 Vida Extra', emoji: '❤️', costo: 15, cantidad: 1 },
    { id: 'vida_3', nombre: 'Paquete 3 Vidas', emoji: '💖', costo: 40, cantidad: 3 },
    { id: 'vida_5', nombre: 'Paquete 5 Vidas', emoji: '🌟', costo: 60, cantidad: 5 },
];

// 📊 Función para calcular el Nivel basado en Totopos Históricos (totales ganados)
const calcularNivelYTitulo = (totalHistorico) => {
    if (totalHistorico < 100) return { nivel: 1, titulo: "Recién Llegado 🌱" };
    if (totalHistorico < 300) return { nivel: 2, titulo: "Explorador Istmeño 🚶🏽" };
    if (totalHistorico < 600) return { nivel: 3, titulo: "Estudiante Zapoteco 📖" };
    if (totalHistorico < 1000) return { nivel: 4, titulo: "Conocedor Diidxazá 🗣️" };
    return { nivel: 5, titulo: "Maestro Zapoteco 👑" };
};

export default function PerfilModal({ user, onClose, onProfileUpdate }) {
    const [nombre, setNombre] = useState('');
    const [totopos, setTotopos] = useState(0);
    const [totoposHistoricos, setTotoposHistoricos] = useState(0); // Para el Nivel
    const [vidas, setVidas] = useState(0); // Vidas del usuario
    const [avatarActual, setAvatarActual] = useState('default');
    const [avataresDesbloqueados, setAvataresDesbloqueados] = useState(['default']);
    
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);

    // Cargar datos del usuario desde Firestore
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'usuarios', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNombre(data.nombre || '');
                    setTotopos(data.totopos || 0);
                    setVidas(data.vidas || 3); // Si no tiene, damos 3 por defecto
                    setAvatarActual(data.avatar || 'default');
                    setAvataresDesbloqueados(data.avataresDesbloqueados || ['default']);
                    
                    // Sincronizar totopos históricos
                    let historico = data.totoposHistoricos || data.totopos || 0;
                    if (data.totopos > historico) historico = data.totopos;
                    setTotoposHistoricos(historico);
                    
                    // Avisar al componente padre de los datos actualizados incluyendo el nivel
                    if (onProfileUpdate) {
                        const calc = calcularNivelYTitulo(historico);
                        onProfileUpdate({
                            nombre: data.nombre || '',
                            avatar: data.avatar || 'default',
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
    }, [user, onProfileUpdate]);

    // Guardar el nombre editado
    const handleActualizarNombre = async (e) => {
        e.preventDefault();
        const nombreLimpio = nombre.trim();
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { nombre: nombreLimpio });
            setMensaje('¡Nombre actualizado con éxito!');
            
            const calc = calcularNivelYTitulo(totoposHistoricos);
            if (onProfileUpdate) {
                onProfileUpdate({ nombre: nombreLimpio, avatar: avatarActual, nivel: calc.nivel });
            }
            
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error actualizando nombre:", error);
            setMensaje('Error al actualizar el nombre.');
        }
    };

    // Comprar Vidas
    const handleComprarVidas = async (paquete) => {
        if (totopos < paquete.costo) {
            setMensaje(`¡No tienes suficientes totopos! Te faltan ${paquete.costo - totopos} 🌽.`);
            setTimeout(() => setMensaje(''), 4000);
            return;
        }

        const nuevosTotopos = totopos - paquete.costo;
        const nuevasVidas = vidas + paquete.cantidad;

        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { 
                totopos: nuevosTotopos,
                vidas: nuevasVidas
            });
            setTotopos(nuevosTotopos);
            setVidas(nuevasVidas);
            setMensaje(`¡Compraste ${paquete.nombre}! ❤️`);
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error comprando vidas:", error);
            setMensaje("Hubo un error con la compra.");
        }
    };

    // Comprar o equipar un avatar
    const handleComprarOEquipar = async (avatarItem) => {
        const yaDesbloqueado = avataresDesbloqueados.includes(avatarItem.id);
        const calc = calcularNivelYTitulo(totoposHistoricos);

        if (!yaDesbloqueado) {
            if (totopos < avatarItem.costo) {
                setMensaje(`¡No tienes suficientes totopos! Te faltan ${avatarItem.costo - totopos} 🌽.`);
                setTimeout(() => setMensaje(''), 4000);
                return;
            }

            const nuevosTotopos = totopos - avatarItem.costo;
            const nuevosDesbloqueados = [...avataresDesbloqueados, avatarItem.id];

            try {
                const docRef = doc(db, 'usuarios', user.uid);
                await updateDoc(docRef, {
                    totopos: nuevosTotopos,
                    avataresDesbloqueados: nuevosDesbloqueados,
                    avatar: avatarItem.id
                });
                setTotopos(nuevosTotopos);
                setAvataresDesbloqueados(nuevosDesbloqueados);
                setAvatarActual(avatarItem.id);
                setMensaje(`¡Has comprado y equipado ${avatarItem.nombre}! 🎉`);
                if (onProfileUpdate) {
                    onProfileUpdate({ nombre, avatar: avatarItem.id, nivel: calc.nivel });
                }
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
                if (onProfileUpdate) {
                    onProfileUpdate({ nombre, avatar: avatarItem.id, nivel: calc.nivel });
                }
                setTimeout(() => setMensaje(''), 3000);
            } catch (error) {
                console.error("Error equipando avatar:", error);
            }
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

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 text-center text-amber-900 font-bold shadow-xl">
                    <span className="text-4xl animate-pulse block mb-2">🌽</span>
                    Cargando tu perfil...
                </div>
            </div>
        );
    }

    const avatarSeleccionadoObj = CATALOGO_AVATARES.find(a => a.id === avatarActual);
    const { nivel, titulo } = calcularNivelYTitulo(totoposHistoricos);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600 w-full max-w-lg relative overflow-hidden flex flex-col max-h-[95vh] animate-fade-in">
                
                <div className="absolute top-3 right-3 z-20">
                    <button
                        onClick={onClose}
                        className="text-amber-900 hover:bg-amber-200/80 font-bold text-xl w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors border border-amber-200 shadow-sm"
                    >
                        ✕
                    </button>
                </div>

                {showConfirmLogout && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="text-5xl mb-3">⚠️</div>
                        <h3 className="text-2xl font-bold text-red-600 mb-2">¿Cerrar Sesión?</h3>
                        <p className="text-amber-900 text-sm mb-6 font-medium">Tendrás que volver a ingresar tu correo para guardar tu progreso en la nube.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowConfirmLogout(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleCerrarSesion} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors">Sí, salir</button>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto custom-scrollbar p-5 pb-6">
                    
                    <div className="text-center mb-6 mt-2 relative">
                        <div className="w-24 h-24 bg-amber-600 rounded-full mx-auto flex items-center justify-center text-white text-5xl shadow-lg border-4 border-white relative">
                            {avatarSeleccionadoObj ? avatarSeleccionadoObj.emoji : '🌽'}
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-sm">
                                Lvl {nivel}
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-black text-amber-950 mt-3">
                            {nombre ? nombre : 'Mi Perfil Istmeño'}
                        </h2>
                        <p className="text-amber-700 text-sm font-medium mb-1">
                            {!nombre ? user.email : titulo}
                        </p>

                        <div className="flex justify-center gap-2 mt-3">
                            <div className="flex items-center gap-1.5 bg-amber-200/80 px-3 py-1.5 rounded-xl border border-amber-400 shadow-sm">
                                <span className="text-lg">🌽</span>
                                <span className="font-black text-amber-900 text-sm">{totopos}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-100/80 px-3 py-1.5 rounded-xl border border-red-300 shadow-sm">
                                <span className="text-lg">❤️</span>
                                <span className="font-black text-red-700 text-sm">{vidas} Vidas</span>
                            </div>
                        </div>
                    </div>

                    {mensaje && (
                        <div className="bg-amber-200 border border-amber-500 text-amber-900 px-4 py-2 rounded-xl mb-4 text-center font-bold text-sm shadow-sm animate-pop">
                            {mensaje}
                        </div>
                    )}

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
                            <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-transform transform active:scale-95 shadow">
                                Guardar
                            </button>
                        </div>
                    </form>

                    <div className="mb-6">
                        <h3 className="font-black text-amber-900 mb-3 text-base flex items-center gap-2">
                            <span>❤️</span> Comprar Vidas Extras
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {CATALOGO_VIDAS.map((paquete) => (
                                <button
                                    key={paquete.id}
                                    onClick={() => handleComprarVidas(paquete)}
                                    className="p-3 bg-white rounded-xl border border-amber-200 flex flex-col items-center justify-center hover:bg-amber-50 hover:border-amber-400 transition-all shadow-sm active:scale-95"
                                >
                                    <div className="text-2xl mb-1">{paquete.emoji}</div>
                                    <div className="font-bold text-xs text-amber-950 text-center mb-1 leading-tight">{paquete.nombre}</div>
                                    <div className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-center w-full">
                                        {paquete.costo} 🌽
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-black text-amber-900 mb-3 text-base flex items-center gap-2">
                            <span>🛍️</span> Tienda de Avatares
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {CATALOGO_AVATARES.map((avatar) => {
                                const desbloqueado = avataresDesbloqueados.includes(avatar.id);
                                const equipado = avatarActual === avatar.id;

                                return (
                                    <div
                                        key={avatar.id}
                                        className={`p-3 rounded-2xl border flex flex-col items-center justify-between transition-all ${
                                            equipado ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400 shadow-sm' : 'border-amber-200 bg-white'
                                        }`}
                                    >
                                        <div className="text-3xl mb-1 drop-shadow-sm">{avatar.emoji}</div>
                                        <div className="font-bold text-xs text-center text-amber-950 mb-1 leading-tight h-8 flex items-center justify-center">{avatar.nombre}</div>
                                        <div className="text-[10px] font-black text-amber-700 mb-2">
                                            {desbloqueado ? 'Desbloqueado ✅' : `${avatar.costo} 🌽`}
                                        </div>
                                        <button
                                            onClick={() => handleComprarOEquipar(avatar)}
                                            disabled={equipado}
                                            className={`w-full py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                                                equipado ? 'bg-amber-400 text-white cursor-default'
                                                : desbloqueado ? 'bg-amber-600 hover:bg-amber-700 text-white shadow active:scale-95'
                                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow active:scale-95'
                                            }`}
                                        >
                                            {equipado ? 'Equipado' : desbloqueado ? 'Equipar' : 'Comprar'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowConfirmLogout(true)}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold py-3 px-4 rounded-2xl shadow-sm transition-transform transform active:scale-95 text-sm"
                    >
                        Cerrar Sesión
                    </button>
                    
                </div>
            </div>
        </div>
    );
}