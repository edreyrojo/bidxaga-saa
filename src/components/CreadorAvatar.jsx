import React, { useState } from 'react';

export default function CreadorAvatar({ onClose, onGuardar }) {
    // 🔄 1. ESTADOS COMPLETOS DE CAPAS Y VARIANTES
    const [personajeBase, setPersonajeBase] = useState('personaje1');
    const [varianteSiluetaropabase, setVarianteSiluetaropabase] = useState('1silueta.svg');
    
    const [colorPiel, setColorPiel] = useState('#F5C6A0');
    const [variantePiel, setVariantePiel] = useState('1piel.svg');

    const [colorCabello, setColorCabello] = useState('#4A3525');
    const [varianteCabello, setVarianteCabello] = useState('1cabello1_1.svg');

    const [colorOjos, setColorOjos] = useState('#4a3525');
    const [varianteOjos, setVarianteOjos] = useState('1ojos1.svg');

    const [varianteRostro, setVarianteRostro] = useState('1rostro1.svg');

    const [colorRopainferior, setColorRopainferior] = useState('#E65100');
    const [varianteRopainferior, setVarianteRopainferior] = useState('1shorts1.svg');

    const [colorRopasuperior, setColorRopasuperior] = useState('#97d398');
    const [varianteRopasuperior, setVarianteRopasuperior] = useState('1playera1.svg');

    // 📚 2. CATÁLOGOS DE VARIANTES POR CAPA
    const variantesSiluetaropabase = [
        { id: "var1", nombre: "silueta", archivo: "1silueta.svg", costo: 0 }
    ];

    const variantesPiel = [
        { id: "v1", nombre: "Principal", archivo: "1piel.svg", costo: 0 }
    ];

    const variantesCabello = [
        { id: "v1", nombre: "Estilo 1", archivo: "1cabello1_1.svg", costo: 0 },
        { id: "v2", nombre: "Estilo 2", archivo: "1cabello2.svg", costo: 0 },
        { id: "v3", nombre: "Estilo 3", archivo: "cabello3.svg", costo: 0 },
        { id: "v4", nombre: "Estilo 4", archivo: "cabello4.svg", costo: 0 },
        { id: "v5", nombre: "Estilo 5", archivo: "cabello 5.svg", costo: 0 }
    ];

    const variantesOjos = [
        { id: "v1", nombre: "Principal", archivo: "1ojos1.svg", costo: 0 },
        { id: "v2", nombre: "Variante 2", archivo: "1ojos2_1.svg", costo: 0 },
        { id: "v3", nombre: "Variante 3", archivo: "1ojos3.svg", costo: 0 }
    ];

    const variantesRostro = [
        { id: "v1", nombre: "Principal", archivo: "1rostro1.svg", costo: 0 }
    ];

    const variantesRopainferior = [
        { id: "v1", nombre: "Shorts", archivo: "1shorts1.svg", costo: 0 }
    ];

    const variantesRopasuperior = [
        { id: "v1", nombre: "Playera", archivo: "1playera1.svg", costo: 0 }
    ];

    // 🎨 3. PALETAS DE COLORES
    const paletaPiel = ["#F5C6A0", "#f5d99e", "#ddc797", "#ddbc97", "#a06e46", "#7b4b24"];
    const paletaCabello = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#4A3525", "#1A1A1A"];
    const paletaOjos = ["#1976D2", "#388E3C", "#4A3525", "#1A1A1A", "#E65100"];
    const paletaRopainferior = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#00e604", "#0026e6"];
    const paletaRopasuperior = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#00e604", "#0026e6"];

    // 💾 4. FUNCIÓN DE GUARDADO COMPATIBLE CON FIREBASE
    const handleGuardarCambios = () => {
        const configuracionAvatar = {
            tipo: personajeBase,
            varianteSiluetaropabase: varianteSiluetaropabase,
            piel: colorPiel,
            variantePiel: variantePiel,
            cabello: colorCabello,
            varianteCabello: varianteCabello,
            ojos: colorOjos,
            varianteOjos: varianteOjos,
            varianteRostro: varianteRostro,
            ropainferior: colorRopainferior,
            varianteRopainferior: varianteRopainferior,
            ropasuperior: colorRopasuperior,
            varianteRopasuperior: varianteRopasuperior,
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
                    <h2 className="text-amber-950 font-extrabold text-lg sm:text-xl">
                        Estudio de Avatar Zapoteco
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
                            className="px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer border-2 bg-amber-600 text-white border-amber-800 shadow-md scale-105"
                        >
                            Estilo 1 (Principal)
                        </button>
                    </div>

                    {/* 🖼️ 5. VISOR DE CAPAS (Contenedor Absoluto Milimétrico) */}
                    <div className="relative w-48 h-48 mx-auto bg-white rounded-3xl border-4 border-amber-300 overflow-hidden shadow-inner flex items-center justify-center select-none">
                        
                        {/* 1. Capa de Silueta / Ropa Base (Estática) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundImage: `url(/avatares/${personajeBase}/${varianteSiluetaropabase})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        />

                        {/* 2. Capa de Piel (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorPiel,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${variantePiel})`,
                                maskImage: `url(/avatares/${personajeBase}/${variantePiel})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 3. Capa de Cabello (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorCabello,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteCabello})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteCabello})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 4. Capa de Ojos (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorOjos,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteOjos})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteOjos})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 5. Capa de Rostro (Estática) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundImage: `url(/avatares/${personajeBase}/${varianteRostro})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        />

                        {/* 6. Capa de Ropa Inferior (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorRopainferior,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteRopainferior})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteRopainferior})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 7. Capa de Ropa Superior (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorRopasuperior,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteRopasuperior})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteRopasuperior})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                    </div>

                    {/* 🎚️ 6. CONTROLES DE VARIANTES Y COLORES */}
                    <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-amber-200 shadow-sm">
                        
                        {/* Selector de Variante: Cabello */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5">
                                Estilo de Cabello
                            </label>
                            <select
                                value={varianteCabello}
                                onChange={(e) => setVarianteCabello(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-amber-950 outline-none font-bold"
                            >
                                {variantesCabello.map((v) => (
                                    <option key={v.id} value={v.archivo}>
                                        {v.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector Color Cabello */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Cabello</span>
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

                        {/* Selector de Variante: Ojos */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5">
                                Estilo de Ojos
                            </label>
                            <select
                                value={varianteOjos}
                                onChange={(e) => setVarianteOjos(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-amber-950 outline-none font-bold"
                            >
                                {variantesOjos.map((v) => (
                                    <option key={v.id} value={v.archivo}>
                                        {v.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector Color Ojos */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Ojos</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorOjos})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaOjos.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorOjos(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorOjos === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Color Piel */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Piel</span>
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

                        {/* Selector Color Ropa Superior */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Ropa Superior</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorRopasuperior})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaRopasuperior.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorRopasuperior(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorRopasuperior === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector Color Ropa Inferior */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Ropa Inferior</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorRopainferior})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaRopainferior.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorRopainferior(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorRopainferior === hex 
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
                        Guardar Avatar
                    </button>
                </div>

            </div>
        </div>
    );
}