import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import MenuPrincipal from './components/MenuPrincipal';
import Memorama from './components/Memorama'; // 👈 Actualizado el nombre del componente y archivo
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama';
import Trivia from './components/Trivia';
import AudioFondo, { LISTA_PISTAS } from './components/AudioFondo';
import LoginModal from './components/LoginModal';
import PerfilModal from './components/PerfilModal';
import ConfiguracionModal from './components/ConfiguracionModal';

const AVATAR_EMOJIS = {
  default: '🌽',
  iguana: '🦎',
  tortuga: '🐢',
  huipil: '🌸'
};

const calcularNivelRapido = (totalHistorico) => {
  if (totalHistorico < 100) return 1;
  if (totalHistorico < 300) return 2;
  if (totalHistorico < 600) return 3;
  if (totalHistorico < 1000) return 4;
  return 5;
};

function App() {
  const [vistaActual, setVistaActual] = useState('menu');
  const [user, setUser] = useState(null);
  
  const [perfilInfo, setPerfilInfo] = useState({ nombre: '', avatar: 'default', nivel: 1 });
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Estados globales de la música
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [indicePista, setIndicePista] = useState(0);

  // 🎮 Estado global para almacenar los controles del juego activo en curso
  const [controlesJuegoActivo, setControlesJuegoActivo] = useState(null);

  // Escuchar sesión y cargar datos iniciales de Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            let historico = data.totoposHistoricos || data.totopos || 0;
            if (data.totopos > historico) historico = data.totopos;
            const nivelCalc = calcularNivelRapido(historico);

            setPerfilInfo({
              nombre: data.nombre || '',
              avatar: data.avatar || 'default',
              nivel: nivelCalc
            });
          }
        } catch (error) {
          console.error("Error cargando perfil superior:", error);
        }
      } else {
        setPerfilInfo({ nombre: '', avatar: 'default', nivel: 1 });
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePanelSuperiorClick = () => {
    if (user) {
      setShowPerfilModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const togglePlayMusic = () => {
    setIsPlayingMusic(prev => !prev);
  };

  const cambiarPistaAudio = () => {
    const siguiente = (indicePista + 1) % LISTA_PISTAS.length;
    setIndicePista(siguiente);
  };

  const emojiAvatar = user ? (AVATAR_EMOJIS[perfilInfo.avatar] || '🌽') : '👤';
  const displayNickname = user 
    ? (perfilInfo.nombre ? perfilInfo.nombre : user.email.split('@')[0]) 
    : 'Iniciar Sesión';

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10 relative">

      {/* Reproductor de audio global persistente */}
      <AudioFondo 
        isPlaying={isPlayingMusic} 
        indicePista={indicePista} 
        onPlayStateChange={setIsPlayingMusic} 
      />

      {/* PANEL SUPERIOR IZQUIERDO: Perfil + Nickname + Nivel + Engrane de Configuración */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        
        {/* Botón / Tarjeta de Perfil */}
        <button
          onClick={handlePanelSuperiorClick}
          className="bg-amber-100/90 hover:bg-amber-200/90 backdrop-blur-md text-amber-950 px-3 py-1.5 rounded-2xl font-bold shadow-md transition-transform transform active:scale-95 flex items-center gap-2.5 cursor-pointer border-2 border-amber-300 hover:border-amber-400 text-xs sm:text-sm"
          title={user ? "Ver Perfil" : "Iniciar Sesión"}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-600 text-white flex items-center justify-center text-lg sm:text-xl shadow-inner border-2 border-amber-300 flex-shrink-0">
            {emojiAvatar}
          </div>

          <div className="flex flex-col text-left leading-tight">
            <span className="font-black text-amber-950 truncate max-w-[110px] sm:max-w-[150px]">
              {displayNickname}
            </span>
            {user && (
              <span className="text-[10px] font-black text-amber-700 bg-amber-200/80 px-1.5 py-0.2 rounded-full inline-block w-fit mt-0.5">
                Lvl {perfilInfo.nivel}
              </span>
            )}
          </div>
        </button>

        {/* Botón de Configuración (Engrane ⚙️) que abre el Modal */}
        <button
          onClick={() => setShowConfigModal(true)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg shadow-md transition-transform transform active:scale-95 border-2 cursor-pointer ${
            isPlayingMusic 
              ? 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border-amber-300 hover:border-amber-400' 
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
          }`}
          title="Abrir Configuración y Música"
        >
          <span className="animate-spin-slow">⚙️</span>
        </button>

      </div>

      {/* 1. Menú Principal */}
      {vistaActual === 'menu' && (
        <MenuPrincipal setVistaActual={(vista) => {
          setControlesJuegoActivo(null); // Limpiamos controles al volver al menú
          setVistaActual(vista);
        }} />
      )}

      {/* 2. Memorama */}
      {vistaActual === 'memorama' && (
        <Memorama 
          user={user} 
          onSetControles={setControlesJuegoActivo}
          onBack={() => { 
            setControlesJuegoActivo(null); 
            setShowConfigModal(false); 
            setVistaActual('menu'); 
          }} 
        />
      )}

      {/* 3. Sopa de Letras */}
      {vistaActual === 'sopa' && (
        <SopaLetras 
          user={user} 
          onSetControles={setControlesJuegoActivo}
          onBack={() => { 
            setControlesJuegoActivo(null); 
            setShowConfigModal(false); 
            setVistaActual('menu'); 
          }} 
        />
      )}

      {/* 4. Crucigrama */}
      {vistaActual === 'crucigrama' && (
        <Crucigrama 
          user={user} 
          onSetControles={setControlesJuegoActivo}
          onBack={() => { 
            setControlesJuegoActivo(null); 
            setShowConfigModal(false); 
            setVistaActual('menu'); 
          }} 
        />
      )}

      {/* 5. Trivia */}
      {vistaActual === 'trivia' && (
        <Trivia 
          user={user} 
          onSetControles={setControlesJuegoActivo}
          onBack={() => { 
            setControlesJuegoActivo(null); 
            setShowConfigModal(false); 
            setVistaActual('menu'); 
          }} 
        />
      )}

      {/* Modal de Inicio de Sesión / Registro */}
      {showLoginModal && (
        <LoginModal user={user} onClose={() => setShowLoginModal(false)} />
      )}

      {/* Modal de Perfil, Edición y Tienda */}
      {showPerfilModal && (
        <PerfilModal 
          user={user} 
          onClose={() => setShowPerfilModal(false)} 
          onProfileUpdate={(nuevosDatos) => setPerfilInfo(prev => ({ ...prev, ...nuevosDatos }))}
        />
      )}

      {/* Modal de Configuración y Música (Con barra de control unificada) */}
      <ConfiguracionModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        isPlaying={isPlayingMusic}
        onTogglePlay={togglePlayMusic}
        indicePista={indicePista}
        onCambiarPista={cambiarPistaAudio}
        listaPistas={LISTA_PISTAS}
        controlesJuegoActivo={controlesJuegoActivo}
      />

    </div>
  );
}

export default App;