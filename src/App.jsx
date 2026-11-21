import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { auth, db } from './firebaseConfig';
import { almacen, configurarScope } from './utils/almacen.js';
import { useSyncRepaso } from './hooks/useSyncRepaso.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

import MenuPrincipal from './components/MenuPrincipal';
import AudioFondo, { LISTA_PISTAS } from './components/AudioFondo';

const Memorama = lazy(() => import('./components/Memorama'));
const SopaLetras = lazy(() => import('./components/SopaLetras'));
const Crucigrama = lazy(() => import('./components/Crucigrama'));
const Trivia = lazy(() => import('./components/Trivia'));
const RetoDiario = lazy(() => import('./components/RetoDiario'));
const PanelProgreso = lazy(() => import('./components/PanelProgreso'));
const GeneradorDev = lazy(() => import('./components/GeneradorDev'));
import LoginModal from './components/LoginModal';
import PerfilModal from './components/PerfilModal';
import ConfiguracionModal from './components/ConfiguracionModal';
import Icono from './components/Icono';

const RUTA_MERCADO_ACCESORIOS = '/avatares/mercado/';

const calcularNivelRapido = (totalHistorico) => {
    if (totalHistorico < 100) return 1;
    if (totalHistorico < 300) return 2;
    if (totalHistorico < 600) return 3;
    if (totalHistorico < 1000) return 4;
    return 5;
};

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
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varSilueta})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
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
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/avatares/${personaje}/${varRostro})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
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
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [animandoSalida, setAnimandoSalida] = useState(false);
  
  const [perfilInfo, setPerfilInfo] = useState({ nombre: '', avatar: 'default', nivel: 1 });
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAvisosModal, setShowAvisosModal] = useState(false);
  const [showAyudaModal, setShowAyudaModal] = useState(false);
  const [showHerramientasMovil, setShowHerramientasMovil] = useState(false);
  const [juegoAyudaSeleccionado, setJuegoAyudaSeleccionado] = useState(null);

  const [listaAvisos, setListaAvisos] = useState([]);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [indicePista, setIndicePista] = useState(0);
  const [logroToast, setLogroToast] = useState(null);
  const logroTimerRef = useRef(null);

  const [controlesJuegoActivo, setControlesJuegoActivo] = useState(null);

  useSyncRepaso(user);

  useEffect(() => {
    // Temporizador para controlar la animación inicial del banner
    const timerAnimacion = setTimeout(() => {
      setAnimandoSalida(true);
      const timerOcultar = setTimeout(() => {
        setMostrarSplash(false);
      }, 700); // Tiempo de la transición de salida
      return () => clearTimeout(timerOcultar);
    }, 2000); // Duración que se muestra el banner en pantalla

    return () => clearTimeout(timerAnimacion);
  }, []);

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

  const cargarAvisos = async () => {
    try {
      const q = query(collection(db, 'avisos'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      const avisos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaAvisos(avisos);
    } catch (error) {
      console.error("Error cargando avisos:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      configurarScope(currentUser);
      setUser(currentUser);
      await cargarPerfil(currentUser);
    });
    cargarAvisos();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setShowHerramientasMovil(false);
  }, [vistaActual, user]);

  useEffect(() => {
    const mostrarLogro = (evento) => {
      setLogroToast(evento.detail);
      if (logroTimerRef.current) clearTimeout(logroTimerRef.current);
      logroTimerRef.current = setTimeout(() => setLogroToast(null), 6000);
    };

    window.addEventListener('logro-desbloqueado', mostrarLogro);
    return () => {
      window.removeEventListener('logro-desbloqueado', mostrarLogro);
      if (logroTimerRef.current) clearTimeout(logroTimerRef.current);
    };
  }, []);

  const handlePanelSuperiorClick = () => {
    if (user) {
      setShowPerfilModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleAyudaClick = () => {
    if (vistaActual === 'menu') {
      setJuegoAyudaSeleccionado(null);
    } else {
      setJuegoAyudaSeleccionado(vistaActual);
    }
    setShowAyudaModal(true);
  };

  const TUTORIALES_JUEGOS = {
    memorama: { titulo: "Memorama", desc: "Voltea dos cartas por turno y empareja cada imagen con su palabra en diidxazá. Completa el nivel sin fallar para ganar el logro Memoria de Rayo." },
    trivia: { titulo: "Trivia", desc: "Responde 5 preguntas de vocabulario. En Modo Difícil, termina un nivel sin errores para ganar el logro Sabio Zapoteco." },
    crucigrama: { titulo: "Crucigrama", desc: "Toca una pista y arma la palabra con el dial de letras. Alcanza el Nivel 5 para ganar el logro Erudito del Crucigrama." },
    sopa: { titulo: "Sopa de Letras", desc: "Desliza el dedo sobre las letras para encontrar cada palabra oculta. Llega al Nivel 10 para ganar el logro Ojo de Águila." }
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
        almacen.setItem('triviaNivel', nivelActual);
      } else if (vistaActual === 'sopa') {
        almacen.setItem('sopaLetrasNivel', nivelActual);
      } else if (vistaActual === 'crucigrama') {
        almacen.setItem('crucigramaNivel', nivelActual);
      } else if (vistaActual === 'memorama') {
        almacen.setItem('memoramaNivel', nivelActual);
      }
    }
  };

  const displayNickname = user 
    ? (perfilInfo.nombre ? perfilInfo.nombre : user.email.split('@')[0]) 
    : 'Iniciar Sesion';

  const onGuardarClick = controlesJuegoActivo?.onGuardarClick;

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-amber-950 pb-10 relative">

      {mostrarSplash && (
        <div className={`fixed inset-0 z-[100] bg-orange-50 flex items-center justify-center transition-opacity duration-700 ${animandoSalida ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex flex-col items-center p-6 animate-fade-in">
            <img 
              src="/images/bannerinicio.png" 
              alt="Bidxaga Saa Inicio" 
              className="max-w-xs sm:max-w-md w-full object-contain drop-shadow-2xl animate-pulse" 
            />
          </div>
        </div>
      )}

      <AudioFondo 
        isPlaying={isPlayingMusic} 
        indicePista={indicePista} 
        onPlayStateChange={setIsPlayingMusic} 
      />

      <div className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] left-[calc(0.75rem+env(safe-area-inset-left))] sm:top-[calc(1rem+env(safe-area-inset-top))] sm:left-[calc(1rem+env(safe-area-inset-left))] z-40 flex items-center gap-2">
        
        <button
          onClick={handlePanelSuperiorClick}
          className="bg-amber-100/95 hover:bg-amber-200/95 backdrop-blur-md text-amber-950 px-3 py-1.5 rounded-2xl font-bold shadow-md transition-transform transform active:scale-95 flex items-center gap-2.5 cursor-pointer border-2 border-amber-300 hover:border-amber-400 text-xs sm:text-sm"
          title={user ? "Ver Perfil" : "Iniciar Sesion"}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center text-lg sm:text-xl shadow-inner border-2 border-amber-300 flex-shrink-0 overflow-hidden relative">
            <RenderAvatarSuperior avatar={perfilInfo.avatar} />
          </div>

          <div className="flex flex-col text-left leading-tight">
            <span className="font-black text-amber-950 truncate max-w-[72px] sm:max-w-[150px]">
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-transform transform active:scale-95 border-2 border-amber-500 cursor-pointer p-2.5"
            title="Volver al Menu Principal"
          >
            <svg className="w-full h-full object-contain" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        )}

        {onGuardarClick && (
          <button
            onClick={onGuardarClick}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-transform transform active:scale-95 border-2 border-emerald-500 cursor-pointer p-2 overflow-hidden"
            title="Guardar Record"
          >
            <img 
              src="/guiechachi.png" 
              alt="Guardar Record" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span style={{ display: 'none' }} className="w-full h-full items-center justify-center text-xs font-bold">
              <Icono nombre="save" className="w-5 h-5" />
            </span>
          </button>
        )}

        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setShowHerramientasMovil((visible) => !visible)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-900 shadow-md transition-transform transform active:scale-95 border-2 border-amber-300 cursor-pointer p-2 relative"
            title="Más opciones"
            aria-label={listaAvisos.length > 0 ? `⋯ Más opciones (${listaAvisos.length} avisos)` : '⋯ Más opciones'}
            aria-expanded={showHerramientasMovil}
          >
            <span className="text-xl font-black leading-none">⋯</span>
            {listaAvisos.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {listaAvisos.length}
              </span>
            )}
          </button>

          {showHerramientasMovil && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowHerramientasMovil(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-12 z-50 w-48 bg-white rounded-2xl border-2 border-amber-300 shadow-2xl p-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAvisosModal(true);
                    setShowHerramientasMovil(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-100 text-sm font-bold text-amber-950 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2"><Icono nombre="megaphone" className="w-4 h-4" /> Avisos</span>
                  {listaAvisos.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {listaAvisos.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAyudaClick();
                    setShowHerramientasMovil(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-100 text-sm font-bold text-amber-950 flex items-center gap-2 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2"><Icono nombre="help" className="w-4 h-4" /> Ayuda</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(true);
                    setShowHerramientasMovil(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-100 text-sm font-bold text-amber-950 flex items-center gap-2 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2"><Icono nombre="settings" className="w-4 h-4" /> Configuración</span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setShowAvisosModal(true)}
          className="hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-900 shadow-md transition-transform transform active:scale-95 border-2 border-amber-300 cursor-pointer p-2 relative"
          title="Avisos"
          aria-label={listaAvisos.length > 0 ? `Avisos (${listaAvisos.length})` : 'Avisos'}
        >
          <Icono nombre="megaphone" className="w-5 h-5" />
          {listaAvisos.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {listaAvisos.length}
            </span>
          )}
        </button>

        <button
          onClick={handleAyudaClick}
          className="hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-900 shadow-md transition-transform transform active:scale-95 border-2 border-amber-300 cursor-pointer p-2"
          title="Ayuda y Tutoriales"
          aria-label="Ayuda y tutoriales"
        >
          <Icono nombre="help" className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowConfigModal(true)}
          className={`hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center shadow-md transition-transform transform active:scale-95 border-2 cursor-pointer overflow-hidden p-2 ${
            isPlayingMusic 
              ? 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border-amber-300 hover:border-amber-400' 
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
          }`}
          title="Abrir Configuracion y Musica"
          aria-label="Configuración y música"
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
            <Icono nombre="settings" className="w-5 h-5" />
          </span>
        </button>

      </div>

      <main className="pt-[calc(4.5rem_+_env(safe-area-inset-top))] sm:pt-[calc(5rem_+_env(safe-area-inset-top))]">
        <Suspense fallback={(
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-amber-900">
            <div className="w-10 h-10 rounded-full border-4 border-amber-300 border-t-amber-700 animate-spin" />
            <p className="text-sm font-bold">Cargando juego…</p>
          </div>
        )}>
        {vistaActual === 'menu' && (
          <MenuPrincipal user={user} setVistaActual={(vista) => {
            setControlesJuegoActivo(null);
            setVistaActual(vista);
          }} />
        )}

        {vistaActual === 'reto' && (
          <RetoDiario
            user={user}
            onBack={() => {
              setControlesJuegoActivo(null);
              setVistaActual('menu');
            }}
          />
        )}

        {vistaActual === 'progreso' && (
          <PanelProgreso
            user={user}
            onBack={() => {
              setControlesJuegoActivo(null);
              setVistaActual('menu');
            }}
          />
        )}

        {vistaActual === 'memorama' && (
          <Memorama 
            key={user?.uid || 'guest'}
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
            key={user?.uid || 'guest'}
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
            key={user?.uid || 'guest'}
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
            key={user?.uid || 'guest'}
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
        </Suspense>
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

      {showAvisosModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-black text-amber-950 mb-4 text-center flex items-center justify-center gap-2"><Icono nombre="megaphone" className="w-5 h-5" /> Avisos y Novedades</h3>
            {listaAvisos.length === 0 ? (
              <p className="text-sm text-amber-800 text-center py-6">No hay avisos disponibles por el momento.</p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {listaAvisos.map((aviso) => (
                  <div key={aviso.id} className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                    <h4 className="font-bold text-amber-950 text-sm mb-1">{aviso.titulo}</h4>
                    <p className="text-xs text-amber-900">{aviso.mensaje}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAvisosModal(false)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showAyudaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-black text-amber-950 mb-4 text-center flex items-center justify-center gap-2"><Icono nombre="help" className="w-5 h-5" /> Centro de Ayuda</h3>
            
            {!juegoAyudaSeleccionado && vistaActual === 'menu' ? (
              <div className="flex flex-col gap-2.5 mb-6">
                <p className="text-xs text-amber-800 text-center mb-2">Selecciona el juego del que deseas ver el tutorial:</p>
                {Object.entries(TUTORIALES_JUEGOS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setJuegoAyudaSeleccionado(key)}
                    className="w-full text-left bg-amber-50 hover:bg-amber-100 p-3 rounded-2xl border border-amber-200 font-bold text-amber-950 text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span>{val.titulo}</span>
                    <Icono nombre="arrowRight" className="w-4 h-4" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                <h4 className="font-black text-amber-900 text-base">
                  {TUTORIALES_JUEGOS[juegoAyudaSeleccionado || vistaActual]?.titulo || "Tutorial"}
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  {TUTORIALES_JUEGOS[juegoAyudaSeleccionado || vistaActual]?.desc || "Instrucciones generales de la actividad."}
                </p>
                <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200 text-center text-xs text-amber-900 font-bold flex items-center justify-center gap-2">
                  <Icono nombre="video" className="w-4 h-4" /> Próximamente: Video tutorial disponible para este juego.
                </div>
                {vistaActual === 'menu' && (
                  <button
                    onClick={() => setJuegoAyudaSeleccionado(null)}
                    className="text-xs text-amber-700 underline font-bold cursor-pointer text-center mt-1"
                  >
                    ← Volver a la lista de juegos
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setShowAyudaModal(false);
                setJuegoAyudaSeleccionado(null);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
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

      {logroToast && (
        <div className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm bg-amber-950 text-white rounded-2xl shadow-2xl border-2 border-amber-400 p-4 flex items-center gap-3">
          <span className="flex-shrink-0 flex items-center justify-center" aria-hidden="true">
            <Icono nombre={logroToast.icono || 'trophy'} className="w-8 h-8 text-amber-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-amber-300 font-black">¡Logro desbloqueado!</p>
            <p className="font-black text-sm truncate">{logroToast.nombre}</p>
            <p className="text-[11px] text-amber-100 leading-snug">{logroToast.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setLogroToast(null)}
            className="text-amber-200 hover:text-white font-black text-lg w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 cursor-pointer"
            aria-label="Cerrar aviso de logro"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

export default App;