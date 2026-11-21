import React, { useState, useEffect, useRef } from 'react';
import Icono from './Icono.jsx';
import { almacen } from '../utils/almacen.js';

const CLAVE_BORRADOR = 'generadorAvatarBorrador';

const clonar = (valor) => JSON.parse(JSON.stringify(valor));

const slugify = (texto) => String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const subcapa = (id, archivo, editable = true) => ({
    id,
    archivo,
    editable,
    previewUrl: null,
});

const variante = (id, nombre, subCapas, costo = 0) => ({
    id,
    nombre,
    costo,
    subCapas,
});

const capa = (id, nombreCapa, colorDefault, paleta, variantes) => ({
    id,
    nombreCapa,
    colorDefault,
    paleta,
    editable: true,
    variantes,
});

const PALETA_PIEL = ['#F5C6A0', '#E0AC69', '#C68642', '#8D5524', '#ffdbac', '#f1c27d'];
const PALETA_ROPA = ['#E65100', '#D32F2F', '#1976D2', '#388E3C', '#7B1FA2'];
const PALETA_NEUTRA = ['#1A1A1A', '#333333', '#555555', '#7F8C8D', '#BDC3C7', '#FFFFFF'];

const BASES = {
    personaje1: {
        nombre: 'Personaje 1 · Clásico',
        capas: [
            capa('silueta', 'Silueta / Ropa base', '#1A1A1A', PALETA_NEUTRA, [
                variante('var1', 'Ropa clásica', [subcapa('sc1', '1silueta.svg', false)]),
            ]),
            capa('piel', 'Tono de piel', '#F5C6A0', PALETA_PIEL, [
                variante('var1', 'Piel base', [subcapa('sc1', 'piel.svg', true)]),
            ]),
            capa('inferior', 'Prenda inferior', '#4A3525', PALETA_ROPA, [
                variante('v1', 'Short', [subcapa('sc1', '1shorts1.svg', true)]),
                variante('v2', 'Pantalón', [subcapa('sc1', 'pantalon1.svg', true)]),
            ]),
            capa('superior', 'Prenda superior', '#E65100', PALETA_ROPA, [
                variante('v1', 'Playera', [subcapa('sc1', '1playera1.svg', true)]),
                variante('v2', 'Camisa', [subcapa('sc1', 'camisa1.svg', true)]),
            ]),
            capa('rostro', 'Rostro', '#1A1A1A', PALETA_NEUTRA, [
                variante('var1', 'Rostro base', [subcapa('sc1', '1rostro1.svg', false)]),
            ]),
            capa('ojos', 'Ojos', '#000000', ['#000000', '#4A3525', '#1976D2', '#19d27b', '#c7c7c7'], [
                variante('v1', 'Ojos 1', [subcapa('sc1', '1ojos1.svg', true)]),
                variante('v2', 'Ojos 2', [subcapa('sc1', '1ojos2_1.svg', true)]),
                variante('v3', 'Ojos 3', [subcapa('sc1', '1ojos3.svg', true)]),
            ]),
            capa('cabello', 'Cabello', '#4A3525', ['#000000', '#4A3525', '#c7c7c7'], [
                variante('v1', 'Cabello 1', [subcapa('sc1', '1cabello1.svg', true)]),
                variante('v2', 'Cabello 2', [subcapa('sc1', '1cabello2.svg', true)]),
                variante('v3', 'Cabello 3', [subcapa('sc1', 'cabello3.svg', true)]),
                variante('v4', 'Cabello 4', [subcapa('sc1', 'cabello4.svg', true)]),
                variante('v5', 'Cabello 5', [subcapa('sc1', 'cabello 5.svg', true)]),
            ]),
        ],
        colores: {
            silueta: '#1A1A1A',
            piel: '#F5C6A0',
            inferior: '#4A3525',
            superior: '#E65100',
            rostro: '#1A1A1A',
            ojos: '#000000',
            cabello: '#4A3525',
        },
        variantes: {
            silueta: 'var1',
            piel: 'var1',
            inferior: 'v1',
            superior: 'v1',
            rostro: 'var1',
            ojos: 'v1',
            cabello: 'v1',
        },
    },
    personaje2: {
        nombre: 'Personaje 2 · Blusón',
        capas: [
            capa('fondo', 'Fondo', '#FDE68A', PALETA_NEUTRA, [
                variante('var1', 'Fondo base', [subcapa('sc1', '2fondo.svg', false)]),
            ]),
            capa('silueta', 'Silueta / Cuerpo', '#1A1A1A', PALETA_NEUTRA, [
                variante('var1', 'Cuerpo base', [subcapa('sc1', '2silueta.svg', false)]),
            ]),
            capa('piel', 'Tono de piel', '#F5C6A0', PALETA_PIEL, [
                variante('var1', 'Piel base', [subcapa('sc1', '2piel.svg', true)]),
            ]),
            capa('bluson', 'Blusón / Ropa', '#C2410C', PALETA_ROPA, [
                variante('var1', 'Blusón 1', [subcapa('sc1', '2bluson1.svg', true)]),
            ]),
            capa('rostro', 'Rostro', '#1A1A1A', PALETA_NEUTRA, [
                variante('var1', 'Rostro base', [subcapa('sc1', '2rostro.svg', false)]),
            ]),
            capa('ojos', 'Ojos', '#000000', ['#000000', '#4A3525', '#1976D2'], [
                variante('var1', 'Ojos 1', [subcapa('sc1', '2ojos.svg', true)]),
            ]),
            capa('cabello', 'Cabello', '#1F2937', ['#000000', '#4A3525', '#c7c7c7'], [
                variante('var1', 'Cabello 1', [subcapa('sc1', '2cabello.svg', true)]),
            ]),
        ],
        colores: {
            fondo: '#FDE68A',
            silueta: '#1A1A1A',
            piel: '#F5C6A0',
            bluson: '#C2410C',
            rostro: '#1A1A1A',
            ojos: '#000000',
            cabello: '#1F2937',
        },
        variantes: {
            fondo: 'var1',
            silueta: 'var1',
            piel: 'var1',
            bluson: 'var1',
            rostro: 'var1',
            ojos: 'var1',
            cabello: 'var1',
        },
    },
};

