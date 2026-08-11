import React from 'react';
import SeccionColapsable from './SeccionColapsable.jsx';

// 🏆 Catálogo de Logros e Insignias para los Juegos
const CATALOGO_LOGROS = [
    { 
        id: 'logro_memoria_1', 
        juego: 'Memorama', 
        nombre: 'Memoria de Rayo', 
        desc: 'Completa cualquier nivel de Memorama sin fallar.', 
        emoji: '🧠' 
    },
    { 
        id: 'logro_crucigrama_5', 
        juego: 'Crucigrama', 
        nombre: 'Erudito del Crucigrama', 
        desc: 'Alcanza el Nivel 5 o superior en Crucigrama.', 
        emoji: '🧩' 
    },
    { 
        id: 'logro_sopa_10', 
        juego: 'Sopa de Letras', 
        nombre: 'Ojo de Águila', 
        desc: 'Llega al Nivel 10 en Sopa de Letras.', 
        emoji: '🔍' 
    },
    { 
        id: 'logro_trivia_maestro', 
        juego: 'Trivia', 
        nombre: 'Sabio Zapoteco', 
        desc: 'Termina la Trivia en Modo Difícil sin errores.', 
        emoji: '🌟' 
    }
];

export default function SeccionLogros({ 
    logrosAbiertos, 
    setLogrosAbiertos, 
    logrosDesbloqueados = [] 
}) {
    return (
        <SeccionColapsable
            icono="/guiechachi.png"
            titulo="Logros y Trofeos"
            abierto={logrosAbiertos}
            setAbierto={setLogrosAbiertos}
            badge={`${logrosDesbloqueados.length}/${CATALOGO_LOGROS.length}`}
        >
            <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                {CATALOGO_LOGROS.map((logro) => {
                    const conseguido = logrosDesbloqueados.includes(logro.id);

                    return (
                        <div 
                            key={logro.id} 
                            className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                                conseguido 
                                    ? 'bg-white border-amber-300 shadow-sm ring-1 ring-amber-200' 
                                    : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
                            }`}
                        >
                            <div className="w-12 h-12 text-xl font-bold bg-amber-100 rounded-xl border border-amber-200 flex items-center justify-center shrink-0 shadow-inner">
                                {logro.emoji || '🏆'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md ${
                                        conseguido ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {logro.juego}
                                    </span>
                                    <span className={`text-[11px] font-bold ${conseguido ? 'text-green-700' : 'text-gray-500'}`}>
                                        {conseguido ? '¡Conseguido! ✅' : 'Bloqueado'}
                                    </span>
                                </div>
                                <h4 className={`font-black text-sm truncate ${conseguido ? 'text-amber-950' : 'text-gray-600'}`}>
                                    {logro.nombre}
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{logro.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SeccionColapsable>
    );
}