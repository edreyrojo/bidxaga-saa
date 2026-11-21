import React, { useState } from 'react';
import SeccionColapsable from './SeccionColapsable.jsx';
import { useRepaso } from '../hooks/useRepaso.js';
import { borrarRepaso } from '../utils/repaso.js';

const CAJAS_VISIBLES = 5;

function IndicadorCaja({ caja = 0 }) {
    return (
        <span className="flex items-center gap-0.5" title={`Nivel de dominio ${Math.min(caja, CAJAS_VISIBLES)} de ${CAJAS_VISIBLES}`}>
            {Array.from({ length: CAJAS_VISIBLES }).map((_, indice) => (
                <span
                    key={indice}
                    className={`w-1.5 h-1.5 rounded-full ${
                        indice < caja ? 'bg-emerald-500' : 'bg-amber-200'
                    }`}
                />
            ))}
        </span>
    );
}

export default function SeccionRepaso({ abierto, setAbierto, user }) {
    const { total, pendientes, dominadas, errores, palabras } = useRepaso(user);
    const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
    const visibles = palabras.slice(0, 8);
    const porcentajeDominio = total > 0 ? Math.round((dominadas / total) * 100) : 0;

    return (
        <SeccionColapsable
            icono="/favicon.png"
            titulo="Repaso Inteligente"
            abierto={abierto}
            setAbierto={setAbierto}
            badge={pendientes > 0 ? `${pendientes} por reforzar` : 'Al día'}
        >
            <div className="p-4">
                <p className="text-xs text-amber-900 leading-relaxed mb-3">
                    La app recuerda qué palabras te cuestan y las muestra con más frecuencia.
                    Cuando aciertas varias veces, deja de insistir con ellas.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white border border-amber-200 rounded-xl px-2 py-2 text-center shadow-sm">
                        <p className="text-lg font-black text-amber-700 leading-none">{pendientes}</p>
                        <p className="text-[10px] font-bold text-amber-800 mt-1">Por reforzar</p>
                    </div>
                    <div className="bg-white border border-emerald-200 rounded-xl px-2 py-2 text-center shadow-sm">
                        <p className="text-lg font-black text-emerald-700 leading-none">{dominadas}</p>
                        <p className="text-[10px] font-bold text-emerald-800 mt-1">Dominadas</p>
                    </div>
                    <div className="bg-white border border-red-200 rounded-xl px-2 py-2 text-center shadow-sm">
                        <p className="text-lg font-black text-red-600 leading-none">{errores}</p>
                        <p className="text-[10px] font-bold text-red-700 mt-1">Errores</p>
                    </div>
                </div>

                {total > 0 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] font-bold text-amber-800 mb-1">
                            <span>Dominio del vocabulario practicado</span>
                            <span>{porcentajeDominio}%</span>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden border border-amber-200">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${porcentajeDominio}%` }} />
                        </div>
                    </div>
                )}

                {visibles.length === 0 ? (
                    <div className="bg-white/70 border border-dashed border-amber-300 rounded-xl p-4 text-center">
                        <p className="text-2xl mb-1">🌱</p>
                        <p className="text-xs font-bold text-amber-900">Aún no hay palabras registradas.</p>
                        <p className="text-[11px] text-amber-700 mt-1">Juega un nivel y aquí aparecerán las palabras que necesitan repaso.</p>
                    </div>
                ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {visibles.map((registro) => (
                            <li
                                key={registro.clave}
                                className="bg-white border border-amber-200 rounded-xl px-3 py-2 shadow-sm flex items-center justify-between gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-amber-950 truncate">{registro.palabra || 'Palabra'}</p>
                                    <p className="text-[11px] text-amber-700 font-medium truncate">
                                        {registro.spanish || 'Sin traducción'}
                                        {registro.tipo === 'flora' ? ' · flora' : ' · fauna'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        (registro.errores || 0) > 0
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {(registro.errores || 0) > 0
                                            ? `${registro.errores} ${registro.errores === 1 ? 'error' : 'errores'}`
                                            : 'Sin errores'}
                                    </span>
                                    <IndicadorCaja caja={registro.caja || 0} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {total > 0 && (
                    <div className="mt-3">
                        {confirmandoBorrar ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-red-800">¿Borrar todo el historial de repaso?</span>
                                <div className="flex gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            borrarRepaso();
                                            setConfirmandoBorrar(false);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                    >
                                        Sí, borrar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmandoBorrar(false)}
                                        className="bg-white border border-red-200 text-red-700 text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmandoBorrar(true)}
                                className="w-full text-[11px] font-bold text-amber-700 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl py-1.5 transition-colors cursor-pointer"
                            >
                                Borrar historial de repaso
                            </button>
                        )}
                    </div>
                )}
            </div>
        </SeccionColapsable>
    );
}
