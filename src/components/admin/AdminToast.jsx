import React, { useEffect } from 'react';
import Icono from '../Icono.jsx';

export default function AdminToast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) return undefined;
        const temporizador = setTimeout(onClose, 3500);
        return () => clearTimeout(temporizador);
    }, [toast, onClose]);

    if (!toast) return null;

    const estilos = toast.tipo === 'error'
        ? 'bg-red-700 border-red-500 text-white'
        : toast.tipo === 'info'
            ? 'bg-amber-800 border-amber-500 text-white'
            : 'bg-emerald-700 border-emerald-500 text-white';

    return (
        <div className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[500] w-[calc(100%-2rem)] max-w-md rounded-2xl border-2 p-3 shadow-2xl flex items-center gap-2 animate-fade-in ${estilos}`}>
            <Icono nombre={toast.tipo === 'error' ? 'alert' : 'checkCircle'} className="w-5 h-5 shrink-0" />
            <p className="flex-1 text-xs font-bold leading-snug">{toast.mensaje}</p>
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar aviso"
                className="p-1 opacity-80 hover:opacity-100 cursor-pointer"
            >
                <Icono nombre="x" className="w-4 h-4" />
            </button>
        </div>
    );
}
