import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales';
import Tarjeta from './Tarjeta';

export default function Tablero() {
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matches, setMatches] = useState(0);

    // Función para inicializar y mezclar el juego
    const iniciarJuego = () => {
        // 1. Creamos las tarjetas de imágenes
        const cartasImagenes = listaAnimales.map(animal => ({
            id: `img-${animal.id}`,
            pairId: animal.id,
            type: 'image',
            content: animal.image,
            label: animal.spanish,
            isMatched: false
        }));

        // 2. Creamos las tarjetas de palabras en diidxazá
        const cartasPalabras = listaAnimales.map(animal => ({
            id: `word-${animal.id}`,
            pairId: animal.id,
            type: 'word',
            content: animal.diidxaza,
            label: animal.spanish,
            isMatched: false
        }));

        // 3. Juntamos ambos mazos y los mezclamos al azar
        const mazoMezclado = [...cartasImagenes, ...cartasPalabras]
            .sort(() => Math.random() - 0.5);

        setCards(mazoMezclado);
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(0);
        setMatches(0);
    };

    // Manejar la elección del usuario
    const handleChoice = (card) => {
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    // Comparar las dos tarjetas seleccionadas
    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);

            // Si los pairId coinciden, ¡encontró el par!
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
                // Si no coinciden, esperamos 1 segundo y las volteamos de regreso
                setTimeout(() => resetTurn(), 1000);
            }
        }
    }, [choiceOne, choiceTwo]);

    // Resetear elecciones e incrementar turno
    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(prevTurns => prevTurns + 1);
        setDisabled(false);
    };

    // Iniciar automáticamente al cargar la página
    useEffect(() => {
        iniciarJuego();
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
            <header className="text-center mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight">
                    Memorama Diidxazá
                </h1>
                <p className="text-sm text-gray-600 mt-1">Aprende los animales del Istmo de Tehuantepec</p>
            </header>

            {/* Marcador e indicadores */}
            <div className="flex justify-between items-center w-full max-w-md bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200 shadow-sm">
                <div className="text-amber-950 font-medium">
                    Turnos: <span className="font-bold text-lg text-red-600">{turns}</span>
                </div>
                <div className="text-amber-950 font-medium">
                    Aciertos: <span className="font-bold text-lg text-green-600">{matches} / {listaAnimales.length}</span>
                </div>
                <button
                    onClick={iniciarJuego}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-md"
                >
                    Reiniciar
                </button>
            </div>

            {/* Mensaje de Victoria */}
            {matches === listaAnimales.length && (
                <div className="bg-green-100 border-2 border-green-500 text-green-900 font-bold px-6 py-3 rounded-xl mb-6 animate-bounce text-center">
                    ¡Sicarú! ¡Completaste el juego con éxito! 🎉
                </div>
            )}

            {/* Rejilla de cartas (Grid responsivo) */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4 w-full max-w-2xl">
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