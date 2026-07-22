import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Catálogo inicial de avatares disponibles en la tienda
const CATALOGO_AVATARES = [
    { id: 'default', nombre: 'Totopo Clásico', emoji: '🌽', costo: 0 },
    { id: 'iguana', nombre: 'Iguana Istmeña', emoji: '🦎', costo: 50 },
    { id: 'tortuga', nombre: 'Tortuga Lagunera', emoji: '🐢', costo: 75 },
    { id: 'huipil', nombre: 'Flor de Huipil', emoji: '🌸', costo: 100 },
];

export default function PerfilModal({ user, onClose }) {
    const [nombre, setNombre] = useState('');
    const [totopos, setTotopos] = useState(0);
    const [avatarActual, setAvatarActual] = useState('default');
    const [avataresDesbloqueados, setAvataresDesbloqueados] = useState(['default']);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');

    // Cargar datos del usuario desde Firestore al abrir el modal
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
                    setAvatarActual(data.avatar || 'default');
                    setAvataresDesbloqueados(data.avataresDesbloqueados || ['default']);
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    // Guardar el nombre editado
    const handleActualizarNombre = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { nombre });
            setMensaje('¡Nombre actualizado con éxito!');
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error actualizando nombre:", error);
            setMensaje('Error al actualizar el nombre.');
        }
    };

    // Comprar o equipar un avatar
    const handleComprarOEquipar = async (avatarItem) => {
        const yaDesbloqueado = avataresDesbloqueados.includes(avatarItem.id);

        if (!yaDesbloqueado) {
            // Verificar si tiene suficientes totopos
            if (totopos < avatarItem.costo) {
                setMensaje(`¡No tienes suficientes totopos! Te faltan ${avatarItem.costo - totopos} 🌽.`);
                setTimeout(() => setMensaje(''), 4000);
                return;
            }

            // Realizar compra
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
                setTimeout(() => setMensaje(''), 3000);
            } catch (error) {
                console.error("Error en compra:", error);
            }
        } else {
            // Si ya lo tiene, solo equiparlo
            try {
                const docRef = doc(db, 'usuarios', user.uid);
                await updateDoc(docRef, { avatar: avatarItem.id });
                setAvatarActual(avatarItem.id);
                setMensaje(`Avatar cambiado a ${avatarItem.nombre} 👍`);
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-amber-50 rounded-2xl p-6 text-center text-amber-900 font-bold">
                    Cargando tu perfil... 🌽
                </div>
            </div>
        );
    }

    const avatarSeleccionadoObj = CATALOGO_AVATARES.find(a => a.id === avatarActual);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-amber-50 rounded-2xl shadow-2xl border-4 border-amber-600 w-full max-w-lg p-6 relative my-8 animate-fade-in text-amber-950">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-amber-800 hover:text-amber-950 font-bold text-xl w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center transition-colors"
                >
                    ✕
                </button>

                {/* Cabecera del Perfil */}
                <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-amber-600 rounded-full mx-auto flex items-center justify-center text-white text-5xl shadow-lg mb-2">
                        {avatarSeleccionadoObj ? avatarSeleccionadoObj.emoji : '🌽'}
                    </div>
                    <h2 className="text-2xl font-black text-amber-900">
                        {nombre ? nombre : 'Mi Perfil Istmeño'}
                    </h2>
                    <p className="text-amber-700 text-sm">{user.email}</p>

                    <div className="inline-flex items-center gap-2 bg-amber-200/80 px-4 py-1.5 rounded-full mt-3 border border-amber-400">
                        <span className="text-xl">🌽</span>
                        <span className="font-black text-amber-900 text-lg">{totopos} Totopos</span>
                    </div>
                </div>

                {mensaje && (
                    <div className="bg-amber-200 border border-amber-500 text-amber-900 px-4 py-2 rounded-xl mb-4 text-center font-semibold text-sm">
                        {mensaje}
                    </div>
                )}

                {/* Sección: Editar Nombre */}
                <form onSubmit={handleActualizarNombre} className="mb-6 bg-white p-4 rounded-xl border border-amber-300 shadow-sm">
                    <label className="block text-amber-900 font-bold text-sm mb-1">Nombre de usuario o apodo</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Chepe Zapoteco"
                            className="flex-1 px-3 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm bg-amber-50/30"
                        />
                        <button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-transform transform active:scale-95 shadow"
                        >
                            Guardar
                        </button>
                    </div>
                </form>

                {/* Sección: Tienda de Avatares */}
                <div className="mb-6">
                    <h3 className="font-black text-amber-900 mb-3 text-lg flex items-center gap-2">
                        <span>🛍️</span> Tienda de Avatares
                    </h3>
                    <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                        {CATALOGO_AVATARES.map((avatar) => {
                            const desbloqueado = avataresDesbloqueados.includes(avatar.id);
                            const equipado = avatarActual === avatar.id;

                            return (
                                <div
                                    key={avatar.id}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all ${equipado
                                            ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-500 shadow-sm'
                                            : 'border-amber-200 bg-white'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">{avatar.emoji}</div>
                                    <div className="font-bold text-sm text-center text-amber-900">{avatar.nombre}</div>
                                    <div className="text-xs text-amber-700 mb-2">
                                        {desbloqueado ? 'Desbloqueado' : `${avatar.costo} 🌽`}
                                    </div>
                                    <button
                                        onClick={() => handleComprarOEquipar(avatar)}
                                        disabled={equipado}
                                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${equipado
                                                ? 'bg-amber-400 text-white cursor-default'
                                                : desbloqueado
                                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow'
                                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow'
                                            }`}
                                    >
                                        {equipado ? 'Equipado' : desbloqueado ? 'Equipar' : 'Comprar'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Botón Cerrar Sesión */}
                <button
                    onClick={handleCerrarSesion}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow transition-transform transform active:scale-95 text-sm"
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}