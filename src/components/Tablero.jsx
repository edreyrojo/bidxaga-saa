import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';
import Tarjeta from './Tarjeta';

const CONFIG_NIVELES = {
    1: { parejas: 4, columnas: 'grid-cols-4' },
    2: { parejas: 6, columnas: 'grid-cols-4 text-sm' },
    3: { parejas: 8, columnas: 'grid-cols-4' },
    4: { parejas: 12, columnas: 'grid-cols-4 sm:grid-cols-6' }
};

// Función auxiliar para obtener configuración (Niveles > 4 usan la del nivel 4)
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

    const configActual = getConfigForLevel(level);
    const parejasRequeridas = configActual.parejas;

    // Cargar ranking al iniciar
    useEffect(() => {
        const savedRanking = JSON.parse(localStorage.getItem('rankingMemorama') || '[]');
        setRanking(savedRanking);
        iniciarJuego(1);
    }, []);

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
        setLevel(prev => prev + 1);
        iniciarJuego(level + 1);
    };

    const finalizarPartida = () => {
        setIsGameOver(true);
    };

    const guardarPuntaje = () => {
        if (!playerName.trim()) return;
        const nuevoRanking = [...ranking, { name: playerName, score: turns, level: level }].sort((a, b) => a.score - b.score).slice(0, 5);
        setRanking(nuevoRanking);
        localStorage.setItem('rankingMemorama', JSON.stringify(nuevoRanking));
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
                    <button onClick={guardarPuntaje} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700">Guardar y Reiniciar</button>
                </div>
            ) : (
                <>
                    <header className="text-center mb-4">
                        <h1 className="text-3xl font-extrabold text-amber-900">Bidxaga saa</h1>
                        <p className="text-sm text-gray-600">Nivel {level} • Turnos: {turns}</p>
                    </header>

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

            {/* Tabla de Ranking */}
            <div className="mt-8 w-full max-w-md">
                <h3 className="font-bold text-center mb-2">Mejores Jugadores</h3>
                <div className="bg-gray-100 rounded-lg p-4">
                    {ranking.length === 0 ? <p className="text-center text-sm">Aún no hay scores.</p> :
                        ranking.map((r, i) => (
                            <div key={i} className="flex justify-between border-b py-1 text-sm">
                                <span>{i + 1}. {r.name} (Nivel {r.level})</span>
                                <span className="font-bold">{r.score} turnos</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}