import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';

import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function Trivia({ onBack }) {
    // Estados principales del juego
    const [nivel, setNivel] = useState(1);
    const [errores, setErrores] = useState(0);
    const [aciertosNivel, setAciertosNivel] = useState(0);
    const [modoDificil, setModoDificil] = useState(false);
    
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

    // Estados para las Modales Personalizadas
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    const PREGUNTAS_POR_NIVEL = 5;

    // Cargar datos locales al iniciar
    useEffect(() => {
        const nivelGuardado = localStorage.getItem('triviaNivel');
        const erroresGuardados = localStorage.getItem('triviaErrores');
        const modoDificilGuardado = localStorage.getItem('triviaModoDificil');
        const nombreGuardado = localStorage.getItem('triviaPlayerName');
        
        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (erroresGuardados) setErrores(parseInt(erroresGuardados, 10));
        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        if (nombreGuardado) {
            setPlayerName(nombreGuardado);
            setInputPlayerName(nombreGuardado);
        }
        
        cargarRankingGlobal();
    }, []);

    // Generar pregunta cuando cambia el nivel o los aciertos (si no hemos terminado el nivel)
    useEffect(() => {
        if (aciertosNivel < PREGUNTAS_POR_NIVEL) {
            generarNuevaPregunta();
        } else {
            setPendingGlobalScore({ level: nivel, errores: errores });
        }
    }, [nivel, aciertosNivel]);

    const generarNuevaPregunta = () => {
        setEstadoRespuesta(null);
        setOpcionSeleccionada(null);

        // Elegir un animal al azar como respuesta correcta
        const animalCorrecto = listaAnimales[Math.floor(Math.random() * listaAnimales.length)];
        
        // Obtener 3 distractores aleatorios que no sean la respuesta correcta
        const distractores = [...listaAnimales]
            .filter(a => a.id !== animalCorrecto.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Combinar y mezclar opciones
        const opcionesMezcladas = [animalCorrecto, ...distractores]
            .sort(() => Math.random() - 0.5);

        setPreguntaActual(animalCorrecto);
        setOpciones(opcionesMezcladas);
    };

    const manejarRespuesta = (opcionElegida) => {
        if (estadoRespuesta !== null) return; // Evitar multiples clicks

        setOpcionSeleccionada(opcionElegida.id);

        if (opcionElegida.id === preguntaActual.id) {
            setEstadoRespuesta('correcta');
            setTimeout(() => {
                setAciertosNivel(prev => prev + 1);
            }, 1000);
        } else {
            setEstadoRespuesta('incorrecta');
            setErrores(prev => prev + 1);
            setTimeout(() => {
                setEstadoRespuesta(null);
                setOpcionSeleccionada(null);
            }, 1200); // Dar tiempo para ver el error y volver a intentar
        }
    };

    const siguienteNivel = () => {
        const proximoNivel = nivel + 1;
        setNivel(proximoNivel);
        setAciertosNivel(0);
        localStorage.setItem('triviaNivel', proximoNivel);
        localStorage.setItem('triviaErrores', errores);
        setGuardadoEnNivel(false);
    };

    // --- FUNCIONES DE GUARDADO Y MODALES (Reutilizadas de SopaLetras) ---
    const handleClickGuardar = () => {
        localStorage.setItem('triviaNivel', nivel);
        localStorage.setItem('triviaErrores', errores);
        localStorage.setItem('triviaModoDificil', modoDificil);

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Récord ya guardado",
                message: `Ya guardaste tu récord global para el Nivel ${nivel}. Avanza al siguiente nivel para volver a registrar tu puntaje.`
            });
            return;
        }

        setInputPlayerName(playerName);
        setShowGuardarModal(true);
    };

    const confirmarGuardadoGlobal = async () => {
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
                show: true, title: "⚠️ Error", message: "Progreso guardado localmente, error al conectar con Firebase."
            });
        }
    };

    const confirmarReiniciar = () => {
        localStorage.removeItem('triviaNivel');
        localStorage.removeItem('triviaErrores');
        localStorage.removeItem('triviaModoDificil');
        setNivel(1);
        setErrores(0);
        setAciertosNivel(0);
        setModoDificil(false);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setShowConfirmRestartModal(false);
        generarNuevaPregunta();
    };

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            // Ordena por Nivel más alto, luego por Menos errores
            const q = query(collection(db, "ranking_trivia"), orderBy("level", "desc"), orderBy("errores", "asc"), limit(10));
            const querySnapshot = await getDocs(q);
            const docs = [];
            querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
            setRanking(docs);
        } catch (error) {
            console.error("Error al cargar ranking:", error);
        }
        setCargandoRanking(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center select-none pb-[env(safe-area-inset-bottom)]">
            <header className="text-center mb-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-950">⚡ Reto Trivia</h2>
                <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1">Nivel {nivel} • Errores: {errores}</p>
            </header>

            {/* BARRA DE CONTROL */}
            <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-3 shadow-sm text-sm gap-2">
                <div className="text-amber-950 font-semibold text-xs sm:text-sm">
                    <span className="text-amber-800 font-bold">Progreso:</span> {aciertosNivel} / {PREGUNTAS_POR_NIVEL}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    {onBack && (
                        <button onClick={() => setShowMenuModal(true)} className="bg-amber-800 hover:bg-amber-900 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">
                            Menú
                        </button>
                    )}
                    <button onClick={handleClickGuardar} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Guardar</button>
                    <button onClick={() => setShowConfirmRestartModal(true)} className="bg-amber-950 hover:bg-black text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Reiniciar</button>
                    <button 
                        onClick={() => {
                            const nuevoModo = !modoDificil;
                            setModoDificil(nuevoModo);
                            localStorage.setItem('triviaModoDificil', nuevoModo);
                        }} 
                        className={`font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors ${modoDificil ? 'bg-red-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700 underline border border-red-300'}`}
                    >
                        {modoDificil ? 'Sin Imágenes' : 'Con Imágenes'}
                    </button>
                </div>
            </div>

            {/* ZONA DE JUEGO */}
            <div className="w-full max-w-lg mt-4 flex flex-col items-center">
                {aciertosNivel === PREGUNTAS_POR_NIVEL ? (
                    <div className="w-full bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center animate-bounce mt-4 shadow-lg">
                        <h3 className="text-2xl font-bold text-green-900 mb-2">🎉 ¡Nivel Completado!</h3>
                        <p className="text-green-800 mb-4 font-medium">Has superado las 5 preguntas.</p>
                        <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-md text-lg transition-transform active:scale-95">
                            Siguiente Nivel ➡️
                        </button>
                    </div>
                ) : (
                    preguntaActual && (
                        <div className="w-full flex flex-col items-center bg-white p-6 rounded-3xl shadow-xl border-2 border-amber-100">
                            
                            {/* Tarjeta de la Pregunta */}
                            {!modoDificil && (
                                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-orange-50 rounded-2xl overflow-hidden flex items-center justify-center border-4 border-amber-200 mb-4 shadow-inner">
                                    <img src={preguntaActual.image} alt={preguntaActual.spanish} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-md" onError={(e) => { e.target.src = "❓"; }} />
                                </div>
                            )}
                            <h3 className="text-2xl sm:text-3xl font-bold text-amber-950 uppercase tracking-wide mb-6">
                                {preguntaActual.spanish}
                            </h3>

                            {/* Opciones */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                {opciones.map((opcion) => {
                                    let estiloBoton = "bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-950";
                                    
                                    if (estadoRespuesta && opcion.id === preguntaActual.id) {
                                        estiloBoton = "bg-green-500 border-green-600 text-white scale-105 shadow-lg"; // La correcta siempre se ilumina
                                    } else if (estadoRespuesta === 'incorrecta' && opcionSeleccionada === opcion.id) {
                                        estiloBoton = "bg-red-500 border-red-600 text-white scale-95 opacity-80"; // La equivocada se marca en rojo
                                    }

                                    return (
                                        <button
                                            key={opcion.id}
                                            onClick={() => manejarRespuesta(opcion)}
                                            disabled={estadoRespuesta !== null}
                                            className={`py-4 px-4 rounded-xl font-bold text-lg sm:text-xl transition-all duration-200 active:scale-95 ${estiloBoton}`}
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

            {/* TABLA DE RANKING GLOBAL */}
            <div className="mt-12 w-full max-w-md">
                <h3 className="font-bold text-amber-900 text-center mb-3 text-xl">🏆 Ranking - Trivia</h3>
                <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                    {cargandoRanking ? (
                        <p className="text-center text-sm text-gray-500 py-2">Cargando puntajes globales...</p>
                    ) : ranking.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-2">Aún no hay scores en la nube. ¡Sé el primero!</p>
                    ) : (
                        ranking.map((r, i) => (
                            <div key={r.id || i} className="flex justify-between items-center border-b py-2 text-sm border-gray-100 last:border-0 hover:bg-amber-50 rounded px-2 transition-colors">
                                <span className="font-medium text-amber-950">
                                    <span className="text-orange-500 font-bold mr-2">{i + 1}.</span> {r.name} 
                                    <span className="text-xs text-amber-700 font-bold ml-2">(Nivel {r.level})</span>
                                </span>
                                <span className="font-bold text-red-700">{r.errores} errores</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODALES (Idénticas a SopaLetras) */}
            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">💾 Guardar Récord</h3>
                        <p className="text-xs text-amber-800 text-center mb-4">Ingresa tu nombre para el ranking global.</p>
                        <input type="text" placeholder="Escribe tu nombre" value={inputPlayerName} onChange={(e) => setInputPlayerName(e.target.value)} className="border-2 border-amber-300 p-3 rounded-lg w-full mb-5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium" autoFocus />
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowGuardarModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300">Cancelar</button>
                            <button onClick={confirmarGuardadoGlobal} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menú?</h3>
                        <p className="text-xs text-amber-800 mb-5">Guarda tu progreso antes de salir.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowMenuModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300">Cancelar</button>
                            <button onClick={() => { setShowMenuModal(false); if (onBack) onBack(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md">Sí, salir</button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="text-3xl mb-2">🔄</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Reiniciar?</h3>
                        <p className="text-xs text-amber-800 mb-5">Volverás al Nivel 1. ¿Estás seguro?</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowConfirmRestartModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300">Cancelar</button>
                            <button onClick={confirmarReiniciar} className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md">Sí, reiniciar</button>
                        </div>
                    </div>
                </div>
            )}

            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>
                        <button onClick={() => setFeedbackModal({ show: false, title: '', message: '' })} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md">Aceptar</button>
                    </div>
                </div>
            )}
        </div>
    );
}