import React from 'react';

export default function SopaLetras() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
            <header className="text-center mb-8">
                <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-4 max-w-full h-auto" />
                <h2 className="text-2xl font-bold text-amber-950">Sopa de Letras</h2>
                <p className="text-sm text-amber-800">Encuentra los nombres de los animales en zapoteco.</p>
            </header>

            <div className="bg-white p-10 rounded-xl shadow-2xl border border-amber-200 text-center w-full max-w-md">
                <p className="text-5xl mb-4">👷🏽‍♂️</p>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Juego en construcción</h3>
                <p className="text-gray-600">Estamos preparando el tablero para que busques las palabras. ¡Vuelve pronto!</p>
            </div>
        </div>
    );
}