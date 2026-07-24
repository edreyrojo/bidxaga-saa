import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function ConfiguracionModal({ 
    isOpen, 
    onClose, 
    isPlaying, 
    onTogglePlay, 
    indicePista, 
    onCambiarPista, 
    listaPistas,
    controlesJuegoActivo,
    user 
}) {
    const [esAdmin, setEsAdmin] = useState(false);
    const [usuariosLista, setUsuariosLista] = useState([]);
    const [cargandoAdmin, setCargandoAdmin] = useState(false);
    const [totoposRegalo, setTotoposRegalo] = useState({});

    useEffect(() => {
        const verificarRolAdmin = async () => {
            if (!user) {
                setEsAdmin(false);
                return;
            }

            try {
                const userRef = doc(db, 'usuarios', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.role && data.role.toLowerCase() === 'admin') {
                        setEsAdmin(true);
                        cargarUsuarios();
                    } else {
                        setEsAdmin(false);
                    }
                } else {
                    setEsAdmin(false);
                }
            } catch (error) {
                console.error("Error al verificar rol de administrador:", error);
                setEsAdmin(false);
            }
        };

        if (isOpen) {
            verificarRolAdmin();
        }
    }, [isOpen, user]);

    const cargarUsuarios = async () => {
        setCargandoAdmin(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'usuarios'));
            const lista = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            setUsuariosLista(lista);
        } catch (error) {
            console.error("Error al cargar la lista de usuarios:", error);
        } finally {
            setCargandoAdmin(false);
        }
    };

    const handleRegalarTotopos = async (targetUserId, totoposActuales) => {
        const cantidadAEnviar = parseInt(totoposRegalo[targetUserId], 10);
        if (isNaN(cantidadAEnviar) || cantidadAEnviar <= 0) {
            alert("Por favor, ingresa una cantidad válida de Totopos.");
            return;
        }

        try {
            const userRef = doc(db, 'usuarios', targetUserId);
            const nuevosTotopos = (totoposActuales || 0) + cantidadAEnviar;
            
            await updateDoc(userRef, { totopos: nuevosTotopos });
            
            alert(`¡Se han enviado ${cantidadAEnviar} Totopos exitosamente!`);
            setTotoposRegalo({ ...totoposRegalo, [targetUserId]: '' });
            cargarUsuarios();
        } catch (error) {
            console.error("Error al actualizar los Totopos:", error);
            alert("Hubo un error al enviar los Totopos.");
        }
    };

    if (!isOpen) return null;

    const level = controlesJuegoActivo?.level;
    const onMenuClick = controlesJuegoActivo?.onMenuClick;
    const onGuardarClick = controlesJuegoActivo?.onGuardarClick;
    const onReiniciarClick = controlesJuegoActivo?.onReiniciarClick;
    const modoDificil = controlesJuegoActivo?.modoDificil;
    const onToggleModoDificil = controlesJuegoActivo?.onToggleModoDificil;

    const tieneJuegoActivo = level !== undefined && level !== null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600 w-full max-w-md relative overflow-hidden flex flex-col p-5 max-h-[90vh] overflow-y-auto">
                
                {/* Botón Cerrar (X) */}
                <div className="absolute top-3 right-3 z-20">
                    <button
                        onClick={onClose}
                        className="text-amber-900 hover:bg-amber-200/80 font-bold text-lg w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors border border-amber-200 shadow-sm cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="text-center mb-3 mt-1">
                    <h2 className="text-lg font-black text-amber-950">
                        Configuración y Controles
                    </h2>
                    <p className="text-amber-700 text-[11px] font-medium">
                        Ajusta la música, el nivel y las opciones de tu partida
                    </p>
                </div>

                {/* --- PANEL DE ADMINISTRACIÓN DESPLEGABLE --- */}
                {esAdmin && (
                    <details className="bg-amber-100/90 p-3 rounded-2xl border-2 border-amber-500 shadow-sm mb-3 group">
                        <summary className="font-black text-amber-950 text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer list-none">
                            <span className="flex items-center gap-1.5">🛡️ Panel de Administración</span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => { e.preventDefault(); cargarUsuarios(); }} 
                                    className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded-md font-bold cursor-pointer"
                                >
                                    Actualizar
                                </button>
                                <span className="text-amber-800 text-xs transition-transform group-open:rotate-180">▼</span>
                            </div>
                        </summary>

                        <div className="mt-3 pt-2 border-t border-amber-300 flex flex-col gap-2">
                            <p className="text-[10px] text-amber-800 font-medium">
                                Gestiona vidas y regala Totopos a los jugadores.
                            </p>

                            {cargandoAdmin ? (
                                <p className="text-center text-xs text-amber-900 py-2 font-bold">Cargando...</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                    {usuariosLista.map((u) => (
                                        <div key={u.id} className="bg-white p-2 rounded-xl border border-amber-200 flex flex-col gap-1.5 shadow-xs">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-amber-950 truncate max-w-[130px]">
                                                    {u.nombre || u.email || 'Sin Nombre'}
                                                </span>
                                                <div className="flex gap-2 font-bold text-amber-900">
                                                    <span>❤️ {u.vidas ?? 3}</span>
                                                    <span>🥥 {u.totopos ?? 0}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-1.5 items-center">
                                                <input 
                                                    type="number"
                                                    placeholder="Totopos"
                                                    value={totoposRegalo[u.id] || ''}
                                                    onChange={(e) => setTotoposRegalo({ ...totoposRegalo, [u.id]: e.target.value })}
                                                    className="w-full text-[11px] bg-amber-50 border border-amber-300 rounded-lg px-2 py-0.5 outline-none font-medium text-amber-950"
                                                />
                                                <button
                                                    onClick={() => handleRegalarTotopos(u.id, u.totopos)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                                >
                                                    Enviar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </details>
                )}

                {/* Sección de Controles del Juego Integrada */}
                {tieneJuegoActivo && (
                    <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-2.5 mb-3">
                        <h3 className="font-black text-amber-900 text-[11px] uppercase tracking-wider">
                            Controles de Partida
                        </h3>

                        <div className="flex items-center justify-between bg-amber-100/70 py-1.5 px-3 rounded-xl border border-amber-300">
                            <span className="text-[11px] font-black text-amber-900 uppercase">Nivel Actual</span>
                            <span className="text-xs font-black text-amber-950 bg-white px-2.5 py-0.5 rounded-lg shadow-xs border border-amber-200">
                                ⭐ {level}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                            {onMenuClick && (
                                <button onClick={onMenuClick} className="bg-amber-100 hover:bg-amber-200 text-amber-950 py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer border border-amber-300 active:scale-95 text-center">
                                    Menú
                                </button>
                            )}
                            {onGuardarClick && (
                                <button onClick={onGuardarClick} className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 text-center">
                                    Guardar
                                </button>
                            )}
                            {onReiniciarClick && (
                                <button onClick={onReiniciarClick} className="bg-amber-950 hover:bg-black text-white py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 text-center">
                                    Reiniciar
                                </button>
                            )}
                        </div>

                        {onToggleModoDificil !== undefined && (
                            <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[11px] font-bold text-amber-900">Modo Desafío</span>
                                <button
                                    onClick={onToggleModoDificil}
                                    className={`py-1 px-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-xs border ${
                                        modoDificil ? 'bg-red-600 text-white border-red-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                    }`}
                                >
                                    {modoDificil ? 'Activado (ON)' : 'Desactivado (OFF)'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- PANEL DE MÚSICA MINIMALISTA (EN UNA SOLA FILA) --- */}
                <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-2 mb-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-amber-900 text-[11px] uppercase tracking-wider">
                            Música de Fondo (Jazz)
                        </h3>
                        <span className="text-[10px] font-bold text-amber-700 truncate max-w-[160px]">
                            {listaPistas?.[indicePista]?.nombre || 'Cargando...'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onTogglePlay}
                            className={`py-2 px-2 rounded-xl font-bold text-[11px] transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer ${
                                isPlaying ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                            }`}
                        >
                            <span>{isPlaying ? '🔊 Música (ON)' : '🔇 Silencio'}</span>
                        </button>

                        <button
                            onClick={onCambiarPista}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2 px-2 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                        >
                            ⏭️ Siguiente Pista
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs cursor-pointer"
                >
                    ¡Listo!
                </button>

            </div>
        </div>
    );
}