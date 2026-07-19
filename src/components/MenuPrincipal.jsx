import React from 'react';

export default function MenuPrincipal({ setVistaActual }) {
    return (
        <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
            {/* Reutilizamos tu banner icónico */}
            <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-6 max-w-full h-auto drop-shadow-md" />

            <h1 className="text-3xl font-bold text-amber-950 mb-1 text-center">¡Bidxaga Saa!</h1>
            <p className="text-amber-800 mb-6 text-center font-medium">Elige cómo quieres aprender diidxazá hoy:</p>

            <div className="flex flex-col gap-3.5 w-full">
                {/* 1. Botón Memorama */}
                <button
                    onClick={() => setVistaActual('memorama')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-amber-700 flex flex-col items-center"
                >
                    <span className="text-xl">🎴 Memorama</span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">Encuentra los pares y haz memoria</span>
                </button>

                {/* 2. Botón Sopa de Letras */}
                <button
                    onClick={() => setVistaActual('sopa')}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-green-700 flex flex-col items-center"
                >
                    <span className="text-xl">🔎 Sopa de Letras</span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">Busca las palabras ocultas</span>
                </button>

                {/* 3. Botón Crucigrama */}
                <button
                    onClick={() => setVistaActual('crucigrama')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-orange-700 flex flex-col items-center"
                >
                    <span className="text-xl">✏️ Crucigrama</span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">Completa los nombres con pistas</span>
                </button>
            </div>

            {/* SECCIÓN INFERIOR: BOTONES SECUNDARIOS (Créditos / Apoyo) */}
            <div className="w-full border-t border-amber-200 mt-8 pt-6 flex flex-col gap-3">
                
                {/* Botón de Invítame un Café / Apoyo */}
                <a
                    href="https://buymeacoffee.com/tuusuario" /* Reemplaza con tu enlace real o de PayPal */
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2.5 px-4 rounded-xl border border-amber-300 flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
                >
                    <span>☕</span> Invítame un café / Apoya el proyecto
                </a>

                {/* Botón de Créditos */}
                <button
                    onClick={() => alert("Proyecto Bidxaga Saa 🐾\nDesarrollado para preservar y difundir el Diidxazá (Zapoteco del Istmo) de Unión Hidalgo, Oaxaca.\nIlustraciones y diseño con mucho orgullo cultural.")}
                    className="text-amber-800 hover:text-amber-950 text-xs font-semibold py-2 transition-colors text-center"
                >
                    ✨ Ver Créditos y Propósito Cultural
                </button>
            </div>
        </div>
    );
}