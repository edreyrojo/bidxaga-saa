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

export default function Tablero() {
    const [level, setLevel] = useState(1);
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matches, setMatches] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [ranking, setRanking] = useState([]);
    const [playerName, setPlayerName] = useState('');

    // Estado para mostrar si estamos cargando los datos de la nube
    const [cargandoRanking, setCargandoRanking] = useState(false);

    const configActual = getConfigForLevel(level);
    const parejasRequeridas = configActual.parejas;

    // 2. FUNCIÓN PARA LEER DESDE LA NUBE (GLOBAL) - OPTIMIZADA CON FILTRO DOBLE
    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            // CORREGIDO: Ordena primero por nivel descendente (mayor nivel primero)
            // y luego por score/turnos ascendente (menos turnos desempata a favor)
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
        // Buscamos si la persona se quedó en un nivel superior (como el Nivel 26 de tu mamá)
        const nivelGuardado = localStorage.getItem('memoramaNivel');
        const nivelInicial = nivelGuardado ? parseInt(nivelGuardado, 10) : 1;
        
        setLevel(nivelInicial);
        iniciarJuego(nivelInicial);
    }, []);

    // Función para que el usuario asegure su partida localmente
    const guardarProgresoLocal = () => {
        localStorage.setItem('memoramaNivel', level);
        alert(`¡Partida guardada localmente! Podrás cerrar y volver al Nivel ${level} cuando quieras.`);
    };

    // Función para resetear el avance local y empezar de cero voluntariamente
    const reiniciarProgresoLocal = () => {
        if (window.confirm("¿Estás seguro de que deseas reiniciar tu progreso local y volver al Nivel 1?")) {
            localStorage.removeItem('memoramaNivel');
            setLevel(1);
            iniciarJuego(1);
        }
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
            content: animal.diidxaza,
            label: animal.spanish,
            isMatched: false
        }));

        const mazoMezclado = [...cartasImagenes, ...cartasPalabras].sort(() => Math.random() - 0.5);

        setCards(mazoMezclado);
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(0);
        setMatches(0);
        setIsGameOver(false);
    };

    const siguienteNivel = () => {
        const proximoNivel = level + 1;
        setLevel(proximoNivel);
        iniciarJuego(proximoNivel);
        // Respaldo automático silencioso cada vez que avanza de nivel
        localStorage.setItem('memoramaNivel', proximoNivel);
    };

    const finalizarPartida = () => {
        setIsGameOver(true);
    };

    // 4. GUARDAR PUNTAJE EN LA NUBE (GLOBAL) Y LIMPIAR SESIÓN LOCAL
    const guardarPuntaje = async () => {
        if (!playerName.trim()) return;

        try {
            await addDoc(collection(db, "ranking"), {
                name: playerName,
                score: turns,
                level: level,
                fecha: new Date().toISOString()
            });

            await cargarRankingGlobal();
        } catch (error) {
            console.error("Error al guardar el puntaje en Firebase:", error);
        }

        // Como ya subió su récord al mundo, limpiamos su memoria local para su próxima gran partida
        localStorage.removeItem('memoramaNivel');
        setIsGameOver(false);
        setLevel(1);
        iniciarJuego(1);
        setPlayerName('');
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
            
            
            {/* Pantalla de Guardar Score */}
            {isGameOver ? (
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-amber-200 text-center">
                    <h2 className="text-2xl font-bold mb-4">¡Partida Finalizada!</h2>
                    <p className="mb-4">Lograste llegar al nivel {level} con un total de <span className="font-bold text-red-600">{turns}</span> turnos.</p>
                    <input
                        type="text"
                        placeholder="Tu nombre"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="border p-2 rounded w-full mb-4"
                    />
                    <button onClick={guardarPuntaje} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700">Guardar en Ranking Global</button>
                </div>
            ) : (
                <>
                    <header className="text-center mb-4">
                        <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-2 max-w-full h-auto" />
                        <p className="text-sm text-gray-600">Nivel {level} • Turnos: {turns}</p>
                    </header>
                    {/* BARRA DE CONTROL DE SESIÓN LOCAL */}
            <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 shadow-sm text-sm">
                <div className="text-amber-950 font-semibold">
                    <span className="text-amber-800 font-bold">Último nivel:</span> {level}
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                    <button 
                        onClick={guardarProgresoLocal} 
                        className="bg-orange-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors shadow-sm"
                    >
                        Guardar
                    </button>
                    <button 
                        onClick={reiniciarProgresoLocal} 
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors shadow-sm"
                    >
                        Reiniciar
                    </button>
                </div>
            </div>


                    {matches === parejasRequeridas && (
                        <div className="bg-green-50 border border-green-500 rounded-xl p-4 mb-4 text-center">
                            <p className="text-lg font-bold mb-2">¡Nivel {level} completado!</p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={siguienteNivel} className="bg-green-600 text-white py-2 px-4 rounded-lg">Siguiente Nivel</button>
                                <button onClick={finalizarPartida} className="bg-amber-600 text-white py-2 px-4 rounded-lg">Terminar y Guardar</button>
                            </div>
                        </div>
                    )}

                    <div className={`grid ${configActual.columnas} gap-3 w-full max-w-2xl`}>
                        {cards.map(card => (
                            <Tarjeta key={card.id} card={card} handleChoice={handleChoice} flipped={card === choiceOne || card === choiceTwo || card.isMatched} disabled={disabled} />
                        ))}
                    </div>
                </>
            )}

            {/* Tabla de Ranking Global */}
            <div className="mt-8 w-full max-w-md">
                <h3 className="font-bold text-center mb-2">Tabla de Posiciones</h3>
                <div className="bg-gray-100 rounded-lg p-4 shadow-inner">
                    {cargandoRanking ? (
                        <p className="text-center text-sm text-gray-500 py-2">Cargando puntajes globales...</p>
                    ) : ranking.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-2">Aún no hay scores en la nube. ¡Sé el primero!</p>
                    ) : (
                        ranking.map((r, i) => (
                            <div key={r.id || i} className="flex justify-between border-b py-1 text-sm border-gray-200 last:border-0">
                                <span className="font-medium text-amber-950">
                                    {i + 1}. {r.name} <span className="text-xs text-amber-700 font-bold">(Nivel {r.level})</span>
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