import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';
import Tarjeta from './Tarjeta';

// Configuración de los niveles del juego
const CONFIG_NIVELES = {
    1: { parejas: 4, columnas: 'grid-cols-4' },
    2: { parejas: 6, columnas: 'grid-cols-4 text-sm' },
    3: { parejas: 8, columnas: 'grid-cols-4' },
    4: { parejas: 12, columnas: 'grid-cols-4 sm:grid-cols-6' }
};

export default function Tablero() {
    const [level, setLevel] = useState(1);
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matches, setMatches] = useState(0);

    // Cantidad de parejas requeridas para el nivel actual
    const parejasRequeridas = CONFIG_NIVELES[level].parejas;

    const iniciarJuego = (nivelActual = level) => {
        // 1. Mezclamos TODA la base de datos completa y tomamos solo la cantidad necesaria para el nivel
        const animalesSeleccionados = [...listaAnimales]
            .sort(() => Math.random() - 0.5)
            .slice(0, CONFIG_NIVELES[nivelActual].parejas);

        // 2. Creamos tarjetas de imágenes
        const cartasImagenes = animalesSeleccionados.map(animal => ({
            id: `img-${animal.id}-${Math.random()}`, // ID único para React
            pairId: animal.id,
            type: 'image',
            content: animal.image,
            label: animal.spanish,
            isMatched: false
        }));

        // 3. Creamos tarjetas de palabras en diidxazá
        const cartasPalabras = animalesSeleccionados.map(animal => ({
            id: `word-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'word',
            content: animal.diidxaza,
            label: animal.spanish,
            isMatched: false
        }));

        // 4. Juntamos y mezclamos el mazo final del nivel
        const mazoMezclado = [...cartasImagenes, ...cartasPalabras]
            .sort(() => Math.random() - 0.5);

        setCards(mazoMezclado);
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(0);
        setMatches(0);
    };

    // Pasar al siguiente nivel
    const siguienteNivel = () => {
        if (level < 4) {
            const proximoNivel = level + 1;
            setLevel(proximoNivel);
            iniciarJuego(proximoNivel);
        } else {
            // Si termina el nivel 4, regresa al 1
            setLevel(1);
            iniciarJuego(1);
        }
    };

    const handleChoice = (card) => {
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);

            if (choiceOne.pairId === choiceTwo.pairId) {
                setCards(prevCards => {
                    return prevCards.map(card => {
                        if (card.pairId === choiceOne.pairId) {
                            return { ...card, isMatched: true };
                        } else {
                            return card;
                        }
                    });
                });
                setMatches(prev => prev + 1);
                resetTurn();
            } else {
                setTimeout(() => resetTurn(), 1000);
            }
        }
    }, [choiceOne, choiceTwo]);

    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(prevTurns => prevTurns + 1);
        setDisabled(false);
    };

    useEffect(() => {
        iniciarJuego();
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
            <header className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight">
                    Bidxaga saa
                </h1>
                <p className="text-sm text-gray-600 mt-1">Encuentros en diidxazá</p>
            </header>

            {/* Barra informativa de Nivel, Turnos y Aciertos */}
            <div className="flex flex-wrap gap-2 justify-between items-center w-full max-w-2xl bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200 shadow-sm text-sm">
                <div className="bg-amber-800 text-white font-bold px-3 py-1 rounded-full">
                    Nivel {level}
                </div>
                <div className="text-amber-950 font-medium">
                    Turnos: <span className="font-bold text-red-600">{turns}</span>
                </div>
                <div className="text-amber-950 font-medium">
                    Aciertos: <span className="font-bold text-green-600">{matches} / {parejasRequeridas}</span>
                </div>
                <button
                    onClick={() => iniciarJuego(level)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1 px-3 rounded-lg transition-colors shadow-sm"
                >
                    Reiniciar Nivel
                </button>
            </div>

            {/* Ventana de éxito al completar el nivel */}
            {matches === parejasRequeridas && (
                <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 text-green-900 rounded-xl p-4 mb-4 text-center shadow-md animate-fade-in">
                    <p className="text-xl font-bold mb-2">¡Sicarú! 🎉 Nivel {level} Completado</p>
                    <button
                        onClick={siguienteNivel}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow transform hover:scale-105"
                    >
                        {level < 4 ? 'Jugar Siguiente Nivel ➡️' : '¡Volver a empezar desde el Nivel 1! 🔄'}
                    </button>
                </div>
            )}

            {/* Rejilla adaptativa según las columnas del nivel configurado */}
            <div className={`grid ${CONFIG_NIVELES[level].columnas} gap-3 w-full max-w-2xl`}>
                {cards.map(card => (
                    <Tarjeta
                        key={card.id}
                        card={card}
                        handleChoice={handleChoice}
                        flipped={card === choiceOne || card === choiceTwo || card.isMatched}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
}