import React, { useState } from 'react';
import MenuPrincipal from './components/MenuPrincipal';
import Tablero from './components/Tablero';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama'; // Importamos el crucigrama

function App() {
  const [vistaActual, setVistaActual] = useState('menu');

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10">

      {/* 1. Menú Principal */}
      {vistaActual === 'menu' && (
        <MenuPrincipal setVistaActual={setVistaActual} />
      )}

      {/* 2. Memorama (Con su botón integrado en su propia barra de control) */}
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

    </div>
  );
}

export default App;