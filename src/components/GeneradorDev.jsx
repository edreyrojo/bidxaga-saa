import React, { useState } from 'react';

// 🛍️ Biblioteca de carpetas de avatares existentes en public/avatares/
const BIBLIOTECA_AVATARES = [
    { id: 'personaje1', nombre: 'Personaje 1 (Clásico)', icono: '👤' },
    { id: 'masculino', nombre: 'Base Masculina', icon: '👦' },
    { id: 'femenino', nombre: 'Base Femenina', icon: '👧' },
    { id: 'personaje2', nombre: 'Personaje 2', icon: '🌟' }
];

export default function GeneradorDev({ onBack }) {
    const [nombrePersonaje, setNombrePersonaje] = useState('personaje1');
    
    // Lista de capas dinámicas con orden de apilamiento (el primero va al fondo)
    const [capas, setCapas] = useState([
        { 
            id: 'silueta', 
            nombreCapa: 'Silueta / Ropa Base', 
            colorDefault: '#1A1A1A', 
            archivo: '1silueta.svg',
            paleta: ['#1A1A1A', '#333333', '#555555', '#7F8C8D', '#BDC3C7', '#FFFFFF'],
            previewUrl: null 
        },
        { 
            id: 'piel', 
            nombreCapa: 'Tono de Piel', 
            colorDefault: '#F5C6A0', 
            archivo: '1piel.svg',
            paleta: ['#F5C6A0', '#E0AC69', '#C68642', '#8D5524', '#ffdbac', '#f1c27d'],
            previewUrl: null
        },
        { 
            id: 'cabello', 
            nombreCapa: 'Cabello', 
            colorDefault: '#4A3525', 
            archivo: '1cabello.svg',
            paleta: ['#4A3525', '#2C3E50', '#8E44AD', '#D35400', '#C0392B', '#F39C12'],
            previewUrl: null
        },
    ]);

    // Estados dinámicos de colores para la previsualización en vivo en PC
    const [coloresVivos, setColoresVivos] = useState({
        silueta: '#1A1A1A',
        piel: '#F5C6A0',
        cabello: '#4A3525'
    });

    // Estado temporal para agregar nuevas capas con constructor interactivo de paleta
    const [nuevaCapa, setNuevaCapa] = useState({ 
        nombreCapa: '', 
        colorDefault: '#E65100', 
        colorTemp: '#E65100', // Color seleccionado actualmente para agregar al paletario
        paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C', '#7B1FA2'], // Lista interactiva
        archivoFile: null,
        previewUrl: null
    });

    // ✨ Función para comenzar un nuevo personaje desde cero
    const handleNuevoPersonaje = () => {
        const nombreInput = prompt("Ingresa el nombre de la carpeta para el nuevo personaje (ej: personaje3, guerrero):", "personaje" + (BIBLIOTECA_AVATARES.length + 1));
        if (!nombreInput) return;
        
        const folderLimpio = nombreInput.toLowerCase().replace(/\s+/g, '_');
        setNombrePersonaje(folderLimpio);
        
        const capasIniciales = [
            { id: 'silueta', nombreCapa: 'Cuerpo Base', colorDefault: '#1A1A1A', archivo: '1silueta.svg', paleta: ['#1A1A1A', '#333333', '#555555'], previewUrl: null },
            { id: 'piel', nombreCapa: 'Tono de Piel', colorDefault: '#F5C6A0', archivo: '1piel.svg', paleta: ['#F5C6A0', '#E0AC69', '#C68642'], previewUrl: null },
            { id: 'cabello', nombreCapa: 'Estilo de Cabello', colorDefault: '#4A3525', archivo: '1cabello.svg', paleta: ['#4A3525', '#2C3E50', '#8E44AD'], previewUrl: null }
        ];
        setCapas(capasIniciales);
        setColoresVivos({
            silueta: '#1A1A1A',
            piel: '#F5C6A0',
            cabello: '#4A3525'
        });
    };

    // 📁 Manejar la subida del archivo SVG para previsualización
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            let nombreSugerido = file.name.replace('.svg', '').replace(/^\d+/, '');
            nombreSugerido = nombreSugerido.charAt(0).toUpperCase() + nombreSugerido.slice(1);

            setNuevaCapa(prev => ({
                ...prev,
                archivoFile: file,
                previewUrl: tempUrl,
                nombreCapa: prev.nombreCapa || nombreSugerido
            }));
        }
    };

    // 🎨 Añadir un color interactivo a la lista de la paleta nueva
    const handleAgregarColorAPaleta = () => {
        if (!nuevaCapa.paletaColors.includes(nuevaCapa.colorTemp)) {
            setNuevaCapa(prev => ({
                ...prev,
                paletaColors: [...prev.paletaColors, prev.colorTemp]
            }));
        }
    };

    // 🗑️ Eliminar un color de la lista de la paleta nueva
    const handleEliminarColorDePaleta = (hexABorrar) => {
        if (nuevaCapa.paletaColors.length <= 1) {
            alert('La paleta debe tener al menos un color.');
            return;
        }
        setNuevaCapa(prev => ({
            ...prev,
            paletaColors: prev.paletaColors.filter(h => h !== hexABorrar)
        }));
    };

    // ➕ Añadir Capa con autogeneración de ID y archivo
    const handleAgregarCapa = () => {
        if (!nuevaCapa.nombreCapa.trim()) {
            alert('El nombre de la capa es obligatorio');
            return;
        }

        const idGenerado = nuevaCapa.nombreCapa
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '');

        if (!idGenerado) {
            alert('Por favor usa caracteres válidos para el nombre de la capa');
            return;
        }

        if (capas.some(c => c.id === idGenerado)) {
            alert('Ya existe una capa con un identificador similar. Elige otro nombre.');
            return;
        }

        const archivoGenerado = `1${idGenerado}.svg`;
        const paletaArray = nuevaCapa.paletaColors.length > 0 
            ? nuevaCapa.paletaColors 
            : [nuevaCapa.colorDefault];

        const nuevaCapaObj = {
            id: idGenerado,
            nombreCapa: nuevaCapa.nombreCapa.trim(),
            colorDefault: nuevaCapa.colorDefault,
            archivo: archivoGenerado, 
            paleta: paletaArray,
            previewUrl: nuevaCapa.previewUrl 
        };

        setCapas([...capas, nuevaCapaObj]);
        setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
        
        // Limpiamos el formulario conservando una paleta por defecto limpia
        setNuevaCapa({ 
            nombreCapa: '', 
            colorDefault: '#E65100', 
            colorTemp: '#E65100',
            paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C'], 
            archivoFile: null, 
            previewUrl: null 
        });
        
        const fileInput = document.getElementById('svgFileInput');
        if(fileInput) fileInput.value = '';
    };

    const eliminarCapa = (idABorrar) => {
        if (capas.length <= 1) {
            alert('El avatar debe tener al menos una capa.');
            return;
        }
        setCapas(capas.filter(capa => capa.id !== idABorrar));
        const copy = { ...coloresVivos };
        delete copy[idABorrar];
        setColoresVivos(copy);
    };

    const moverCapa = (index, direccion) => {
        const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
        if (nuevoIndex < 0 || nuevoIndex >= capas.length) return;
        
        const copiaCapas = [...capas];
        const temp = copiaCapas[index];
        copiaCapas[index] = copiaCapas[nuevoIndex];
        copiaCapas[nuevoIndex] = temp;
        setCapas(copiaCapas);
    };

    const cambiarColorCapa = (idCapa, hex) => {
        setColoresVivos(prev => ({ ...prev, [idCapa]: hex }));
    };

    // 🚀 EL MOTOR DEL GENERADOR DE CÓDIGO
    const generarCodigoJSX = () => {
        let codigo = `/* =============================================================\n`;
        codigo += `   🎨 CÓDIGO GENERADO PARA: ${nombrePersonaje}\n`;
        codigo += `   Cópialo y reemplaza las secciones correspondientes en CreadorAvatar.jsx\n`;
        codigo += `   ============================================================= */\n\n`;

        codigo += `// 🔄 1. ESTADOS (Reemplaza los estados en CreadorAvatar.jsx)\n`;
        codigo += `const [personajeBase, setPersonajeBase] = useState('${nombrePersonaje}');\n`;
        capas.forEach(capa => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `const [color${idCap}, setColor${idCap}] = useState('${coloresVivos[capa.id] || capa.colorDefault}');\n`;
        });

        codigo += `\n// 🎨 2. PALETAS DE COLORES RECOMENDADAS (Reemplaza las paletas)\n`;
        capas.forEach(capa => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            const paletaJson = JSON.stringify(capa.paleta || [capa.colorDefault, '#E65100', '#D32F2F', '#1976D2']);
            codigo += `const paleta${idCap} = ${paletaJson};\n`;
        });

        codigo += `\n// 💾 3. OBJETO PARA GUARDAR (Actualiza dentro de handleGuardarCambios)\n`;
        codigo += `const configuracionAvatar = {\n`;
        codigo += `    tipo: personajeBase,\n`;
        capas.forEach(capa => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `    ${capa.id}: color${idCap},\n`;
        });
        codigo += `    rutaBase: \`/avatares/\${personajeBase}/\`\n`;
        codigo += `};\n`;

        codigo += `\n// 🖼️ 4. VISOR DE CAPAS (Reemplaza el visor actual - Respetando orden de apilamiento)\n`;
        codigo += `<div className="relative w-48 h-48 mx-auto bg-white rounded-3xl border-4 border-amber-300 flex items-center justify-center shadow-inner overflow-hidden">\n`;
        capas.forEach((capa, index) => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `    {/* ${index + 1}. Capa de ${capa.nombreCapa} */}\n`;
            codigo += `    <div\n`;
            codigo += `        className="absolute inset-0 pointer-events-none transition-colors duration-200"\n`;
            codigo += `        style={{\n`;
            codigo += `            backgroundColor: color${idCap},\n`;
            codigo += `            WebkitMaskImage: \`url(/avatares/\${personajeBase}/${capa.archivo})\`,\n`;
            codigo += `            maskImage: \`url(/avatares/\${personajeBase}/${capa.archivo})\`,\n`;
            codigo += `            WebkitMaskSize: 'contain',\n`;
            codigo += `            maskSize: 'contain',\n`;
            codigo += `            WebkitMaskRepeat: 'no-repeat',\n`;
            codigo += `            maskRepeat: 'no-repeat',\n`;
            codigo += `            WebkitMaskPosition: 'center',\n`;
            codigo += `            maskPosition: 'center'\n`;
            codigo += `        }}\n`;
            codigo += `    />\n`;
        });
        codigo += `</div>\n`;

        codigo += `\n// 🎚️ 5. SELECTORES DE COLOR\n`;
        codigo += `<div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-amber-200 shadow-sm">\n`;
        capas.forEach((capa) => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `    {/* Selector ${capa.nombreCapa} */}\n`;
            codigo += `    <div>\n`;
            codigo += `        <label className="block text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center justify-between">\n`;
            codigo += `            <span>${capa.nombreCapa}</span>\n`;
            codigo += `            <span className="text-[10px] text-amber-700 font-medium">({color${idCap}})</span>\n`;
            codigo += `        </label>\n`;
            codigo += `        <div className="flex gap-2.5 flex-wrap">\n`;
            codigo += `            {paleta${idCap}.map((hex) => (\n`;
            codigo += `                <button\n`;
            codigo += `                    key={hex}\n`;
            codigo += `                    type="button"\n`;
            codigo += `                    onClick={() => setColor${idCap}(hex)}\n`;
            codigo += `                    className={\`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shadow-sm \${\n`;
            codigo += `                        color${idCap} === hex \n`;
            codigo += `                            ? 'scale-110 border-amber-950 ring-2 ring-amber-400' \n`;
            codigo += `                            : 'border-amber-300 hover:scale-105'\n`;
            codigo += `                    }\`}\n`;
            codigo += `                    style={{ backgroundColor: hex }}\n`;
            codigo += `                />\n`;
            codigo += `            ))}\n`;
            codigo += `        </div>\n`;
            codigo += `    </div>\n`;
        });
        codigo += `</div>\n`;

        return codigo;
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-amber-50 rounded-3xl border-4 border-amber-400 shadow-2xl my-6 font-sans text-amber-950">
            
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b-2 border-amber-200">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                            ← Volver
                        </button>
                    )}
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        🛠️ Estudio Profesional de Capas SVG
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleNuevoPersonaje}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        ✨ Nuevo Personaje
                    </button>
                    <span className="text-xs font-bold bg-amber-200 text-amber-900 px-3 py-2 rounded-xl border border-amber-300">
                        Escritorio Optimizado
                    </span>
                </div>
            </div>

            {/* BIBLIOTECA */}
            <div className="bg-white p-4 rounded-3xl border-2 border-amber-300 shadow-sm mb-6">
                <h3 className="text-xs font-black uppercase text-amber-900 mb-3 flex items-center gap-1.5">
                    📂 Biblioteca de Personajes (Carpetas en <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">/public/avatares/</code>)
                </h3>
                <div className="flex flex-wrap gap-2">
                    {BIBLIOTECA_AVATARES.map((avatar) => (
                        <button
                            key={avatar.id}
                            onClick={() => setNombrePersonaje(avatar.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-2 ${
                                nombrePersonaje === avatar.id
                                    ? 'bg-amber-600 text-white border-amber-800 shadow-md scale-105'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            <span>{avatar.icon || '📁'}</span>
                            <span>{avatar.nombre}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                    
                    {/* Tarjeta de Previsualización en Vivo */}
                    <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-md flex flex-col items-center">
                        <h3 className="font-black text-xs text-amber-900 uppercase tracking-wider mb-3">
                            👁️ Previsualización Interactiva ({nombrePersonaje})
                        </h3>
                        
                        <div className="relative w-56 h-56 bg-amber-50 rounded-3xl border-4 border-amber-400 flex items-center justify-center shadow-inner overflow-hidden mb-4">
                            {capas.map((capa) => {
                                const maskUrl = capa.previewUrl ? `url(${capa.previewUrl})` : `url(/avatares/${nombrePersonaje}/${capa.archivo})`;
                                
                                return (
                                    <div
                                        key={capa.id}
                                        className="absolute inset-0 pointer-events-none transition-colors duration-200"
                                        style={{
                                            backgroundColor: coloresVivos[capa.id] || capa.colorDefault,
                                            WebkitMaskImage: maskUrl,
                                            maskImage: maskUrl,
                                            WebkitMaskSize: 'contain',
                                            maskSize: 'contain',
                                            WebkitMaskRepeat: 'no-repeat',
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',
                                            maskPosition: 'center'
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <div className="w-full space-y-2">
                            <label className="block text-[11px] font-bold text-amber-800 uppercase">Ajustar Colores al Vuelo:</label>
                            <div className="grid grid-cols-2 gap-2">
                                {capas.map(capa => (
                                    <div key={capa.id} className="flex items-center justify-between bg-amber-50 p-2 rounded-xl border border-amber-200 text-xs">
                                        <span className="font-bold truncate max-w-[90px]">{capa.nombreCapa}</span>
                                        <input 
                                            type="color" 
                                            value={coloresVivos[capa.id] || capa.colorDefault} 
                                            onChange={(e) => cambiarColorCapa(capa.id, e.target.value)}
                                            className="w-7 h-7 rounded-lg border border-amber-300 cursor-pointer bg-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Gestor de Capas y Nuevo Formulario */}
                    <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md">
                        <h3 className="font-bold text-xs mb-1 text-amber-900 flex justify-between items-center">
                            <span>📚 Orden de Apilamiento ({capas.length})</span>
                        </h3>
                        <p className="text-[10px] text-amber-700 mb-3">El elemento 1 queda al fondo y los superiores se enciman.</p>
                        
                        <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                            {capas.map((c, i) => (
                                <li key={c.id} className="text-xs bg-amber-50 p-2 rounded-xl border border-amber-200 flex justify-between items-center shadow-xs gap-2">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <b className="bg-amber-200 px-1.5 py-0.5 rounded text-[11px]">{i + 1}</b>
                                        <span className="font-medium text-amber-900 truncate">
                                            {c.nombreCapa} <code className="bg-white px-1 py-0.5 rounded border border-amber-200 text-[10px] ml-1">{c.archivo}</code>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => moverCapa(i, 'arriba')} disabled={i === 0} className="px-1.5 py-1 bg-amber-200 hover:bg-amber-300 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer">⬆️</button>
                                        <button onClick={() => moverCapa(i, 'abajo')} disabled={i === capas.length - 1} className="px-1.5 py-1 bg-amber-200 hover:bg-amber-300 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer">⬇️</button>
                                        <button onClick={() => eliminarCapa(c.id)} className="text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-100 rounded-lg text-[10px] cursor-pointer ml-1">✕</button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* FORMULARIO DE NUEVA CAPA CON ESTÉTICA ARTESANAL */}
                        <div className="bg-gradient-to-br from-amber-100/70 to-orange-50 p-4 rounded-3xl border-2 border-amber-300/80 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                                    <span>✨</span> Cargar Nueva Capa SVG
                                </p>
                                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-full">Modular</span>
                            </div>
                            
                            {/* 1. Subida del archivo con diseño punteado */}
                            <div>
                                <label className="block text-[11px] font-bold text-amber-900 mb-1">1. Archivo SVG del accesorio:</label>
                                <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white/60 p-2.5 rounded-2xl transition-colors text-center cursor-pointer">
                                    <input 
                                        type="file" 
                                        id="svgFileInput"
                                        accept=".svg" 
                                        onChange={handleFileChange}
                                        className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer text-amber-900"
                                    />
                                </div>
                                {nuevaCapa.previewUrl && (
                                    <p className="text-[10px] text-emerald-700 mt-1 font-bold text-center">✓ SVG cargado y listo para pruebas</p>
                                )}
                            </div>

                            {/* 2. Nombre de la Capa y Color Base */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-amber-900">2. Detalles de la Capa:</label>
                                <input 
                                    type="text" 
                                    placeholder="Nombre (ej: Sombrero, Zapatos)" 
                                    value={nuevaCapa.nombreCapa} 
                                    onChange={(e) => setNuevaCapa({...nuevaCapa, nombreCapa: e.target.value})} 
                                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-2xl text-xs bg-white text-amber-950 outline-none focus:border-amber-500 font-medium shadow-inner" 
                                />
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border-2 border-amber-300 shadow-inner">
                                    <span className="text-[11px] font-bold text-amber-900">Color por defecto:</span>
                                    <input 
                                        type="color" 
                                        value={nuevaCapa.colorDefault} 
                                        onChange={(e) => setNuevaCapa({...nuevaCapa, colorDefault: e.target.value})} 
                                        className="w-7 h-7 rounded-xl border border-amber-300 cursor-pointer bg-transparent ml-auto" 
                                    />
                                </div>
                            </div>

                            {/* 3. CONSTRUCTOR INTERACTIVO DE PALETA (¡NUEVO!) */}
                            <div className="bg-white/80 p-3 rounded-2xl border-2 border-amber-200 shadow-xs space-y-2">
                                <label className="block text-[11px] font-black text-amber-900 uppercase">3. Constructor de Paleta Recomendada:</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-300">
                                        <span className="text-[10px] font-bold text-amber-800">Elegir color:</span>
                                        <input 
                                            type="color" 
                                            value={nuevaCapa.colorTemp} 
                                            onChange={(e) => setNuevaCapa({...nuevaCapa, colorTemp: e.target.value})} 
                                            className="w-6 h-6 rounded-lg border border-amber-300 cursor-pointer bg-transparent" 
                                        />
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleAgregarColorAPaleta}
                                        className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1"
                                    >
                                        <span className="text-sm leading-none">+</span> Añadir a Paleta
                                    </button>
                                </div>

                                {/* Lista visual de colores añadidos */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {nuevaCapa.paletaColors.map((hex) => (
                                        <div 
                                            key={hex} 
                                            className="flex items-center gap-1 bg-amber-100 border border-amber-300 px-2 py-1 rounded-xl shadow-xs"
                                        >
                                            <span className="w-4 h-4 rounded-full border border-amber-950 shadow-xs" style={{ backgroundColor: hex }}></span>
                                            <span className="text-[10px] font-mono font-bold text-amber-900">{hex}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleEliminarColorDePaleta(hex)}
                                                className="text-red-700 hover:text-red-900 font-bold text-xs ml-1 cursor-pointer"
                                                title="Eliminar color"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={handleAgregarCapa} 
                                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md uppercase tracking-wider"
                            >
                                🚀 Añadir Capa y Actualizar Código
                            </button>
                            
                            <p className="text-[9px] text-amber-800 text-center italic">
                                Nota: Recuerda mover tu archivo SVG físicamente a la carpeta public de VS Code.
                            </p>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: CÓDIGO */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-[#1e1e1e] p-5 rounded-3xl border-2 border-amber-500 shadow-xl flex flex-col h-full">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-black text-amber-400 uppercase tracking-wider">
                                💻 Código JSX Listo para Producción
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono">Actualización en tiempo real</span>
                        </div>
                        <textarea 
                            readOnly
                            value={generarCodigoJSX()}
                            className="w-full flex-1 min-h-[520px] p-4 bg-[#141414] text-[#9cdcfe] font-mono text-xs rounded-2xl shadow-inner resize-none focus:outline-none leading-relaxed border border-gray-800"
                        />
                        <button 
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(generarCodigoJSX());
                                alert('¡Código copiado al portapapeles! 📋 Recuerda también copiar los archivos SVG reales a tu carpeta public/avatares.');
                            }}
                            className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2"
                        >
                            <span>📋</span> Copiar Todo el Código Estructurado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}