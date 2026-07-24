import React from 'react';

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
    if (!isOpen) return null;

    // Extraemos de forma segura las variables y funciones del juego actual
    const level = controlesJuegoActivo?.level;
    const onMenuClick = controlesJuegoActivo?.onMenuClick;
    const onGuardarClick = controlesJuegoActivo?.onGuardarClick;
    const onReiniciarClick = controlesJuegoActivo?.onReiniciarClick;
    const modoDificil = controlesJuegoActivo?.modoDificil;
    const onToggleModoDificil = controlesJuegoActivo?.onToggleModoDificil;

    const tieneJuegoActivo = level !== undefined && level !== null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            {/* Tarjeta Modal Estilo Istmeño / Ámbar */}
            <div className="bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600 w-full max-w-md relative overflow-hidden flex flex-col p-6 max-h-[90vh] overflow-y-auto">
                
                {/* Botón Cerrar (X) */}
                <div className="absolute top-3 right-3 z-20">
                    <button
                        onClick={onClose}
                        className="text-amber-900 hover:bg-amber-200/80 font-bold text-xl w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors border border-amber-200 shadow-sm cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Título */}
                <div className="text-center mb-4 mt-2">
                    <h2 className="text-xl font-black text-amber-950">
                        Configuración y Controles
                    </h2>
                    <p className="text-amber-700 text-xs font-medium mt-1">
                        Ajusta la música, el nivel y las opciones de tu partida
                    </p>
                </div>

                {/* Sección de Controles del Juego Integrada */}
                {tieneJuegoActivo && (
                    <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-3 mb-4">
                        <h3 className="font-black text-amber-900 text-xs uppercase tracking-wider">
                            Controles de Partida
                        </h3>

                        {/* Indicador de Nivel */}
                        <div className="flex items-center justify-between bg-amber-100/70 py-2 px-3 rounded-xl border border-amber-300">
                            <span className="text-xs font-black text-amber-900 uppercase">Nivel Actual</span>
                            <span className="text-sm font-black text-amber-950 bg-white px-3 py-0.5 rounded-lg shadow-xs border border-amber-200">
                                ⭐ {level}
                            </span>
                        </div>

                        {/* Botones de Acción: Menú Principal, Guardar y Reiniciar */}
                        <div className="grid grid-cols-3 gap-2">
                            {onMenuClick && (
                                <button
                                    onClick={onMenuClick}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer border border-amber-300 active:scale-95 text-center"
                                >
                                    Menú
                                </button>
                            )}

                            {onGuardarClick && (
                                <button
                                    onClick={onGuardarClick}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 text-center"
                                >
                                    Guardar
                                </button>
                            )}

                            {onReiniciarClick && (
                                <button
                                    onClick={onReiniciarClick}
                                    className="bg-amber-950 hover:bg-black text-white py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 text-center"
                                >
                                    Reiniciar
                                </button>
                            )}
                        </div>

                        {/* Toggle de Modo Desafío / Difícil */}
                        {onToggleModoDificil !== undefined && (
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-bold text-amber-900">Modo Desafío</span>
                                <button
                                    onClick={onToggleModoDificil}
                                    className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs border ${
                                        modoDificil 
                                            ? 'bg-red-600 text-white border-red-700' 
                                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                    }`}
                                >
                                    {modoDificil ? 'Activado (ON)' : 'Desactivado (OFF)'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Panel de Opciones de Audio */}
                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-3 mb-4">
                    <h3 className="font-black text-amber-900 text-xs uppercase tracking-wider">
                        Música de Fondo (Jazz)
                    </h3>

                    {/* Botón de Reproducción / Silencio */}
                    <button
                        onClick={onTogglePlay}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                            isPlaying 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                        }`}
                    >
                        <span>{isPlaying ? 'Música Activada (ON)' : 'Música Silenciada (OFF)'}</span>
                    </button>

                    <hr className="border-amber-100 my-0.5" />

                    {/* Selector de Pistas */}
                    <div>
                        <span className="block text-xs font-bold text-amber-900 mb-1.5">
                            Pista actual: <span className="text-amber-700">{listaPistas?.[indicePista]?.nombre || 'Cargando...'}</span>
                        </span>
                        <button
                            onClick={onCambiarPista}
                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                        >
                            Cambiar Pista Siguiente
                        </button>
                    </div>
                </div>

                {/* Botón inferior para aceptar / cerrar */}
                <button
                    onClick={onClose}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl shadow-md transition-transform transform active:scale-95 text-sm cursor-pointer"
                >
                    ¡Listo!
                </button>

            </div>
        </div>
    );
}