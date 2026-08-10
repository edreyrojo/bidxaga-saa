import React from 'react';
import { obtenerCategoriasPorTipo } from '../data/Categoriascontenido.js';

export default function SelectorCategorias({
    tipo,
    desbloqueadas = [],
    activas = [],
    totopos = 0,
    nivelCuenta = 1,
    onToggleActiva,
    onDesbloquear,
    onClose
}) {
    const categorias = obtenerCategoriasPorTipo(tipo);

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-amber-50 border-4 border-amber-300 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[88vh]">

                <div className="bg-amber-200 px-5 py-4 flex justify-between items-center border-b-2 border-amber-300">
                    <div>
                        <h2 className="text-amber-950 font-extrabold text-lg">Categorías de {tipo === 'flora' ? 'Flora' : 'Fauna'}</h2>
                        <p className="text-[11px] font-bold text-amber-800/80">Elige qué practicar, o desbloquea más con totopos</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-amber-800 hover:text-amber-950 font-bold text-xl w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
                    {categorias.map((cat) => {
                        const estaDesbloqueada = desbloqueadas.includes(cat.id);
                        const estaActiva = activas.includes(cat.id);
                        const alcanzaParaComprar = totopos >= cat.costoTotopos;

                        if (estaDesbloqueada) {
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => onToggleActiva(cat.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                        estaActiva
                                            ? 'bg-emerald-50 border-emerald-500 shadow-md'
                                            : 'bg-white border-amber-200 hover:border-amber-400'
                                    }`}
                                >
                                    <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="block font-bold text-sm text-amber-950 truncate">{cat.nombre}</span>
                                        <span className="text-[10px] font-bold text-amber-700">
                                            {estaActiva ? '✅ Practicando esta categoría' : 'Desbloqueada — toca para incluirla'}
                                        </span>
                                    </div>
                                    <span
                                        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                                            estaActiva ? 'bg-emerald-600 border-emerald-700' : 'bg-white border-amber-300'
                                        }`}
                                    >
                                        {estaActiva && <span className="text-white text-xs font-black">✓</span>}
                                    </span>
                                </button>
                            );
                        }

                        // Categoría bloqueada
                        const faltaNivel = cat.nivelCuentaRequerido > nivelCuenta;
                        return (
                            <div
                                key={cat.id}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-amber-100 bg-amber-50/60"
                            >
                                <span className="text-2xl flex-shrink-0 grayscale opacity-60">{cat.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-bold text-sm text-amber-900/70 truncate">🔒 {cat.nombre}</span>
                                    <span className="text-[10px] font-bold text-amber-700/80">
                                        {faltaNivel ? `Gratis al llegar a Nivel de Cuenta ${cat.nivelCuentaRequerido}` : '¡Ya la puedes reclamar gratis!'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    disabled={cat.costoTotopos > 0 && !alcanzaParaComprar}
                                    onClick={() => onDesbloquear(cat.id, cat.costoTotopos)}
                                    className={`px-3 py-2 rounded-xl text-[11px] font-black flex-shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
                                        cat.costoTotopos === 0 || alcanzaParaComprar
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow'
                                            : 'bg-amber-100 text-amber-400 cursor-not-allowed'
                                    }`}
                                >
                                    {cat.costoTotopos === 0 ? 'Reclamar' : (
                                        <>🌽 {cat.costoTotopos}</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-amber-100 px-5 py-3 border-t-2 border-amber-300 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                        {activas.length === 0 ? '⚠️ Elige al menos una categoría' : `${activas.length} categoría(s) activa(s)`}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={activas.length === 0}
                        className={`px-5 py-2 rounded-xl font-black text-sm shadow-md transition-colors cursor-pointer ${
                            activas.length === 0
                                ? 'bg-amber-200 text-amber-400 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                    >
                        Listo
                    </button>
                </div>

            </div>
        </div>
    );
}