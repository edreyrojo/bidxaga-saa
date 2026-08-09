import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import MenuPrincipal from './components/MenuPrincipal';
import Memorama from './components/Memorama';
import SopaLetras from './components/SopaLetras';
import Crucigrama from './components/Crucigrama';
import Trivia from './components/Trivia';
import GeneradorDev from './components/GeneradorDev';
import AudioFondo, { LISTA_PISTAS } from './components/AudioFondo';
import LoginModal from './components/LoginModal';
import PerfilModal from './components/PerfilModal';
import ConfiguracionModal from './components/ConfiguracionModal';

// Ruta de mercado para accesorios sincronizada
const RUTA_MERCADO_ACCESORIOS = '/avatares/mercado/';

// Catalogo de respaldos para tienda y identificadores
const AVATAR_EMOJIS = {
    default: 'Coraza',
    iguana: 'Iguana',
    tortuga: 'Tortuga',
    huipil: 'Huipil',
    colibri: 'Colibri',
    jaguar: 'Jaguar',
    mezcal: 'Mezcal',
    sol: 'Sol',
    bandera: 'Bandera',
    corona: 'Corona'
};

const calcularNivelRapido = (totalHistorico) => {
    if (totalHistorico < 100) return 1;
    if (totalHistorico < 300) return 2;
    if (totalHistorico < 600) return 3;
    if (totalHistorico < 1000) return 4;
    return 5;
};

/* ==========================================
   RENDERIZADOR DE AVATAR SUPERIOR (8 Capas con Accesorios)
   ========================================== */