const METADATOS_BASES = Object.entries(BASES).map(([id, base]) => ({
    id,
    nombre: base.nombre,
    icono: 'user',
    base: true,
}));

const crearDatosPersonaje = (id) => {
    const base = BASES[id];
    if (!base) return { capas: [], colores: {}, variantes: {} };
    return {
        capas: clonar(base.capas),
        colores: { ...base.colores },
        variantes: { ...base.variantes },
    };
};

const crearPersonajesIniciales = () => {
    const personajes = {};
    Object.keys(BASES).forEach((id) => {
        personajes[id] = crearDatosPersonaje(id);
    });
    return personajes;
};

const crearEstadoInicial = () => {
    const personajes = crearPersonajesIniciales();
    const nombrePersonaje = 'personaje1';
    const datos = personajes[nombrePersonaje];

    return {
        bibliotecaAvatares: METADATOS_BASES.map((avatar) => ({ ...avatar })),
        personajes,
        nombrePersonaje,
        capas: clonar(datos.capas),
        coloresVivos: { ...datos.colores },
        variantesActivas: { ...datos.variantes },
    };
};

const leerBorrador = () => {
    try {
        const crudo = almacen.getItem(CLAVE_BORRADOR);
        if (!crudo) return null;

        const datos = JSON.parse(crudo);
        if (!datos || !Array.isArray(datos.bibliotecaAvatares) || !datos.personajes) return null;

        const nombrePersonaje = typeof datos.nombrePersonaje === 'string' && datos.personajes[datos.nombrePersonaje]
            ? datos.nombrePersonaje
            : 'personaje1';

        const personajesBase = crearPersonajesIniciales();
        const personajes = {
            ...personajesBase,
            ...datos.personajes,
        };

        const actual = personajes[nombrePersonaje];
        if (!actual) return null;

        return {
            bibliotecaAvatares: datos.bibliotecaAvatares.map((avatar) => ({
                ...avatar,
                base: typeof avatar.base === 'boolean' ? avatar.base : Boolean(BASES[avatar.id]),
            })),
            personajes,
            nombrePersonaje,
            capas: Array.isArray(actual.capas) ? actual.capas : [],
            coloresVivos: actual.colores && typeof actual.colores === 'object' ? actual.colores : {},
            variantesActivas: actual.variantes && typeof actual.variantes === 'object' ? actual.variantes : {},
        };
    } catch {
        return null;
    }
};

const capasParaGuardar = (capas) => capas.map((capaActual) => ({
    ...capaActual,
    variantes: (capaActual.variantes || []).map((varianteActual) => ({
        ...varianteActual,
        subCapas: (varianteActual.subCapas || []).map(({
            archivoFile: _archivoFile,
            previewUrl: _previewUrl,
            ...resto
        }) => resto),
    })),
}));

const sanitizarPersonajes = (mapa) => Object.fromEntries(
    Object.entries(mapa || {}).map(([id, datos]) => [
        id,
        {
            capas: capasParaGuardar(datos?.capas || []),
            colores: datos?.colores && typeof datos.colores === 'object' ? datos.colores : {},
            variantes: datos?.variantes && typeof datos.variantes === 'object' ? datos.variantes : {},
        },
    ])
);

