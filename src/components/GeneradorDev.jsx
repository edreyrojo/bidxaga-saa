import React, { useState } from 'react';

export default function GeneradorDev({ onBack }) {
    // Modo de trabajo: 'avatar' (completo) o 'asset' (componente individual)
    const [modoGenerador, setModoGenerador] = useState('avatar');

    // Biblioteca de carpetas en estado dinamico
    const [bibliotecaAvatares, setBibliotecaAvatares] = useState([
        { id: 'personaje1', nombre: 'Personaje 1 (Clásico)', icon: '👤' },
        { id: 'masculino', nombre: 'Base Masculina', icon: '👦' },
        { id: 'femenino', nombre: 'Base Femenina', icon: '👧' },
        { id: 'espada', nombre: 'Asset: Espada', icon: '⚔️' }
    ]);

    const [nombrePersonaje, setNombrePersonaje] = useState('personaje1');
    
    // Lista de capas dinamicas (orden de apilamiento: primero fondo)
    const [capas, setCapas] = useState([
        { 
            id: 'silueta', 
            nombreCapa: 'Silueta / Ropa Base', 
            colorDefault: '#1A1A1A', 
            paleta: ['#1A1A1A', '#333333', '#555555', '#7F8C8D', '#BDC3C7', '#FFFFFF'],
            editable: true,
            variantes: [
                { id: 'var1', nombre: 'Ropa Clásica', archivo: '1silueta.svg', costo: 0, previewUrl: null }
            ]
        },
        { 
            id: 'piel', 
            nombreCapa: 'Tono de Piel', 
            colorDefault: '#F5C6A0', 
            paleta: ['#F5C6A0', '#E0AC69', '#C68642', '#8D5524', '#ffdbac', '#f1c27d'],
            editable: true,
            variantes: [
                { id: 'var1', nombre: 'Piel Base', archivo: '1piel.svg', costo: 0, previewUrl: null }
            ]
        },
        { 
            id: 'cabello', 
            nombreCapa: 'Cabello', 
            colorDefault: '#4A3525', 
            paleta: ['#4A3525', '#2C3E50', '#8E44AD', '#D35400', '#C0392B', '#F39C12'],
            editable: true,
            variantes: [
                { id: 'var1', nombre: 'Cabello Clásico', archivo: '1cabello.svg', costo: 0, previewUrl: null },
                { id: 'var2', nombre: 'Cabello Corto', archivo: '2cabello.svg', costo: 50, previewUrl: null }
            ]
        },
    ]);

    // Estados de colores para la previsualizacion
    const [coloresVivos, setColoresVivos] = useState({
        silueta: '#1A1A1A',
        piel: '#F5C6A0',
        cabello: '#4A3525'
    });

    // Variante activa seleccionada por cada capa
    const [variantesActivas, setVariantesActivas] = useState({
        silueta: '1silueta.svg',
        piel: '1piel.svg',
        cabello: '1cabello.svg'
    });

    // Estado temporal para agregar o editar capas
    const [nuevaCapa, setNuevaCapa] = useState({ 
        nombreCapa: '', 
        colorDefault: '#E65100', 
        colorTemp: '#E65100', 
        paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C', '#7B1FA2'], 
        variantesTemp: [
            { id: 'v1', nombre: 'Principal', archivo: '1archivo.svg', costo: 0, archivoFile: null, previewUrl: null }
        ]
    });

    // ID de la capa en edicion
    const [capaEditandoId, setCapaEditandoId] = useState(null);

    // Historial de colores recientes
    const [coloresRecientes, setColoresRecientes] = useState(['#1A1A1A', '#F5C6A0', '#4A3525', '#FFFFFF', '#E65100', '#1976D2']);

    const agregarColorReciente = (hex) => {
        if (!hex) return;
        setColoresRecientes(prev => {
            if (prev[0] === hex) return prev; 
            const filtrados = prev.filter(c => c !== hex);
            return [hex, ...filtrados].slice(0, 6);
        });
    };

    const eliminarAvatarDeBiblioteca = (idAEliminar, e) => {
        e.stopPropagation(); 
        if (bibliotecaAvatares.length <= 1) {
            alert('Debe haber al menos un elemento en la biblioteca.');
            return;
        }
        const nuevaBiblioteca = bibliotecaAvatares.filter(av => av.id !== idAEliminar);
        setBibliotecaAvatares(nuevaBiblioteca);
        
        if (nombrePersonaje === idAEliminar) {
            setNombrePersonaje(nuevaBiblioteca[0].id);
        }
    };

    const handleNuevoPersonaje = () => {
        const nombreInput = prompt("Ingresa el nombre del nuevo contenedor (ej: guerrero, o asset_escudo):", "nuevo_" + (bibliotecaAvatares.length + 1));
        if (!nombreInput) return;
        
        const folderLimpio = nombreInput.toLowerCase().replace(/\s+/g, '_');
        
        if (!bibliotecaAvatares.some(av => av.id === folderLimpio)) {
            setBibliotecaAvatares(prev => [...prev, { id: folderLimpio, nombre: folderLimpio, icon: modoGenerador === 'asset' ? '🧩' : '🎨' }]);
        }

        setNombrePersonaje(folderLimpio);
        setCapas([]);
        setColoresVivos({});
        setVariantesActivas({});
        setCapaEditandoId(null);
        setNuevaCapa({
            nombreCapa: '', 
            colorDefault: '#E65100', 
            colorTemp: '#E65100', 
            paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C'], 
            variantesTemp: [
                { id: 'v1', nombre: 'Principal', archivo: '1principal.svg', costo: 0, archivoFile: null, previewUrl: null }
            ]
        });
    };

    const handleVarianteFileChange = (indexVar, e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            let nombreSugerido = file.name.replace(/\.[^/.]+$/, "");
            nombreSugerido = nombreSugerido.charAt(0).toUpperCase() + nombreSugerido.slice(1);

            setNuevaCapa(prev => {
                const nuevasVariantes = [...prev.variantesTemp];
                nuevasVariantes[indexVar] = {
                    ...nuevasVariantes[indexVar],
                    archivoFile: file,
                    archivo: file.name,
                    previewUrl: tempUrl,
                    nombre: nuevasVariantes[indexVar].nombre || nombreSugerido
                };
                return { 
                    ...prev, 
                    variantesTemp: nuevasVariantes,
                    nombreCapa: prev.nombreCapa || nombreSugerido
                };
            });
        }
    };

    const agregarVarianteTemp = () => {
        const num = nuevaCapa.variantesTemp.length + 1;
        setNuevaCapa(prev => ({
            ...prev,
            variantesTemp: [
                ...prev.variantesTemp,
                { id: `v${num}`, nombre: `Variante ${num}`, archivo: `${num}archivo.svg`, costo: 0, archivoFile: null, previewUrl: null }
            ]
        }));
    };

    const eliminarVarianteTemp = (indexVar) => {
        if (nuevaCapa.variantesTemp.length <= 1) {
            alert('La capa debe tener al menos una variante SVG.');
            return;
        }
        setNuevaCapa(prev => ({
            ...prev,
            variantesTemp: prev.variantesTemp.filter((_, idx) => idx !== indexVar)
        }));
    };

    const handleAgregarColorAPaleta = () => {
        const colorNuevo = nuevaCapa.colorTemp;
        if (!nuevaCapa.paletaColors.includes(colorNuevo)) {
            setNuevaCapa(prev => ({
                ...prev,
                paletaColors: [...prev.paletaColors, colorNuevo]
            }));
        }
        agregarColorReciente(colorNuevo);
    };

    const handleEliminarColorDePaleta = (hexABorrar) => {
        setNuevaCapa(prev => {
            const nuevaPaleta = prev.paletaColors.filter(h => h !== hexABorrar);
            return {
                ...prev,
                paletaColors: nuevaPaleta.length === 0 ? ['#000000'] : nuevaPaleta
            };
        });
    };

    const handleVaciarPaleta = () => {
        setNuevaCapa(prev => ({
            ...prev,
            paletaColors: ['#000000']
        }));
    };

    const iniciarEdicionCapa = (capa) => {
        setCapaEditandoId(capa.id);
        setNuevaCapa({
            nombreCapa: capa.nombreCapa,
            colorDefault: capa.colorDefault,
            colorTemp: capa.colorDefault,
            paletaColors: [...(capa.paleta || [capa.colorDefault])],
            variantesTemp: capa.variantes && capa.variantes.length > 0 
                ? capa.variantes.map(v => ({ ...v, archivoFile: null })) 
                : [{ id: 'v1', nombre: 'Principal', archivo: capa.archivo || '1archivo.svg', costo: 0, archivoFile: null, previewUrl: capa.previewUrl || null }]
        });
    };

    const cancelarEdicion = () => {
        setCapaEditandoId(null);
        setNuevaCapa({
            nombreCapa: '', 
            colorDefault: '#E65100', 
            colorTemp: '#E65100', 
            paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C'], 
            variantesTemp: [
                { id: 'v1', nombre: 'Principal', archivo: '1archivo.svg', costo: 0, archivoFile: null, previewUrl: null }
            ]
        });
    };

    const handleGuardarCapa = () => {
        if (!nuevaCapa.nombreCapa.trim()) {
            alert('Falta nombre');
            return;
        }

        const idGenerado = nuevaCapa.nombreCapa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

        const paletaArray = nuevaCapa.paletaColors.length > 0 ? nuevaCapa.paletaColors : [nuevaCapa.colorDefault];

        const variantesFinales = nuevaCapa.variantesTemp.map((v, i) => ({
            id: v.id || `v${i + 1}`,
            nombre: v.nombre.trim() || `Variante ${i + 1}`,
            archivo: v.archivoFile ? v.archivoFile.name : (v.archivo || `${i + 1}${idGenerado}.svg`),
            costo: Number(v.costo) || 0,
            previewUrl: v.previewUrl || null
        }));

        if (capaEditandoId !== null) {
            setCapas(capas.map(c => {
                if (c.id === capaEditandoId) {
                    return {
                        ...c,
                        id: idGenerado,
                        nombreCapa: nuevaCapa.nombreCapa.trim(),
                        colorDefault: nuevaCapa.colorDefault,
                        paleta: paletaArray,
                        variantes: variantesFinales
                    };
                }
                return c;
            }));

            if (!variantesActivas[idGenerado] && variantesFinales.length > 0) {
                setVariantesActivas(prev => ({ ...prev, [idGenerado]: variantesFinales[0].archivo }));
            }

            if (capaEditandoId !== idGenerado) {
                setColoresVivos(prev => {
                    const copy = { ...prev };
                    const colorActual = copy[capaEditandoId] || nuevaCapa.colorDefault;
                    delete copy[capaEditandoId];
                    copy[idGenerado] = colorActual;
                    return copy;
                });
                
                setVariantesActivas(prev => {
                    const copy = { ...prev };
                    const varActiva = copy[capaEditandoId];
                    delete copy[capaEditandoId];
                    if(varActiva) copy[idGenerado] = varActiva;
                    return copy;
                });
            } else {
                setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
            }
            setCapaEditandoId(null);
        } else {
            if (capas.some(c => c.id === idGenerado)) {
                alert('ID repetido');
                return;
            }

            const nuevaCapaObj = {
                id: idGenerado,
                nombreCapa: nuevaCapa.nombreCapa.trim(),
                colorDefault: nuevaCapa.colorDefault,
                paleta: paletaArray,
                editable: true,
                variantes: variantesFinales
            };

            setCapas([...capas, nuevaCapaObj]);
            setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
            if (variantesFinales.length > 0) {
                setVariantesActivas(prev => ({ ...prev, [idGenerado]: variantesFinales[0].archivo }));
            }
        }
        
        cancelarEdicion();
    };

    const eliminarCapa = (idABorrar) => {
        if (capas.length <= 1) return;
        setCapas(capas.filter(capa => capa.id !== idABorrar));
        const copyColores = { ...coloresVivos };
        delete copyColores[idABorrar];
        setColoresVivos(copyColores);
        
        const copyVariantes = { ...variantesActivas };
        delete copyVariantes[idABorrar];
        setVariantesActivas(copyVariantes);
        
        if (capaEditandoId === idABorrar) cancelarEdicion();
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

    const toggleCapaEditable = (id) => {
        setCapas(capas.map(c => c.id === id ? { ...c, editable: c.editable === false ? true : false } : c));
    };

    const getArchivoActivo = (capa) => {
        if (!capa.variantes || capa.variantes.length === 0) return capa.archivo || '1archivo.svg';
        const activo = variantesActivas[capa.id];
        if (activo && capa.variantes.some(v => v.archivo === activo)) return activo;
        return capa.variantes[0].archivo;
    };

    const getPreviewUrlActivo = (capa) => {
        if (!capa.variantes || capa.variantes.length === 0) return capa.previewUrl || null;
        const archivoActual = getArchivoActivo(capa);
        const varianteEncontrada = capa.variantes.find(v => v.archivo === archivoActual);
        return varianteEncontrada ? varianteEncontrada.previewUrl : null;
    };

    // GENERADOR DE CODIGO DOBLE (AVATAR O ASSET)
    const generarCodigoJSX = () => {
        let codigo = "";

        if (modoGenerador === 'asset') {
            const nombreComp = nombrePersonaje.charAt(0).toUpperCase() + nombrePersonaje.slice(1);
            
            codigo += `/* =============================================================\n`;
            codigo += `   🧩 COMPONENTE ASSET: ${nombreComp} (Multi-Color)\n`;
            codigo += `   Listo para importar en cualquier parte de la app.\n`;
            codigo += `   ============================================================= */\n\n`;
            codigo += `import React from 'react';\n\n`;
            
            codigo += `export default function ${nombreComp}({ \n`;
            capas.forEach(capa => {
                if (capa.editable !== false) {
                    const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                    codigo += `    color${idCap} = '${coloresVivos[capa.id] || capa.colorDefault}',\n`;
                }
            });
            codigo += `    className = "w-16 h-16" // Ajusta el tamaño al llamarlo\n`;
            codigo += `}) {\n`;
            codigo += `    return (\n`;
            codigo += `        <div className={\`relative \${className} overflow-hidden flex items-center justify-center\`}>\n`;
            
            capas.forEach((capa, index) => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                const archivoActivo = getArchivoActivo(capa); // Toma el archivo de la variante visualizada
                
                codigo += `            {/* ${index + 1}. Capa: ${capa.nombreCapa} */}\n`;
                codigo += `            <div \n`;
                codigo += `                className="absolute inset-0 pointer-events-none"\n`;
                codigo += `                style={{\n`;
                if (capa.editable !== false) {
                    codigo += `                    backgroundColor: color${idCap},\n`;
                    codigo += `                    WebkitMaskImage: \`url(/avatares/${nombrePersonaje}/${archivoActivo})\`,\n`;
                    codigo += `                    maskImage: \`url(/avatares/${nombrePersonaje}/${archivoActivo})\`,\n`;
                    codigo += `                    WebkitMaskSize: 'contain',\n`;
                    codigo += `                    maskSize: 'contain',\n`;
                    codigo += `                    WebkitMaskRepeat: 'no-repeat',\n`;
                    codigo += `                    maskRepeat: 'no-repeat',\n`;
                    codigo += `                    WebkitMaskPosition: 'center',\n`;
                    codigo += `                    maskPosition: 'center'\n`;
                } else {
                    codigo += `                    backgroundImage: \`url(/avatares/${nombrePersonaje}/${archivoActivo})\`,\n`;
                    codigo += `                    backgroundSize: 'contain',\n`;
                    codigo += `                    backgroundRepeat: 'no-repeat',\n`;
                    codigo += `                    backgroundPosition: 'center'\n`;
                }
                codigo += `                }}\n`;
                codigo += `            />\n`;
            });
            
            codigo += `        </div>\n`;
            codigo += `    );\n`;
            codigo += `}\n`;

        } else {
            // Generacion estandar para el Perfil (Avatar)
            codigo += `/* =============================================================\n`;
            codigo += `   👤 CÓDIGO GENERADO PARA: ${nombrePersonaje} (Con Variantes Múltiples)\n`;
            codigo += `   ============================================================= */\n\n`;

            codigo += `// 1. ESTADOS\n`;
            codigo += `const [personajeBase, setPersonajeBase] = useState('${nombrePersonaje}');\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                if (capa.editable !== false) {
                    codigo += `const [color${idCap}, setColor${idCap}] = useState('${coloresVivos[capa.id] || capa.colorDefault}');\n`;
                }
                const varianteDefault = capa.variantes && capa.variantes.length > 0 ? capa.variantes[0].archivo : (capa.archivo || '1archivo.svg');
                codigo += `const [variante${idCap}, setVariante${idCap}] = useState('${varianteDefault}');\n`;
            });

            codigo += `\n// 2. CATÁLOGO DE VARIANTES\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                const variantesJson = JSON.stringify(capa.variantes || [], null, 4);
                codigo += `const variantes${idCap} = ${variantesJson};\n`;
            });

            codigo += `\n// 3. PALETAS\n`;
            capas.forEach(capa => {
                if (capa.editable !== false) {
                    const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                    const paletaJson = JSON.stringify(capa.paleta || [capa.colorDefault, '#E65100', '#D32F2F', '#1976D2']);
                    codigo += `const paleta${idCap} = ${paletaJson};\n`;
                }
            });

            codigo += `\n// 4. ESTRUCTURA (Visor Absoluto)\n`;
            codigo += `<div className="relative w-48 h-48 mx-auto bg-white rounded-3xl overflow-hidden">\n`;
            capas.forEach((capa, index) => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `    {/* ${index + 1}. ${capa.nombreCapa} */}\n`;
                codigo += `    <div\n`;
                codigo += `        className="absolute inset-0 pointer-events-none transition-colors duration-250"\n`;
                codigo += `        style={{\n`;
                if (capa.editable !== false) {
                    codigo += `            backgroundColor: color${idCap},\n`;
                    codigo += `            WebkitMaskImage: \`url(/avatares/\${personajeBase}/\${variante${idCap}})\`,\n`;
                    codigo += `            maskImage: \`url(/avatares/\${personajeBase}/\${variante${idCap}})\`,\n`;
                    codigo += `            WebkitMaskSize: 'contain',\n`;
                    codigo += `            maskSize: 'contain',\n`;
                    codigo += `            WebkitMaskRepeat: 'no-repeat',\n`;
                    codigo += `            maskRepeat: 'no-repeat',\n`;
                    codigo += `            WebkitMaskPosition: 'center',\n`;
                    codigo += `            maskPosition: 'center'\n`;
                } else {
                    codigo += `            backgroundImage: \`url(/avatares/\${personajeBase}/\${variante${idCap}})\`,\n`;
                    codigo += `            backgroundSize: 'contain',\n`;
                    codigo += `            backgroundRepeat: 'no-repeat',\n`;
                    codigo += `            backgroundPosition: 'center'\n`;
                }
                codigo += `        }}\n`;
                codigo += `    />\n`;
            });
            codigo += `</div>\n`;
        }

        return codigo;
    };

    const capasEditables = capas.filter(c => c.editable !== false);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-amber-50 rounded-3xl border-4 border-amber-400 shadow-2xl my-6 font-sans text-amber-950">
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b-2 border-amber-200">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer">
                            ←
                        </button>
                    )}
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        {modoGenerador === 'avatar' ? '👤 Constructor Avatar' : '🧩 Constructor Asset'}
                    </h2>
                </div>
                
                <div className="flex bg-amber-200 rounded-2xl p-1 border border-amber-400 shadow-inner">
                    <button 
                        onClick={() => setModoGenerador('avatar')} 
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoGenerador === 'avatar' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-900 hover:bg-amber-300'}`}
                    >
                        👤 Avatar
                    </button>
                    <button 
                        onClick={() => setModoGenerador('asset')} 
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoGenerador === 'asset' ? 'bg-emerald-600 text-white shadow-md' : 'text-amber-900 hover:bg-amber-300'}`}
                    >
                        🧩 Asset Simple
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleNuevoPersonaje} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5">
                        ➕ Nuevo
                    </button>
                    <span className="text-xs font-bold bg-amber-200 text-amber-900 px-3 py-2 rounded-xl border border-amber-300">
                        Admin
                    </span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border-2 border-amber-300 shadow-sm mb-6">
                <h3 className="text-xs font-black uppercase text-amber-900 mb-3 flex items-center justify-between">
                    <span>📚 Biblioteca</span>
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
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-5 flex flex-col gap-5">
                    
                    <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-md flex flex-col items-center">
                        <h3 className="font-black text-xs text-amber-900 uppercase tracking-wider mb-3">
                            👁️ Visor ({nombrePersonaje})
                        </h3>
                        
                        <div className="relative w-56 h-56 bg-amber-50 rounded-3xl border-4 border-amber-400 flex items-center justify-center shadow-inner overflow-hidden mb-4">
                            {capas.length === 0 ? (
                                <div className="text-center p-4">
                                    <span className="text-2xl">🎨</span>
                                </div>
                            ) : (
                                capas.map((capa) => {
                                    const previewUrlActiva = getPreviewUrlActivo(capa);
                                    const archivoActivo = getArchivoActivo(capa);
                                    const maskUrl = previewUrlActiva ? `url(${previewUrlActiva})` : `url(/avatares/${nombrePersonaje}/${archivoActivo})`;
                                    
                                    if (capa.editable === false) {
                                        return (
                                            <div
                                                key={capa.id}
                                                className="absolute inset-0 pointer-events-none transition-all duration-200"
                                                style={{
                                                    backgroundImage: maskUrl,
                                                    backgroundSize: 'contain',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'center'
                                                }}
                                            />
                                        );
                                    }

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
                            <div className="w-full space-y-3">
                                <label className="block text-[11px] font-bold text-amber-800 uppercase">🖌️ Ajustes Vivos:</label>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {capas.map(capa => {
                                        const archivoActual = getArchivoActivo(capa);
                                        return (
                                            <div key={capa.id} className="flex flex-col bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-amber-900">{capa.nombreCapa}</span>
                                                    {capa.editable !== false && (
                                                        <input 
                                                            type="color" 
                                                            value={coloresVivos[capa.id] || capa.colorDefault} 
                                                            onChange={(e) => setColoresVivos(prev => ({ ...prev, [capa.id]: e.target.value }))}
                                                            onBlur={(e) => agregarColorReciente(e.target.value)}
                                                            className="w-6 h-6 rounded-md border border-amber-300 cursor-pointer bg-transparent"
                                                        />
                                                    )}
                                                </div>

                                                {capa.variantes && capa.variantes.length > 1 && (
                                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-amber-200/60">
                                                        {capa.variantes.map(v => (
                                                            <button
                                                                key={v.id || v.archivo}
                                                                type="button"
                                                                onClick={() => setVariantesActivas(prev => ({ ...prev, [capa.id]: v.archivo }))}
                                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                                                    archivoActual === v.archivo
                                                                        ? 'bg-amber-700 text-white shadow-xs'
                                                                        : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                                                                }`}
                                                            >
                                                                {v.nombre}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md">
                        <h3 className="font-bold text-xs mb-1 text-amber-900 flex justify-between items-center">
                            <span>{modoGenerador === 'asset' ? '📑 PIEZAS DE COLOR' : '📚 CATEGORÍAS'} ({capas.length})</span>
                        </h3>
                        
                        {capas.length === 0 ? (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center text-xs text-amber-800 mb-4 font-medium">
                                Vacío.
                            </div>
                        ) : (
                            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                                {capas.map((c, i) => (
                                    <li key={c.id} className={`text-xs p-2 rounded-xl border flex justify-between items-center shadow-xs gap-2 ${capaEditandoId === c.id ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className="flex items-center gap-1.5 truncate">
                                            <b className="bg-amber-200 px-1.5 py-0.5 rounded text-[11px]">{i + 1}</b>
                                            <span className="font-medium text-amber-900 truncate">
                                                {c.nombreCapa}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button 
                                                onClick={() => toggleCapaEditable(c.id)} 
                                                className={`px-1.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${c.editable === false ? 'bg-gray-300 opacity-80' : 'bg-blue-100'}`}
                                            >
                                                {c.editable === false ? '🔒' : '🎨'}
                                            </button>
                                            <button onClick={() => iniciarEdicionCapa(c)} className="px-1.5 py-1 bg-amber-200 rounded-lg text-xs font-bold cursor-pointer">✏️</button>
                                            <button onClick={() => moverCapa(i, 'arriba')} disabled={i === 0} className="px-1.5 py-1 bg-amber-200 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer">⬆️</button>
                                            <button onClick={() => moverCapa(i, 'abajo')} disabled={i === capas.length - 1} className="px-1.5 py-1 bg-amber-200 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer">⬇️</button>
                                            <button onClick={() => eliminarCapa(c.id)} className="text-red-600 font-bold px-2 py-1 bg-red-100 rounded-lg text-[10px] cursor-pointer ml-1">✕</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className={`p-4 rounded-3xl border-2 shadow-sm space-y-3 ${capaEditandoId ? 'bg-gradient-to-br from-amber-200/90 to-amber-100 border-amber-500' : 'bg-gradient-to-br from-amber-100/70 to-orange-50 border-amber-300/80'}`}>
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                                    <span>{capaEditandoId ? '✏️' : '✨'}</span> Formulario 
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-amber-900">Nombre (ej: Gema, Brillo):</label>
                                <input 
                                    type="text" 
                                    value={nuevaCapa.nombreCapa} 
                                    onChange={(e) => setNuevaCapa({...nuevaCapa, nombreCapa: e.target.value})} 
                                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-2xl text-xs bg-white text-amber-950 outline-none focus:border-amber-500" 
                                />
                            </div>
                            
                            <div className="space-y-2 bg-white/80 p-3 rounded-2xl border border-amber-300">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-black text-amber-900 uppercase">SVG:</label>
                                    <button
                                        type="button"
                                        onClick={agregarVarianteTemp}
                                        className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] cursor-pointer"
                                    >
                                        ➕ Variante
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {nuevaCapa.variantesTemp.map((v, indexVar) => (
                                        <div key={v.id || indexVar} className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <input 
                                                    type="text"
                                                    placeholder="Nombre"
                                                    value={v.nombre}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNuevaCapa(prev => {
                                                            const copy = [...prev.variantesTemp];
                                                            copy[indexVar].nombre = val;
                                                            return { ...prev, variantesTemp: copy };
                                                        });
                                                    }}
                                                    className="flex-1 px-2 py-1 border border-amber-300 rounded-lg text-xs bg-white outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarVarianteTemp(indexVar)}
                                                    className="text-red-600 bg-red-100 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="file"
                                                    accept=".svg"
                                                    onChange={(e) => handleVarianteFileChange(indexVar, e)}
                                                    className="w-full text-[10px] file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-amber-600 file:text-white cursor-pointer hover:file:bg-amber-700"
                                                />
                                                {v.previewUrl && <span className="text-[10px] text-emerald-700 font-bold shrink-0">✓</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white p-2 rounded-2xl border-2 border-amber-300 shadow-inner flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-900">Color Base:</span>
                                <input 
                                    type="color" 
                                    value={nuevaCapa.colorDefault} 
                                    onChange={(e) => setNuevaCapa({...nuevaCapa, colorDefault: e.target.value})} 
                                    onBlur={(e) => agregarColorReciente(e.target.value)}
                                    className="w-7 h-7 rounded-xl border border-amber-300 cursor-pointer bg-transparent" 
                                />
                            </div>

                            <div className="bg-white/80 p-3 rounded-2xl border-2 border-amber-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black text-amber-900 uppercase">Paleta:</label>
                                    <button 
                                        type="button"
                                        onClick={handleVaciarPaleta}
                                        className="text-[9px] text-red-600 border border-red-200 px-2 py-0.5 rounded-full cursor-pointer"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={nuevaCapa.colorTemp} 
                                        onChange={(e) => setNuevaCapa({...nuevaCapa, colorTemp: e.target.value})} 
                                        onBlur={(e) => agregarColorReciente(e.target.value)}
                                        className="w-6 h-6 rounded-lg border border-amber-300 cursor-pointer bg-transparent" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAgregarColorAPaleta}
                                        className="bg-amber-700 text-white font-bold py-1 px-2 rounded-xl text-[10px] cursor-pointer"
                                    >
                                        ➕ Añadir
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {nuevaCapa.paletaColors.map((hex, idx) => (
                                        <div key={`${hex}-${idx}`} className="flex items-center gap-1 bg-amber-100 border border-amber-300 px-2 py-1 rounded-xl shadow-xs">
                                            <span className="w-4 h-4 rounded-full border border-amber-950" style={{ backgroundColor: hex }}></span>
                                            <span className="text-[10px] font-mono font-bold text-amber-900">{hex}</span>
                                            <button type="button" onClick={() => handleEliminarColorDePaleta(hex)} className="text-red-700 font-bold text-xs ml-1 cursor-pointer">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {capaEditandoId && (
                                    <button type="button" onClick={cancelarEdicion} className="bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-2xl text-xs cursor-pointer">
                                        ❌
                                    </button>
                                )}
                                <button type="button" onClick={handleGuardarCapa} className="flex-1 bg-amber-600 text-white font-black py-3 rounded-2xl text-xs cursor-pointer uppercase">
                                    {capaEditandoId ? '💾 Guardar' : '🚀 Añadir'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-[#1e1e1e] p-5 rounded-3xl border-2 border-amber-500 shadow-xl flex flex-col h-full">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-black text-amber-400 uppercase tracking-wider">
                                💻 Código Listo
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono text-right max-w-[120px]">
                                {modoGenerador === 'asset' ? 'Componente Limpio' : 'Estado Completo'}
                            </span>
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
                                alert('¡Código copiado al portapapeles! 📋');
                            }}
                            className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl cursor-pointer text-sm flex items-center justify-center gap-2"
                        >
                            📋 Copiar Componente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}