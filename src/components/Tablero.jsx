import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';
import Tarjeta from './Tarjeta';

// 1. IMPORTAMOS LA CONFIGURACIÓN Y FUNCIONES DE FIREBASE
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const CONFIG_NIVELES = {
    1: { parejas: 4, columnas: 'grid-cols-4' },
    2: { parejas: 6, columnas: 'grid-cols-4 text-sm' },
    3: { parejas: 8, columnas: 'grid-cols-4' },
    4: { parejas: 12, columnas: 'grid-cols-4 sm:grid-cols-6' }
};

const getConfigForLevel = (lvl) => {
    return CONFIG_NIVELES[lvl] || { parejas: 12, columnas: 'grid-cols-4 sm:grid-cols-6' };
};

export default function Tablero({ onBack }) {
    const [level, setLevel] = useState(1);
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matches, setMatches] = useState(0);
    const [ranking, setRanking] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [modoDificil, setModoDificil] = useState(false);
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    
    // Memoria temporal para guardar el récord del nivel anterior completado
    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);

    // Estado para mostrar si estamos cargando los datos de la nube
    const [cargandoRanking, setCargandoRanking] = useState(false);

    // Estados para las Modales Personalizadas
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    const configActual = getConfigForLevel(level);
    const parejasRequeridas = configActual.parejas;

    // 2. FUNCIÓN PARA LEER DESDE LA NUBE (GLOBAL)
    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(
                collection(db, "ranking"), 
                orderBy("level", "desc"), 
                orderBy("score", "asc"), 
                limit(10)
            );
            const querySnapshot = await getDocs(q);

            const datosRanking = [];
            querySnapshot.forEach((doc) => {
                datosRanking.push({ id: doc.id, ...doc.data() });
            });

            setRanking(datosRanking);
        } catch (error) {
            console.error("Error al cargar el ranking desde Firebase:", error);
        } finally {
            setCargandoRanking(false);
        }
    };

    // 3. CARGA INICIAL DESDE FIREBASE Y RESCATE DE PROGRESO LOCAL
    useEffect(() => {
        cargarRankingGlobal();
        const nivelGuardado = localStorage.getItem('memoramaNivel');
        const modoDificilGuardado = localStorage.getItem('memoramaModoDificil');
        const nombreGuardado = localStorage.getItem('memoramaPlayerName');
        const nivelInicial = nivelGuardado ? parseInt(nivelGuardado, 10) : 1;
        
        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        if (nombreGuardado) {
            setPlayerName(nombreGuardado);
            setInputPlayerName(nombreGuardado);
        }
        setLevel(nivelInicial);
    }, []);

    useEffect(() => {
        iniciarJuego(level);
    }, [level, modoDificil]);

    // Detectar automáticamente cuando se completa un nivel para congelar su puntaje
    useEffect(() => {
        if (matches === parejasRequeridas && parejasRequeridas > 0) {
            setPendingGlobalScore({ level: level, turns: turns });
        }
    }, [matches, parejasRequeridas, level, turns]);

    // Al hacer click en Guardar: Abrir modal personalizada
    const handleClickGuardar = () => {
        localStorage.setItem('memoramaNivel', level);
        localStorage.setItem('memoramaModoDificil', modoDificil);

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Récord ya guardado",
                message: "Ya guardaste tu récord global. Avanza o completa un nivel para volver a registrar tu puntaje."
            });
            return;
        }

        setInputPlayerName(playerName);
        setShowGuardarModal(true);
    };

    // Ejecutar guardado real desde la modal personalizada
    const confirmarGuardadoGlobal = async () => {
        const nombreLimpio = inputPlayerName.trim();
        if (!nombreLimpio) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Nombre requerido",
                message: "Por favor escribe un nombre válido para registrarte en el ranking."
            });
            return;
        }

        setPlayerName(nombreLimpio);
        localStorage.setItem('memoramaPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore || { level: level, turns: turns };

        try {
            await addDoc(collection(db, "ranking"), {
                name: nombreLimpio,
                score: scoreToSave.turns,
                level: scoreToSave.level,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "🎉 ¡Guardado Exitoso!",
                message: `¡Partida guardada localmente (Nivel ${level}) y récord global registrado para el Nivel ${scoreToSave.level} con ${scoreToSave.turns} turnos!`
            });
        } catch (error) {
            console.error("Error al guardar el puntaje en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "⚠️ Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    const confirmarReiniciar = () => {
        localStorage.removeItem('memoramaNivel');
        localStorage.removeItem('memoramaModoDificil');
        localStorage.removeItem('memoramaPlayerName');
        setLevel(1);
        setModoDificil(false);
        setPlayerName('');
        setInputPlayerName('');
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setShowConfirmRestartModal(false);
        iniciarJuego(1);
    };

    const iniciarJuego = (nivelActual) => {
        const animalesSeleccionados = [...listaAnimales]
            .sort(() => Math.random() - 0.5)
            .slice(0, getConfigForLevel(nivelActual).parejas);

        const cartasImagenes = animalesSeleccionados.map(animal => ({
            id: `img-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'image',
            content: animal.image,
            label: animal.spanish,
            isMatched: false
        }));

        const cartasPalabras = animalesSeleccionados.map(animal => ({
            id: `word-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'word',
            content: modoDificil ? animal.spanish : animal.diidxaza,
            label: animal.spanish,
            isMatched: false
        }));

        const mazoMezclado = [...cartasImagenes, ...cartasPalabras].sort(() => Math.random() - 0.5);

        setCards(mazoMezclado);
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(0);
        setMatches(0);
        setGuardadoEnNivel(false);
    };

    const siguienteNivel = () => {
        const proximoNivel = level + 1;
        setLevel(proximoNivel);
        localStorage.setItem('memoramaNivel', proximoNivel);
        setGuardadoEnNivel(false);
    };

    const handleChoice = (card) => {
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(prevTurns => prevTurns + 1);
        setDisabled(false);
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);
            if (choiceOne.pairId === choiceTwo.pairId) {
                setCards(prevCards => prevCards.map(card => card.pairId === choiceOne.pairId ? { ...card, isMatched: true } : card));
                setMatches(prev => prev + 1);
                resetTurn();
            } else {
                setTimeout(() => resetTurn(), 1000);
            }
        }
    }, [choiceOne, choiceTwo]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center select-none pb-[env(safe-area-inset-bottom)]">
            
            <header className="text-center mb-3">
                <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-2 max-w-full h-auto" />
                <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1">Nivel {level} • Turnos: {turns}</p>
            </header>

            {/* BARRA DE CONTROL LOCAL Y GLOBAL UNIFICADA */}
            <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-3 shadow-sm text-sm gap-2">
                <div className="text-amber-950 font-semibold text-xs sm:text-sm">
                    <span className="text-amber-800 font-bold">Nivel:</span> {level}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    {onBack && (
                        <button 
                            onClick={() => setShowMenuModal(true)} 
                            className="bg-amber-800 hover:bg-amber-900 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors"
                        >
                            Menú
                        </button>
                    )}
                    <button onClick={handleClickGuardar} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Guardar</button>
                    <button onClick={() => setShowConfirmRestartModal(true)} className="bg-amber-950 hover:bg-black text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Reiniciar</button>
                    <button 
                        onClick={() => {
                            const nuevoModo = !modoDificil;
                            setModoDificil(nuevoModo);
                            localStorage.setItem('memoramaModoDificil', nuevoModo);
                        }} 
                        className={`font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors ${modoDificil ? 'bg-green-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700 underline border border-red-300'}`}
                    >
                        {modoDificil ? 'Difícil ON' : 'Difícil OFF'}
                    </button>
                </div>
            </div>

            {matches === parejasRequeridas && (
                <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3 text-center animate-bounce">
                    <p className="text-lg sm:text-xl font-bold text-green-900 mb-2">🎉 ¡Nivel {level} completado!</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm">Siguiente Nivel</button>
                    </div>
                </div>
            )}

            <div className={`grid ${configActual.columnas} gap-3 w-full max-w-2xl mt-2`}>
                {cards.map(card => (
                    <Tarjeta key={card.id} card={card} handleChoice={handleChoice} flipped={card === choiceOne || card === choiceTwo || card.isMatched} disabled={disabled} />
                ))}
            </div>

            {/* MODAL PERSONALIZADA PARA GUARDAR PROGRESO */}
            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">💾 Guardar Récord</h3>
                        <p className="text-xs text-amber-800 text-center mb-4">Ingresa tu nombre para guardar tu puntaje en el ranking global.</p>
                        
                        <input 
                            type="text" 
                            placeholder="Escribe tu nombre" 
                            value={inputPlayerName} 
                            onChange={(e) => setInputPlayerName(e.target.value)} 
                            className="border-2 border-amber-300 p-3 rounded-lg w-full mb-5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium" 
                            autoFocus
                        />
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setShowGuardarModal(false)} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmarGuardadoGlobal} 
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA VOLVER AL MENÚ */}
            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menú Principal?</h3>
                        <p className="text-xs text-amber-800 mb-5">Asegúrate de haber guardado tu progreso antes de salir para evitar perder tus avances.</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setShowMenuModal(false)} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => { setShowMenuModal(false); if (onBack) onBack(); }} 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA REINICIAR */}
            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">🔄</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Reiniciar Progreso?</h3>
                        <p className="text-xs text-amber-800 mb-5">Se borrará tu nivel actual y volverás al Nivel 1. ¿Estás seguro?</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setShowConfirmRestartModal(false)} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmarReiniciar} 
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
                            >
                                Sí, reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE MENSAJES / FEEDBACK GENERAL (REEMPLAZO DE ALERT) */}
            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>
                        
                        <button 
                            onClick={() => setFeedbackModal({ show: false, title: '', message: '' })} 
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla de Ranking Global */}
            <div className="mt-12 w-full max-w-md">
                <h3 className="font-bold text-amber-900 text-center mb-3 text-xl">🏆 Ranking - Memorama</h3>
                <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                    {cargandoRanking ? (
                        <p className="text-center text-sm text-gray-500 py-2">Cargando puntajes globales...</p>
                    ) : ranking.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-2">Aún no hay scores en la nube. ¡Sé el primero!</p>
                    ) : (
                        ranking.map((r, i) => (
                            <div key={r.id || i} className="flex justify-between items-center border-b py-2 text-sm border-gray-100 last:border-0 hover:bg-amber-50 rounded px-2 transition-colors">
                                <span className="font-medium text-amber-950">
                                    <span className="text-orange-500 font-bold mr-2">{i + 1}.</span> {r.name} <span className="text-xs text-amber-700 font-bold ml-2">(Nivel {r.level})</span>
                                </span>
                                <span className="font-bold text-amber-900">{r.score} turnos</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}