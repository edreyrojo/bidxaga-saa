import React, { useRef, useEffect } from 'react';

export const LISTA_PISTAS = [
    { id: 1, nombre: 'Pista 1 (Jazz Suave)', ruta: '/audio/pista1.mp3' },
    { id: 2, nombre: 'Pista 2 (Jazz Nocturno)', ruta: '/audio/pista2.mp3' }
];

export default function AudioFondo({ isPlaying, indicePista, onPlayStateChange }) {
    const audioRef = useRef(null);

    // Controlar la reproducción de audio según el estado global
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.log("Autoplay bloqueado por el navegador:", e);
                if (onPlayStateChange) onPlayStateChange(false);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, indicePista]);

    return (
        <audio
            ref={audioRef}
            src={LISTA_PISTAS[indicePista].ruta}
            loop
            preload="auto"
        />
    );
}