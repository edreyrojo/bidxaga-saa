import React, { useState, useMemo } from 'react';
import { CATALOGO_ACCESORIOS } from '../data/catalogoActivos.js';

// 🗂️ Los accesorios viven en la carpeta compartida del mercado, NO dentro de la
// carpeta de cada personaje (esa era la causa de que el accesorio nunca se viera).
const RUTA_MERCADO = '/avatares/mercado/';

/* ==========================================
   SUBCOMPONENTE: CAPA VISUAL (SVG en máscara o imagen de fondo)
   Evita repetir el mismo bloque de estilos 8 veces en el visor.
   ========================================== */
function CapaSVG({ src, color, estatica = false }) {
    if (estatica) {
        return (
            <div
                className="absolute inset-0 pointer-events-none transition-colors duration-250"
                style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                }}
            />
        );
    }
    return (
        <div
            className="absolute inset-0 pointer-events-none transition-colors duration-250"
            style={{
                backgroundColor: color,
                WebkitMaskImage: `url(${src})`,
                maskImage: `url(${src})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center'
            }}
        />
    );
}

/* ==========================================
   SUBCOMPONENTE: SELECTOR DE VARIANTE (dropdown con bloqueo por inventario)
   ========================================== */
function SelectorVariante({ label, value, onChange, opciones, esDesbloqueado }) {
    return (
        <div>
            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-amber-950 outline-none font-bold"
            >
                {opciones.map((v) => {
                    const desbloqueado = esDesbloqueado(v.costo, v.id);
                    return (
                        <option key={v.id} value={v.archivo} disabled={!desbloqueado}>
                            {v.nombre} {desbloqueado ? '' : `(Bloqueado - ${v.costo} Totopos)`}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}

/* ==========================================
   SUBCOMPONENTE: SELECTOR DE COLOR (paleta de swatches)
   ========================================== */
function SelectorColor({ label, colorActual, onSelect, paleta }) {
    return (
        <div>
            <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">
                <span>{label}</span>
                <span className="text-[10px] text-amber-700 font-medium">({colorActual})</span>
            </label>
            <div className="flex gap-2.5 flex-wrap">
                {paleta.map((hex) => (
                    <button
                        key={hex}
                        type="button"
                        onClick={() => onSelect(hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm ${
                            colorActual === hex
                                ? 'scale-110 border-amber-950 ring-2 ring-amber-400'
                                : 'border-amber-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                    />
                ))}
            </div>
        </div>
    );
}

// Elige un elemento al azar de un arreglo (usado por "Aleatorizar")
const elegirAleatorio = (arreglo) => arreglo[Math.floor(Math.random() * arreglo.length)];

export default function CreadorAvatar({ onClose, onGuardar, onOpenInventario, inventarioVariantes = [], avatarActual }) {
    // Verificar si el avatar actual es un objeto personalizado para cargar sus presets previos
    const esPersonalizado = typeof avatarActual === 'object' && avatarActual !== null;

    // Valores por defecto centralizados (se usan al iniciar SIN personalización previa,
    // y también como base de "Restablecer")
    const DEFAULTS = {
        personajeBase: 'personaje1',
        varianteSiluetaropabase: '1silueta.svg',
        colorTonodepiel: '#F5C6A0',
        varianteTonodepiel: 'piel.svg',
        colorSuperior: '#E65100',
        varianteSuperior: '1playera1.svg',
        varianteRostro: '1rostro1.svg',
        colorOjos: '#000000',
        varianteOjos: '1ojos1.svg',
        colorCabello: '#4A3525',
        varianteCabello: '1cabello1.svg',
        colorInferior: '#4A3525',
        varianteInferior: '1shorts1.svg',
        varianteAccesorio: '',
        colorAccesorio: '#E65100'
    };

    // Snapshot inicial: si hay avatar personalizado previo, se cargan sus valores
    // (con alias de nombres de campo antiguos por compatibilidad), si no, los DEFAULTS.
    const construirSnapshotInicial = () => {
        if (!esPersonalizado) return { ...DEFAULTS };
        return {
            personajeBase: avatarActual.tipo || DEFAULTS.personajeBase,
            varianteSiluetaropabase: avatarActual.varianteSiluetaropabase || DEFAULTS.varianteSiluetaropabase,
            colorTonodepiel: avatarActual.tonodepiel || avatarActual.piel || DEFAULTS.colorTonodepiel,
            varianteTonodepiel: avatarActual.varianteTonodepiel || avatarActual.variantePiel || DEFAULTS.varianteTonodepiel,
            colorSuperior: avatarActual.superior || avatarActual.ropasuperior || DEFAULTS.colorSuperior,
            varianteSuperior: avatarActual.varianteSuperior || avatarActual.varianteRopasuperior || DEFAULTS.varianteSuperior,
            varianteRostro: avatarActual.varianteRostro || DEFAULTS.varianteRostro,
            colorOjos: avatarActual.ojos || DEFAULTS.colorOjos,
            varianteOjos: avatarActual.varianteOjos || DEFAULTS.varianteOjos,
            colorCabello: avatarActual.cabello || DEFAULTS.colorCabello,
            varianteCabello: avatarActual.varianteCabello || DEFAULTS.varianteCabello,
            colorInferior: avatarActual.inferior || avatarActual.ropainferior || DEFAULTS.colorInferior,
            varianteInferior: avatarActual.varianteInferior || avatarActual.varianteRopainferior || DEFAULTS.varianteInferior,
            varianteAccesorio: avatarActual.varianteAccesorio || DEFAULTS.varianteAccesorio,
            colorAccesorio: avatarActual.accesorio || DEFAULTS.colorAccesorio
        };
    };

    // El snapshot inicial se calcula UNA sola vez (no se recalcula en cada render)
    const [snapshotInicial] = useState(construirSnapshotInicial);

    // 1. ESTADOS COMPLETOS DE CAPAS Y VARIANTES (arrancan desde el snapshot inicial)
    const [personajeBase, setPersonajeBase] = useState(snapshotInicial.personajeBase);
    const [varianteSiluetaropabase, setVarianteSiluetaropabase] = useState(snapshotInicial.varianteSiluetaropabase);

    const [colorTonodepiel, setColorTonodepiel] = useState(snapshotInicial.colorTonodepiel);
    const [varianteTonodepiel, setVarianteTonodepiel] = useState(snapshotInicial.varianteTonodepiel);

    const [colorSuperior, setColorSuperior] = useState(snapshotInicial.colorSuperior);
    const [varianteSuperior, setVarianteSuperior] = useState(snapshotInicial.varianteSuperior);

    const [varianteRostro, setVarianteRostro] = useState(snapshotInicial.varianteRostro);

    const [colorOjos, setColorOjos] = useState(snapshotInicial.colorOjos);
    const [varianteOjos, setVarianteOjos] = useState(snapshotInicial.varianteOjos);

    const [colorCabello, setColorCabello] = useState(snapshotInicial.colorCabello);
    const [varianteCabello, setVarianteCabello] = useState(snapshotInicial.varianteCabello);

    const [colorInferior, setColorInferior] = useState(snapshotInicial.colorInferior);
    const [varianteInferior, setVarianteInferior] = useState(snapshotInicial.varianteInferior);

    // Estado para accesorios (al frente)
    const [varianteAccesorio, setVarianteAccesorio] = useState(snapshotInicial.varianteAccesorio);
    const [colorAccesorio, setColorAccesorio] = useState(snapshotInicial.colorAccesorio);

    // Estado para el modal de confirmación al cerrar con cambios sin guardar
    const [showConfirmClose, setShowConfirmClose] = useState(false);

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

    // Catálogo de accesorios vinculados con el inventario
    // 🔧 Generado desde el catálogo único compartido: cualquier accesorio nuevo que agregues
    // ahí (en /data/catalogoActivos.js) aparece aquí automáticamente, ya con su costo real.
    const variantesAccesorios = [
        { id: "ninguno", nombre: "Sin Accesorio", archivo: "", costo: 0 },
        ...CATALOGO_ACCESORIOS.map(a => ({ id: a.id, nombre: a.nombre, archivo: a.archivo, costo: a.costo }))
    ];

    // 3. PALETAS DE COLORES
    const paletaTonodepiel = ["#F5C6A0", "#E0AC69", "#C68642", "#8D5524", "#ffdbac", "#f1c27d"];
    const paletaSuperior = ["#E65100", "#D32F2F", "#1976D2", "#388E3C"];
    const paletaOjos = ["#000000", "#4A3525", "#1976D2", "#19d27b", "#c7c7c7"];
    const paletaCabello = ["#000000", "#4A3525", "#c7c7c7"];
    const paletaInferior = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#675246", "#221849"];
    const paletaAccesorio = ["#E65100", "#D32F2F", "#1976D2", "#388E3C", "#D4AF37", "#000000"];

    // Validación de propiedad en el inventario del usuario
    const esDesbloqueado = (costo, id) => {
        if (costo === 0 || id === "ninguno") return true;
        return inventarioVariantes.includes(id);
    };

    // 4. CONSTRUCCIÓN DEL OBJETO DE CONFIGURACIÓN (usado para guardar Y para detectar cambios)
    const construirConfiguracion = () => ({
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
        varianteAccesorio: varianteAccesorio,
        accesorio: colorAccesorio,
        rutaBase: `/avatares/${personajeBase}/`
    });

    // 🛡️ ¿Hay cambios sin guardar? Se recalcula en cada render comparando contra el snapshot inicial
    const hayCambiosSinGuardar = useMemo(() => {
        return JSON.stringify({
            personajeBase, varianteSiluetaropabase, colorTonodepiel, varianteTonodepiel,
            colorSuperior, varianteSuperior, varianteRostro, colorOjos, varianteOjos,
            colorCabello, varianteCabello, colorInferior, varianteInferior,
            varianteAccesorio, colorAccesorio
        }) !== JSON.stringify(snapshotInicial);
    }, [
        personajeBase, varianteSiluetaropabase, colorTonodepiel, varianteTonodepiel,
        colorSuperior, varianteSuperior, varianteRostro, colorOjos, varianteOjos,
        colorCabello, varianteCabello, colorInferior, varianteInferior,
        varianteAccesorio, colorAccesorio, snapshotInicial
    ]);

    const handleGuardarCambios = () => {
        if (onGuardar) {
            onGuardar(construirConfiguracion());
        }
        onClose();
    };

    // Intenta cerrar: si hay cambios sin guardar, pide confirmación antes de descartarlos
    const handleIntentarCerrar = () => {
        if (hayCambiosSinGuardar) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    // 🆕 Restablece todos los valores al snapshot con el que se abrió el Creador
    const handleRestablecer = () => {
        setPersonajeBase(snapshotInicial.personajeBase);
        setVarianteSiluetaropabase(snapshotInicial.varianteSiluetaropabase);
        setColorTonodepiel(snapshotInicial.colorTonodepiel);
        setVarianteTonodepiel(snapshotInicial.varianteTonodepiel);
        setColorSuperior(snapshotInicial.colorSuperior);
        setVarianteSuperior(snapshotInicial.varianteSuperior);
        setVarianteRostro(snapshotInicial.varianteRostro);
        setColorOjos(snapshotInicial.colorOjos);
        setVarianteOjos(snapshotInicial.varianteOjos);
        setColorCabello(snapshotInicial.colorCabello);
        setVarianteCabello(snapshotInicial.varianteCabello);
        setColorInferior(snapshotInicial.colorInferior);
        setVarianteInferior(snapshotInicial.varianteInferior);
        setVarianteAccesorio(snapshotInicial.varianteAccesorio);
        setColorAccesorio(snapshotInicial.colorAccesorio);
    };

    // 🆕 Aleatoriza el look completo, respetando lo que SÍ tienes desbloqueado
    const handleAleatorizar = () => {
        const opcionesSuperior = variantesSuperior.filter(v => esDesbloqueado(v.costo, v.id));
        const opcionesOjos = variantesOjos.filter(v => esDesbloqueado(v.costo, v.id));
        const opcionesCabello = variantesCabello.filter(v => esDesbloqueado(v.costo, v.id));
        const opcionesInferior = variantesInferior.filter(v => esDesbloqueado(v.costo, v.id));
        const opcionesAccesorio = variantesAccesorios.filter(v => esDesbloqueado(v.costo, v.id));

        setVarianteSuperior(elegirAleatorio(opcionesSuperior).archivo);
        setColorSuperior(elegirAleatorio(paletaSuperior));

        setVarianteOjos(elegirAleatorio(opcionesOjos).archivo);
        setColorOjos(elegirAleatorio(paletaOjos));

        setVarianteCabello(elegirAleatorio(opcionesCabello).archivo);
        setColorCabello(elegirAleatorio(paletaCabello));

        setVarianteInferior(elegirAleatorio(opcionesInferior).archivo);
        setColorInferior(elegirAleatorio(paletaInferior));

        setColorTonodepiel(elegirAleatorio(paletaTonodepiel));

        const accesorioElegido = elegirAleatorio(opcionesAccesorio);
        setVarianteAccesorio(accesorioElegido.archivo);
        if (accesorioElegido.archivo) setColorAccesorio(elegirAleatorio(paletaAccesorio));
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
                        {hayCambiosSinGuardar && (
                            <p className="text-[10px] font-bold text-amber-800/80 mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block animate-pulse"></span>
                                Cambios sin guardar
                            </p>
                        )}
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
                            onClick={handleIntentarCerrar}
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
                        {/* 1. Silueta / Ropa Base (Estática) */}
                        <CapaSVG estatica src={`/avatares/${personajeBase}/${varianteSiluetaropabase}`} />
                        {/* 2. Tono de Piel (Dinámica) */}
                        <CapaSVG src={`/avatares/${personajeBase}/${varianteTonodepiel}`} color={colorTonodepiel} />
                        {/* 3. Inferior (Dinámica) */}
                        <CapaSVG src={`/avatares/${personajeBase}/${varianteInferior}`} color={colorInferior} />
                        {/* 4. Superior (Dinámica) */}
                        <CapaSVG src={`/avatares/${personajeBase}/${varianteSuperior}`} color={colorSuperior} />
                        {/* 5. Rostro (Estática) */}
                        <CapaSVG estatica src={`/avatares/${personajeBase}/${varianteRostro}`} />
                        {/* 6. Ojos (Dinámica) */}
                        <CapaSVG src={`/avatares/${personajeBase}/${varianteOjos}`} color={colorOjos} />
                        {/* 7. Cabello (Dinámica) */}
                        <CapaSVG src={`/avatares/${personajeBase}/${varianteCabello}`} color={colorCabello} />
                        {/* 8. Accesorio (Hasta el frente) — 🛠️ ahora sí apunta a la carpeta correcta */}
                        {varianteAccesorio && (
                            <CapaSVG src={`${RUTA_MERCADO}${varianteAccesorio}`} color={colorAccesorio} />
                        )}
                    </div>

                    {/* Acciones rápidas: Aleatorizar / Restablecer */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleAleatorizar}
                            className="flex-1 bg-white hover:bg-amber-100 text-amber-900 font-bold py-2 rounded-xl text-xs shadow-sm border border-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            🎲 Aleatorizar
                        </button>
                        <button
                            type="button"
                            onClick={handleRestablecer}
                            disabled={!hayCambiosSinGuardar}
                            className={`flex-1 font-bold py-2 rounded-xl text-xs shadow-sm border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                hayCambiosSinGuardar
                                    ? 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-amber-50 text-amber-400 border-amber-100 cursor-not-allowed'
                            }`}
                        >
                            ↺ Restablecer
                        </button>
                    </div>

                    {/* Controles de Variantes y Colores */}
                    <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-amber-200 shadow-sm">

                        <SelectorVariante
                            label="Accesorio (Al Frente)"
                            value={varianteAccesorio}
                            onChange={setVarianteAccesorio}
                            opciones={variantesAccesorios}
                            esDesbloqueado={esDesbloqueado}
                        />

                        {varianteAccesorio && (
                            <SelectorColor
                                label="Color Accesorio"
                                colorActual={colorAccesorio}
                                onSelect={setColorAccesorio}
                                paleta={paletaAccesorio}
                            />
                        )}

                        <SelectorVariante
                            label="Estilo de Cabello"
                            value={varianteCabello}
                            onChange={setVarianteCabello}
                            opciones={variantesCabello}
                            esDesbloqueado={esDesbloqueado}
                        />
                        <SelectorColor
                            label="Color Cabello"
                            colorActual={colorCabello}
                            onSelect={setColorCabello}
                            paleta={paletaCabello}
                        />

                        <SelectorVariante
                            label="Estilo de Ojos"
                            value={varianteOjos}
                            onChange={setVarianteOjos}
                            opciones={variantesOjos}
                            esDesbloqueado={esDesbloqueado}
                        />
                        <SelectorColor
                            label="Color Ojos"
                            colorActual={colorOjos}
                            onSelect={setColorOjos}
                            paleta={paletaOjos}
                        />

                        <SelectorVariante
                            label="Estilo Superior"
                            value={varianteSuperior}
                            onChange={setVarianteSuperior}
                            opciones={variantesSuperior}
                            esDesbloqueado={esDesbloqueado}
                        />
                        <SelectorColor
                            label="Color Superior"
                            colorActual={colorSuperior}
                            onSelect={setColorSuperior}
                            paleta={paletaSuperior}
                        />

                        <SelectorVariante
                            label="Estilo Inferior"
                            value={varianteInferior}
                            onChange={setVarianteInferior}
                            opciones={variantesInferior}
                            esDesbloqueado={esDesbloqueado}
                        />
                        <SelectorColor
                            label="Color Inferior"
                            colorActual={colorInferior}
                            onSelect={setColorInferior}
                            paleta={paletaInferior}
                        />

                        <SelectorColor
                            label="Tono de Piel"
                            colorActual={colorTonodepiel}
                            onSelect={setColorTonodepiel}
                            paleta={paletaTonodepiel}
                        />

                    </div>

                </div>

                {/* Pie del Modal con Botones */}
                <div className="bg-amber-100 px-6 py-3 border-t-2 border-amber-300 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleIntentarCerrar}
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

                {/* MODAL DE CONFIRMACIÓN: CAMBIOS SIN GUARDAR */}
                {showConfirmClose && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-xs flex flex-col items-center text-center animate-fade-in">
                            <div className="text-3xl mb-2">⚠️</div>
                            <h3 className="text-lg font-bold text-amber-950 mb-1">¿Descartar cambios?</h3>
                            <p className="text-xs text-amber-800 mb-5">
                                Tienes cambios sin guardar en tu avatar. Si sales ahora se perderán.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmClose(false)}
                                    className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                                >
                                    Seguir editando
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                                >
                                    Descartar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
