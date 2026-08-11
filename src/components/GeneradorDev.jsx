import React, { useState } from 'react';

export default function GeneradorDev({ onBack }) {
    // Estado principal del modo
    const [modoGenerador, setModoGenerador] = useState('avatar');

    // Biblioteca de carpetas
    const [bibliotecaAvatares, setBibliotecaAvatares] = useState([
        { id: 'personaje1', nombre: 'Personaje 1 (Clásico)', icon: '👤' },
        { id: 'masculino', nombre: 'Base Masculina', icon: '👦' },
        { id: 'femenino', nombre: 'Base Femenina', icon: '👧' },
        { id: 'gafas', nombre: 'Asset: Gafas', icon: '👓' }
    ]);

    const [nombrePersonaje, setNombrePersonaje] = useState('personaje1');
    
    // Capas ahora son "Grupos" que contienen variantes, y cada variante contiene "subCapas"
    const [capas, setCapas] = useState([
        { 
            id: 'silueta', 
            nombreCapa: 'Silueta / Ropa', 
            colorDefault: '#1A1A1A', 
            paleta: ['#1A1A1A', '#333333', '#555555', '#7F8C8D', '#BDC3C7', '#FFFFFF'],
            editable: true,
            variantes: [
                { 
                    id: 'var1', 
                    nombre: 'Ropa Clásica', 
                    costo: 0, 
                    subCapas: [
                        { id: 'sc1', archivo: '1silueta.svg', editable: true, previewUrl: null }
                    ] 
                }
            ]
        },
        { 
            id: 'piel', 
            nombreCapa: 'Tono de Piel', 
            colorDefault: '#F5C6A0', 
            paleta: ['#F5C6A0', '#E0AC69', '#C68642', '#8D5524', '#ffdbac', '#f1c27d'],
            editable: true,
            variantes: [
                { 
                    id: 'var1', 
                    nombre: 'Piel Base', 
                    costo: 0, 
                    subCapas: [
                        { id: 'sc1', archivo: '1piel_base.svg', editable: true, previewUrl: null },
                        { id: 'sc2', archivo: '1piel_sombra.svg', editable: false, previewUrl: null }
                    ]
                }
            ]
        },
    ]);

    // Colores vivos del visor
    const [coloresVivos, setColoresVivos] = useState({
        silueta: '#1A1A1A',
        piel: '#F5C6A0'
    });

    // ID de la variante activa por grupo
    const [variantesActivas, setVariantesActivas] = useState({
        silueta: 'var1',
        piel: 'var1'
    });

    // Estado para edicion o creacion de un grupo
    const [nuevaCapa, setNuevaCapa] = useState({ 
        nombreCapa: '', 
        colorDefault: '#E65100', 
        colorTemp: '#E65100', 
        paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C', '#7B1FA2'], 
        variantesTemp: [
            { 
                id: 'v1', 
                nombre: 'Principal', 
                costo: 0, 
                subCapas: [
                    { id: 'sc1', archivo: '1archivo.svg', editable: true, archivoFile: null, previewUrl: null }
                ] 
            }
        ]
    });

    const [capaEditandoId, setCapaEditandoId] = useState(null);
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
        if (bibliotecaAvatares.length <= 1) return;
        const nuevaBiblioteca = bibliotecaAvatares.filter(av => av.id !== idAEliminar);
        setBibliotecaAvatares(nuevaBiblioteca);
        if (nombrePersonaje === idAEliminar) setNombrePersonaje(nuevaBiblioteca[0].id);
    };

    const handleNuevoPersonaje = () => {
        const nombreInput = prompt("Ingresa el nombre del contenedor (ej: gafas_pro):", "nuevo_" + (bibliotecaAvatares.length + 1));
        if (!nombreInput) return;
        
        const folderLimpio = nombreInput.toLowerCase().replace(/\s+/g, '_');
        if (!bibliotecaAvatares.some(av => av.id === folderLimpio)) {
            setBibliotecaAvatares(prev => [...prev, { id: folderLimpio, nombre: folderLimpio, icon: modoGenerador === 'asset' ? '🧩' : '🎨' }]);
        }

        setNombrePersonaje(folderLimpio);
        setCapas([]);
        setColoresVivos({});
        setVariantesActivas({});
        cancelarEdicion();
    };

    // Funciones para subcapas (sprites)
    const handleSubCapaFileChange = (indexVar, indexSub, e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setNuevaCapa(prev => {
                const copyVar = [...prev.variantesTemp];
                const targetSub = { ...copyVar[indexVar].subCapas[indexSub] };
                
                targetSub.archivoFile = file;
                targetSub.archivo = file.name;
                targetSub.previewUrl = tempUrl;

                copyVar[indexVar].subCapas[indexSub] = targetSub;
                let sugName = prev.nombreCapa;
                if(!sugName && indexVar===0 && indexSub===0) {
                    sugName = file.name.replace(/\.[^/.]+$/, "").charAt(0).toUpperCase() + file.name.slice(1).replace(/\.[^/.]+$/, "");
                }

                return { ...prev, variantesTemp: copyVar, nombreCapa: sugName };
            });
        }
    };

    const agregarSubCapa = (indexVar) => {
        setNuevaCapa(prev => {
            const copyVar = [...prev.variantesTemp];
            copyVar[indexVar].subCapas.push({
                id: `sc${Date.now()}`,
                archivo: `sprite_${copyVar[indexVar].subCapas.length + 1}.svg`,
                editable: true,
                archivoFile: null,
                previewUrl: null
            });
            return { ...prev, variantesTemp: copyVar };
        });
    };

    const eliminarSubCapa = (indexVar, indexSub) => {
        setNuevaCapa(prev => {
            const copyVar = [...prev.variantesTemp];
            if (copyVar[indexVar].subCapas.length <= 1) return prev;
            copyVar[indexVar].subCapas.splice(indexSub, 1);
            return { ...prev, variantesTemp: copyVar };
        });
    };

    const toggleSubCapaEditable = (indexVar, indexSub) => {
        setNuevaCapa(prev => {
            const copyVar = [...prev.variantesTemp];
            const target = copyVar[indexVar].subCapas[indexSub];
            target.editable = !target.editable;
            return { ...prev, variantesTemp: copyVar };
        });
    };

    // Funciones para Variantes
    const agregarVarianteTemp = () => {
        setNuevaCapa(prev => ({
            ...prev,
            variantesTemp: [
                ...prev.variantesTemp,
                { 
                    id: `v${Date.now()}`, 
                    nombre: `Var ${prev.variantesTemp.length + 1}`, 
                    costo: 0, 
                    subCapas: [{ id: `sc${Date.now()}`, archivo: 'sprite.svg', editable: true, archivoFile: null, previewUrl: null }] 
                }
            ]
        }));
    };

    const eliminarVarianteTemp = (indexVar) => {
        setNuevaCapa(prev => {
            if (prev.variantesTemp.length <= 1) return prev;
            return { ...prev, variantesTemp: prev.variantesTemp.filter((_, idx) => idx !== indexVar) };
        });
    };

    // Paletas
    const handleAgregarColorAPaleta = () => {
        const colorNuevo = nuevaCapa.colorTemp;
        if (!nuevaCapa.paletaColors.includes(colorNuevo)) {
            setNuevaCapa(prev => ({ ...prev, paletaColors: [...prev.paletaColors, colorNuevo] }));
        }
        agregarColorReciente(colorNuevo);
    };

    const handleEliminarColorDePaleta = (hexABorrar) => {
        setNuevaCapa(prev => {
            const nuevaPaleta = prev.paletaColors.filter(h => h !== hexABorrar);
            return { ...prev, paletaColors: nuevaPaleta.length === 0 ? ['#000000'] : nuevaPaleta };
        });
    };

    const handleVaciarPaleta = () => setNuevaCapa(prev => ({ ...prev, paletaColors: ['#000000'] }));

    // Edicion y Guardado
    const iniciarEdicionCapa = (capa) => {
        setCapaEditandoId(capa.id);
        
        const varMapeadas = capa.variantes && capa.variantes.length > 0 ? capa.variantes.map(v => ({
            ...v,
            subCapas: v.subCapas ? v.subCapas.map(sc => ({ ...sc, archivoFile: null })) : []
        })) : [{ id: 'v1', nombre: 'Principal', costo: 0, subCapas: [{ id: 'sc1', archivo: 'archivo.svg', editable: true, previewUrl: null }] }];

        setNuevaCapa({
            nombreCapa: capa.nombreCapa,
            colorDefault: capa.colorDefault,
            colorTemp: capa.colorDefault,
            paletaColors: [...(capa.paleta || [capa.colorDefault])],
            variantesTemp: varMapeadas
        });
    };

    const cancelarEdicion = () => {
        setCapaEditandoId(null);
        setNuevaCapa({
            nombreCapa: '', 
            colorDefault: '#E65100', 
            colorTemp: '#E65100', 
            paletaColors: ['#E65100', '#D32F2F', '#1976D2', '#388E3C'], 
            variantesTemp: [{ id: 'v1', nombre: 'Principal', costo: 0, subCapas: [{ id: 'sc1', archivo: 'sprite.svg', editable: true, previewUrl: null }] }]
        });
    };

    const handleGuardarCapa = () => {
        if (!nuevaCapa.nombreCapa.trim()) return;

        const idGenerado = nuevaCapa.nombreCapa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const paletaArray = nuevaCapa.paletaColors.length > 0 ? nuevaCapa.paletaColors : [nuevaCapa.colorDefault];

        const variantesFinales = nuevaCapa.variantesTemp.map((v, i) => ({
            id: v.id || `v${i + 1}`,
            nombre: v.nombre.trim() || `Var ${i + 1}`,
            costo: Number(v.costo) || 0,
            subCapas: v.subCapas.map((sc, j) => ({
                id: sc.id || `sc${j + 1}`,
                archivo: sc.archivoFile ? sc.archivoFile.name : sc.archivo,
                editable: sc.editable,
                previewUrl: sc.previewUrl || null
            }))
        }));

        if (capaEditandoId !== null) {
            setCapas(capas.map(c => {
                if (c.id === capaEditandoId) {
                    return { ...c, id: idGenerado, nombreCapa: nuevaCapa.nombreCapa.trim(), colorDefault: nuevaCapa.colorDefault, paleta: paletaArray, variantes: variantesFinales };
                }
                return c;
            }));

            if (!variantesActivas[idGenerado] && variantesFinales.length > 0) {
                setVariantesActivas(prev => ({ ...prev, [idGenerado]: variantesFinales[0].id }));
            }

            if (capaEditandoId !== idGenerado) {
                setColoresVivos(prev => { const copy = { ...prev }; copy[idGenerado] = copy[capaEditandoId] || nuevaCapa.colorDefault; delete copy[capaEditandoId]; return copy; });
                setVariantesActivas(prev => { const copy = { ...prev }; copy[idGenerado] = copy[capaEditandoId]; delete copy[capaEditandoId]; return copy; });
            } else {
                setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
            }
        } else {
            if (capas.some(c => c.id === idGenerado)) return;
            setCapas([...capas, { id: idGenerado, nombreCapa: nuevaCapa.nombreCapa.trim(), colorDefault: nuevaCapa.colorDefault, paleta: paletaArray, editable: true, variantes: variantesFinales }]);
            setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
            if (variantesFinales.length > 0) setVariantesActivas(prev => ({ ...prev, [idGenerado]: variantesFinales[0].id }));
        }
        
        cancelarEdicion();
    };

    const eliminarCapa = (idABorrar) => {
        if (capas.length <= 1) return;
        setCapas(capas.filter(capa => capa.id !== idABorrar));
        const copyColores = { ...coloresVivos }; delete copyColores[idABorrar]; setColoresVivos(copyColores);
        const copyVariantes = { ...variantesActivas }; delete copyVariantes[idABorrar]; setVariantesActivas(copyVariantes);
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

    const getSubCapasActivas = (capa) => {
        if (!capa.variantes || capa.variantes.length === 0) return [];
        const idVar = variantesActivas[capa.id];
        let variante = capa.variantes.find(v => v.id === idVar);
        if (!variante) variante = capa.variantes[0];
        return variante.subCapas || [];
    };

    // Exportador de codigo con Map para SubCapas
    const generarCodigoJSX = () => {
        let codigo = "";

        if (modoGenerador === 'asset') {
            const nombreComp = nombrePersonaje.charAt(0).toUpperCase() + nombrePersonaje.slice(1);
            codigo += `/* Componente Asset: ${nombreComp} */\nimport React from 'react';\n\n`;
            codigo += `export default function ${nombreComp}({ \n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `    color${idCap} = '${coloresVivos[capa.id] || capa.colorDefault}',\n`;
            });
            codigo += `    className = "w-16 h-16"\n}) {\n`;
            
            // Inyeccion de catalogo interno para standalone asset
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `    const var${idCap} = ${JSON.stringify(capa.variantes[0].subCapas || [])};\n`;
            });

            codigo += `    return (\n        <div className={\`relative \${className} flex items-center justify-center\`}>\n`;
            capas.forEach((capa) => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `            {var${idCap}.map((sub, i) => (\n`;
                codigo += `                <div key={sub.id || i} className="absolute inset-0 pointer-events-none"\n`;
                codigo += `                    style={{\n`;
                codigo += `                        ...(sub.editable ? {\n`;
                codigo += `                            backgroundColor: color${idCap},\n`;
                codigo += `                            WebkitMaskImage: \`url(/avatares/${nombrePersonaje}/\${sub.archivo})\`,\n`;
                codigo += `                            maskImage: \`url(/avatares/${nombrePersonaje}/\${sub.archivo})\`,\n`;
                codigo += `                            WebkitMaskSize: 'contain', maskSize: 'contain',\n`;
                codigo += `                            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',\n`;
                codigo += `                            WebkitMaskPosition: 'center', maskPosition: 'center'\n`;
                codigo += `                        } : {\n`;
                codigo += `                            backgroundImage: \`url(/avatares/${nombrePersonaje}/\${sub.archivo})\`,\n`;
                codigo += `                            backgroundSize: 'contain',\n`;
                codigo += `                            backgroundRepeat: 'no-repeat',\n`;
                codigo += `                            backgroundPosition: 'center'\n`;
                codigo += `                        })\n`;
                codigo += `                    }}\n`;
                codigo += `                />\n`;
                codigo += `            ))}\n`;
            });
            codigo += `        </div>\n    );\n}\n`;

        } else {
            codigo += `/* Codigo Generado Avatar Multi-Sprites: ${nombrePersonaje} */\n\n`;
            codigo += `// Estados Base\n`;
            codigo += `const [personajeBase, setPersonajeBase] = useState('${nombrePersonaje}');\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `const [color${idCap}, setColor${idCap}] = useState('${coloresVivos[capa.id] || capa.colorDefault}');\n`;
                const varIdDef = capa.variantes.length > 0 ? capa.variantes[0].id : 'v1';
                codigo += `const [variante${idCap}, setVariante${idCap}] = useState('${varIdDef}');\n`;
            });

            codigo += `\n// Catalogo de Variantes y SubCapas\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `const variantes${idCap} = ${JSON.stringify(capa.variantes || [], null, 4)};\n`;
            });

            codigo += `\n// Paletas\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `const paleta${idCap} = ${JSON.stringify(capa.paleta || [capa.colorDefault])};\n`;
            });

            codigo += `\n// Estructura Visor \n`;
            codigo += `<div className="relative w-48 h-48 mx-auto bg-white rounded-3xl overflow-hidden">\n`;
            capas.forEach((capa) => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `    {variantes${idCap}.find(v => v.id === variante${idCap})?.subCapas.map((sub, i) => (\n`;
                codigo += `        <div\n`;
                codigo += `            key={sub.id || i}\n`;
                codigo += `            className="absolute inset-0 pointer-events-none transition-colors duration-250"\n`;
                codigo += `            style={{\n`;
                codigo += `                ...(sub.editable ? {\n`;
                codigo += `                    backgroundColor: color${idCap},\n`;
                codigo += `                    WebkitMaskImage: \`url(/avatares/\${personajeBase}/\${sub.archivo})\`,\n`;
                codigo += `                    maskImage: \`url(/avatares/\${personajeBase}/\${sub.archivo})\`,\n`;
                codigo += `                    WebkitMaskSize: 'contain', maskSize: 'contain',\n`;
                codigo += `                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',\n`;
                codigo += `                    WebkitMaskPosition: 'center', maskPosition: 'center'\n`;
                codigo += `                } : {\n`;
                codigo += `                    backgroundImage: \`url(/avatares/\${personajeBase}/\${sub.archivo})\`,\n`;
                codigo += `                    backgroundSize: 'contain',\n`;
                codigo += `                    backgroundRepeat: 'no-repeat',\n`;
                codigo += `                    backgroundPosition: 'center'\n`;
                codigo += `                })\n`;
                codigo += `            }}\n`;
                codigo += `        />\n`;
                codigo += `    ))}\n`;
            });
            codigo += `</div>\n`;
        }

        return codigo;
    };

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
                        {modoGenerador === 'avatar' ? '👤 Editor Avatar' : '🧩 Editor Asset'}
                    </h2>
                </div>
                
                <div className="flex bg-amber-200 rounded-2xl p-1 border border-amber-400 shadow-inner">
                    <button onClick={() => setModoGenerador('avatar')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoGenerador === 'avatar' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-900 hover:bg-amber-300'}`}>👤 Avatar</button>
                    <button onClick={() => setModoGenerador('asset')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoGenerador === 'asset' ? 'bg-emerald-600 text-white shadow-md' : 'text-amber-900 hover:bg-amber-300'}`}>🧩 Asset Sprites</button>
                </div>

                <button onClick={handleNuevoPersonaje} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5">
                    ➕ Nuevo
                </button>
            </div>

            <div className="bg-white p-4 rounded-3xl border-2 border-amber-300 shadow-sm mb-6">
                <h3 className="text-xs font-black uppercase text-amber-900 mb-3 flex items-center justify-between">
                    <span>📚 Biblioteca</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                    {bibliotecaAvatares.map((avatar) => (
                        <div key={avatar.id} onClick={() => { setNombrePersonaje(avatar.id); cancelarEdicion(); }} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-2 ${nombrePersonaje === avatar.id ? 'bg-amber-600 text-white border-amber-800 shadow-md scale-105' : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'}`}>
                            <span>{avatar.icon || avatar.icono || '📁'}</span>
                            <span>{avatar.nombre}</span>
                            <button type="button" onClick={(e) => eliminarAvatarDeBiblioteca(avatar.id, e)} className="ml-1 text-red-600 hover:text-white hover:bg-red-600 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black transition-colors">✕</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-5 flex flex-col gap-5">
                    
                    <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-md flex flex-col items-center">
                        <h3 className="font-black text-xs text-amber-900 uppercase tracking-wider mb-3">👁️ Visor ({nombrePersonaje})</h3>
                        
                        <div className="relative w-56 h-56 bg-amber-50 rounded-3xl border-4 border-amber-400 flex items-center justify-center shadow-inner overflow-hidden mb-4">
                            {capas.length === 0 ? <div className="text-center p-4"><span className="text-2xl">🎨</span></div> : (
                                capas.map((capa) => {
                                    const subCapasActivas = getSubCapasActivas(capa);
                                    return subCapasActivas.map((subCapa) => {
                                        const maskUrl = subCapa.previewUrl ? `url(${subCapa.previewUrl})` : `url(/avatares/${nombrePersonaje}/${subCapa.archivo})`;
                                        if (!subCapa.editable) {
                                            return <div key={`${capa.id}-${subCapa.id}`} className="absolute inset-0 pointer-events-none transition-all duration-200" style={{ backgroundImage: maskUrl, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
                                        }
                                        return <div key={`${capa.id}-${subCapa.id}`} className="absolute inset-0 pointer-events-none transition-colors duration-200" style={{ backgroundColor: coloresVivos[capa.id] || capa.colorDefault, WebkitMaskImage: maskUrl, maskImage: maskUrl, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
                                    });
                                })
                            )}
                        </div>

                        {capas.length > 0 && (
                            <div className="w-full space-y-3">
                                <label className="block text-[11px] font-bold text-amber-800 uppercase">🖌️ Ajustes Vivos:</label>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {capas.map(capa => {
                                        const varActiva = variantesActivas[capa.id] || capa.variantes[0]?.id;
                                        return (
                                            <div key={capa.id} className="flex flex-col bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-amber-900">{capa.nombreCapa}</span>
                                                    <input type="color" value={coloresVivos[capa.id] || capa.colorDefault} onChange={(e) => setColoresVivos(prev => ({ ...prev, [capa.id]: e.target.value }))} onBlur={(e) => agregarColorReciente(e.target.value)} className="w-6 h-6 rounded-md border border-amber-300 cursor-pointer bg-transparent" />
                                                </div>
                                                {capa.variantes && capa.variantes.length > 1 && (
                                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-amber-200/60">
                                                        {capa.variantes.map(v => (
                                                            <button key={v.id} type="button" onClick={() => setVariantesActivas(prev => ({ ...prev, [capa.id]: v.id }))} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${varActiva === v.id ? 'bg-amber-700 text-white shadow-xs' : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'}`}>
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
                            <span>📚 GRUPOS ({capas.length})</span>
                        </h3>
                        {capas.length === 0 ? <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center text-xs text-amber-800 mb-4 font-medium">Vacío.</div> : (
                            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                                {capas.map((c, i) => (
                                    <li key={c.id} className={`text-xs p-2 rounded-xl border flex justify-between items-center shadow-xs gap-2 ${capaEditandoId === c.id ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className="flex items-center gap-1.5 truncate">
                                            <b className="bg-amber-200 px-1.5 py-0.5 rounded text-[11px]">{i + 1}</b>
                                            <span className="font-medium text-amber-900 truncate">{c.nombreCapa}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
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
                                <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5"><span>{capaEditandoId ? '✏️' : '✨'}</span> Configurar Grupo</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-amber-900">Nombre (ej: Gafas pro):</label>
                                <input type="text" value={nuevaCapa.nombreCapa} onChange={(e) => setNuevaCapa({...nuevaCapa, nombreCapa: e.target.value})} className="w-full px-3 py-2 border-2 border-amber-300 rounded-2xl text-xs bg-white text-amber-950 outline-none focus:border-amber-500" />
                            </div>
                            
                            {/* Constructor de Sprites por Variantes */}
                            <div className="space-y-2 bg-white/80 p-3 rounded-2xl border border-amber-300 max-h-60 overflow-y-auto">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-black text-amber-900 uppercase">Variantes & Subcapas:</label>
                                    <button type="button" onClick={agregarVarianteTemp} className="bg-amber-700 text-white font-bold px-2 py-1 rounded-xl text-[10px]">➕ Variante</button>
                                </div>
                                
                                {nuevaCapa.variantesTemp.map((v, indexVar) => (
                                    <div key={v.id || indexVar} className="bg-amber-50 p-2 rounded-xl border border-amber-300 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input type="text" placeholder="Nombre Var" value={v.nombre} onChange={(e) => { const copy = [...nuevaCapa.variantesTemp]; copy[indexVar].nombre = e.target.value; setNuevaCapa(p => ({...p, variantesTemp: copy})); }} className="flex-1 px-2 py-1 border border-amber-300 rounded-lg text-[10px] bg-white outline-none" />
                                            <button type="button" onClick={() => eliminarVarianteTemp(indexVar)} className="text-red-600 bg-red-100 px-2 py-1 rounded-lg text-xs font-bold">🗑️</button>
                                        </div>

                                        <div className="space-y-1">
                                            {v.subCapas.map((sc, indexSub) => (
                                                <div key={sc.id || indexSub} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 rounded-lg border border-amber-200">
                                                    <input type="file" accept=".svg" onChange={(e) => handleSubCapaFileChange(indexVar, indexSub, e)} className="w-full sm:w-auto text-[9px] file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:bg-amber-600 file:text-white cursor-pointer" />
                                                    <div className="flex gap-1 w-full sm:w-auto justify-end">
                                                        <button type="button" onClick={() => toggleSubCapaEditable(indexVar, indexSub)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${sc.editable ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                                            {sc.editable ? '🎨 Base' : '🔒 Fijo'}
                                                        </button>
                                                        <button type="button" onClick={() => eliminarSubCapa(indexVar, indexSub)} className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-[10px]">✕</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => agregarSubCapa(indexVar)} className="w-full text-center bg-amber-200 text-amber-900 font-bold py-1 rounded-lg text-[10px]">➕ Añadir Sprite (Subcapa)</button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-white p-2 rounded-2xl border-2 border-amber-300 shadow-inner flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-900">Color Base del Grupo:</span>
                                <input type="color" value={nuevaCapa.colorDefault} onChange={(e) => setNuevaCapa({...nuevaCapa, colorDefault: e.target.value})} onBlur={(e) => agregarColorReciente(e.target.value)} className="w-7 h-7 rounded-xl border border-amber-300 cursor-pointer bg-transparent" />
                            </div>

                            <div className="bg-white/80 p-3 rounded-2xl border-2 border-amber-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black text-amber-900 uppercase">Paleta:</label>
                                    <button type="button" onClick={handleVaciarPaleta} className="text-[9px] text-red-600 border border-red-200 px-2 py-0.5 rounded-full cursor-pointer">🗑️</button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input type="color" value={nuevaCapa.colorTemp} onChange={(e) => setNuevaCapa({...nuevaCapa, colorTemp: e.target.value})} onBlur={(e) => agregarColorReciente(e.target.value)} className="w-6 h-6 rounded-lg border border-amber-300 cursor-pointer bg-transparent" />
                                    <button type="button" onClick={handleAgregarColorAPaleta} className="bg-amber-700 text-white font-bold py-1 px-2 rounded-xl text-[10px] cursor-pointer">➕ Añadir</button>
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
                                    <button type="button" onClick={cancelarEdicion} className="bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-2xl text-xs cursor-pointer">❌</button>
                                )}
                                <button type="button" onClick={handleGuardarCapa} className="flex-1 bg-amber-600 text-white font-black py-3 rounded-2xl text-xs cursor-pointer uppercase">
                                    {capaEditandoId ? '💾 Guardar Grupo' : '🚀 Añadir Grupo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-[#1e1e1e] p-5 rounded-3xl border-2 border-amber-500 shadow-xl flex flex-col h-full">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-black text-amber-400 uppercase tracking-wider">💻 Código Listo</label>
                            <span className="text-[10px] text-gray-400 font-mono text-right max-w-[120px]">
                                {modoGenerador === 'asset' ? 'Multi-Color Sprite' : 'Avatar Engine'}
                            </span>
                        </div>
                        <textarea 
                            readOnly
                            value={generarCodigoJSX()}
                            className="w-full flex-1 min-h-[520px] p-4 bg-[#141414] text-[#9cdcfe] font-mono text-[10px] rounded-2xl shadow-inner resize-none focus:outline-none leading-relaxed border border-gray-800"
                        />
                        <button type="button" onClick={() => { navigator.clipboard.writeText(generarCodigoJSX()); alert('¡Código copiado al portapapeles! 📋'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl cursor-pointer text-sm flex items-center justify-center gap-2">
                            📋 Copiar Componente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}