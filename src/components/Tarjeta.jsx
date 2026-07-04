import React from 'react';

export default function Tarjeta({ card, handleChoice, flipped, disabled }) {

    const handleClick = () => {
        if (!disabled && !flipped && !card.isMatched) {
            handleChoice(card);
        }
    };

    // Lógica mejorada: 
    // 1. Si es larga, usamos clases pequeñas.
    // 2. Si la pantalla es grande (md:), usamos clases más grandes.
    const textLength = card.content ? card.content.length : 0;

    const responsiveTextClass = () => {
        if (textLength > 12) return "text-[10px] md:text-sm"; // Palabras muy largas
        if (textLength > 8) return "text-xs md:text-base";    // Palabras medianas
        return "text-sm md:text-xl font-bold";                // Palabras cortas (Ideal)
    };

    return (
        <div className="relative aspect-square cursor-pointer perspective group" onClick={handleClick}>
            <div className={`w-full h-full duration-500 transform-style preserve-3d relative ${flipped ? 'rotate-y-180' : ''}`}>

                {/* PARTE FRONTAL (Contenido) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white border-2 border-amber-300 rounded-xl flex flex-col items-center justify-center p-2 shadow-inner hover:border-amber-400 transition-colors">
                    {card.type === 'image' ? (
                        <img
                            src={card.content}
                            alt={card.label}
                            className="w-full h-full object-contain p-1 rounded-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}

                    {/* Contenedor de texto con clases responsivas */}
                    <div className={`${card.type === 'image' ? 'hidden' : 'flex'} flex-col items-center justify-center h-full w-full text-center p-1`}>
                        <p className={`${responsiveTextClass()} text-amber-950 uppercase tracking-tight leading-tight break-words`}>
                            {card.type === 'word' ? card.content : card.label}
                        </p>
                        {card.type === 'word' && (
                            /* CORREGIDO: Se cambió 'hidden md:block' por 'block' para que siempre sea visible educativo */
                            <span className="text-[9px] md:text-xs text-black mt-1 uppercase tracking-wider block">
                                ({card.label})
                            </span>
                        )}
                    </div>
                </div>

                {/* PARTE TRASERA (Ficha oculta) */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-amber-600 border-2 border-white rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:bg-amber-500 group-hover:scale-[1.02]">
                    <span className="text-white/40 font-black text-3xl md:text-5xl select-none">?</span>
                </div>

            </div>
        </div>
    );
}