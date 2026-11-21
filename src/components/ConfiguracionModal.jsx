import React, { useState } from 'react';

export default function ConfiguracionModal({ 
    isOpen, 
    onClose, 
    isPlaying, 
    onTogglePlay, 
    indicePista, 
    onCambiarPista, 
    listaPistas,
    controlesJuegoActivo
}) {
    const [showOpcionesReiniciar, setShowOpcionesReiniciar] = useState(false);

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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600 w-full max-w-md md:max-w-3xl relative overflow-hidden flex flex-col p-5 max-h-[90vh] overflow-y-auto">
                
                {showOpcionesReiniciar && (
                    <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="bg-white p-5 rounded-3xl border-2 border-amber-500 shadow-xl w-full max-w-xs flex flex-col gap-3">
                            <h3 className="font-black text-amber-950 text-sm uppercase tracking-wider">
                                Opciones de Reinicio
                            </h3>
                            <p className="text-[10px] text-amber-800 leading-snug">
                                Reiniciar Nivel conserva tu nivel y tus totopos. Reiniciar Desde 0 te devuelve al Nivel 1.
                            </p>
                            <div className="flex flex-col gap-2 mt-1">
                                {onReiniciarClick && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowOpcionesReiniciar(false);
                                            onReiniciarClick();
                                            onClose();
                                        }}
                                        className="w-full bg-amber-950 hover:bg-black text-white py-2 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                                    >
                                        Reiniciar Nivel Actual
                                    </button>
                                )}
                                {onReiniciarDesdeCeroClick && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowOpcionesReiniciar(false);
                                            onReiniciarDesdeCeroClick();
                                            onClose();
                                        }}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                                    >
                                        Reiniciar Desde 0
                                    </button>
                                )}
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
                        Configuracion y Controles
                    </h2>
                    <p className="text-amber-700 text-[11px] font-medium">
                        Ajusta la musica, el nivel y las opciones de tu partida
                    </p>
                </div>

                {tieneJuegoActivo && (
                    <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-2.5 mb-3">
                        <h3 className="font-black text-amber-900 text-[11px] uppercase tracking-wider">
                            Controles de Partida
                        </h3>

                        <div className="flex items-center justify-between bg-amber-100/70 py-1.5 px-3 rounded-xl border border-amber-300">
                            <span className="text-[11px] font-black text-amber-900 uppercase">Nivel Actual</span>
                            <span className="text-xs font-black text-amber-950 bg-white px-2.5 py-0.5 rounded-lg shadow-xs border border-amber-200">
                                {level}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                            {onGuardarClick && (
                                <button onClick={onGuardarClick} className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer text-center">
                                    Guardar
                                </button>
                            )}
                            {onReiniciarClick && (
                                <button onClick={() => setShowOpcionesReiniciar(true)} className="bg-amber-950 hover:bg-black text-white py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer text-center">
                                    Reiniciar
                                </button>
                            )}
                        </div>

                        {onToggleModoDificil !== undefined && (
                            <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[11px] font-bold text-amber-900">Modo Desafio</span>
                                <button
                                    onClick={onToggleModoDificil}
                                    className={`py-1 px-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
                                        modoDificil ? 'bg-red-600 text-white border-red-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                    }`}
                                >
                                    {modoDificil ? 'Activado (ON)' : 'Desactivado (OFF)'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-2 mb-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-amber-900 text-[11px] uppercase tracking-wider">
                            Musica de Fondo (Jazz)
                        </h3>
                        <span className="text-[10px] font-bold text-amber-700 truncate max-w-[160px]">
                            {listaPistas?.[indicePista]?.nombre || 'Cargando...'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onTogglePlay}
                            className={`py-2 px-2 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isPlaying ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                            }`}
                        >
                            <span>{isPlaying ? 'Musica (ON)' : 'Silencio'}</span>
                        </button>

                        <button
                            onClick={onCambiarPista}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                        >
                            Siguiente Pista
                        </button>
                    </div>
                </div>

                {onMenuClick ? (
                    <button
                        onClick={onMenuClick}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        Salir al Menu Principal
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