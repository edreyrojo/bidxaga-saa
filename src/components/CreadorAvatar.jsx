import React, { useState } from 'react';

export default function CreadorAvatar({ onClose, onGuardar, onOpenInventario, inventarioVariantes = [] }) {
    // 1. ESTADOS COMPLETOS DE CAPAS Y VARIANTES
    const [personajeBase, setPersonajeBase] = useState('personaje1');
    const [varianteSiluetaropabase, setVarianteSiluetaropabase] = useState('1silueta.svg');
    
    const [colorTonodepiel, setColorTonodepiel] = useState('#F5C6A0');
    const [varianteTonodepiel, setVarianteTonodepiel] = useState('piel.svg');

    const [colorSuperior, setColorSuperior] = useState('#E65100');
    const [varianteSuperior, setVarianteSuperior] = useState('1playera1.svg');

    const [varianteRostro, setVarianteRostro] = useState('1rostro1.svg');

    const [colorOjos, setColorOjos] = useState('#000000');
    const [varianteOjos, setVarianteOjos] = useState('1ojos1.svg');

    const [colorCabello, setColorCabello] = useState('#4A3525');
    const [varianteCabello, setVarianteCabello] = useState('1cabello1.svg');

    const [colorInferior, setColorInferior] = useState('#4A3525');
    const [varianteInferior, setVarianteInferior] = useState('1shorts1.svg');

    // 2. CATÁLOGOS DE VARIANTES POR CAPA
    const variantesSiluetaropabase = [
        { id: "var1", nombre: "Ropa Clásica", archivo: "1silueta.svg", costo: 0 }
    ];

    const variantesTonodepiel = [
        { id: "var1", nombre: "Piel Base", archivo: "piel.svg", costo: 0 }
    ];

    const variantesSuperior = [
        { id: "v1", nombre: "Principal", archivo: "1playera1.svg", costo: 0 },
        { id: "v2", nombre: "Camisa", archivo: "camisa1.svg", costo: 0 }
    ];

    const variantesRostro = [
        { id: "v1", nombre: "Principal", archivo: "1rostro1.svg", costo: 0 }
    ];

    const variantesOjos = [
        { id: "v1", nombre: "Principal", archivo: "1ojos1.svg", costo: 0 },
        { id: "v2", nombre: "Variante 2", archivo: "1ojos2_1.svg", costo: 0 },
        { id: "v3", nombre: "Variante 3", archivo: "1ojos3.svg", costo: 0 }
    ];

    const variantesCabello = [
        { id: "v1", nombre: "Principal", archivo: "1cabello1.svg", costo: 0 },
        { id: "v2", nombre: "Variante 2", archivo: "1cabello2.svg", costo: 0 },
        { id: "v3", nombre: "Variante 3", archivo: "cabello3.svg", costo: 0 },
        { id: "v4", nombre: "Variante 4", archivo: "cabello4.svg", costo: 0 },
        { id: "v5", nombre: "Variante 5", archivo: "cabello 5.svg", costo: 0 }
    ];

    const variantesInferior = [
        { id: "v1", nombre: "Principal", archivo: "1shorts1.svg", costo: 0 },
        { id: "v2", nombre: "Pantalon", archivo: "pantalon1.svg", costo: 0 }
    ];

    // 3. PALETAS DE COLORES
    const paletaTonodepiel = ["#F5C6A0", "#E0AC69", "#C68642", "#8D5524", "#ffdbac", "#f1c27d"];
    const paletaSuperior = ["#E65100", "#D32F2F", "#1976D2", "#388E3C"];
    const paletaOjos = ["#000000", "#4A3525", "#1976D2", "#19d27b", "#c7c7c7"];
    const paletaCabello = ["#000000", "#4A3525", "#c7c7c7"];
    const paletaInferior = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#675246", "#221849"];

    // Validación de propiedad en el inventario del usuario
    const esDesbloqueado = (costo, id) => {
        if (costo === 0) return true;
        return inventarioVariantes.includes(id);
    };

    // 4. FUNCIÓN DE GUARDADO COMPATIBLE CON FIREBASE
    const handleGuardarCambios = () => {
        const configuracionAvatar = {
            tipo: personajeBase,
            varianteSiluetaropabase: varianteSiluetaropabase,
            tonodepiel: colorTonodepiel,
            varianteTonodepiel: varianteTonodepiel,
            superior: colorSuperior,
            varianteSuperior: varianteSuperior,
            varianteRostro: varianteRostro,
            ojos: colorOjos,
            varianteOjos: varianteOjos,
            cabello: colorCabello,
            varianteCabello: varianteCabello,
            inferior: colorInferior,
            varianteInferior: varianteInferior,
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
                    <div>
                        <h2 className="text-amber-950 font-extrabold text-lg sm:text-xl">
                            Estudio de Avatar Zapoteco
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {onOpenInventario && (
                            <button
                                type="button"
                                onClick={onOpenInventario}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                            >
                                Inventario
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-amber-800 hover:text-amber-950 font-bold text-xl w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Contenido Principal con Scroll fluido */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">

                    {/* Selector de Estilo / Base */}
                    <div className="flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPersonajeBase('personaje1')}
                            className="px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer border-2 bg-amber-600 text-white border-amber-800 shadow-md scale-105"
                        >
                            Estilo 1 (Principal)
                        </button>
                    </div>

                    {/* Visor de Capas Milimétrico */}
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

                        {/* 2. Capa de Tono de Piel (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorTonodepiel,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteTonodepiel})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteTonodepiel})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 3. Capa Superior (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorSuperior,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteSuperior})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteSuperior})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />

                        {/* 4. Capa de Rostro (Estática) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundImage: `url(/avatares/${personajeBase}/${varianteRostro})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        />

                        {/* 5. Capa de Ojos (Dinámica) */}
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

                        {/* 6. Capa de Cabello (Dinámica) */}
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

                        {/* 7. Capa Inferior (Dinámica) */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-colors duration-250"
                            style={{
                                backgroundColor: colorInferior,
                                WebkitMaskImage: `url(/avatares/${personajeBase}/${varianteInferior})`,
                                maskImage: `url(/avatares/${personajeBase}/${varianteInferior})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        />
                    </div>

                    {/* Controles de Variantes y Colores */}
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
                                {variantesCabello.map((v) => {
                                    const desbloqueado = esDesbloqueado(v.costo, v.id);
                                    return (
                                        <option key={v.id} value={v.archivo} disabled={!desbloqueado}>
                                            {v.nombre} {desbloqueado ? '' : `(Bloqueado - ${v.costo} Totopos)`}
                                        </option>
                                    );
                                })}
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
                                {variantesOjos.map((v) => {
                                    const desbloqueado = esDesbloqueado(v.costo, v.id);
                                    return (
                                        <option key={v.id} value={v.archivo} disabled={!desbloqueado}>
                                            {v.nombre} {desbloqueado ? '' : `(Bloqueado - ${v.costo} Totopos)`}
                                        </option>
                                    );
                                })}
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

                        {/* Selector de Variante: Superior */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5">
                                Estilo Superior
                            </label>
                            <select
                                value={varianteSuperior}
                                onChange={(e) => setVarianteSuperior(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-amber-950 outline-none font-bold"
                            >
                                {variantesSuperior.map((v) => {
                                    const desbloqueado = esDesbloqueado(v.costo, v.id);
                                    return (
                                        <option key={v.id} value={v.archivo} disabled={!desbloqueado}>
                                            {v.nombre} {desbloqueado ? '' : `(Bloqueado - ${v.costo} Totopos)`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Selector Color Superior */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Superior</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorSuperior})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaSuperior.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorSuperior(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorSuperior === hex 
                                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400' 
                                                : 'border-amber-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selector de Variante: Inferior */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5">
                                Estilo Inferior
                            </label>
                            <select
                                value={varianteInferior}
                                onChange={(e) => setVarianteInferior(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-amber-950 outline-none font-bold"
                            >
                                {variantesInferior.map((v) => {
                                    const desbloqueado = esDesbloqueado(v.costo, v.id);
                                    return (
                                        <option key={v.id} value={v.archivo} disabled={!desbloqueado}>
                                            {v.nombre} {desbloqueado ? '' : `(Bloqueado - ${v.costo} Totopos)`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Selector Color Inferior */}
                        <div>
                            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                                <span>Color Inferior</span>
                                <span className="text-[10px] text-amber-700 font-medium">({colorInferior})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaInferior.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorInferior(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorInferior === hex 
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
                                <span className="text-[10px] text-amber-700 font-medium">({colorTonodepiel})</span>
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {paletaTonodepiel.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setColorTonodepiel(hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                                            colorTonodepiel === hex 
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