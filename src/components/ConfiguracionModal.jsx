import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

export default function ConfiguracionModal({ 
    isOpen, 
    onClose, 
    isPlaying, 
    onTogglePlay, 
    indicePista, 
    onCambiarPista, 
    listaPistas,
    controlesJuegoActivo,
    user,
    onOpenGenerador // 🛠️ Nueva prop para abrir el generador a pantalla completa
}) {
    const [esAdmin, setEsAdmin] = useState(false);
    const [seccionAdmin, setSeccionAdmin] = useState('usuarios'); // 'usuarios' o 'records'

    // Estados para Gestión de Usuarios
    const [usuariosLista, setUsuariosLista] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [totoposRegalo, setTotoposRegalo] = useState({});

    // Estados para Gestión de Récords
    const [coleccionSeleccionada, setColeccionSeleccionada] = useState('ranking');
    const [recordsLista, setRecordsLista] = useState([]);
    const [cargandoRecords, setCargandoRecords] = useState(false);

    // Estado para mostrar las opciones de reinicio al frente
    const [showOpcionesReiniciar, setShowOpcionesReiniciar] = useState(false);

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
                        cargarRecords(coleccionSeleccionada);
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
            setShowOpcionesReiniciar(false);
        }
    }, [isOpen, user]);

    const cargarUsuarios = async () => {
        setCargandoUsuarios(true);
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
            setCargandoUsuarios(false);
        }
    };

    const cargarRecords = async (nombreColeccion) => {
        setCargandoRecords(true);
        try {
            const querySnapshot = await getDocs(collection(db, nombreColeccion));
            const lista = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            setRecordsLista(lista);
        } catch (error) {
            console.error(`Error al cargar los récords de ${nombreColeccion}:`, error);
            setRecordsLista([]);
        } finally {
            setCargandoRecords(false);
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

    const handleEliminarRecord = async (idRecord) => {
        if (!window.confirm("¿Estás seguro de eliminar este récord de forma permanente?")) return;

        try {
            await deleteDoc(doc(db, coleccionSeleccionada, idRecord));
            alert("¡Récord eliminado correctamente!");
            cargarRecords(coleccionSeleccionada);
        } catch (error) {
            console.error("Error al eliminar el récord:", error);
            alert("Hubo un error al intentar eliminar el récord.");
        }
    };

    if (!isOpen) return null;

    const level = controlesJuegoActivo?.level;
    const onMenuClick = controlesJuegoActivo?.onMenuClick;
    const onGuardarClick = controlesJuegoActivo?.onGuardarClick;
    const onReiniciarClick = controlesJuegoActivo?.onReiniciarClick;
    const onReiniciarDesdeCeroClick = controlesJuegoActivo?.onReiniciarDesdeCeroClick;
    const modoDificil = controlesJuegoActivo?.modoDificil;
    const onToggleModoDificil = controlesJuegoActivo?.onToggleModoDificil;

    const tieneJuegoActivo = level !== undefined && level !== null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600 w-full max-w-md relative overflow-hidden flex flex-col p-5 max-h-[90vh] overflow-y-auto">
                
                {/* --- SUB-PANEL FLOTANTE DE REINICIO --- */}
                {showOpcionesReiniciar && (
                    <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="bg-white p-5 rounded-3xl border-2 border-amber-500 shadow-xl w-full max-w-xs flex flex-col gap-3">
                            <h3 className="font-black text-amber-950 text-sm uppercase tracking-wider">
                                ⚠️ Opciones de Reinicio
                            </h3>
                            <p className="text-amber-800 text-[11px] font-medium">
                                Selecciona cómo deseas reiniciar tu partida:
                            </p>
                            <div className="flex flex-col gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOpcionesReiniciar(false);
                                        if (onReiniciarClick) onReiniciarClick();
                                        onClose();
                                    }}
                                    className="w-full bg-amber-950 hover:bg-black text-white py-2 px-3 rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 text-center"
                                >
                                    🔄 Reiniciar Nivel Actual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOpcionesReiniciar(false);
                                        if (onReiniciarDesdeCeroClick) {
                                            onReiniciarDesdeCeroClick();
                                        } else if (onReiniciarClick) {
                                            onReiniciarClick();
                                        }
                                        onClose();
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 text-center"
                                >
                                    ⚠️ Reiniciar Desde 0
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowOpcionesReiniciar(false)}
                                    className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-amber-300 text-center mt-1"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* --- PANEL DE ADMINISTRACIÓN (SOLO PARA ADMINS) --- */}
                {esAdmin && (
                    <details className="bg-amber-100/90 p-3 rounded-2xl border-2 border-amber-500 shadow-sm mb-3 group">
                        <summary className="font-black text-amber-950 text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer list-none">
                            <span className="flex items-center gap-1.5">🛡️ Panel de Administración</span>
                            <span className="text-amber-800 text-xs transition-transform group-open:rotate-180">▼</span>
                        </summary>

                        <div className="mt-3 pt-2 border-t border-amber-300 flex flex-col gap-2.5">
                            
                            {/* Pestañas internas del Panel Admin (Solo Usuarios y Récords) */}
                            <div className="grid grid-cols-2 gap-1 bg-amber-200/60 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setSeccionAdmin('usuarios')}
                                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        seccionAdmin === 'usuarios' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-300/50'
                                    }`}
                                >
                                    👥 Usuarios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSeccionAdmin('records')}
                                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                        seccionAdmin === 'records' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-300/50'
                                    }`}
                                >
                                    <span>🏆 Récords</span>
                                </button>
                            </div>

                            {/* 🛠️ Botón Directo para abrir el Generador en Pantalla Completa (Fuera del Modal) */}
                            {onOpenGenerador && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenGenerador();
                                    }}
                                    className="w-full bg-amber-800 hover:bg-amber-900 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <span>🛠️ Abrir Generador (Pantalla Completa PC)</span>
                                </button>
                            )}

                            {/* SECCIÓN 1: GESTIÓN DE USUARIOS */}
                            {seccionAdmin === 'usuarios' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-amber-800 font-medium">
                                            Gestiona vidas y regala Totopos.
                                        </p>
                                        <button 
                                            onClick={cargarUsuarios} 
                                            className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded-md font-bold cursor-pointer"
                                        >
                                            Actualizar
                                        </button>
                                    </div>

                                    {cargandoUsuarios ? (
                                        <p className="text-center text-xs text-amber-900 py-2 font-bold">Cargando usuarios...</p>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                                            {usuariosLista.map((u) => (
                                                <div key={u.id} className="bg-white p-2 rounded-xl border border-amber-200 flex flex-col gap-1.5 shadow-xs">
                                                    <div className="flex justify-between items-center text-[11px]">
                                                        <span className="font-bold text-amber-950 truncate max-w-[130px]">
                                                            {u.nombre || u.email || 'Sin Nombre'}
                                                        </span>
                                                        <div className="flex gap-2 font-bold text-amber-900 items-center">
                                                            <span className="flex items-center gap-1">
                                                                <img src="/tuna-vida.png" alt="Vidas" className="w-4 h-4 object-contain inline-block" onError={(e) => e.target.style.display='none'} />
                                                                <span>{u.vidas ?? 3}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <img src="/totopo.png" alt="Totopos" className="w-4 h-4 object-contain inline-block" onError={(e) => e.target.style.display='none'} />
                                                                <span>{u.totopos ?? 0}</span>
                                                            </span>
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
                            )}

                            {/* SECCIÓN 2: GESTIÓN DE RÉCORDS */}
                            {seccionAdmin === 'records' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-amber-800 font-bold uppercase">Selecciona Colección:</label>
                                        <select
                                            value={coleccionSeleccionada}
                                            onChange={(e) => {
                                                setColeccionSeleccionada(e.target.value);
                                                cargarRecords(e.target.value);
                                            }}
                                            className="w-full text-[11px] bg-white border border-amber-300 rounded-lg px-2 py-1 outline-none font-medium text-amber-950"
                                        >
                                            <option value="ranking">ranking (Memorama)</option>
                                            <option value="ranking_crucigrama">ranking_crucigrama</option>
                                            <option value="ranking_sopa">ranking_sopa</option>
                                            <option value="ranking_trivia">ranking_trivia</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-amber-800 font-medium">Registros: {recordsLista.length}</span>
                                        <button 
                                            onClick={() => cargarRecords(coleccionSeleccionada)} 
                                            className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded-md font-bold cursor-pointer"
                                        >
                                            Actualizar
                                        </button>
                                    </div>

                                    {cargandoRecords ? (
                                        <p className="text-center text-xs text-amber-900 py-2 font-bold">Cargando récords...</p>
                                    ) : recordsLista.length === 0 ? (
                                        <p className="text-center text-xs text-gray-500 py-2">No hay registros en esta colección.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                                            {recordsLista.map((rec) => (
                                                <div key={rec.id} className="bg-white p-2 rounded-xl border border-amber-200 flex justify-between items-center shadow-xs gap-2">
                                                    <div className="flex flex-col text-[11px] overflow-hidden">
                                                        <span className="font-bold text-amber-950 truncate">
                                                            👤 {rec.name || rec.nombre || 'Anónimo'} 
                                                            <span className="text-amber-700 font-normal ml-1">(Niv: {rec.level || rec.nivel || '?'})</span>
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 truncate">
                                                            {rec.score !== undefined ? `Puntos: ${rec.score}` : ''}
                                                            {rec.intentos !== undefined ? `Intentos: ${rec.intentos}` : ''}
                                                            {rec.errores !== undefined ? `Errores: ${rec.errores}` : ''}
                                                            {rec.fecha ? ` • ${new Date(rec.fecha).toLocaleDateString()}` : ''}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminarRecord(rec.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                                    >
                                                        🗑️ Borrar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                        <div className="grid grid-cols-2 gap-1.5">
                            {onGuardarClick && (
                                <button onClick={onGuardarClick} className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 text-center">
                                    Guardar
                                </button>
                            )}
                            {onReiniciarClick && (
                                <button onClick={() => setShowOpcionesReiniciar(true)} className="bg-amber-950 hover:bg-black text-white py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 text-center">
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

                {/* --- PANEL DE MÚSICA MINIMALISTA --- */}
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

                {/* Botón de Menú Principal o Cerrar */}
                {onMenuClick ? (
                    <button
                        onClick={onMenuClick}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        Salir al Menú Principal
                    </button>
                ) : (
                    <button
                        onClick={onClose}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs cursor-pointer"
                    >
                        Cerrar
                    </button>
                )}

            </div>
        </div>
    );
}