import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';
import {
    categoriaInicialPorDefecto,
    sincronizarDesbloqueosPorNivel,
    filtrarContenidoPorCategorias
} from '../data/Categoriascontenido.js';
import { calcularNivelCuenta } from '../utils/Nivelcuenta.js';
import SelectorCategorias from './SelectorCategorias.jsx';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, increment, query, orderBy, limit } from 'firebase/firestore';

export default function Trivia({ onBack, user, onSetControles, setControlesJuegoActivo }) {
    // Estados principales del juego
    const [nivel, setNivel] = useState(1);
    const [errores, setErrores] = useState(0);
    const [erroresParaVida, setErroresParaVida] = useState(0); // 🛡️ Acumulador de errores para perder 1 vida cada 3
    const [aciertosNivel, setAciertosNivel] = useState(0);
    const [modoDificil, setModoDificil] = useState(false);
    const [totopos, setTotopos] = useState(0); // 🌽 Sistema de Economía Virtual
    const [vidas, setVidas] = useState(3); // ❤️ Sistema de Vidas
    const [isGameOver, setIsGameOver] = useState(false); // Estado de Game Over por falta de vidas
    
    // Estados de la pregunta actual
    const [preguntaActual, setPreguntaActual] = useState(null);
    const [opciones, setOpciones] = useState([]);
    const [estadoRespuesta, setEstadoRespuesta] = useState(null); // 'correcta', 'incorrecta', o null
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);

    // Estados del Ranking y Control de Guardado
    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);

    // Estados para las Modales Personalizadas del Juego
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false); // ⚠️ Estado para la advertencia del menú
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    // 📚 Sistema de categorías desbloqueables (Trivia solo usa fauna)
    const [nivelCuenta, setNivelCuenta] = useState(1);
    const [categoriasFaunaDesbloqueadas, setCategoriasFaunaDesbloqueadas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFaunaActivas, setCategoriasFaunaActivas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [showSelectorCategorias, setShowSelectorCategorias] = useState(false);

    const PREGUNTAS_POR_NIVEL = 5;
    const TOTOPOS_POR_NIVEL = 15; // Recompensa de totopos al completar nivel
    const COSTO_VIDAS = 30; // Costo en totopos para recuperar 3 vidas

    // 💾 Función auxiliar para guardar el progreso local completo al salir o guardar
    const guardarProgresoLocal = () => {
        localStorage.setItem('triviaNivel', nivel);
        localStorage.setItem('triviaErrores', errores);
        localStorage.setItem('triviaModoDificil', modoDificil);
        localStorage.setItem('totopos', totopos);
        localStorage.setItem('triviaVidas', vidas);
    };

    // Función auxiliar para guardar automáticamente si hay sesión activa y nickname configurado
    const confirmarGuardadoAutomatico = async (nombreLimpio) => {
        const scoreToSave = pendingGlobalScore || { level: nivel, errores: errores };

        try {
            await addDoc(collection(db, "ranking_trivia"), {
                name: nombreLimpio,
                errores: scoreToSave.errores,
                level: scoreToSave.level,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "🎉 ¡Guardado Exitoso!",
                message: `¡Hola ${nombreLimpio}! Récord registrado automáticamente en el ranking global para el Nivel ${scoreToSave.level} (${scoreToSave.errores} errores).`
            });
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "⚠️ Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    // Al hacer click en Guardar con verificación de sesión y nickname
    const handleClickGuardar = async () => {
        guardarProgresoLocal();

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Récord ya guardado",
                message: `Ya guardaste tu récord global para el Nivel ${nivel}. Avanza de nivel para volver a registrar puntaje.`
            });
            return;
        }

        const currentUser = user || auth.currentUser;
        let nombreAUsar = playerName;

        if (currentUser) {
            try {
                const userDocRef = doc(db, 'usuarios', currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const nickNube = data.nickname || data.nombre || data.name;
                    if (nickNube) {
                        nombreAUsar = nickNube;
                        setPlayerName(nickNube);
                        setInputPlayerName(nickNube);
                        localStorage.setItem('triviaPlayerName', nickNube);
                    }
                }
            } catch (e) {
                console.error("Error al verificar nickname en la nube:", e);
            }
        }

        if (currentUser && nombreAUsar.trim()) {
            confirmarGuardadoAutomatico(nombreAUsar.trim());
        } else {
            setInputPlayerName(nombreAUsar);
            setShowGuardarModal(true);
        }
    };

    // Sincronizar controles globales con App.jsx y ConfiguracionModal
    useEffect(() => {
        const registrarControles = onSetControles || setControlesJuegoActivo;
        if (registrarControles) {
            registrarControles({
                level: nivel,
                onMenuClick: () => {
                    setShowMenuModal(true); // ⚠️ Muestra la advertencia antes de salir
                },
                onGuardarClick: handleClickGuardar,
                onReiniciarClick: () => setShowConfirmRestartModal(true),
                modoDificil: modoDificil,
                onToggleModoDificil: () => setModoDificil(prev => !prev)
            });
        }

        return () => {
            if (registrarControles) {
                registrarControles(null);
            }
        };
    }, [nivel, modoDificil, errores, guardadoEnNivel, pendingGlobalScore, onSetControles, setControlesJuegoActivo]);

    // Cargar datos locales y sincronizar con Firebase si hay sesión activa
    useEffect(() => {
        const nivelGuardado = localStorage.getItem('triviaNivel');
        const erroresGuardados = localStorage.getItem('triviaErrores');
        const modoDificilGuardado = localStorage.getItem('triviaModoDificil');
        const nombreGuardado = localStorage.getItem('triviaPlayerName');
        const totoposGuardados = localStorage.getItem('totopos');
        const vidasGuardadas = localStorage.getItem('triviaVidas');
        
        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (erroresGuardados) setErrores(parseInt(erroresGuardados, 10));
        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        if (nombreGuardado) {
            setPlayerName(nombreGuardado);
            setInputPlayerName(nombreGuardado);
        }
        if (totoposGuardados) setTotopos(parseInt(totoposGuardados, 10));
        if (vidasGuardadas !== null) setVidas(parseInt(vidasGuardadas, 10));

        // 📚 Categorías: respaldo local
        try {
            const faunaGuardadas = JSON.parse(localStorage.getItem('categoriasFaunaDesbloqueadas') || 'null');
            if (faunaGuardadas) {
                setCategoriasFaunaDesbloqueadas(faunaGuardadas);
                setCategoriasFaunaActivas(prev => prev.filter(id => faunaGuardadas.includes(id)).length ? prev.filter(id => faunaGuardadas.includes(id)) : categoriaInicialPorDefecto('fauna'));
            }
        } catch (e) {
            console.error("Error al leer categorías guardadas localmente:", e);
        }

        // Sincronizar totopos y nickname del perfil en Firestore si el usuario está logueado
        const cargarDatosNube = async () => {
            const currentUser = user || auth.currentUser;
            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'usuarios', currentUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.totopos !== undefined) {
                            setTotopos(data.totopos);
                            localStorage.setItem('totopos', data.totopos);
                        }

                        // 🏅 Nivel de Cuenta + sincronización de categorías gratis por nivel
                        const historico = data.totoposHistoricos !== undefined ? data.totoposHistoricos : (data.totopos || 0);
                        const nivelCalc = calcularNivelCuenta(historico);
                        setNivelCuenta(nivelCalc);

                        const faunaNube = sincronizarDesbloqueosPorNivel('fauna', data.categoriasFaunaDesbloqueadas || categoriaInicialPorDefecto('fauna'), nivelCalc);
                        setCategoriasFaunaDesbloqueadas(faunaNube);
                        localStorage.setItem('categoriasFaunaDesbloqueadas', JSON.stringify(faunaNube));

                        setCategoriasFaunaActivas(prev => {
                            const activasValidas = prev.filter(id => faunaNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('fauna');
                        });

                        if (JSON.stringify(faunaNube) !== JSON.stringify(data.categoriasFaunaDesbloqueadas || [])) {
                            updateDoc(userDocRef, { categoriasFaunaDesbloqueadas: faunaNube })
                                .catch(err => console.error("Error al sincronizar categorías por nivel:", err));
                        }

                        const nickNube = data.nickname || data.nombre || data.name;
                        if (nickNube) {
                            setPlayerName(nickNube);
                            setInputPlayerName(nickNube);
                            localStorage.setItem('triviaPlayerName', nickNube);
                        }
                    }
                } catch (e) {
                    console.error("Error al cargar datos de la nube:", e);
                }
            }
        };
        cargarDatosNube();
        cargarRankingGlobal();
    }, [user]);

    // Guardar en localStorage los cambios de nivel, errores, modo difícil o vidas de forma automática
    useEffect(() => {
        guardarProgresoLocal();
    }, [nivel, errores, modoDificil, vidas, totopos]);

    // Generar pregunta cuando cambia el nivel o los aciertos
    useEffect(() => {
        if (aciertosNivel < PREGUNTAS_POR_NIVEL && !isGameOver) {
            generarNuevaPregunta();
        } else if (aciertosNivel >= PREGUNTAS_POR_NIVEL) {
            setPendingGlobalScore({ level: nivel, errores: errores });
        }
    }, [nivel, aciertosNivel, isGameOver, categoriasFaunaActivas]);

    const generarNuevaPregunta = () => {
        setEstadoRespuesta(null);
        setOpcionSeleccionada(null);

        const poolActivo = filtrarContenidoPorCategorias(listaAnimales, categoriasFaunaActivas);
        const poolSeguro = poolActivo.length >= 4 ? poolActivo : listaAnimales;

        const animalCorrecto = poolSeguro[Math.floor(Math.random() * poolSeguro.length)];

        const distractores = [...poolSeguro]
            .filter(a => a.id !== animalCorrecto.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const opcionesMezcladas = [animalCorrecto, ...distractores]
            .sort(() => Math.random() - 0.5);

        setPreguntaActual(animalCorrecto);
        setOpciones(opcionesMezcladas);
    };

    const manejarRespuesta = (opcionElegida) => {
        if (estadoRespuesta !== null || isGameOver) return;

        setOpcionSeleccionada(opcionElegida.id);

        if (opcionElegida.id === preguntaActual.id) {
            setEstadoRespuesta('correcta');
            setTimeout(() => {
                setAciertosNivel(prev => prev + 1);
            }, 1000);
        } else {
            setEstadoRespuesta('incorrecta');
            setErrores(prev => prev + 1);
            
            // 🛡️ Incrementamos contador de errores acumulados para perder vida cada 3 errores
            const nuevoErroresParaVida = erroresParaVida + 1;
            setErroresParaVida(nuevoErroresParaVida);

            if (nuevoErroresParaVida >= 3) {
                setErroresParaVida(0); // Reiniciamos el contador de errores parciales
                const nuevasVidas = vidas - 1;
                setVidas(nuevasVidas);
                localStorage.setItem('triviaVidas', nuevasVidas);

                if (nuevasVidas <= 0) {
                    setTimeout(() => {
                        setIsGameOver(true);
                    }, 1000);
                    return;
                }
            }

            // Permite al usuario volver a intentar sin revelar cuál era la respuesta correcta
            setTimeout(() => {
                setEstadoRespuesta(null);
                setOpcionSeleccionada(null);
            }, 1200);
        }
    };

    const siguienteNivel = async () => {
        const proximoNivel = nivel + 1;
        
        // Sumar y guardar totopos localmente
        const nuevosTotopos = totopos + TOTOPOS_POR_NIVEL;
        setTotopos(nuevosTotopos);
        localStorage.setItem('totopos', nuevosTotopos);

        // Si hay un usuario con sesión iniciada, actualizar en Firestore
        const currentUser = user || auth.currentUser;
        if (currentUser) {
            try {
                const userDocRef = doc(db, 'usuarios', currentUser.uid);
                await updateDoc(userDocRef, {
                    totopos: increment(TOTOPOS_POR_NIVEL),
                    totoposHistoricos: increment(TOTOPOS_POR_NIVEL)
                });
            } catch (error) {
                console.error("Error al actualizar totopos en Firestore:", error);
            }
        }

        setNivel(proximoNivel);
        setAciertosNivel(0);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);

        setFeedbackModal({
            show: true,
            title: "🌽 ¡Nivel Superado!",
            message: `Ganaste +${TOTOPOS_POR_NIVEL} totopos. Tienes un total de ${nuevosTotopos} totopos en tu morral.`
        });
    };

    const confirmarGuardadoGlobal = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        
        const nombreLimpio = inputPlayerName.trim();
        if (!nombreLimpio) {
            setFeedbackModal({
                show: true, title: "⚠️ Nombre requerido", message: "Por favor escribe un nombre válido."
            });
            return;
        }

        setPlayerName(nombreLimpio);
        localStorage.setItem('triviaPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore || { level: nivel, errores: errores };

        try {
            await addDoc(collection(db, "ranking_trivia"), {
                name: nombreLimpio,
                errores: scoreToSave.errores,
                level: scoreToSave.level,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "🎉 ¡Guardado Exitoso!",
                message: `Récord registrado: Nivel ${scoreToSave.level} con ${scoreToSave.errores} errores.`
            });
        } catch (error) {
            setFeedbackModal({
                show: true, title: "⚠️ Error", message: "Progreso guardado localmente, error al conectar with Firebase."
            });
        }
    };

    // 🛡️ Reinicia únicamente el Nivel actual con las 3 vidas restauradas
    // 📚 Desbloquear una categoría de fauna pagando totopos actuales
    const handleDesbloquearCategoria = async (categoriaId, costo) => {
        if (costo > 0 && totopos < costo) {
            setFeedbackModal({
                show: true,
                title: "🌽 Totopos insuficientes",
                message: `Te faltan ${costo - totopos} totopos para desbloquear esta categoría.`
            });
            return;
        }

        const nuevosTotopos = totopos - costo;
        let nuevasDesbloqueadas = [];
        setCategoriasFaunaDesbloqueadas(prev => {
            nuevasDesbloqueadas = prev.includes(categoriaId) ? prev : [...prev, categoriaId];
            localStorage.setItem('categoriasFaunaDesbloqueadas', JSON.stringify(nuevasDesbloqueadas));
            return nuevasDesbloqueadas;
        });
        setCategoriasFaunaActivas(prev => (prev.includes(categoriaId) ? prev : [...prev, categoriaId]));

        if (costo > 0) {
            setTotopos(nuevosTotopos);
            localStorage.setItem('totopos', nuevosTotopos);
        }

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            try {
                const payload = { categoriasFaunaDesbloqueadas: nuevasDesbloqueadas };
                if (costo > 0) payload.totopos = nuevosTotopos;
                await updateDoc(doc(db, 'usuarios', currentUser.uid), payload);
            } catch (err) {
                console.error("Error al sincronizar categoría desbloqueada:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "🔓 ¡Categoría desbloqueada!",
            message: costo > 0
                ? `Gastaste ${costo} totopos. Ya puedes practicar esta categoría.`
                : "¡La reclamaste gratis por tu Nivel de Cuenta!"
        });
    };

    const handleToggleCategoriaActiva = (categoriaId) => {
        setCategoriasFaunaActivas(prev => {
            const yaActiva = prev.includes(categoriaId);
            if (yaActiva) {
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== categoriaId);
            }
            return [...prev, categoriaId];
        });
    };

    const confirmarReiniciar = (e) => {
        if (e?.preventDefault) e.preventDefault();
        setVidas(3);
        setErroresParaVida(0);
        setAciertosNivel(0);
        setIsGameOver(false);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setShowConfirmRestartModal(false);
        localStorage.setItem('triviaVidas', 3);
        generarNuevaPregunta();
    };

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(collection(db, "ranking_trivia"), orderBy("level", "desc"), orderBy("errores", "asc"), limit(10));
            const querySnapshot = await getDocs(q);
            const docs = [];
            querySnapshot.forEach((docSnap) => docs.push({ id: docSnap.id, ...docSnap.data() }));
            setRanking(docs);
        } catch (error) {
            console.error("Error al cargar ranking:", error);
        }
        setCargandoRanking(false);
    };

    return (
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 flex flex-col items-center select-none w-full pb-[env(safe-area-inset-bottom)]">
            <header className="text-center mb-3">
                <h2 className="text-2xl sm:text-3xl font-black text-amber-950">⚡ Reto Trivia Diidxazá</h2>
                <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1 flex items-center justify-center gap-2 flex-wrap">
                    <span>Nivel {nivel}</span>
                    <span>•</span>
                    <span>Errores: {errores}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5" title={`Vidas: ${vidas}/3`}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <img 
                                key={i} 
                                src="/tuna-vida.png" 
                                alt="vida" 
                                className={`w-4 h-4 object-contain inline-block transition-opacity ${i < vidas ? 'opacity-100' : 'opacity-30 grayscale'}`} 
                                onError={(e)=>{e.target.style.display='none'}} 
                            />
                        ))}
                    </span>
                    <span>•</span>
                    <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                        <img src="/totopo.png" alt="Totopos" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                        {totopos} Totopos
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => setShowSelectorCategorias(true)}
                    className="mt-2 inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-full border-2 border-amber-300 shadow-sm transition-colors cursor-pointer"
                >
                    📚 Categorías
                    <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {categoriasFaunaActivas.length}
                    </span>
                </button>
            </header>

            {/* 🖥️ CONTENEDOR DE TRES COLUMNAS EN PC */}
            <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col lg:grid lg:grid-cols-[280px_1fr_300px] gap-6 items-center lg:items-start justify-center mt-1">
                
                {/* Columna Izquierda: Panel de Estado y Progreso del Nivel */}
                <div className="hidden lg:flex flex-col gap-3 w-full">
                    <h3 className="font-black text-amber-900 border-b-2 border-amber-200 pb-1.5 text-center lg:text-left text-sm sm:text-base">
                        📊 Estado del Nivel
                    </h3>
                    <div className="bg-white rounded-2xl p-4 shadow-md border border-amber-200 flex flex-col gap-3 w-full">
                        <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-b border-amber-100 pb-2">
                            <span>Nivel Actual:</span>
                            <span className="text-amber-700">{nivel}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-b border-amber-100 pb-2">
                            <span>Errores Totales:</span>
                            <span className="text-red-600">{errores}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-b border-amber-100 pb-2">
                            <span>Vidas:</span>
                            <span className="inline-flex items-center gap-1">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <img 
                                        key={i} 
                                        src="/tuna-vida.png" 
                                        alt="vida" 
                                        className={`w-4 h-4 object-contain inline-block ${i < vidas ? 'opacity-100' : 'opacity-30 grayscale'}`} 
                                        onError={(e)=>{e.target.style.display='none'}} 
                                    />
                                ))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-b border-amber-100 pb-2">
                            <span>Totopos:</span>
                            <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                                <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                                {totopos}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-xs font-bold text-amber-900">Progreso:</span>
                            <div className="w-full bg-amber-100/60 text-center py-2 px-3 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                                {aciertosNivel} / {PREGUNTAS_POR_NIVEL} aciertos
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Central: Zona de Juego de la Trivia */}
                <div className="w-full flex flex-col items-center">
                    {aciertosNivel === PREGUNTAS_POR_NIVEL ? (
                        <div className="w-full bg-amber-50 border-4 border-amber-600 rounded-3xl p-6 text-center animate-fade-in shadow-xl">
                            <h3 className="text-2xl font-black text-amber-950 mb-2">🎉 ¡Nivel Superado!</h3>
                            <p className="text-amber-800 mb-6 font-medium text-sm inline-flex items-center justify-center gap-1 flex-wrap">
                                Has superado las 5 preguntas y ganado +{TOTOPOS_POR_NIVEL} 
                                <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                                totopos.
                            </p>
                            <button type="button" onClick={siguienteNivel} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-2xl shadow-md text-sm transition-transform active:scale-95 cursor-pointer">
                                Siguiente Nivel ➡️
                            </button>
                        </div>
                    ) : (
                        preguntaActual && (
                            <div className="w-full flex flex-col items-center bg-white p-6 rounded-3xl shadow-xl border-2 border-amber-200">
                                {!modoDificil && (
                                    <div className="w-48 h-48 sm:w-56 sm:h-56 bg-orange-50 rounded-2xl overflow-hidden flex items-center justify-center border-4 border-amber-200 mb-4 shadow-inner">
                                        <img src={preguntaActual.image} alt={preguntaActual.spanish} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-md" onError={(e) => { e.target.src = "❓"; }} />
                                    </div>
                                )}
                                <h3 className="text-2xl sm:text-3xl font-black text-amber-950 uppercase tracking-wide mb-6 text-center">
                                    {preguntaActual.spanish}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                    {opciones.map((opcion) => {
                                        let estiloBoton = "bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 cursor-pointer";
                                        
                                        if (estadoRespuesta === 'correcta' && opcion.id === preguntaActual.id) {
                                            estiloBoton = "bg-emerald-600 border-emerald-700 text-white scale-105 shadow-lg";
                                        } else if (estadoRespuesta === 'incorrecta' && opcionSeleccionada === opcion.id) {
                                            estiloBoton = "bg-red-500 border-red-600 text-white scale-95 opacity-80";
                                        }

                                        return (
                                            <button
                                                key={opcion.id}
                                                type="button"
                                                onClick={() => manejarRespuesta(opcion)}
                                                disabled={estadoRespuesta !== null}
                                                className={`py-4 px-4 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-200 active:scale-95 shadow-sm ${estiloBoton}`}
                                            >
                                                {opcion.diidxaza}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Columna Derecha: Ranking Global con Guiechachi en PNG */}
                <div className="w-full flex flex-col gap-3">
                    <h3 className="font-black text-amber-900 border-b-2 border-amber-200 pb-1.5 text-center lg:text-left text-sm sm:text-base flex items-center justify-center lg:justify-start gap-1.5">
                        <img 
                            src="/guiechachi.png" 
                            alt="Guiechachi" 
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                            }}
                        />
                        <span style={{ display: 'none' }}>🏆</span>
                        Ranking Global
                    </h3>
                    <div className="bg-white rounded-2xl p-4 shadow-md border border-amber-200 w-full max-h-[440px] lg:max-h-none overflow-y-auto lg:overflow-y-visible custom-scrollbar">
                        {cargandoRanking ? (
                            <p className="text-center text-xs text-amber-700 py-3 font-medium">Cargando puntajes globales...</p>
                        ) : ranking.length === 0 ? (
                            <p className="text-center text-xs text-amber-700 py-3 font-medium">Aún no hay scores en la nube. ¡Sé el primero!</p>
                        ) : (
                            ranking.map((r, i) => (
                                <div key={r.id || i} className="flex justify-between items-center border-b py-2.5 text-xs sm:text-sm border-amber-100 last:border-0 hover:bg-amber-50 rounded-xl px-2 transition-colors">
                                    <span className="font-bold text-amber-950 flex items-center gap-2 truncate pr-2">
                                        <span className="text-orange-600 font-black">{i + 1}.</span> <span className="truncate">{r.name}</span> 
                                        <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">Nivel {r.level}</span>
                                    </span>
                                    <span className="font-bold text-red-700 flex-shrink-0">{r.errores} err.</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* 💔 MODAL DE GAME OVER (SIN VIDAS) */}
            {isGameOver && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-amber-600 w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
                        <div className="text-4xl mb-2">💔</div>
                        <h3 className="text-2xl font-black text-amber-950 mb-1">¡Sin Vidas!</h3>
                        <p className="text-xs text-amber-700 mb-5 font-medium">Te has quedado sin corazones. Puedes reiniciar este nivel o usar tus totopos para revivir.</p>
                        
                        <div className="flex flex-col gap-3 w-full">
                            {totopos >= COSTO_VIDAS && (
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const nuevosTotopos = totopos - COSTO_VIDAS;
                                        setTotopos(nuevosTotopos);
                                        setVidas(3);
                                        setIsGameOver(false);
                                        localStorage.setItem('totopos', nuevosTotopos);
                                        localStorage.setItem('triviaVidas', 3);
                                    }} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    ❤️ Comprar 3 Vidas ({COSTO_VIDAS} 
                                    <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                                    )
                                </button>
                            )}
                            <button 
                                type="button" 
                                onClick={confirmarReiniciar} 
                                className="w-full bg-amber-950 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs shadow-md cursor-pointer"
                            >
                                🔄 Reiniciar Nivel {nivel} (3 Vidas)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GUARDAR */}
            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={confirmarGuardadoGlobal} className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-amber-600 w-full max-w-sm flex flex-col items-center animate-fade-in relative">
                        <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white text-xl shadow-md border-2 border-white mb-3">
                            💾
                        </div>
                        <h3 className="text-xl font-black text-amber-950 mb-1">Guardar Récord</h3>
                        <p className="text-xs text-amber-700 text-center mb-4 font-medium">Ingresa tu nombre para el ranking global.</p>
                        <input 
                            type="text" 
                            placeholder="Escribe tu nombre" 
                            value={inputPlayerName} 
                            onChange={(e) => setInputPlayerName(e.target.value)} 
                            className="bg-white border-2 border-amber-300 p-3 rounded-xl w-full mb-5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-amber-950" 
                            autoFocus 
                        />
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowGuardarModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-3 rounded-2xl font-bold text-xs border border-amber-300 cursor-pointer">Cancelar</button>
                            <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md cursor-pointer">Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ⚠️ MODAL DE ADVERTENCIA PARA VOLVER AL MENÚ */}
            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-amber-600 w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
                        <div className="text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-black text-amber-950 mb-2">¿Volver al Menú Principal?</h3>
                        <p className="text-xs text-amber-700 mb-5 font-medium">Si sales ahora, asegúrate de haber guardado tu progreso. ¿Estás seguro?</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowMenuModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-3 rounded-2xl font-bold text-xs border border-amber-300 cursor-pointer">Cancelar</button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    guardarProgresoLocal(); // 💾 Guarda antes de salir al menú
                                    setShowMenuModal(false);
                                    if (onBack) onBack();
                                }} 
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs shadow-md cursor-pointer"
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REINICIAR */}
            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-amber-600 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white text-xl shadow-md border-2 border-white mb-3">
                            🔄
                        </div>
                        <h3 className="text-xl font-black text-amber-950 mb-1">¿Reiniciar Nivel {nivel}?</h3>
                        <p className="text-xs text-amber-700 mb-5 font-medium">Reiniciarás el Nivel {nivel} con 3 vidas restauradas. ¿Estás seguro?</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowConfirmRestartModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-3 rounded-2xl font-bold text-xs border border-amber-300 cursor-pointer">Cancelar</button>
                            <button type="button" onClick={confirmarReiniciar} className="flex-1 bg-amber-950 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs shadow-md cursor-pointer">Sí, reiniciar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FEEDBACK */}
            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-amber-600 w-full max-w-sm flex flex-col items-center text-center">
                        <h3 className="text-xl font-black text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-700 mb-5 font-medium">{feedbackModal.message}</p>
                        <button type="button" onClick={() => setFeedbackModal({ show: false, title: '', message: '' })} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md cursor-pointer">Aceptar</button>
                    </div>
                </div>
            )}
            {/* 📚 MODAL: SELECTOR DE CATEGORÍAS DESBLOQUEABLES (solo fauna en Trivia) */}
            {showSelectorCategorias && (
                <SelectorCategorias
                    tipo="fauna"
                    desbloqueadas={categoriasFaunaDesbloqueadas}
                    activas={categoriasFaunaActivas}
                    totopos={totopos}
                    nivelCuenta={nivelCuenta}
                    onToggleActiva={handleToggleCategoriaActiva}
                    onDesbloquear={handleDesbloquearCategoria}
                    onClose={() => setShowSelectorCategorias(false)}
                />
            )}
        </div>
    );
}