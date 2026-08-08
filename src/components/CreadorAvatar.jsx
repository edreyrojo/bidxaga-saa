import React, { useState } from 'react';

export default function CreadorAvatar({ onClose, onGuardar }) {
    // 🎭 Estado para seleccionar el modelo base (por ahora personaje1)
    const [personajeBase, setPersonajeBase] = useState('personaje1');

    // 🎨 Estados para los colores seleccionados de cada capa
    const [colorPiel, setColorPiel] = useState('#F5C6A0');
    const [colorCabello, setColorCabello] = useState('#4A3525');
    const [colorSilueta, setColorSilueta] = useState('#1A1A1A'); // Silueta base (fondo/contorno)

    // Paletas de colores profesionales
    const paletaPiel = ['#F5C6A0', '#E0AC69', '#C68642', '#8D5524', '#3D2314'];
    const paletaCabello = ['#4A3525', '#1A1A1A', '#8B4513', '#D4AF37', '#B22222', '#556B2F'];
    const paletaSilueta = ['#1A1A1A', '#E65100', '#D32F2F', '#1976D2', '#388E3C', '#7B1FA2', '#455A64'];

    const handleGuardarCambios = () => {
        const configuracionAvatar = {
            tipo: personajeBase,
            piel: colorPiel,
            cabello: colorCabello,
            silueta: colorSilueta,
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

                    {/* VISOR DE CAPAS VECTORIALES EN TIEMPO REAL (Orden corregido: Silueta atrás, Piel en medio, Cabello al frente) */}
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-white rounded-3xl border-4 border-amber-300 flex items-center justify-center shadow-inner overflow-hidden">
                        
                        {/* 1. Capa de Silueta (Al fondo, ideal para color negro o tonos oscuros de base) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-200"
                            style={{
                                backgroundColor: colorSilueta,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1silueta.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1silueta.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 2. Capa de Piel (En el medio, cubriendo el cuerpo base) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-200"
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

                        {/* 3. Capa de Cabello (Hasta adelante, rematando el diseño) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-200"
                            style={{
                                backgroundColor: colorCabello,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/1cabello.svg)`,
                                maskImage: `url(/avatares/${personajeBase}/1cabello.svg)`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                    </div>

                    {/* SELECTORES DE COLOR */}
                    <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-amber-200 shadow-sm">

                        {/* Selector Color de Silueta / Base / Contorno */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Silueta / Ropa Base</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorSilueta})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaSilueta.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorSilueta(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorSilueta === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Tono de Piel */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Tono de Piel</span>
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

                        {/* Selector Color de Cabello */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color de Cabello</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorCabello})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaCabello.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorCabello(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorCabello === hex 
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