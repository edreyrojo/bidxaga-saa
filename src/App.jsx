import React, { useState } from 'react';
import MenuPrincipal from './components/MenuPrincipal';
import Tablero from './components/Tablero';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama'; // Importamos el nuevo crucigrama

function App() {
  const [vistaActual, setVistaActual] = useState('menu');

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10">

      {/* 1. Menú Principal */}
      {vistaActual === 'menu' && (
        <MenuPrincipal setVistaActual={setVistaActual} />
      )}

      {/* 2. Memorama */}
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

      {/* 3. Sopa de Letras */}
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

      {/* 4. Crucigrama */}
      {vistaActual === 'crucigrama' && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-4xl px-4 py-2">
            <button
              onClick={() => setVistaActual('menu')}
              className="mt-4 text-amber-700 font-bold hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              ← Volver al Menú principal
            </button>
          </div>
          <Crucigrama />
        </div>
      )}

    </div>
  );
}

export default App;