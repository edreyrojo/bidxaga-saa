import React, { useEffect, useState } from 'react';
import Icono from './Icono.jsx';

export default function AvisoActualizacion() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const mostrar = () => setVisible(true);
        window.addEventListener('bidxaga:sw-actualizado', mostrar);
        return () => window.removeEventListener('bidxaga:sw-actualizado', mostrar);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[400] w-[calc(100%-2rem)] max-w-sm bg-amber-950 text-white rounded-2xl shadow-2xl border-2 border-amber-400 p-4 flex items-center gap-3 animate-fade-in">
            <Icono nombre="refresh" className="w-5 h-5 text-amber-300 shrink-0" />

            <div className="flex-1 min-w-0">
                <p className="text-xs font-black">Nueva versión disponible</p>
                <p className="text-[11px] text-amber-100">Recarga para actualizar la app.</p>
            </div>

            <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black px-3 py-1.5 rounded-lg cursor-pointer shrink-0"
            >
                Recargar
            </button>
            <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Cerrar aviso de actualización"
                className="text-amber-200 hover:text-white p-1 cursor-pointer shrink-0"
            >
                <Icono nombre="x" className="w-4 h-4" />
            </button>
        </div>
    );
}
