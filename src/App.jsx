import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; // <-- Asegúrate de importar db
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // <-- Importamos para leer el perfil

import MenuPrincipal from './components/MenuPrincipal';
import Tablero from './components/Tablero';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama';
import Trivia from './components/Trivia';
import AudioFondo from './components/AudioFondo';
import LoginModal from './components/LoginModal';
import PerfilModal from './components/PerfilModal';

// Pequeño diccionario para saber qué emoji mostrar en el botón
const AVATAR_EMOJIS = {
  default: '🌽',
  iguana: '🦎',
  tortuga: '🐢',
  huipil: '🌸'
};

function App() {
  const [vistaActual, setVistaActual] = useState('menu');
  const [user, setUser] = useState(null);
  
  // Nuevo estado para controlar lo que dice el botón flotante
  const [perfilInfo, setPerfilInfo] = useState({ nombre: '', avatar: 'default' });
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);

  // Escuchar si el usuario inicia o cierra sesión en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Si hay usuario, vamos a buscar su avatar y nombre a Firestore rápidamente
        try {
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPerfilInfo({
              nombre: data.nombre || '',
              avatar: data.avatar || 'default'
            });
          }
        } catch (error) {
          console.error("Error cargando datos para la burbuja de perfil:", error);
        }
      } else {
        // Si cierra sesión, limpiamos la info
        setPerfilInfo({ nombre: '', avatar: 'default' });
      }
    });
    return () => unsubscribe();
  }, []);

  // Función inteligente para el botón superior derecho:
  const handleBotonSuperior = () => {
    if (user) {
      setShowPerfilModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  // Variables para renderizar el botón de forma limpia
  const emojiBoton = user ? (AVATAR_EMOJIS[perfilInfo.avatar] || '🌽') : '🌽';
  const textoBoton = user 
    ? (perfilInfo.nombre ? perfilInfo.nombre : user.email.split('@')[0]) 
    : 'Iniciar Sesión';

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10 relative">

      {/* Reproductor de audio flotante (persistente en toda la app) */}
      <AudioFondo />

      {/* Botón Flotante Superior Derecho para Iniciar Sesión / Perfil */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={handleBotonSuperior}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl font-bold shadow-md transition-transform transform active:scale-95 flex items-center gap-2 cursor-pointer text-sm sm:text-base border-2 border-amber-500 hover:border-amber-400"
        >
          <span className="text-xl drop-shadow-sm">{emojiBoton}</span>
          <span>{textoBoton}</span>
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
        <PerfilModal 
          user={user} 
          onClose={() => setShowPerfilModal(false)} 
          /* Aquí enganchamos el evento para actualizar la burbuja sin recargar la página */
          onProfileUpdate={(nuevosDatos) => setPerfilInfo(prev => ({ ...prev, ...nuevosDatos }))}
        />
      )}

    </div>
  );
}

export default App;