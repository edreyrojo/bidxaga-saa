import React, { useState } from 'react';

export default function CreadorAvatar({ onClose, onGuardar }) {
    // 🔄 1. ESTADOS
    const [personajeBase, setPersonajeBase] = useState('personaje1');
    const [colorPiel, setColorPiel] = useState('#F5C6A0');
    const [colorOjos1, setColorOjos1] = useState('#5d320e');
    const [colorCabello1, setColorCabello1] = useState('#5c320f');
    const [colorPlayera1, setColorPlayera1] = useState('#468b41');
    const [colorShorts1, setColorShorts1] = useState('#5a968a');

    // 🎨 2. PALETAS DE COLORES
    const paletaPiel = ["#F5C6A0", "#ffbc85", "#a06e46", "#7b4b24", "#5d320e"];
    const paletaOjos1 = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#1A1A1A"];
    const paletaCabello1 = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#5c320f", "#1A1A1A"];
    const paletaPlayera1 = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#468b41"];
    const paletaShorts1 = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#5a968a", "#1A1A1A"];

    // 💾 3. FUNCIÓN DE GUARDADO
    const handleGuardarCambios = () => {
        const configuracionAvatar = {
            tipo: personajeBase,
            piel: colorPiel,
            ojos1: colorOjos1,
            cabello1: colorCabello1,
            playera1: colorPlayera1,
            shorts1: colorShorts1,
            rutaBase: `/avatares/${personajeBase}/`
        };
        if (onGuardar) {
            onGuardar(configuracionAvatar);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-amber-50 border-4 border-amber-300 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">

                {/* Cabecera del Modal */}
                <div className="bg-amber-200 px-6 py-4 flex justify-between items-center border-b-2 border-amber-300">
                    <h2 className="text-amber-950 font-extrabold text-lg sm:text-xl flex items-center gap-2">
                        🎨 Estudio de Avatar Zapoteco
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-amber-800 hover:text-amber-950 font-bold text-xl w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Contenido Principal con Scroll fluido */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">

                    {/* SELECTOR DE ESTILO / BASE */}
                    <div className="flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPersonajeBase('personaje1')}
                            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer border-2 ${
                                personajeBase === 'personaje1'
                                    ? 'bg-amber-600 text-white border-amber-800 shadow-md scale-105'
                                    : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                            }`}
                        >
                            🧑🏽 Estilo 1 (Principal)
                        </button>
                    </div>

                    {/* 🖼️ 4. VISOR DE CAPAS (Contenedor Absoluto Milimétrico) */}
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-white rounded-3xl border-4 border-amber-300 overflow-hidden shadow-inner flex items-center justify-center select-none">
                        {/* 1. Capa de Silueta / Ropa Base (Estática) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundImage: `url(/avatares/${personajeBase}/1silueta.svg)`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        />
                        {/* 2. Capa de Piel */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorPiel,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1piel.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1piel.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                        {/* 3. Capa de Rostro1 (Estática) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundImage: `url(/avatares/${personajeBase}/1rostro1.svg)`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        />
                        {/* 4. Capa de Ojos1 */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorOjos1,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1ojos1.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1ojos1.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                        {/* 5. Capa de Cabello1 */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorCabello1,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1cabello1.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1cabello1.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                        {/* 6. Capa de Playera1 */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorPlayera1,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1playera1.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1playera1.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                        {/* 7. Capa de Shorts1 */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorShorts1,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1shorts1.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1shorts1.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                    </div>

                    {/* 🎚️ 5. SELECTORES DE COLOR */}
                    <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-amber-200 shadow-sm">
                        
                        {/* Selector Piel */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Piel</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorPiel})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaPiel.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorPiel(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorPiel === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Ojos1 */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Ojos</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorOjos1})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaOjos1.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorOjos1(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorOjos1 === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Cabello1 */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Cabello</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorCabello1})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaCabello1.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorCabello1(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorCabello1 === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Playera1 */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Playera</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorPlayera1})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaPlayera1.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorPlayera1(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorPlayera1 === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Shorts1 */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Shorts</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorShorts1})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaShorts1.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorShorts1(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorShorts1 === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Pie del Modal con Botones */}
                <div className="bg-amber-100 px-6 py-3 border-t-2 border-amber-300 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleGuardarCambios}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl shadow-md transition-transform transform active:scale-95 cursor-pointer"
                    >
                        Guardar Avatar 🎨
                    </button>
                </div>

            </div>
        </div>
    );
}