import React from 'react';
import Icono from '../Icono.jsx';

export default function AdminConfirmacion({
    abierto,
    titulo,
    mensaje,
    nota = '',
    onNotaChange,
    onConfirmar,
    onCancelar,
    textoConfirmar = 'Confirmar',
    peligro = false,
    cargando = false,
}) {
    if (!abierto) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[450] flex items-center justify-center p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-confirm-title"
                className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-2xl w-full max-w-sm animate-fade-in"
            >
                <div className="flex justify-center mb-3">
                    <Icono nombre={peligro ? 'alert' : 'checkCircle'} className={`w-9 h-9 ${peligro ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>

                <h2 id="admin-confirm-title" className="text-lg font-black text-amber-950 text-center">{titulo}</h2>
                {mensaje && <p className="text-xs text-amber-800 text-center mt-2 leading-relaxed">{mensaje}</p>}

                {onNotaChange && (
                    <label className="block text-[11px] font-bold text-amber-900 mt-4">
                        Nota interna (opcional)
                        <textarea
                            value={nota}
                            onChange={(evento) => onNotaChange(evento.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Motivo, seguimiento o comentario para el equipo."
                            className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500 resize-none"
                        />
                    </label>
                )}

                <div className="flex gap-2 mt-5">
                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={cargando}
                        className="flex-1 bg-amber-100 hover:bg-amber-200 disabled:opacity-60 text-amber-950 font-bold py-2.5 rounded-xl text-xs border border-amber-300 cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmar}
                        disabled={cargando}
                        className={`flex-1 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer ${
                            peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-700 hover:bg-emerald-800'
                        }`}
                    >
                        {cargando ? 'Guardando…' : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}
