import React, { useState } from 'react';
import MenuPrincipal from './components/MenuPrincipal';
import Tablero from './components/Tablero';
import SopaLetras from './components/SopaLetras';

function App() {
  // Estado para controlar qué pantalla se está viendo. Inicia en el 'menu'
  const [vistaActual, setVistaActual] = useState('menu');

  return (
    // Contenedor principal con el fondo cálido característico del proyecto
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10">

      {/* 1. Muestra el Menú Principal */}
      {vistaActual === 'menu' && (
        <MenuPrincipal setVistaActual={setVistaActual} />
      )}

      {/* 2. Muestra el juego de Memorama (Tablero) */}
      {vistaActual === 'memorama' && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-4xl px-4 py-2">
            <button
              onClick={() => setVistaActual('menu')}
              className="mt-4 text-amber-700 font-bold hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              ← Volver al Menú principal
            </button>
          </div>
          <Tablero />
        </div>
      )}

      {/* 3. Muestra el juego de Sopa de Letras */}
      {vistaActual === 'sopa' && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-4xl px-4 py-2">
            <button
              onClick={() => setVistaActual('menu')}
              className="mt-4 text-amber-700 font-bold hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              ← Volver al Menú principal
            </button>
          </div>
          <SopaLetras />
        </div>
      )}

    </div>
  );
}

export default App;