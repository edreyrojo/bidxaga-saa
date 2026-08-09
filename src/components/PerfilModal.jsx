import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import CreadorAvatar from './CreadorAvatar';
import SeccionTienda from './SeccionTienda';
import SeccionLogros from './SeccionLogros';
import SeccionInventario from './SeccionInventario';

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
   RENDERIZADOR DE AVATAR (Compatible con Variantes y SVG)
   ========================================== */
function RenderAvatarVisual({ avatar }) {
    const esPersonalizado = typeof avatar === 'object' && avatar !== null;

    if (esPersonalizado) {
        const personaje = avatar.tipo || 'personaje1';
        const varSilueta = avatar.varianteSiluetaropabase || '1silueta.svg';
        const varTonodepiel = avatar.varianteTonodepiel || avatar.variantePiel || 'piel.svg';
        const colorTonodepiel = avatar.tonodepiel || avatar.piel || '#F5C6A0';
        const varSuperior = avatar.varianteSuperior || avatar.varianteRopasuperior || '1playera1.svg';
        const colorSuperior = avatar.superior || avatar.ropasuperior || '#E65100';
        const varRostro = avatar.varianteRostro || '1rostro1.svg';
        const varOjos = avatar.varianteOjos || '1ojos1.svg';
        const colorOjos = avatar.ojos || '#1A1A1A';
        const varCabello = avatar.varianteCabello || '1cabello1.svg';
        const colorCabello = avatar.cabello || '#1A1A1A';
        const varInferior = avatar.varianteInferior || avatar.varianteRopainferior || '1shorts1.svg';
        const colorInferior = avatar.inferior || avatar.ropainferior || '#4A3525';

        return (
            <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
                {/* 1. Capa de Silueta / Ropa Base */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varSilueta})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                {/* 2. Capa de Tono de Piel */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorTonodepiel,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varTonodepiel})`,
                        maskImage: `url(/avatares/${personaje}/${varTonodepiel})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 3. Capa Superior */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorSuperior,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varSuperior})`,
                        maskImage: `url(/avatares/${personaje}/${varSuperior})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 4. Capa de Rostro */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varRostro})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                {/* 5. Capa de Ojos */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorOjos,
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
                {/* 6. Capa de Cabello */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorCabello,
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
                {/* 7. Capa Inferior */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorInferior,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varInferior})`,
                        maskImage: `url(/avatares/${personaje}/${varInferior})`,
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
    const [nombreTemporal, setNombreTemporal] = useState('');
    const [editandoNombre, setEditandoNombre] = useState(false);

    const [totopos, setTotopos] = useState(0);
    const [totoposHistoricos, setTotoposHistoricos] = useState(0);
    const [vidas, setVidas] = useState(3);
    const [avatarActual, setAvatarActual] = useState('default');
    const [avataresDesbloqueados, setAvataresDesbloqueados] = useState(['default']);
    const [accesoriosDesbloqueados, setAccesoriosDesbloqueados] = useState([]);
    const [logrosDesbloqueados, setLogrosDesbloqueados] = useState([]);

    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    const [showCreador, setShowCreador] = useState(false);

    const [tiendaAbierta, setTiendaAbierta] = useState(false);
    const [logrosAbiertos, setLogrosAbiertos] = useState(false);
    const [inventarioAbierto, setInventarioAbierto] = useState(false);

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
                    const nombreUsuario = data.nombre || '';
                    setNombre(nombreUsuario);
                    setNombreTemporal(nombreUsuario);
                    setTotopos(data.totopos || 0);
                    setVidas(data.vidas !== undefined ? data.vidas : 3);
                    setAvatarActual(avatarId);
                    setAvataresDesbloqueados(data.avataresDesbloqueados || ['default']);
                    setAccesoriosDesbloqueados(data.accesoriosDesbloqueados || []);
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
                            nombre: nombreUsuario,
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
        const nombreLimpio = nombreTemporal.trim();
        try {
            const docRef = doc(db, 'usuarios', user.uid);
            await updateDoc(docRef, { nombre: nombreLimpio });
            setNombre(nombreLimpio);
            setEditandoNombre(false);
            setMensaje('Nombre actualizado con exito');
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
            setMensaje('Avatar personalizado guardado con exito.');
            
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
            console.error("Error al cerrar sesion:", error);
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
                        <h3 className="text-2xl font-bold text-red-600 mb-2">¿Cerrar Sesion?</h3>
                        <p className="text-amber-900 text-sm mb-6 font-medium">Tendras que volver a ingresar para conservar tu progreso en la nube.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowConfirmLogout(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleCerrarSesion} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors cursor-pointer">Si, salir</button>
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

                        {/* NICKNAME Y LÁPIZ MONOCROMÁTICO DE EDICIÓN RÁPIDA */}
                        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                            {!editandoNombre ? (
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black text-amber-950">
                                        {nombre ? nombre : (user?.email || 'Mi Perfil Istmeño')}
                                    </h2>
                                    <button 
                                        onClick={() => { setNombreTemporal(nombre); setEditandoNombre(true); }} 
                                        className="text-amber-700 hover:text-amber-900 bg-amber-200/60 hover:bg-amber-200 p-1.5 rounded-full transition-colors cursor-pointer"
                                        title="Editar nombre"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleActualizarNombre} className="flex gap-2 w-full max-w-xs mx-auto animate-fade-in">
                                    <input
                                        type="text"
                                        value={nombreTemporal}
                                        onChange={(e) => setNombreTemporal(e.target.value)}
                                        placeholder="Nuevo apodo"
                                        className="flex-1 px-3 py-1.5 rounded-xl border-2 border-amber-400 focus:outline-none focus:border-amber-600 text-sm bg-white text-amber-950 font-bold"
                                        autoFocus
                                    />
                                    <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow">
                                        OK
                                    </button>
                                    <button type="button" onClick={() => setEditandoNombre(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2 py-1.5 rounded-xl text-xs cursor-pointer">
                                        X
                                    </button>
                                </form>
                            )}
                        </div>

                        <p className="text-amber-700 text-sm font-medium mb-2 mt-1">
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
                                    <img src="/totopo.png" alt="Totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
                                </span>
                            </div>
                            <div className="w-full bg-amber-100 rounded-full h-3.5 overflow-hidden border border-amber-300 shadow-inner">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: `${progresoInfo.porcentaje}%` }}></div>
                            </div>
                        </div>

                        {/* CONTADORES */}
                        <div className="flex justify-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 bg-amber-200/80 px-3 py-1.5 rounded-xl border border-amber-400 shadow-sm">
                                <img src="/totopo.png" alt="Totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none'; }} />
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

                    {/* TIENDA DE AVATARES Y VIDAS */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <img src="/tehuana.png" alt="Tehuana" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            <h3 className="text-amber-950 font-black text-base">Mercado y Tienda</h3>
                        </div>
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
                            accesoriosDesbloqueados={accesoriosDesbloqueados}
                            setAccesoriosDesbloqueados={setAccesoriosDesbloqueados}
                            setMensaje={setMensaje}
                            tiendaAbierta={tiendaAbierta}
                            setTiendaAbierta={setTiendaAbierta}
                        />
                    </div>

                    {/* SECCION INVENTARIO */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <img src="/palmera.png" alt="Inventario" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            <h3 className="text-amber-950 font-black text-base">Inventario de Objetos</h3>
                        </div>
                        <SeccionInventario
                            user={user}
                            avataresDesbloqueados={avataresDesbloqueados}
                            setAvataresDesbloqueados={setAvataresDesbloqueados}
                            accesoriosDesbloqueados={accesoriosDesbloqueados}
                            setAccesoriosDesbloqueados={setAccesoriosDesbloqueados}
                            avatarActual={avatarActual}
                            setAvatarActual={setAvatarActual}
                            setMensaje={setMensaje}
                            inventarioAbierto={inventarioAbierto}
                            setInventarioAbierto={setInventarioAbierto}
                        />
                    </div>

                    {/* LOGROS Y TROFEOS */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <img src="/guiechachi.png" alt="Guiechachi" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            <h3 className="text-amber-950 font-black text-base">Logros y Trofeos</h3>
                        </div>
                        <SeccionLogros 
                            logrosAbiertos={logrosAbiertos}
                            setLogrosAbiertos={setLogrosAbiertos}
                            logrosDesbloqueados={logrosDesbloqueados}
                        />
                    </div>

                    <button
                        onClick={() => setShowConfirmLogout(true)}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold py-3 px-4 rounded-2xl shadow-sm transition-transform active:scale-95 text-sm cursor-pointer mt-4"
                    >
                        Cerrar Sesion
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