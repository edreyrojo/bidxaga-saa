import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import MenuPrincipal from './components/MenuPrincipal';
import Memorama from './components/Memorama';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama';
import Trivia from './components/Trivia';
import GeneradorDev from './components/GeneradorDev'; // 🛠️ Importamos el generador a pantalla completa
import AudioFondo, { LISTA_PISTAS } from './components/AudioFondo';
import LoginModal from './components/LoginModal';
import PerfilModal from './components/PerfilModal';
import ConfiguracionModal from './components/ConfiguracionModal';

// 🛍️ Catálogo completo de emojis para sincronizar con la tienda
const AVATAR_EMOJIS = {
  default: '🌽',
  iguana: '🦎',
  tortuga: '🐢',
  huipil: '🌸',
  colibri: '🐦',
  jaguar: '🐆',
  mezcal: '🥃',
  sol: '☀️',
  bandera: '🧵',
  corona: '👑'
};

const calcularNivelRapido = (totalHistorico) => {
  if (totalHistorico < 100) return 1;
  if (totalHistorico < 300) return 2;
  if (totalHistorico < 600) return 3;
  if (totalHistorico < 1000) return 4;
  return 5;
};

/* ==========================================
   🎨 COMPONENTE AUXILIAR: RENDERIZADOR DE AVATAR DE 7 CAPAS EN APP
   ========================================== */
