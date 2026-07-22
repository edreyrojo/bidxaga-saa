import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import MenuPrincipal from './components/MenuPrincipal';
import Tablero from './components/Tablero';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama';
import Trivia from './components/Trivia';
import AudioFondo from './components/AudioFondo'; // Reproductor de música global
import LoginModal from './components/LoginModal'; // Modal para iniciar sesión / registrarse
import PerfilModal from './components/PerfilModal'; // Modal de perfil y tienda de totopos

function App() {
  const [vistaActual, setVistaActual] = useState('menu');
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);

  // Escuchar si el usuario inicia o cierra sesión en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Función inteligente para el botón superior derecho:
  // Si hay usuario logueado abre el Perfil, si no, abre el Login.
  const handleBotonSuperior = () => {
    if (user) {
      setShowPerfilModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10 relative">

      {/* Reproductor de audio flotante (persistente en toda la app) */}
      <AudioFondo />

      {/* Botón Flotante Superior Derecho para Iniciar Sesión / Perfil */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={handleBotonSuperior}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-transform transform active:scale-95 flex items-center gap-2 cursor-pointer text-sm sm:text-base"
        >
          <span>🌽</span>
          {user ? (user.email ? user.email.split('@')[0] : 'Mi Perfil') : 'Iniciar Sesión'}
        </button>
      </div>

      {/* 1. Menú Principal */}
      {vistaActual === 'menu' && (
        <MenuPrincipal setVistaActual={setVistaActual} />
      )}

      {/* 2. Memorama (Pasamos user) */}
      {vistaActual === 'memorama' && (
        <Tablero onBack={() => setVistaActual('menu')} user={user} />
      )}

      {/* 3. Sopa de Letras (Pasamos user) */}
      {vistaActual === 'sopa' && (
        <SopaLetras onBack={() => setVistaActual('menu')} user={user} />
      )}

      {/* 4. Crucigrama (Pasamos user) */}
      {vistaActual === 'crucigrama' && (
        <Crucigrama onBack={() => setVistaActual('menu')} user={user} />
      )}

      {/* 5. Trivia (Reto Rápido) (Pasamos user) */}
      {vistaActual === 'trivia' && (
        <Trivia onBack={() => setVistaActual('menu')} user={user} />
      )}

      {/* Modal de Inicio de Sesión / Registro */}
      {showLoginModal && (
        <LoginModal user={user} onClose={() => setShowLoginModal(false)} />
      )}

      {/* Modal de Perfil, Edición y Tienda de Totopos */}
      {showPerfilModal && (
        <PerfilModal user={user} onClose={() => setShowPerfilModal(false)} />
      )}

    </div>
  );
}

export default App;