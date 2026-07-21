import React, { useState } from 'react';
import MenuPrincipal from './components/MenuPrincipal';
import Tablero from './components/Tablero';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama';
import Trivia from './components/Trivia'; // 1. Importamos el nuevo componente de Trivia

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
        <Tablero onBack={() => setVistaActual('menu')} />
      )}

      {/* 3. Sopa de Letras */}
      {vistaActual === 'sopa' && (
        <SopaLetras onBack={() => setVistaActual('menu')} />
      )}

      {/* 4. Crucigrama */}
      {vistaActual === 'crucigrama' && (
        <Crucigrama onBack={() => setVistaActual('menu')} />
      )}

      {/* 5. Trivia (Reto Rápido) */}
      {vistaActual === 'trivia' && (
        <Trivia onBack={() => setVistaActual('menu')} />
      )}

    </div>
  );
}

export default App;