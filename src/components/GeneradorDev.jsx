import React, { useState } from 'react';

export default function GeneradorDev({ onBack }) {
    // 🛍️ Biblioteca de carpetas de avatares en estado dinámico (permite borrar pruebas)
    const [bibliotecaAvatares, setBibliotecaAvatares] = useState([
        { id: 'personaje1', nombre: 'Personaje 1 (Clásico)', icon: '👤' },
        { id: 'masculino', nombre: 'Base Masculina', icon: '👦' },
        { id: 'femenino', nombre: 'Base Femenina', icon: '👧' },
        { id: 'personaje2', nombre: 'Personaje 2', icon: '🌟' }
    ]);

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

    // Estado temporal para agregar o editar capas con constructor interactivo de paleta
    const [nuevaCapa, setNuevaCapa] = useState({ 
        nombreCapa: '', 
        colorDefault: '#E65100', 
        colorTemp: '#E65100', 
        paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C', '#7B1FA2'], 
        archivoFile: null,
        previewUrl: null
    });

    // ID de la capa que se está editando actualmente (null si estamos creando una nueva)
    const [capaEditandoId, setCapaEditandoId] = useState(null);

    // 🕒 Historial de colores usados recientemente en el constructor
    const [coloresRecientes, setColoresRecientes] = useState(['#1A1A1A', '#F5C6A0', '#4A3525', '#FFFFFF']);

    // 🗑️ Función para eliminar un personaje de la biblioteca
    const eliminarAvatarDeBiblioteca = (idAEliminar, e) => {
        e.stopPropagation(); // Evita que se seleccione el avatar al dar clic en la 'X'
        if (bibliotecaAvatares.length <= 1) {
            alert('Debe haber al menos un personaje en la biblioteca.');
            return;
        }
        const nuevaBiblioteca = bibliotecaAvatares.filter(av => av.id !== idAEliminar);
        setBibliotecaAvatares(nuevaBiblioteca);
        
        // Si el personaje eliminado era el que estaba activo, cambiamos al primero disponible
        if (nombrePersonaje === idAEliminar) {
            setNombrePersonaje(nuevaBiblioteca[0].id);
        }
    };

    // ✨ Función para comenzar un nuevo personaje completamente desde cero
    const handleNuevoPersonaje = () => {
        const nombreInput = prompt("Ingresa el nombre de la carpeta para el nuevo personaje (ej: personaje3, guerrero):", "personaje" + (bibliotecaAvatares.length + 1));
        if (!nombreInput) return;
        
        const folderLimpio = nombreInput.toLowerCase().replace(/\s+/g, '_');
        
        // Si no existe en la biblioteca, lo añadimos automáticamente
        if (!bibliotecaAvatares.some(av => av.id === folderLimpio)) {
            setBibliotecaAvatares(prev => [...prev, { id: folderLimpio, nombre: folderLimpio, icon: '🎨' }]);
        }

        setNombrePersonaje(folderLimpio);
        setCapas([]);
        setColoresVivos({});
        setCapaEditandoId(null);
        setNuevaCapa({
            nombreCapa: '', 
            colorDefault: '#E65100', 
            colorTemp: '#E65100', 
            paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C'], 
            archivoFile: null,
            previewUrl: null
        });
    };

    // 📁 Manejar la subida del archivo SVG para previsualización
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            let nombreSugerido = file.name.replace(/\.[^/.]+$/, "").replace(/^\d+/, '');
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
        const colorNuevo = nuevaCapa.colorTemp;
        
        // Evita duplicados en la paleta de la capa
        if (!nuevaCapa.paletaColors.includes(colorNuevo)) {
            setNuevaCapa(prev => ({
                ...prev,
                paletaColors: [...prev.paletaColors, colorNuevo]
            }));
        }

        // Guarda el color en los recientes (manteniendo máximo 6 colores en memoria)
        setColoresRecientes(prev => {
            const filtrados = prev.filter(c => c !== colorNuevo);
            return [colorNuevo, ...filtrados].slice(0, 6);
        });
    };

    // 🗑️ Eliminar un color de la lista de la paleta nueva
    const handleEliminarColorDePaleta = (hexABorrar) => {
        setNuevaCapa(prev => {
            const nuevaPaleta = prev.paletaColors.filter(h => h !== hexABorrar);
            // Si eliminamos todos los colores, devolvemos un arreglo con un color negro por defecto
            return {
                ...prev,
                paletaColors: nuevaPaleta.length === 0 ? ['#000000'] : nuevaPaleta
            };
        });
    };

    // ✏️ Iniciar edición de una capa existente desde el orden de apilamiento
    const iniciarEdicionCapa = (capa) => {
        setCapaEditandoId(capa.id);
        setNuevaCapa({
            nombreCapa: capa.nombreCapa,
            colorDefault: capa.colorDefault,
            colorTemp: capa.colorDefault,
            paletaColors: [...(capa.paleta || [capa.colorDefault])],
            archivoFile: null,
            previewUrl: capa.previewUrl || null,
            archivoOriginal: capa.archivo
        });
    };

    // ❌ Cancelar edición de capa
    const cancelarEdicion = () => {
        setCapaEditandoId(null);
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

    // 💾 Guardar Capa (Ya sea agregando nueva o actualizando una existente)
    const handleGuardarCapa = () => {
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

        const paletaArray = nuevaCapa.paletaColors.length > 0 
            ? nuevaCapa.paletaColors 
            : [nuevaCapa.colorDefault];

        if (capaEditandoId !== null) {
            // MODO EDICIÓN DE CAPA EXISTENTE
            setCapas(capas.map(c => {
                if (c.id === capaEditandoId) {
                    const archivoFinal = nuevaCapa.archivoFile 
                        ? nuevaCapa.archivoFile.name 
                        : (c.archivo || `${idGenerado}.svg`);
                    
                    return {
                        ...c,
                        id: idGenerado,
                        nombreCapa: nuevaCapa.nombreCapa.trim(),
                        colorDefault: nuevaCapa.colorDefault,
                        archivo: archivoFinal,
                        paleta: paletaArray,
                        previewUrl: nuevaCapa.previewUrl || c.previewUrl
                    };
                }
                return c;
            }));

            // Actualizar colores vivos si cambió el ID
            if (capaEditandoId !== idGenerado) {
                setColoresVivos(prev => {
                    const copy = { ...prev };
                    const colorActual = copy[capaEditandoId] || nuevaCapa.colorDefault;
                    delete copy[capaEditandoId];
                    copy[idGenerado] = colorActual;
                    return copy;
                });
            } else {
                setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
            }

            setCapaEditandoId(null);
        } else {
            // MODO CREACIÓN DE NUEVA CAPA
            if (capas.some(c => c.id === idGenerado)) {
                alert('Ya existe una capa con un identificador similar. Elige otro nombre.');
                return;
            }

            const archivoGenerado = nuevaCapa.archivoFile 
                ? nuevaCapa.archivoFile.name 
                : `${idGenerado}.svg`;

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
        }
        
        // Limpiamos el formulario
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
        if (capaEditandoId === idABorrar) {
            cancelarEdicion();
        }
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

    // 🚀 EL MOTOR DEL GENERADOR DE CÓDIGO CON CONTENEDOR ABSOLUTO MAESTRO
    const generarCodigoJSX = () => {
        let codigo = `/* =============================================================\n`;
        codigo += `   🎨 CÓDIGO GENERADO PARA: ${nombrePersonaje}\n`;
        codigo += `   Estructura estricta con Contenedor Absoluto (inset-0)\n`;
        codigo += `   ============================================================= */\n\n`;

        codigo += `// 🔄 1. ESTADOS\n`;
        codigo += `const [personajeBase, setPersonajeBase] = useState('${nombrePersonaje}');\n`;
        capas.forEach(capa => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `const [color${idCap}, setColor${idCap}] = useState('${coloresVivos[capa.id] || capa.colorDefault}');\n`;
        });

        codigo += `\n// 🎨 2. PALETAS DE COLORES\n`;
        capas.forEach(capa => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            const paletaJson = JSON.stringify(capa.paleta || [capa.colorDefault, '#E65100', '#D32F2F', '#1976D2']);
            codigo += `const paleta${idCap} = ${paletaJson};\n`;
        });

        codigo += `\n// 💾 3. OBJETO PARA GUARDAR\n`;
        codigo += `const configuracionAvatar = {\n`;
        codigo += `    tipo: personajeBase,\n`;
        capas.forEach(capa => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `    ${capa.id}: color${idCap},\n`;
        });
        codigo += `    rutaBase: \`/avatares/\${personajeBase}/\`\n`;
        codigo += `};\n`;

        codigo += `\n// 🖼️ 4. VISOR DE CAPAS (Contenedor Absoluto Milimétrico)\n`;
        codigo += `<div className="relative w-48 h-48 mx-auto bg-white rounded-3xl border-4 border-amber-300 overflow-hidden shadow-inner flex items-center justify-center select-none">\n`;
        capas.forEach((capa, index) => {
            const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
            codigo += `    {/* ${index + 1}. Capa de ${capa.nombreCapa} */}\n`;
            codigo += `    <div\n`;
            codigo += `        className="absolute inset-0 pointer-events-none transition-colors duration-250"\n`;
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

            {/* BIBLIOTECA DE AVATARES CON OPCIÓN DE BORRADO DE PRUEBAS */}
            <div className="bg-white p-4 rounded-3xl border-2 border-amber-300 shadow-sm mb-6">
                <h3 className="text-xs font-black uppercase text-amber-900 mb-3 flex items-center justify-between">
                    <span>📂 Biblioteca de Personajes (Carpetas en <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">/public/avatares/</code>)</span>
                    <span className="text-[10px] text-amber-700 font-normal">Puedes eliminar ajustes de prueba con la (✕)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                    {bibliotecaAvatares.map((avatar) => (
                        <div
                            key={avatar.id}
                            onClick={() => {
                                setNombrePersonaje(avatar.id);
                                cancelarEdicion();
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-2 ${
                                nombrePersonaje === avatar.id
                                    ? 'bg-amber-600 text-white border-amber-800 shadow-md scale-105'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            <span>{avatar.icon || avatar.icono || '📁'}</span>
                            <span>{avatar.nombre}</span>
                            <button
                                type="button"
                                onClick={(e) => eliminarAvatarDeBiblioteca(avatar.id, e)}
                                className="ml-1 text-red-600 hover:text-white hover:bg-red-600 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black transition-colors"
                                title="Eliminar este personaje/prueba de la biblioteca"
                            >
                                ✕
                            </button>
                        </div>
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
                            {capas.length === 0 ? (
                                <div className="text-center p-4">
                                    <span className="text-2xl">🎨</span>
                                    <p className="text-[11px] font-bold text-amber-800 mt-1">Sin capas agregadas aún. Carga tu primer SVG abajo.</p>
                                </div>
                            ) : (
                                capas.map((capa) => {
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
                                })
                            )}
                        </div>

                        {capas.length > 0 && (
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
                        )}
                    </div>

                    {/* Gestor de Capas y Nuevo Formulario */}
                    <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md">
                        <h3 className="font-bold text-xs mb-1 text-amber-900 flex justify-between items-center">
                            <span>📚 Orden de Apilamiento ({capas.length})</span>
                        </h3>
                        <p className="text-[10px] text-amber-700 mb-3">El elemento 1 queda al fondo y los superiores se enciman. Haz clic en ✏️ para editar cualquier capa.</p>
                        
                        {capas.length === 0 ? (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center text-xs text-amber-800 mb-4 font-medium">
                                Tu personaje está vacío. Comienza cargando tu archivo SVG.
                            </div>
                        ) : (
                            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                                {capas.map((c, i) => (
                                    <li key={c.id} className={`text-xs p-2 rounded-xl border flex justify-between items-center shadow-xs gap-2 ${capaEditandoId === c.id ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className="flex items-center gap-1.5 truncate">
                                            <b className="bg-amber-200 px-1.5 py-0.5 rounded text-[11px]">{i + 1}</b>
                                            <span className="font-medium text-amber-900 truncate">
                                                {c.nombreCapa} <code className="bg-white px-1 py-0.5 rounded border border-amber-200 text-[10px] ml-1">{c.archivo}</code>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => iniciarEdicionCapa(c)} title="Editar capa" className="px-1.5 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg text-xs font-bold cursor-pointer">✏️</button>
                                            <button onClick={() => moverCapa(i, 'arriba')} disabled={i === 0} title="Mover arriba" className="px-1.5 py-1 bg-amber-200 hover:bg-amber-300 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer">⬆️</button>
                                            <button onClick={() => moverCapa(i, 'abajo')} disabled={i === capas.length - 1} title="Mover abajo" className="px-1.5 py-1 bg-amber-200 hover:bg-amber-300 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer">⬇️</button>
                                            <button onClick={() => eliminarCapa(c.id)} title="Eliminar capa" className="text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-100 rounded-lg text-[10px] cursor-pointer ml-1">✕</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* FORMULARIO DE NUEVA / EDITAR CAPA */}
                        <div className={`p-4 rounded-3xl border-2 shadow-sm space-y-3 ${capaEditandoId ? 'bg-gradient-to-br from-amber-200/90 to-amber-100 border-amber-500' : 'bg-gradient-to-br from-amber-100/70 to-orange-50 border-amber-300/80'}`}>
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                                    <span>{capaEditandoId ? '✏️' : '✨'}</span> {capaEditandoId ? `Editando: ${nuevaCapa.nombreCapa}` : 'Cargar Nueva Capa SVG'}
                                </p>
                                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-full">Modular</span>
                            </div>
                            
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
                                    <p className="text-[10px] text-emerald-700 mt-1 font-bold text-center">✓ SVG listo</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-amber-900">2. Detalles de la Capa:</label>
                                <input 
                                    type="text" 
                                    placeholder="Nombre (ej: Silueta, Sombrero, Zapatos)" 
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

                            {/* ========================================================== */}
                            {/* 🛠️ CONSTRUCTOR DE PALETA ACTUALIZADO Y OPTIMIZADO */}
                            {/* ========================================================== */}
                            <div className="bg-white/80 p-3 rounded-2xl border-2 border-amber-200 shadow-xs space-y-2">
                                <label className="block text-[11px] font-black text-amber-900 uppercase">3. Constructor de Paleta Recomendada:</label>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-300">
                                        <span className="text-[10px] font-bold text-amber-800">Elegir:</span>
                                        <input 
                                            type="color" 
                                            value={nuevaCapa.colorTemp} 
                                            onChange={(e) => setNuevaCapa({...nuevaCapa, colorTemp: e.target.value})} 
                                            className="w-6 h-6 rounded-lg border border-amber-300 cursor-pointer bg-transparent" 
                                        />
                                    </div>
                                    
                                    {/* 🕒 Historial de colores recientes interactivo */}
                                    <div className="flex items-center gap-1.5 border-l-2 border-amber-200 pl-2">
                                        <span className="text-[9px] text-amber-600 font-bold uppercase hidden sm:block">Recientes:</span>
                                        {coloresRecientes.map(hex => (
                                            <button
                                                key={hex}
                                                type="button"
                                                onClick={() => setNuevaCapa({...nuevaCapa, colorTemp: hex})}
                                                className="w-5 h-5 rounded-full border border-amber-300 hover:scale-110 shadow-xs transition-transform cursor-pointer"
                                                style={{ backgroundColor: hex }}
                                                title={`Usar color ${hex}`}
                                            />
                                        ))}
                                    </div>

                                    {/* ➕ Botón más compacto y ajustado a la derecha */}
                                    <button 
                                        type="button"
                                        onClick={handleAgregarColorAPaleta}
                                        className="ml-auto bg-amber-700 hover:bg-amber-800 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1"
                                    >
                                        <span className="text-sm leading-none">+</span> Añadir
                                    </button>
                                </div>

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
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* ========================================================== */}

                            <div className="flex gap-2">
                                {capaEditandoId && (
                                    <button 
                                        type="button" 
                                        onClick={cancelarEdicion} 
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button 
                                    type="button" 
                                    onClick={handleGuardarCapa} 
                                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md uppercase tracking-wider"
                                >
                                    {capaEditandoId ? '💾 Guardar Cambios de Capa' : '🚀 Añadir Capa y Actualizar Código'}
                                </button>
                            </div>
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