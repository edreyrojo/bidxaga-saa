import React from 'react';

export default function MenuPrincipal({ setVistaActual }) {
    return (
        <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
            {/* Reutilizamos tu banner icónico */}
            <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-8 max-w-full h-auto drop-shadow-md" />

            <h1 className="text-3xl font-bold text-amber-950 mb-2 text-center">¡Bidxaga Saa!</h1>
            <p className="text-amber-800 mb-8 text-center font-medium">Elige cómo quieres aprender diidxazá hoy:</p>

            <div className="flex flex-col gap-4 w-full">
                {/* Botón Memorama */}
                <button
                    onClick={() => setVistaActual('memorama')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-amber-700 flex flex-col items-center"
                >
                    <span className="text-xl">🎴 Memorama</span>
                    <span className="text-sm font-normal opacity-90 mt-1">Encuentra los pares y haz memoria</span>
                </button>

                {/* Botón Sopa de Letras */}
                <button
                    onClick={() => setVistaActual('sopa')}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-green-700 flex flex-col items-center"
                >
                    <span className="text-xl">🔎 Sopa de Letras</span>
                    <span className="text-sm font-normal opacity-90 mt-1">Busca las palabras ocultas</span>
                </button>

                {/* Contenedor de juegos futuros */}
                <button disabled className="bg-gray-200 text-gray-500 font-bold py-4 px-6 rounded-xl border-2 border-gray-300 flex flex-col items-center cursor-not-allowed mt-4">
                    <span className="text-xl">🚧 Próximamente</span>
                    <span className="text-sm font-normal opacity-80 mt-1">Más juegos en camino...</span>
                </button>
            </div>
        </div>
    );
}