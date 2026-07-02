import React from 'react';

export default function Tarjeta({ card, handleChoice, flipped, disabled }) {

    const handleClick = () => {
        if (!disabled && !flipped && !card.isMatched) {
            handleChoice(card);
        }
    };

    return (
        <div className="relative aspect-square cursor-pointer perspective" onClick={handleClick}>
            <div className={`w-full h-full duration-500 transform-style preserve-3d relative ${flipped ? 'rotate-y-180' : ''}`}>

                {/* PARTE FRONTAL DE LA TARJETA (Cuando se voltea) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white border-4 border-amber-500 rounded-2xl flex flex-col items-center justify-center p-2 shadow-md">
                    {card.type === 'image' ? (
                        <img
                            src={card.content}
                            alt={card.label}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                                // Esto evita que se rompa la app si aún no pones tu dibujo
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                    ) : null}

                    {/* Si es tipo palabra, o si la imagen no se encuentra aún, muestra el texto */}
                    <div className={card.type === 'image' ? 'hidden text-center text-xs text-gray-400 mt-1' : 'text-center'}>
                        <p className="text-xl font-bold text-amber-900">{card.type === 'word' ? card.content : card.label}</p>
                        {card.type === 'word' && <p className="text-xs text-gray-500 italic">({card.label})</p>}
                    </div>
                </div>

                {/* PARTE TRASERA DE LA TARJETA (Oculta) */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-red-600 to-amber-500 border-4 border-white rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105">
                    <span className="text-white font-black text-2xl tracking-wider select-none">?</span>
                </div>

            </div>
        </div>
    );
}