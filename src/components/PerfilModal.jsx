import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import CreadorAvatar from './CreadorAvatar';
import SeccionTienda from './SeccionTienda';
import SeccionLogros from './SeccionLogros';

// Funciones de Nivel y Progreso
const calcularNivelYTitulo = (totalHistorico) => {
    if (totalHistorico < 100) return { nivel: 1, titulo: "Recién Llegado" };
    if (totalHistorico < 300) return { nivel: 2, titulo: "Explorador Istmeño" };
    if (totalHistorico < 600) return { nivel: 3, titulo: "Estudiante Zapoteco" };
    if (totalHistorico < 1000) return { nivel: 4, titulo: "Conocedor Diidxazá" };
    return { nivel: 5, titulo: "Maestro Zapoteco" };
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
   RENDERIZADOR DE AVATAR
   ========================================== */
function RenderAvatarVisual({ avatar }) {
    const esPersonalizado = typeof avatar === 'object' && avatar !== null;

    if (esPersonalizado) {
        const personaje = avatar.tipo || 'personaje1';
        const varSilueta = avatar.varianteSiluetaropabase || '1silueta.svg';
        const varPiel = avatar.variantePiel || '1piel.svg';
        const varCabello = avatar.varianteCabello || '1cabello1_1.svg';
        const varOjos = avatar.varianteOjos || '1ojos1.svg';
        const varRostro = avatar.varianteRostro || '1rostro1.svg';
        const varRopainferior = avatar.varianteRopainferior || '1shorts1.svg';
        const varRopasuperior = avatar.varianteRopasuperior || '1playera1.svg';

        return (
            <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varSilueta})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.piel || '#F5C6A0',
                        WebkitMaskImage: `url(/avatares/${personaje}/${varPiel})`,
                        maskImage: `url(/avatares/${personaje}/${varPiel})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.cabello || '#4A3525',
                        WebkitMaskImage: `url(/avatares/${personaje}/${varCabello})`,
                        maskImage: `url(/avatares/${personaje}/${varCabello})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.ojos || '#4a3525',
                        WebkitMaskImage: `url(/avatares/${personaje}/${varOjos})`,
                        maskImage: `url(/avatares/${personaje}/${varOjos})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varRostro})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.ropainferior || '#E65100',
                        WebkitMaskImage: `url(/avatares/${personaje}/${varRopainferior})`,
                        maskImage: `url(/avatares/${personaje}/${varRopainferior})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.ropasuperior || '#97d398',
                        WebkitMaskImage: `url(/avatares/${personaje}/${varRopasuperior})`,
                        maskImage: `url(/avatares/${personaje}/${varRopasuperior})`,
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

    return (
        <img 
            src={`/avatares/${avatar}.png`} 
            alt="Avatar Equipado"
            className="w-full h-full object-contain p-1 bg-amber-50"
            onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (!e.target.parentNode.querySelector('.fallback-text')) {
                    const fallback = document.createElement('span');
                    fallback.className = "fallback-text text-xs font-bold flex items-center justify-center w-full h-full text-amber-900";
                    fallback.innerText = 'Avatar';
                    e.target.parentNode.appendChild(fallback);
                }
            }}
        />
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
                        onProfileUpdate({
                            nombre: data.nombre || '',
                            avatar: avatarId,
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
            setMensaje('Nombre actualizado con éxito');
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error actualizando nombre:", error);
            setMensaje('Error al actualizar el nombre.');
        }
    };

    const handleGuardarAvatarPersonalizado = async (configuracionAvatar) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { avatar: configuracionAvatar });
            setAvatarActual(configuracionAvatar);
            setMensaje('Avatar personalizado guardado con éxito.');
            
            const calc = calcularNivelYTitulo(totoposHistoricos);
            if (onProfileUpdate) {
                onProfileUpdate({
                    nombre,
                    avatar: configuracionAvatar,
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
                        X
                    </button>
                </div>

                {showConfirmLogout && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
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
                            <span>Sincronizando datos con la nube...</span>
                        </div>
                    )}

                    {/* ENCABEZADO DE PERFIL */}
                    <div className="text-center mb-6 mt-2 relative">
                        <div className="relative inline-block mx-auto">
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
                                    Diseñar mi Avatar
                                </button>
                            </div>
                        )}

                        {/* BARRA DE PROGRESO */}
                        <div className="max-w-xs mx-auto mb-3 bg-white/80 p-3 rounded-2xl border border-amber-200 shadow-sm">
                            <div className="flex justify-between items-center text-xs font-black text-amber-900 mb-1.5">
                                <span>Progreso Nivel {nivel}</span>
                                <span className="text-amber-700 flex items-center gap-1">
                                    {totoposHistoricos} / {progresoInfo.necesario}
                                    <img src="/totopp.png" alt="Totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                </span>
                            </div>
                            <div className="w-full bg-amber-100 rounded-full h-3.5 overflow-hidden border border-amber-300 shadow-inner">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: `${progresoInfo.porcentaje}%` }}></div>
                            </div>
                        </div>

                        {/* CONTADORES */}
                        <div className="flex justify-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 bg-amber-200/80 px-3 py-1.5 rounded-xl border border-amber-400 shadow-sm">
                                <img src="/totopp.png" alt="Totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                <span className="font-black text-amber-900 text-sm">{totopos}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-100/80 px-3 py-1.5 rounded-xl border border-red-300 shadow-sm">
                                <img src="/tuna-vida.png" alt="Vida" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
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

                    {/* TIENDA DE AVATARES Y VIDAS (DELEGADO A SECCIONTIENDA) */}
                    <SeccionTienda 
                        user={user}
                        totopos={totopos}
                        setTotopos={setTotopos}
                        vidas={vidas}
                        setVidas={setVidas}
                        avatarActual={avatarActual}
                        setAvatarActual={setAvatarActual}
                        avataresDesbloqueados={avataresDesbloqueados}
                        setAvataresDesbloqueados={setAvataresDesbloqueados}
                        setMensaje={setMensaje}
                        tiendaAbierta={tiendaAbierta}
                        setTiendaAbierta={setTiendaAbierta}
                    />

                    {/* LOGROS Y TROFEOS */}
                    <SeccionLogros 
                        logrosAbiertos={logrosAbiertos}
                        setLogrosAbiertos={setLogrosAbiertos}
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