export default function GeneradorDev({ onBack }) {
    const [borradorInicial] = useState(leerBorrador);
    const [inicial] = useState(() => borradorInicial || crearEstadoInicial());

    const [modoGenerador, setModoGenerador] = useState('avatar');
    const [bibliotecaAvatares, setBibliotecaAvatares] = useState(inicial.bibliotecaAvatares);
    const [personajes, setPersonajes] = useState(inicial.personajes);
    const [nombrePersonaje, setNombrePersonaje] = useState(inicial.nombrePersonaje);
    const [capas, setCapas] = useState(inicial.capas);
    const [coloresVivos, setColoresVivos] = useState(inicial.coloresVivos);
    const [variantesActivas, setVariantesActivas] = useState(inicial.variantesActivas);
    const [aviso, setAviso] = useState(null);
    const [guardadoEn, setGuardadoEn] = useState(null);
    const [nuevoPersonajeAbierto, setNuevoPersonajeAbierto] = useState(false);
    const [nombreNuevoPersonaje, setNombreNuevoPersonaje] = useState('');
    const [errorNuevoPersonaje, setErrorNuevoPersonaje] = useState('');
    const inputImportarRef = useRef(null);

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

    const avisar = (tipo, mensaje) => setAviso({ tipo, mensaje });

    useEffect(() => {
        if (!aviso) return undefined;
        const timer = setTimeout(() => setAviso(null), 4000);
        return () => clearTimeout(timer);
    }, [aviso]);

    // Guardado automático del borrador en este dispositivo.
    useEffect(() => {
        const timer = setTimeout(() => {
            const personajesActuales = sanitizarPersonajes({
                ...personajes,
                [nombrePersonaje]: {
                    capas,
                    colores: coloresVivos,
                    variantes: variantesActivas,
                },
            });

            try {
                almacen.setItem(CLAVE_BORRADOR, JSON.stringify({
                    version: 2,
                    bibliotecaAvatares,
                    personajes: personajesActuales,
                    nombrePersonaje,
                }));
                setGuardadoEn(Date.now());
            } catch {
                // Sin localStorage la herramienta sigue funcionando en memoria.
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [bibliotecaAvatares, personajes, nombrePersonaje, capas, coloresVivos, variantesActivas]);

    const construirDatosExportables = () => ({
        version: 2,
        bibliotecaAvatares,
        personajes: sanitizarPersonajes({
            ...personajes,
            [nombrePersonaje]: {
                capas,
                colores: coloresVivos,
                variantes: variantesActivas,
            },
        }),
        nombrePersonaje,
    });

    const seleccionarPersonaje = (avatar) => {
        const personajesActualizados = sanitizarPersonajes({
            ...personajes,
            [nombrePersonaje]: {
                capas,
                colores: coloresVivos,
                variantes: variantesActivas,
            },
        });

        setPersonajes(personajesActualizados);

        const datos = personajesActualizados[avatar.id] || crearDatosPersonaje(avatar.id);
        setNombrePersonaje(avatar.id);
        setCapas(clonar(datos.capas || []));
        setColoresVivos({ ...(datos.colores || {}) });
        setVariantesActivas({ ...(datos.variantes || {}) });
        cancelarEdicion();
        setAviso(null);
    };

    const abrirNuevoPersonaje = () => {
        setNombreNuevoPersonaje(`nuevo_${bibliotecaAvatares.length + 1}`);
        setErrorNuevoPersonaje('');
        setNuevoPersonajeAbierto(true);
    };

    const crearNuevoPersonaje = () => {
        const limpio = nombreNuevoPersonaje.trim();
        const id = slugify(limpio);

        if (!limpio || !id) {
            setErrorNuevoPersonaje('Escribe un nombre con letras o números.');
            return;
        }

        if (bibliotecaAvatares.some((avatar) => avatar.id === id)) {
            setErrorNuevoPersonaje('Ya existe un personaje con ese nombre.');
            return;
        }

        setBibliotecaAvatares((previos) => [
            ...previos,
            {
                id,
                nombre: limpio,
                icono: modoGenerador === 'asset' ? 'puzzle' : 'palette',
            },
        ]);
        setPersonajes((previos) => ({
            ...previos,
            [id]: { capas: [], colores: {}, variantes: {} },
        }));
        setNombrePersonaje(id);
        setCapas([]);
        setColoresVivos({});
        setVariantesActivas({});
        cancelarEdicion();
        setNuevoPersonajeAbierto(false);
        avisar('exito', `Personaje "${limpio}" creado.`);
    };

    const copiarJSON = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(construirDatosExportables(), null, 2));
            avisar('exito', 'JSON copiado al portapapeles.');
        } catch {
            avisar('error', 'No se pudo copiar. Revisa los permisos del navegador.');
        }
    };

    const descargarJSON = () => {
        try {
            const blob = new Blob([JSON.stringify(construirDatosExportables(), null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `avatar-${nombrePersonaje}.json`;
            enlace.click();
            URL.revokeObjectURL(url);
            avisar('exito', 'JSON descargado.');
        } catch {
            avisar('error', 'No se pudo descargar el JSON.');
        }
    };

    const importarJSON = (evento) => {
        const archivo = evento.target.files?.[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = () => {
            try {
                const datos = JSON.parse(String(lector.result));
                if (!datos || !Array.isArray(datos.bibliotecaAvatares) || !datos.personajes) {
                    throw new Error('FORMATO_INVALIDO');
                }

                const nombre = typeof datos.nombrePersonaje === 'string' && datos.personajes[datos.nombrePersonaje]
                    ? datos.nombrePersonaje
                    : datos.bibliotecaAvatares[0]?.id;
                const actual = datos.personajes[nombre];

                if (!actual) throw new Error('SIN_PERSONAJE');

                setBibliotecaAvatares(datos.bibliotecaAvatares);
                setPersonajes(datos.personajes);
                setNombrePersonaje(nombre);
                setCapas(Array.isArray(actual.capas) ? actual.capas : []);
                setColoresVivos(actual.colores && typeof actual.colores === 'object' ? actual.colores : {});
                setVariantesActivas(actual.variantes && typeof actual.variantes === 'object' ? actual.variantes : {});
                cancelarEdicion();
                avisar('exito', 'JSON importado correctamente.');
            } catch {
                avisar('error', 'El archivo no tiene el formato esperado.');
            }
        };
        lector.onerror = () => avisar('error', 'No se pudo leer el archivo.');
        lector.readAsText(archivo);

        if (inputImportarRef.current) inputImportarRef.current.value = '';
    };

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
        const avatar = bibliotecaAvatares.find((item) => item.id === idAEliminar);

        if (!avatar || avatar.base) {
            avisar('info', 'Las bases del proyecto no se pueden eliminar.');
            return;
        }

        if (bibliotecaAvatares.length <= 1) return;

        const nuevaBiblioteca = bibliotecaAvatares.filter(av => av.id !== idAEliminar);
        setBibliotecaAvatares(nuevaBiblioteca);
        setPersonajes((previos) => {
            const copia = { ...previos };
            delete copia[idAEliminar];
            return copia;
        });

        if (nombrePersonaje === idAEliminar) {
            const siguiente = nuevaBiblioteca[0];
            const datos = personajes[siguiente.id] || crearDatosPersonaje(siguiente.id);
            setNombrePersonaje(siguiente.id);
            setCapas(clonar(datos.capas || []));
            setColoresVivos({ ...(datos.colores || {}) });
            setVariantesActivas({ ...(datos.variantes || {}) });
            cancelarEdicion();
        }
    };

    const handleSubCapaFileChange = (indexVar, indexSub, e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setNuevaCapa(prev => {
                const copyVar = [...prev.variantesTemp];
                const subCapasCopy = [...copyVar[indexVar].subCapas];
                subCapasCopy[indexSub] = {
                    ...subCapasCopy[indexSub],
                    archivoFile: file,
                    archivo: file.name,
                    previewUrl: tempUrl
                };
                copyVar[indexVar] = {
                    ...copyVar[indexVar],
                    subCapas: subCapasCopy
                };

                let sugName = prev.nombreCapa;
                if(!sugName && indexVar === 0 && indexSub === 0) {
                    sugName = file.name.replace(/\.[^/.]+$/, "").charAt(0).toUpperCase() + file.name.slice(1).replace(/\.[^/.]+$/, "");
                }

                return { ...prev, variantesTemp: copyVar, nombreCapa: sugName };
            });
        }
    };

    const agregarSubCapa = (indexVar) => {
        setNuevaCapa(prev => {
            const copyVar = [...prev.variantesTemp];
            const subCapasActuales = copyVar[indexVar].subCapas || [];
            copyVar[indexVar] = {
                ...copyVar[indexVar],
                subCapas: [
                    ...subCapasActuales,
                    {
                        id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        archivo: `sprite_${subCapasActuales.length + 1}.svg`,
                        editable: true,
                        archivoFile: null,
                        previewUrl: null
                    }
                ]
            };
            return { ...prev, variantesTemp: copyVar };
        });
    };

    const eliminarSubCapa = (indexVar, indexSub) => {
        setNuevaCapa(prev => {
            const copyVar = [...prev.variantesTemp];
            const subCapasActuales = copyVar[indexVar].subCapas || [];
            if (subCapasActuales.length <= 1) return prev;
            copyVar[indexVar] = {
                ...copyVar[indexVar],
                subCapas: subCapasActuales.filter((_, idx) => idx !== indexSub)
            };
            return { ...prev, variantesTemp: copyVar };
        });
    };

    const toggleSubCapaEditable = (indexVar, indexSub) => {
        setNuevaCapa(prev => {
            const copyVar = [...prev.variantesTemp];
            const subCapasCopy = [...copyVar[indexVar].subCapas];
            subCapasCopy[indexSub] = {
                ...subCapasCopy[indexSub],
                editable: !subCapasCopy[indexSub].editable
            };
            copyVar[indexVar] = {
                ...copyVar[indexVar],
                subCapas: subCapasCopy
            };
            return { ...prev, variantesTemp: copyVar };
        });
    };

    const agregarVarianteTemp = () => {
        setNuevaCapa(prev => ({
            ...prev,
            variantesTemp: [
                ...prev.variantesTemp,
                { 
                    id: `v_${Date.now()}`, 
                    nombre: `Var ${prev.variantesTemp.length + 1}`, 
                    costo: 0, 
                    subCapas: [{ id: `sc_${Date.now()}`, archivo: 'sprite.svg', editable: true, archivoFile: null, previewUrl: null }] 
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
        const nombre = nuevaCapa.nombreCapa.trim();
        if (!nombre) {
            avisar('error', 'Escribe un nombre para el grupo de capas.');
            return;
        }

        const idGenerado = slugify(nombre);
        if (!idGenerado) {
            avisar('error', 'El nombre debe incluir al menos una letra o número.');
            return;
        }

        if (nuevaCapa.variantesTemp.length === 0) {
            avisar('error', 'Agrega al menos una variante.');
            return;
        }

        for (let i = 0; i < nuevaCapa.variantesTemp.length; i += 1) {
            const actual = nuevaCapa.variantesTemp[i];
            if (!actual.subCapas || actual.subCapas.length === 0) {
                avisar('error', `La variante ${i + 1} necesita al menos una subcapa.`);
                return;
            }
            const sinArchivo = actual.subCapas.some((sc) => !String(sc.archivo || '').trim());
            if (sinArchivo) {
                avisar('error', `La variante ${i + 1} tiene una subcapa sin archivo SVG.`);
                return;
            }
        }

        const colisiona = capas.some((capaActual) => (
            capaActual.id === idGenerado && capaActual.id !== capaEditandoId
        ));
        if (colisiona) {
            avisar('error', 'Ya existe un grupo con ese nombre. Usa otro nombre.');
            return;
        }

        const paletaArray = nuevaCapa.paletaColors.length > 0 ? nuevaCapa.paletaColors : [nuevaCapa.colorDefault];

        const variantesFinales = nuevaCapa.variantesTemp.map((v, i) => ({
            id: v.id || `v${i + 1}`,
            nombre: String(v.nombre || '').trim() || `Variante ${i + 1}`,
            costo: Math.max(0, Math.floor(Number(v.costo) || 0)),
            subCapas: (v.subCapas || []).map((sc, j) => ({
                id: sc.id || `sc${j + 1}`,
                archivo: sc.archivoFile ? sc.archivoFile.name : sc.archivo,
                editable: sc.editable,
                previewUrl: sc.previewUrl || null
            }))
        }));

        if (capaEditandoId !== null) {
            setCapas(capas.map(c => {
                if (c.id === capaEditandoId) {
                    return { ...c, id: idGenerado, nombreCapa: nombre, colorDefault: nuevaCapa.colorDefault, paleta: paletaArray, variantes: variantesFinales };
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
            avisar('exito', `Grupo "${nombre}" actualizado.`);
        } else {
            setCapas([...capas, { id: idGenerado, nombreCapa: nombre, colorDefault: nuevaCapa.colorDefault, paleta: paletaArray, editable: true, variantes: variantesFinales }]);
            setColoresVivos(prev => ({ ...prev, [idGenerado]: nuevaCapa.colorDefault }));
            if (variantesFinales.length > 0) setVariantesActivas(prev => ({ ...prev, [idGenerado]: variantesFinales[0].id }));
            avisar('exito', `Grupo "${nombre}" agregado.`);
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

    const generarCodigoJSX = () => {
        let codigo = "";

        if (modoGenerador === 'asset') {
            const nombreComp = nombrePersonaje
                .split('_')
                .filter(Boolean)
                .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
                .join('') || 'AvatarAsset';
            codigo += `import React from 'react';\n\n`;
            codigo += `// Asset para /avatares/${nombrePersonaje}/\n`;
            codigo += `export default function ${nombreComp}({ \n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `    color${idCap} = '${coloresVivos[capa.id] || capa.colorDefault}',\n`;
            });
            codigo += `    className = "w-16 h-16"\n}) {\n`;
            
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `    const var${idCap} = ${JSON.stringify(capa.variantes?.[0]?.subCapas || [])};\n`;
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
            codigo += `import React, { useState } from 'react';\n\n`;
            codigo += `/* Código generado para el avatar: ${nombrePersonaje} */\n`;
            codigo += `/* Pega este bloque dentro de CreadorAvatar.jsx */\n\n`;
            codigo += `const [personajeBase, setPersonajeBase] = useState('${nombrePersonaje}');\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `const [color${idCap}, setColor${idCap}] = useState('${coloresVivos[capa.id] || capa.colorDefault}');\n`;
                const varIdDef = capa.variantes?.[0]?.id || 'v1';
                codigo += `const [variante${idCap}, setVariante${idCap}] = useState('${varIdDef}');\n`;
            });

            codigo += `\n`;
            capas.forEach(capa => {
                const idCap = capa.id.charAt(0).toUpperCase() + capa.id.slice(1);
                codigo += `const variantes${idCap} = ${JSON.stringify(capa.variantes || [], null, 4)};\n`;
            });

            codigo += `\n<div className="relative w-48 h-48 mx-auto bg-white rounded-3xl overflow-hidden">\n`;
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
                        <button onClick={onBack} aria-label="Volver" className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer">
                            ←
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            {modoGenerador === 'avatar' ? 'Editor Avatar' : 'Editor Asset'}
                        </h2>
                        <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                            {guardadoEn
                                ? `Borrador guardado a las ${new Date(guardadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
                                : 'Los cambios se guardan automáticamente en este dispositivo'}
                        </p>
                    </div>
                </div>
                
                <div className="flex bg-amber-200 rounded-2xl p-1 border border-amber-400 shadow-inner">
                    <button onClick={() => setModoGenerador('avatar')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoGenerador === 'avatar' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-900 hover:bg-amber-300'}`}>Avatar</button>
                    <button onClick={() => setModoGenerador('asset')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoGenerador === 'asset' ? 'bg-emerald-600 text-white shadow-md' : 'text-amber-900 hover:bg-amber-300'}`}>Asset Sprites</button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={abrirNuevoPersonaje} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5">
                        + Nuevo
                    </button>
                    <button onClick={() => inputImportarRef.current?.click()} className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">
                        Importar
                    </button>
                    <button onClick={descargarJSON} className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">
                        Exportar JSON
                    </button>
                    <button onClick={copiarJSON} className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">
                        Copiar JSON
                    </button>
                    <input
                        ref={inputImportarRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={importarJSON}
                        className="hidden"
                        aria-label="Importar JSON del generador"
                    />
                </div>
            </div>

            {aviso && (
                <div className={`mb-4 rounded-2xl border-2 px-4 py-3 text-xs font-bold ${
                    aviso.tipo === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : aviso.tipo === 'info'
                            ? 'bg-sky-50 border-sky-200 text-sky-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                    {aviso.mensaje}
                </div>
            )}

            <div className="bg-white p-4 rounded-3xl border-2 border-amber-300 shadow-sm mb-6">
                <h3 className="text-xs font-black uppercase text-amber-900 mb-3 flex items-center justify-between">
                    <span>Biblioteca</span>
                    <span className="text-[10px] font-bold normal-case text-amber-700">
                        Elige una base y personaliza sus capas
                    </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                    {bibliotecaAvatares.map((avatar) => (
                        <div
                            key={avatar.id}
                            onClick={() => seleccionarPersonaje(avatar)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-2 ${nombrePersonaje === avatar.id ? 'bg-amber-600 text-white border-amber-800 shadow-md scale-105' : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'}`}
                        >
                            <Icono nombre={avatar.icono || 'folder'} className="w-4 h-4" />
                            <span>{avatar.nombre}</span>
                            {avatar.base && (
                                <span className="text-[9px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded-full">
                                    Base
                                </span>
                            )}
                            {!avatar.base && (
                                <button
                                    type="button"
                                    onClick={(e) => eliminarAvatarDeBiblioteca(avatar.id, e)}
                                    aria-label={`Eliminar ${avatar.nombre}`}
                                    className="ml-1 text-red-600 hover:text-white hover:bg-red-600 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-5 flex flex-col gap-5">
                    
                    <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-md flex flex-col items-center">
                        <h3 className="font-black text-xs text-amber-900 uppercase tracking-wider mb-3">Visor ({nombrePersonaje})</h3>
                        
                        <div className="relative w-56 h-56 bg-amber-50 rounded-3xl border-4 border-amber-400 flex items-center justify-center shadow-inner overflow-hidden mb-4">
                            {capas.length === 0 ? <div className="text-center p-4"><Icono nombre="palette" className="w-6 h-6 mx-auto text-amber-700" /></div> : (
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
                                <label className="block text-[11px] font-bold text-amber-800 uppercase">Ajustes Vivos:</label>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {capas.map(capa => {
                                        const varActiva = variantesActivas[capa.id] || capa.variantes?.[0]?.id;
                                        return (
                                            <div key={capa.id} className="flex flex-col bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-amber-900">{capa.nombreCapa}</span>
                                                    <input type="color" value={coloresVivos[capa.id] || capa.colorDefault} onChange={(e) => setColoresVivos(prev => ({ ...prev, [capa.id]: e.target.value }))} onBlur={(e) => agregarColorReciente(e.target.value)} className="w-6 h-6 rounded-md border border-amber-300 cursor-pointer bg-transparent" />
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {coloresRecientes.map((hex, i) => (
                                                        <button key={i} type="button" onClick={() => setColoresVivos(prev => ({ ...prev, [capa.id]: hex }))} className="w-4 h-4 rounded-full border border-amber-900 shadow-xs cursor-pointer" style={{ backgroundColor: hex }} />
                                                    ))}
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
                            <span>GRUPOS ({capas.length})</span>
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
                                            <button type="button" onClick={() => iniciarEdicionCapa(c)} aria-label={`Editar ${c.nombreCapa}`} className="px-1.5 py-1 bg-amber-200 rounded-lg text-xs font-bold cursor-pointer"><Icono nombre="pencil" className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => moverCapa(i, 'arriba')} disabled={i === 0} aria-label={`Subir ${c.nombreCapa}`} className="px-1.5 py-1 bg-amber-200 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer"><Icono nombre="arrowUp" className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => moverCapa(i, 'abajo')} disabled={i === capas.length - 1} aria-label={`Bajar ${c.nombreCapa}`} className="px-1.5 py-1 bg-amber-200 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer"><Icono nombre="arrowDown" className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => eliminarCapa(c.id)} aria-label={`Eliminar ${c.nombreCapa}`} className="text-red-600 font-bold px-2 py-1 bg-red-100 rounded-lg text-[10px] cursor-pointer ml-1">✕</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className={`p-4 rounded-3xl border-2 shadow-sm space-y-3 ${capaEditandoId ? 'bg-gradient-to-br from-amber-200/90 to-amber-100 border-amber-500' : 'bg-gradient-to-br from-amber-100/70 to-orange-50 border-amber-300/80'}`}>
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                                    <Icono nombre={capaEditandoId ? 'pencil' : 'sparkles'} className="w-4 h-4" /> Configurar Grupo
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-amber-900">Nombre (ej: Gafas pro):</label>
                                <input type="text" value={nuevaCapa.nombreCapa} onChange={(e) => setNuevaCapa({...nuevaCapa, nombreCapa: e.target.value})} className="w-full px-3 py-2 border-2 border-amber-300 rounded-2xl text-xs bg-white text-amber-950 outline-none focus:border-amber-500" />
                            </div>
                            
                            <div className="space-y-2 bg-white/80 p-3 rounded-2xl border border-amber-300 max-h-60 overflow-y-auto">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-black text-amber-900 uppercase">Variantes & Subcapas:</label>
                                    <button type="button" onClick={agregarVarianteTemp} className="bg-amber-700 text-white font-bold px-2 py-1 rounded-xl text-[10px] inline-flex items-center gap-1"><Icono nombre="plus" className="w-3 h-3" /> Variante</button>
                                </div>
                                
                                {nuevaCapa.variantesTemp.map((v, indexVar) => (
                                    <div key={v.id || indexVar} className="bg-amber-50 p-2 rounded-xl border border-amber-300 space-y-2">
                                        <div className="grid grid-cols-[1fr_84px_auto] items-center gap-2">
                                            <input type="text" aria-label={`Nombre de la variante ${indexVar + 1}`} placeholder="Nombre de la variante" value={v.nombre} onChange={(e) => { const copy = [...nuevaCapa.variantesTemp]; copy[indexVar].nombre = e.target.value; setNuevaCapa(p => ({...p, variantesTemp: copy})); }} className="w-full px-2 py-1 border border-amber-300 rounded-lg text-[10px] bg-white outline-none" />
                                            <label className="flex items-center gap-1 text-[9px] font-bold text-amber-800">
                                                Costo
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    aria-label={`Costo de la variante ${indexVar + 1}`}
                                                    value={v.costo ?? 0}
                                                    onChange={(e) => {
                                                        const copy = [...nuevaCapa.variantesTemp];
                                                        copy[indexVar].costo = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                                        setNuevaCapa(p => ({ ...p, variantesTemp: copy }));
                                                    }}
                                                    className="w-14 px-1.5 py-1 border border-amber-300 rounded-lg text-[10px] bg-white outline-none"
                                                />
                                            </label>
                                            <button type="button" onClick={() => eliminarVarianteTemp(indexVar)} aria-label={`Eliminar variante ${indexVar + 1}`} className="text-red-600 bg-red-100 px-2 py-1 rounded-lg text-xs font-bold"><Icono nombre="trash" className="w-3.5 h-3.5" /></button>
                                        </div>

                                        <div className="space-y-1">
                                            {v.subCapas.map((sc, indexSub) => (
                                                <div key={sc.id || indexSub} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 rounded-lg border border-amber-200">
                                                    <input type="file" accept=".svg" aria-label={`SVG de la subcapa ${indexSub + 1}`} onChange={(e) => handleSubCapaFileChange(indexVar, indexSub, e)} className="w-full sm:w-auto text-[9px] file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:bg-amber-600 file:text-white cursor-pointer" />
                                                    <div className="flex gap-1 w-full sm:w-auto justify-end">
                                                        <button type="button" onClick={() => toggleSubCapaEditable(indexVar, indexSub)} className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${sc.editable ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                                            {sc.editable ? <><Icono nombre="palette" className="w-3 h-3" /> Base</> : <><Icono nombre="lock" className="w-3 h-3" /> Fijo</>}
                                                        </button>
                                                        <button type="button" onClick={() => eliminarSubCapa(indexVar, indexSub)} aria-label={`Eliminar subcapa ${indexSub + 1}`} className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-[10px]">✕</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => agregarSubCapa(indexVar)} className="w-full text-center bg-amber-200 text-amber-900 font-bold py-1 rounded-lg text-[10px] inline-flex items-center justify-center gap-1"><Icono nombre="plus" className="w-3 h-3" /> Añadir Subcapa</button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-white p-2 rounded-2xl border-2 border-amber-300 shadow-inner flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-amber-900">Color Base del Grupo:</span>
                                    <input type="color" value={nuevaCapa.colorDefault} onChange={(e) => setNuevaCapa({...nuevaCapa, colorDefault: e.target.value})} onBlur={(e) => agregarColorReciente(e.target.value)} className="w-7 h-7 rounded-xl border border-amber-300 cursor-pointer bg-transparent" />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {coloresRecientes.map((hex, i) => (
                                        <button key={i} type="button" onClick={() => setNuevaCapa(prev => ({ ...prev, colorDefault: hex }))} className="w-4 h-4 rounded-full border border-amber-900 shadow-xs cursor-pointer" style={{ backgroundColor: hex }} title={`Usar ${hex}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/80 p-3 rounded-2xl border-2 border-amber-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black text-amber-900 uppercase">Paleta:</label>
                                    <button type="button" onClick={handleVaciarPaleta} className="text-[9px] text-red-600 border border-red-200 px-2 py-0.5 rounded-full cursor-pointer"><Icono nombre="trash" className="w-3 h-3" /></button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input type="color" value={nuevaCapa.colorTemp} onChange={(e) => setNuevaCapa({...nuevaCapa, colorTemp: e.target.value})} onBlur={(e) => agregarColorReciente(e.target.value)} className="w-6 h-6 rounded-lg border border-amber-300 cursor-pointer bg-transparent" />
                                    <button type="button" onClick={handleAgregarColorAPaleta} className="bg-amber-700 text-white font-bold py-1 px-2 rounded-xl text-[10px] cursor-pointer inline-flex items-center gap-1"><Icono nombre="plus" className="w-3 h-3" /> Añadir</button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {coloresRecientes.map((hex, i) => (
                                        <button key={i} type="button" onClick={() => setNuevaCapa(prev => ({ ...prev, colorTemp: hex }))} className="w-4 h-4 rounded-full border border-amber-900 shadow-xs cursor-pointer" style={{ backgroundColor: hex }} title={`Seleccionar ${hex}`} />
                                    ))}
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
                                    <button type="button" onClick={cancelarEdicion} className="bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-2xl text-xs cursor-pointer"><Icono nombre="x" className="w-4 h-4" /></button>
                                )}
                                <button type="button" onClick={handleGuardarCapa} className="flex-1 bg-amber-600 text-white font-black py-3 rounded-2xl text-xs cursor-pointer uppercase">
                                    {capaEditandoId ? 'Guardar Grupo' : 'Añadir Grupo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-[#1e1e1e] p-5 rounded-3xl border-2 border-amber-500 shadow-xl flex flex-col h-full">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-black text-amber-400 uppercase tracking-wider">Código Listo</label>
                            <span className="text-[10px] text-gray-400 font-mono text-right max-w-[120px]">
                                {modoGenerador === 'asset' ? 'Multi-Color Sprite' : 'Avatar Engine'}
                            </span>
                        </div>
                        <textarea 
                            readOnly
                            value={generarCodigoJSX()}
                            className="w-full flex-1 min-h-[520px] p-4 bg-[#141414] text-[#9cdcfe] font-mono text-[10px] rounded-2xl shadow-inner resize-none focus:outline-none leading-relaxed border border-gray-800"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <button type="button" onClick={() => { navigator.clipboard.writeText(generarCodigoJSX()).then(() => avisar('exito', 'Código copiado al portapapeles.')).catch(() => avisar('error', 'No se pudo copiar el código.')); }} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl cursor-pointer text-sm flex items-center justify-center gap-2">
                                Copiar Componente
                            </button>
                            <button type="button" onClick={copiarJSON} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3.5 rounded-2xl cursor-pointer text-sm flex items-center justify-center gap-2">
                                Copiar JSON
                            </button>
                            <button type="button" onClick={descargarJSON} className="flex-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-black py-3.5 rounded-2xl cursor-pointer text-sm flex items-center justify-center gap-2">
                                Descargar JSON
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed font-medium">
                            Coloca los SVG en <code className="text-amber-300">/public/avatares/{nombrePersonaje}/</code>.
                            El JSON guarda capas, variantes, costos y paletas para continuar después.
                        </p>
                    </div>
                </div>
            </div>

            {nuevoPersonajeAbierto && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="nuevo-personaje-titulo" className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-2xl w-full max-w-sm">
                        <h3 id="nuevo-personaje-titulo" className="text-lg font-black text-amber-950 mb-1">
                            Nuevo personaje
                        </h3>
                        <p className="text-[11px] text-amber-700 font-medium mb-3">
                            Se creará una carpeta lógica para organizar sus capas. Después puedes agregar grupos y variantes.
                        </p>
                        <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">
                            Nombre del personaje
                        </label>
                        <input
                            type="text"
                            value={nombreNuevoPersonaje}
                            onChange={(evento) => {
                                setNombreNuevoPersonaje(evento.target.value);
                                setErrorNuevoPersonaje('');
                            }}
                            maxLength={60}
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                            autoFocus
                        />
                        {errorNuevoPersonaje && (
                            <p className="text-[10px] font-bold text-red-700 mt-1">{errorNuevoPersonaje}</p>
                        )}
                        <p className="text-[10px] text-amber-700 mt-2">
                            Carpeta sugerida: <code className="font-bold">/public/avatares/{slugify(nombreNuevoPersonaje) || 'nuevo_personaje'}/</code>
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => setNuevoPersonajeAbierto(false)} className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl px-3 py-2 text-[11px] font-bold cursor-pointer">
                                Cancelar
                            </button>
                            <button type="button" onClick={crearNuevoPersonaje} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-3 py-2 text-[11px] font-bold cursor-pointer">
                                Crear personaje
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}