function RenderAvatarSuperior({ avatar }) {
    const esPersonalizado = typeof avatar === 'object' && avatar !== null;

    if (esPersonalizado) {
        const personaje = avatar.tipo || 'personaje1';
        return (
            <div className="w-full h-full relative overflow-hidden bg-amber-50 flex items-center justify-center">
                {/* 1. Capa de Silueta / Ropa Base (Estática) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/1silueta.svg)`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                {/* 2. Capa de Piel */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.piel || '#F5C6A0',
                        WebkitMaskImage: `url(/avatares/${personaje}/1piel.svg)`,
                        maskImage: `url(/avatares/${personaje}/1piel.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 3. Capa de Rostro1 (Estática) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/1rostro1.svg)`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                {/* 4. Capa de Ojos1 */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.ojos1 || '#5d320e',
                        WebkitMaskImage: `url(/avatares/${personaje}/1ojos1.svg)`,
                        maskImage: `url(/avatares/${personaje}/1ojos1.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 5. Capa de Cabello1 */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.cabello1 || '#5c320f',
                        WebkitMaskImage: `url(/avatares/${personaje}/1cabello1.svg)`,
                        maskImage: `url(/avatares/${personaje}/1cabello1.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 6. Capa de Playera1 */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.playera1 || '#468b41',
                        WebkitMaskImage: `url(/avatares/${personaje}/1playera1.svg)`,
                        maskImage: `url(/avatares/${personaje}/1playera1.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 7. Capa de Shorts1 */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: avatar.shorts1 || '#5a968a',
                        WebkitMaskImage: `url(/avatares/${personaje}/1shorts1.svg)`,
                        maskImage: `url(/avatares/${personaje}/1shorts1.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
            </div>
        );
    }

    if (avatar && avatar !== 'default') {
        return (
            <img 
                src={`/avatares/${avatar}.png`} 
                alt={avatar}
                className="w-full h-full object-cover"
                onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                    }
                }}
            />
        );
    }

    return null;
}

function App() {
  const [vistaActual, setVistaActual] = useState('menu');
  const [user, setUser] = useState(null);
  
  const [perfilInfo, setPerfilInfo] = useState({ nombre: '', avatar: 'default', emoji: '🌽', nivel: 1 });
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Estados globales de la música
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [indicePista, setIndicePista] = useState(0);

  // 🎮 Estado global para almacenar los controles del juego activo en curso
  const [controlesJuegoActivo, setControlesJuegoActivo] = useState(null);

  // 🔄 Función reutilizable para cargar el perfil del usuario desde Firestore
  const cargarPerfil = async (currentUser) => {
    if (currentUser) {
      try {
        const docRef = doc(db, 'usuarios', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          let historico = data.totoposHistoricos || data.totopos || 0;
          if (data.totopos > historico) historico = data.totopos;
          const nivelCalc = calcularNivelRapido(historico);
          const avatarId = data.avatar !== undefined ? data.avatar : 'default';
          const emojiCalc = typeof avatarId === 'object' ? '🎨' : (AVATAR_EMOJIS[avatarId] || '🌽');

          setPerfilInfo({
            nombre: data.nombre || '',
            avatar: avatarId,
            emoji: emojiCalc,
            nivel: nivelCalc
          });
        }
      } catch (error) {
        console.error("Error cargando perfil superior:", error);
      }
    } else {
      setPerfilInfo({ nombre: '', avatar: 'default', emoji: '🌽', nivel: 1 });
    }
  };

  // Escuchar sesión y cargar datos iniciales de Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await cargarPerfil(currentUser);
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

  // 💾 Función auxiliar para guardar el nivel actual en localStorage antes de volver al menú
  const guardarNivelActual = () => {
    if (controlesJuegoActivo?.level !== undefined && controlesJuegoActivo?.level !== null) {
      const nivelActual = controlesJuegoActivo.level;
      if (vistaActual === 'trivia') {
        localStorage.setItem('triviaNivel', nivelActual);
      } else if (vistaActual === 'sopa') {
        localStorage.setItem('sopaLetrasNivel', nivelActual);
      } else if (vistaActual === 'crucigrama') {
        localStorage.setItem('crucigramaNivel', nivelActual);
      } else if (vistaActual === 'memorama') {
        localStorage.setItem('memoramaNivel', nivelActual);
      }
    }
  };

  const emojiAvatar = user ? (perfilInfo.emoji || (typeof perfilInfo.avatar === 'object' ? '🎨' : AVATAR_EMOJIS[perfilInfo.avatar]) || '🌽') : '👤';
  const displayNickname = user 
    ? (perfilInfo.nombre ? perfilInfo.nombre : user.email.split('@')[0]) 
    : 'Iniciar Sesión';

  const onGuardarClick = controlesJuegoActivo?.onGuardarClick;

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10 relative">

      {/* Reproductor de audio global persistente */}
      <AudioFondo 
        isPlaying={isPlayingMusic} 
        indicePista={indicePista} 
        onPlayStateChange={setIsPlayingMusic} 
      />

      {/* 🚀 PANEL SUPERIOR FLOTANTE */}
      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-40 flex items-center gap-2">
        
        {/* 1.- Botón / Tarjeta de Perfil Modal */}
        <button
          onClick={handlePanelSuperiorClick}
          className="bg-amber-100/90 hover:bg-amber-200/90 backdrop-blur-md text-amber-950 px-3 py-1.5 rounded-2xl font-bold shadow-md transition-transform transform active:scale-95 flex items-center gap-2.5 cursor-pointer border-2 border-amber-300 hover:border-amber-400 text-xs sm:text-sm"
          title={user ? "Ver Perfil" : "Iniciar Sesión"}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center text-lg sm:text-xl shadow-inner border-2 border-amber-300 flex-shrink-0 overflow-hidden relative">
            <RenderAvatarSuperior avatar={perfilInfo.avatar} />
            <span 
              style={{ display: (user && perfilInfo.avatar && perfilInfo.avatar !== 'default') ? 'none' : 'flex' }} 
              className="w-full h-full items-center justify-center"
            >
              {emojiAvatar}
            </span>
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

        {/* 2.- Botón Menú Principal */}
        {vistaActual !== 'menu' && (
          <button
            onClick={() => {
              guardarNivelActual();
              if (controlesJuegoActivo?.onMenuClick) {
                controlesJuegoActivo.onMenuClick(); 
              } else {
                setControlesJuegoActivo(null);
                setVistaActual('menu');
              }
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2.5 sm:px-3.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 border-2 border-amber-500 whitespace-nowrap"
            title="Volver al Menú Principal"
          >
            <span className="sm:hidden text-base leading-none">☰</span>
            <span className="hidden sm:inline">Menú Principal</span>
          </button>
        )}

        {/* 3.- Botón Flotante de Guardar Récord */}
        {onGuardarClick && (
          <button
            onClick={onGuardarClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2.5 sm:px-3.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 border-2 border-emerald-500 whitespace-nowrap"
            title="Guardar Récord"
          >
            <span className="text-base leading-none">💾</span>
            <span className="hidden sm:inline">Guardar Récord</span>
          </button>
        )}

        {/* 4.- Botón de Configuración */}
        <button
          onClick={() => setShowConfigModal(true)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shadow-md transition-transform transform active:scale-95 border-2 cursor-pointer overflow-hidden p-2 ${
            isPlayingMusic 
              ? 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border-amber-300 hover:border-amber-400' 
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
          }`}
          title="Abrir Configuración y Música"
        >
          <img 
            src="/engrane.png" 
            alt="Configuración" 
            className="w-full h-full object-contain animate-spin-slow"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <span style={{ display: 'none' }} className="w-full h-full items-center justify-center text-lg">
            ⚙️
          </span>
        </button>

      </div>

      {/* 🎮 CONTENEDOR DE VISTAS */}
      <main className="pt-16 sm:pt-20">
        {vistaActual === 'menu' && (
          <MenuPrincipal setVistaActual={(vista) => {
            setControlesJuegoActivo(null);
            setVistaActual(vista);
          }} />
        )}

        {vistaActual === 'memorama' && (
          <Memorama 
            user={user} 
            onSetControles={setControlesJuegoActivo}
            onBack={() => { 
              guardarNivelActual();
              setControlesJuegoActivo(null); 
              setShowConfigModal(false); 
              setVistaActual('menu'); 
            }} 
          />
        )}

        {vistaActual === 'sopa' && (
          <SopaLetras 
            user={user} 
            onSetControles={setControlesJuegoActivo}
            onBack={() => { 
              guardarNivelActual();
              setControlesJuegoActivo(null); 
              setShowConfigModal(false); 
              setVistaActual('menu'); 
            }} 
          />
        )}

        {vistaActual === 'crucigrama' && (
          <Crucigrama 
            user={user} 
            onSetControles={setControlesJuegoActivo}
            onBack={() => { 
              guardarNivelActual();
              setControlesJuegoActivo(null); 
              setShowConfigModal(false); 
              setVistaActual('menu'); 
            }} 
          />
        )}

        {vistaActual === 'trivia' && (
          <Trivia 
            user={user} 
            onSetControles={setControlesJuegoActivo}
            onBack={() => { 
              guardarNivelActual();
              setControlesJuegoActivo(null); 
              setShowConfigModal(false); 
              setVistaActual('menu'); 
            }} 
          />
        )}

        {/* 🛠️ Vista de Generador a Pantalla Completa */}
        {vistaActual === 'generador' && (
          <GeneradorDev 
            onBack={() => {
              setControlesJuegoActivo(null);
              setVistaActual('menu');
            }} 
          />
        )}
      </main>

      {/* Modal de Inicio de Sesión / Registro */}
      {showLoginModal && (
        <LoginModal user={user} onClose={() => setShowLoginModal(false)} />
      )}

      {/* Modal de Perfil, Edición y Tienda */}
      {showPerfilModal && (
        <PerfilModal 
          user={user} 
          onClose={() => {
            setShowPerfilModal(false);
            cargarPerfil(user); 
          }} 
          onProfileUpdate={(nuevosDatos) => {
            setPerfilInfo(prev => ({ 
              ...prev, 
              ...nuevosDatos, 
              emoji: nuevosDatos.emoji || (typeof nuevosDatos.avatar === 'object' ? '🎨' : AVATAR_EMOJIS[nuevosDatos.avatar]) || prev.emoji 
            }));
          }}
        />
      )}

      {/* Modal de Configuración, Música y Panel Admin */}
      <ConfiguracionModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        isPlaying={isPlayingMusic}
        onTogglePlay={togglePlayMusic}
        indicePista={indicePista}
        onCambiarPista={cambiarPistaAudio}
        listaPistas={LISTA_PISTAS}
        controlesJuegoActivo={controlesJuegoActivo}
        user={user} 
        onOpenGenerador={() => setVistaActual('generador')} 
      />

    </div>
  );
}

export default App;