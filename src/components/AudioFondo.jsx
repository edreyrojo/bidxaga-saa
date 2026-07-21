import React, { useState, useEffect, useRef } from 'react';

// Rutas de tus pistas de audio en la carpeta public
const LISTA_PISTAS = [
    { id: 1, nombre: 'Pista 1', ruta: '/audio/pista1.mp3' },
    { id: 2, nombre: 'Pista 2', ruta: '/audio/pista2.mp3' }
];

export default function AudioFondo() {
    const [indicePista, setIndicePista] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Reproducir automáticamente al cambiar de pista o iniciar
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Autoplay bloqueado por el navegador:", e));
            }
        }
    }, [indicePista]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => console.log("Error al reproducir audio:", e));
        }
    };

    const cambiarPista = () => {
        // Pasa a la siguiente pista de forma cíclica (0 -> 1 -> 0)
        const siguiente = (indicePista + 1) % LISTA_PISTAS.length;
        setIndicePista(siguiente);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md border-2 border-amber-300 p-2 rounded-2xl shadow-xl">
            <audio
                ref={audioRef}
                src={LISTA_PISTAS[indicePista].ruta}
                loop
                preload="auto"
            />

            {/* Botón de Play / Pausa */}
            <button
                onClick={togglePlay}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                    isPlaying 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse' 
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                }`}
                title={isPlaying ? "Silenciar música" : "Activar música de fondo"}
            >
                <span>{isPlaying ? '🎵' : '🔇'}</span>
                <span>{isPlaying ? 'Música: ON' : 'Música: OFF'}</span>
            </button>

            {/* Botón para cambiar entre la Pista 1 y Pista 2 */}
            <button
                onClick={cambiarPista}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                title="Cambiar pista de audio"
            >
                🔀 {LISTA_PISTAS[indicePista].nombre}
            </button>
        </div>
    );
}