function RenderAvatarSuperior({ avatar }) {
    const esPersonalizado = typeof avatar === 'object' && avatar !== null;

    if (esPersonalizado) {
        const personaje = avatar.tipo || 'personaje1';
        const varSilueta = avatar.varianteSiluetaropabase || '1silueta.svg';
        const varTonodepiel = avatar.varianteTonodepiel || avatar.variantePiel || 'piel.svg';
        const colorTonodepiel = avatar.tonodepiel || avatar.piel || '#F5C6A0';
        const varSuperior = avatar.varianteSuperior || avatar.varianteRopasuperior || '1playera1.svg';
        const colorSuperior = avatar.superior || avatar.ropasuperior || '#E65100';
        const varRostro = avatar.varianteRostro || '1rostro1.svg';
        const varOjos = avatar.varianteOjos || '1ojos1.svg';
        const colorOjos = avatar.ojos || '#1A1A1A';
        const varCabello = avatar.varianteCabello || '1cabello1.svg';
        const colorCabello = avatar.cabello || '#1A1A1A';
        const varInferior = avatar.varianteInferior || avatar.varianteRopainferior || '1shorts1.svg';
        const colorInferior = avatar.inferior || avatar.ropainferior || '#4A3525';
        const varAccesorio = avatar.varianteAccesorio || '';
        const colorAccesorio = avatar.accesorio || '#E65100';

        return (
            <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
                {/* 1. Capa de Silueta / Ropa Base */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varSilueta})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                {/* 2. Capa de Tono de Piel */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorTonodepiel,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varTonodepiel})`,
                        maskImage: `url(/avatares/${personaje}/${varTonodepiel})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 3. Capa Superior */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorSuperior,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varSuperior})`,
                        maskImage: `url(/avatares/${personaje}/${varSuperior})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 4. Capa de Rostro */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varRostro})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
                {/* 5. Capa de Ojos */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorOjos,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varOjos})`,
                        maskImage: `url(/avatares/${personaje}/${varOjos})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 6. Capa de Cabello */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorCabello,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varCabello})`,
                        maskImage: `url(/avatares/${personaje}/${varCabello})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 7. Capa Inferior */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: colorInferior,
                        WebkitMaskImage: `url(/avatares/${personaje}/${varInferior})`,
                        maskImage: `url(/avatares/${personaje}/${varInferior})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                    }}
                />
                {/* 8. Capa de Accesorio */}
                {varAccesorio && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundColor: colorAccesorio,
                            WebkitMaskImage: `url(${RUTA_MERCADO_ACCESORIOS}${varAccesorio})`,
                            maskImage: `url(${RUTA_MERCADO_ACCESORIOS}${varAccesorio})`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center'
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <img 
            src={`/avatares/${avatar}.png`} 
            alt="Avatar Equipado"
            className="w-full h-full object-contain p-1 bg-amber-50"
            onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (!e.target.parentNode.querySelector('.fallback-text')) {
                    const fallback = document.createElement('span');
                    fallback.className = "fallback-text text-xs font-bold flex items-center justify-center w-full h-full text-amber-900";
                    fallback.innerText = 'Avatar';
                    e.target.parentNode.appendChild(fallback);
                }
            }}
        />
    );
}

function App() {
  const [vistaActual, setVistaActual] = useState('menu');
  const [user, setUser] = useState(null);
  
  const [perfilInfo, setPerfilInfo] = useState({ nombre: '', avatar: 'default', nivel: 1 });
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [indicePista, setIndicePista] = useState(0);

  const [controlesJuegoActivo, setControlesJuegoActivo] = useState(null);

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

          setPerfilInfo({
            nombre: data.nombre || '',
            avatar: avatarId,
            nivel: nivelCalc
          });
        }
      } catch (error) {
        console.error("Error cargando perfil superior:", error);
      }
    } else {
      setPerfilInfo({ nombre: '', avatar: 'default', nivel: 1 });
    }
  };

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

  const displayNickname = user 
    ? (perfilInfo.nombre ? perfilInfo.nombre : user.email.split('@')[0]) 
    : 'Iniciar Sesion';

  const onGuardarClick = controlesJuegoActivo?.onGuardarClick;

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10 relative">

      <AudioFondo 
        isPlaying={isPlayingMusic} 
        indicePista={indicePista} 
        onPlayStateChange={setIsPlayingMusic} 
      />

      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-40 flex items-center gap-2">
        
        <button
          onClick={handlePanelSuperiorClick}
          className="bg-amber-100/90 hover:bg-amber-200/90 backdrop-blur-md text-amber-950 px-3 py-1.5 rounded-2xl font-bold shadow-md transition-transform transform active:scale-95 flex items-center gap-2.5 cursor-pointer border-2 border-amber-300 hover:border-amber-400 text-xs sm:text-sm"
          title={user ? "Ver Perfil" : "Iniciar Sesion"}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center text-lg sm:text-xl shadow-inner border-2 border-amber-300 flex-shrink-0 overflow-hidden relative">
            <RenderAvatarSuperior avatar={perfilInfo.avatar} />
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
            title="Volver al Menu Principal"
          >
            <span className="sm:hidden text-base leading-none">Menu</span>
            <span className="hidden sm:inline">Menu Principal</span>
          </button>
        )}

        {onGuardarClick && (
          <button
            onClick={onGuardarClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2.5 sm:px-3.5 rounded-2xl shadow-md transition-transform transform active:scale-95 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 border-2 border-emerald-500 whitespace-nowrap"
            title="Guardar Record"
          >
            <span className="hidden sm:inline">Guardar Record</span>
          </button>
        )}

        <button
          onClick={() => setShowConfigModal(true)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shadow-md transition-transform transform active:scale-95 border-2 cursor-pointer overflow-hidden p-2 ${
            isPlayingMusic 
              ? 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border-amber-300 hover:border-amber-400' 
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
          }`}
          title="Abrir Configuracion y Musica"
        >
          <img 
            src="/engrane.png" 
            alt="Configuracion" 
            className="w-full h-full object-contain animate-spin-slow"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <span style={{ display: 'none' }} className="w-full h-full items-center justify-center text-lg">
            Config
          </span>
        </button>

      </div>

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

        {vistaActual === 'generador' && (
          <GeneradorDev 
            onBack={() => {
              setControlesJuegoActivo(null);
              setVistaActual('menu');
            }} 
          />
        )}
      </main>

      {showLoginModal && (
        <LoginModal user={user} onClose={() => setShowLoginModal(false)} />
      )}

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
              ...nuevosDatos
            }));
          }}
        />
      )}

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