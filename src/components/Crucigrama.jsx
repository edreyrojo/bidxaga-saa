import React, { useState, useEffect, useRef } from 'react';
import { listaAnimales } from '../data/animales.js';
import { listaFlora } from '../data/flora.js';
import {
    categoriaInicialPorDefecto,
    sincronizarDesbloqueosPorNivel,
    filtrarContenidoPorCategorias
} from '../data/Categoriascontenido.js';
import { calcularNivelCuenta } from '../utils/Nivelcuenta.js';
import SelectorCategorias from './SelectorCategorias.jsx';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

const RECOMPENSAS_CRUCIGRAMA = {
    1: 15,
    2: 30,
    3: 50,
    4: 70,
    5: 90
};

const MAX_VIDAS = 5;

const obtenerBaseDatosActiva = (modo, categoriasFaunaActivas = [], categoriasFloraActivas = []) => {
    const faunaFiltrada = filtrarContenidoPorCategorias(listaAnimales, categoriasFaunaActivas);
    const floraFiltrada = filtrarContenidoPorCategorias(listaFlora, categoriasFloraActivas);

    switch (modo) {
        case 'flora':
            return floraFiltrada;
        case 'fauna':
            return faunaFiltrada;
        case 'ambos': {
            const floraConOffset = floraFiltrada.map(item => ({ ...item, id: item.id + 1000, categoria: item.categoria, tipoContenido: 'flora' }));
            const faunaConOffset = faunaFiltrada.map(item => ({ ...item, tipoContenido: 'fauna' }));
            return [...faunaConOffset, ...floraConOffset];
        }
        default:
            return faunaFiltrada;
    }
};

const limpiarPalabra = (texto, modoDificil = false) => {
    if (!texto || typeof texto !== 'string') return "";
    if (modoDificil) {
        return texto
            .normalize("NFC")
            .toUpperCase()
            .replace(/[^A-ZÁÉÍÓÚÜÑ'\s]/g, "")
            .trim();
    }
    return texto
        .normalize("NFD")
        .toUpperCase()
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^A-Z]/g, "");        
};

const generarTableroCrucigrama = (candidatos, modoDificil = false) => {
    let grid = {}; 
    let placements = []; 
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    let numberCounter = 1;

    const addPlacement = (animal, text, startX, startY, dirX, dirY, number) => {
        placements.push({ id: animal.id, text, x: startX, y: startY, dirX, dirY, number, animal });
        for (let i = 0; i < text.length; i++) {
            let px = startX + (i * dirX);
            let py = startY + (i * dirY);
            let key = `${px},${py}`;
            
            if (!grid[key]) grid[key] = { char: text[i], words: [] };
            grid[key].words.push(animal.id);
            if (i === 0 && !grid[key].number) grid[key].number = number;

            minX = Math.min(minX, px);
            maxX = Math.max(maxX, px);
            minY = Math.min(minY, py);
            maxY = Math.max(maxY, py);
        }
    };

    candidatos.forEach((animal, index) => {
        if (!animal || !animal.diidxaza) return;
        const text = limpiarPalabra(animal.diidxaza, modoDificil);
        if (!text) return;

        if (index === 0 || placements.length === 0) {
            addPlacement(animal, text, 0, 0, 1, 0, numberCounter++);
            return;
        }

        let placed = false;
        for (let p of placements) {
            if (placed) break;
            for (let i = 0; i < text.length; i++) {
                if (placed) break;
                for (let j = 0; j < p.text.length; j++) {
                    if (text[i] === p.text[j]) {
                        let newDirX = p.dirY === 0 ? 0 : 1;
                        let newDirY = p.dirX === 0 ? 0 : 1;

                        let crossX = p.x + (j * p.dirX);
                        let crossY = p.y + (j * p.dirY);

                        let startX = crossX - (i * newDirX);
                        let startY = crossY - (i * newDirY);

                        let valid = true;
                        for (let k = 0; k < text.length; k++) {
                            let checkX = startX + k * newDirX;
                            let checkY = startY + k * newDirY;
                            let key = `${checkX},${checkY}`;
                            let cell = grid[key];

                            if (cell && cell.char !== text[k]) { valid = false; break; }
                            if (!cell) {
                                let n1 = grid[`${checkX + newDirY},${checkY + newDirX}`];
                                let n2 = grid[`${checkX - newDirY},${checkY - newDirX}`];
                                if (n1 || n2) { valid = false; break; }

                                if (k === 0 && grid[`${checkX - newDirX},${checkY - newDirY}`]) { valid = false; break; }
                                if (k === text.length - 1 && grid[`${checkX + newDirX},${checkY + newDirY}`]) { valid = false; break; }
                            }
                        }

                        if (valid) {
                            addPlacement(animal, text, startX, startY, newDirX, newDirY, numberCounter++);
                            placed = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!placed) {
            addPlacement(animal, text, minX, maxY + 2, 1, 0, numberCounter++);
        }
    });

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    let matriz = Array(height).fill(null).map(() => Array(width).fill({ empty: true }));

    for (let key in grid) {
        let [x, y] = key.split(',').map(Number);
        matriz[y - minY][x - minX] = {
            empty: false,
            char: grid[key].char,
            number: grid[key].number,
            words: grid[key].words
        };
    }

    const translatedPlacements = placements.map(p => ({
        ...p, startX: p.x - minX, startY: p.y - minY
    }));

    return { matriz, placements: translatedPlacements, width, height };
};

export default function Crucigrama({ 
    onBack, 
    user, 
    setControlesJuegoActivo,
    onSetControles 
}) {
    const reproducirSonido = (tipo) => {
        try {
            let archivo = '/audio/click1.mp3';
            if (tipo === 2) archivo = '/audio/click2.mp3';
            if (tipo === 3) archivo = '/audio/click3.mp3';
            const audio = new Audio(archivo);
            audio.play().catch(e => console.log("Audio play prevented:", e));
        } catch (err) {
            console.log("Error al reproducir sonido:", err);
        }
    };

    const [nivel, setNivel] = useState(() => {
        const n = localStorage.getItem('crucigramaNivel');
        return n ? parseInt(n, 10) : 1;
    });
    
    const [intentos, setIntentos] = useState(() => {
        const i = localStorage.getItem('crucigramaIntentos');
        return i ? parseInt(i, 10) : 0;
    });

    const [tipoContenido, setTipoContenido] = useState(() => {
        return localStorage.getItem('tipoContenidoJuego') || 'fauna';
    });

    const [vidas, setVidas] = useState(() => {
        const vidasGuardadas = localStorage.getItem('crucigramaVidas');
        const v = parseInt(vidasGuardadas, 10);
        if (!isNaN(v) && v > 0 && v <= MAX_VIDAS) {
            return v;
        }
        localStorage.setItem('crucigramaVidas', MAX_VIDAS);
        return MAX_VIDAS;
    });

    const [placements, setPlacements] = useState([]);
    const [matriz, setMatriz] = useState([]);
    const [respuestasUsuario, setRespuestasUsuario] = useState({});
    const [palabrasResueltas, setPalabrasResueltas] = useState([]);
    const [modoDificil, setModoDificil] = useState(false);
    const [totopos, setTotopos] = useState(0);
    const [intentosErroneosPalabras, setIntentosErroneosPalabras] = useState({});
    const [fichasVistas, setFichasVistas] = useState([]);
    const [activePlacement, setActivePlacement] = useState(null);
    const [dialSeleccion, setDialSeleccion] = useState([]);
    const [letrasElegidas, setLetrasElegidas] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const dialRef = useRef(null);

    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);

    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    const [nivelCuenta, setNivelCuenta] = useState(1);
    const [categoriasFaunaDesbloqueadas, setCategoriasFaunaDesbloqueadas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFloraDesbloqueadas, setCategoriasFloraDesbloqueadas] = useState(() => categoriaInicialPorDefecto('flora'));
    
    const [categoriasFaunaActivas, setCategoriasFaunaActivas] = useState(() => {
        try {
            const guardadas = JSON.parse(localStorage.getItem('crucigramaCategoriasFaunaActivas') || 'null');
            return guardadas && guardadas.length > 0 ? guardadas : categoriaInicialPorDefecto('fauna');
        } catch (e) {
            return categoriaInicialPorDefecto('fauna');
        }
    });
    
    const [categoriasFloraActivas, setCategoriasFloraActivas] = useState(() => {
        try {
            const guardadas = JSON.parse(localStorage.getItem('crucigramaCategoriasFloraActivas') || 'null');
            return guardadas && guardadas.length > 0 ? guardadas : categoriaInicialPorDefecto('flora');
        } catch (e) {
            return categoriaInicialPorDefecto('flora');
        }
    });

    const [showSelectorCategorias, setShowSelectorCategorias] = useState(false);

    const recompensaActual = RECOMPENSAS_CRUCIGRAMA[nivel] || (20 * nivel);

    const confirmarGuardadoAutomatico = async (nombreLimpio) => {
        reproducirSonido(1);
        const scoreToSave = pendingGlobalScore || { level: nivel, intentos: intentos };
        const currentUser = user || auth.currentUser;
        const docId = currentUser ? currentUser.uid : nombreLimpio.toLowerCase().replace(/\s+/g, '_');

        try {
            const docRef = doc(db, "ranking_crucigrama", docId);
            const docSnap = await getDoc(docRef);

            let guardar = true;
            if (docSnap.exists()) {
                const dataAntigua = docSnap.data();
                const nivelAntiguo = dataAntigua.level || 1;
                const intentosAntiguos = dataAntigua.intentos || 0;

                if (scoreToSave.level < nivelAntiguo || (scoreToSave.level === nivelAntiguo && scoreToSave.intentos >= intentosAntiguos)) {
                    guardar = false;
                }
            }

            if (guardar) {
                await setDoc(docRef, {
                    name: nombreLimpio,
                    intentos: scoreToSave.intentos,
                    level: scoreToSave.level,
                    fecha: new Date().toISOString()
                }, { merge: true });
            }

            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "Guardado Exitoso",
                message: guardar 
                    ? `${nombreLimpio}: Record registrado en Nivel ${scoreToSave.level} (${scoreToSave.intentos} intentos).`
                    : `Ya tienes un record igual o superior registrado.`
            });
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    const handleClickGuardar = () => {
        reproducirSonido(1);
        localStorage.setItem('crucigramaNivel', nivel);
        localStorage.setItem('crucigramaIntentos', intentos);
        localStorage.setItem('crucigramaVidas', vidas);
        localStorage.setItem('crucigramaModoDificil', modoDificil);
        localStorage.setItem('totopos', totopos);

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "Nivel ya guardado",
                message: `Ya guardaste tu record global para el Nivel ${nivel}. Avanza al siguiente nivel para volver a registrar tu puntaje en el ranking.`
            });
            return;
        }

        const currentUser = user || auth.currentUser;
        if (currentUser && playerName) {
            confirmarGuardadoAutomatico(playerName);
            return;
        }

        setInputPlayerName(playerName);
        setShowGuardarModal(true);
    };

    useEffect(() => {
        const registrarControles = setControlesJuegoActivo || onSetControles;
        if (registrarControles) {
            registrarControles({
                level: nivel,
                onGuardarClick: handleClickGuardar,
                onReiniciarClick: () => {
                    reproducirSonido(1);
                    setShowConfirmRestartModal(true);
                },
                onMenuClick: () => {
                    reproducirSonido(1);
                    setShowMenuModal(true);
                },
                modoDificil: modoDificil,
                onToggleModoDificil: () => {
                    reproducirSonido(1);
                    const nuevoModo = !modoDificil;
                    setModoDificil(nuevoModo);
                    localStorage.setItem('crucigramaModoDificil', nuevoModo);
                }
            });
        }
        return () => {
            if (registrarControles) {
                registrarControles(null);
            }
        };
    }, [nivel, intentos, vidas, modoDificil, totopos, guardadoEnNivel, pendingGlobalScore, playerName, tipoContenido, setControlesJuegoActivo, onSetControles, user]);

    const confirmarSalidaMenu = () => {
        reproducirSonido(1);
        setShowMenuModal(false);
        if (onBack) onBack();
    };

    useEffect(() => {
        const modoDificilGuardado = localStorage.getItem('crucigramaModoDificil');
        const nombreGuardado = localStorage.getItem('crucigramaPlayerName');
        const totoposGuardados = localStorage.getItem('totopos');

        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        if (nombreGuardado) {
            setPlayerName(nombreGuardado);
            setInputPlayerName(nombreGuardado);
        }
        if (totoposGuardados) setTotopos(parseInt(totoposGuardados, 10));

        try {
            const faunaGuardadas = JSON.parse(localStorage.getItem('categoriasFaunaDesbloqueadas') || 'null');
            if (faunaGuardadas) {
                setCategoriasFaunaDesbloqueadas(faunaGuardadas);
            }
            const floraGuardadas = JSON.parse(localStorage.getItem('categoriasFloraDesbloqueadas') || 'null');
            if (floraGuardadas) {
                setCategoriasFloraDesbloqueadas(floraGuardadas);
            }

            const faunaActivasGuardadas = JSON.parse(localStorage.getItem('crucigramaCategoriasFaunaActivas') || 'null');
            if (faunaActivasGuardadas) {
                const validas = faunaActivasGuardadas.filter(id => (faunaGuardadas || categoriaInicialPorDefecto('fauna')).includes(id));
                if (validas.length > 0) setCategoriasFaunaActivas(validas);
            }

            const floraActivasGuardadas = JSON.parse(localStorage.getItem('crucigramaCategoriasFloraActivas') || 'null');
            if (floraActivasGuardadas) {
                const validas = floraActivasGuardadas.filter(id => (floraGuardadas || categoriaInicialPorDefecto('flora')).includes(id));
                if (validas.length > 0) setCategoriasFloraActivas(validas);
            }
        } catch (e) {
            console.error("Error al leer categorias guardadas localmente:", e);
        }

        const cargarTotoposNube = async () => {
            const currentUser = user || auth.currentUser;
            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'usuarios', currentUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.totopos !== undefined) {
                            setTotopos(data.totopos);
                            localStorage.setItem('totopos', data.totopos);
                        }

                        const historico = data.totoposHistoricos !== undefined ? data.totoposHistoricos : (data.totopos || 0);
                        const nivelCalc = calcularNivelCuenta(historico);
                        setNivelCuenta(nivelCalc);

                        const faunaNube = sincronizarDesbloqueosPorNivel('fauna', data.categoriasFaunaDesbloqueadas || categoriaInicialPorDefecto('fauna'), nivelCalc);
                        const floraNube = sincronizarDesbloqueosPorNivel('flora', data.categoriasFloraDesbloqueadas || categoriaInicialPorDefecto('flora'), nivelCalc);
                        setCategoriasFaunaDesbloqueadas(faunaNube);
                        setCategoriasFloraDesbloqueadas(floraNube);
                        localStorage.setItem('categoriasFaunaDesbloqueadas', JSON.stringify(faunaNube));
                        localStorage.setItem('categoriasFloraDesbloqueadas', JSON.stringify(floraNube));

                        const faunaActivasGuardadas = JSON.parse(localStorage.getItem('crucigramaCategoriasFaunaActivas') || 'null');
                        setCategoriasFaunaActivas(prev => {
                            const base = faunaActivasGuardadas || prev;
                            const activasValidas = base.filter(id => faunaNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('fauna');
                        });

                        const floraActivasGuardadas = JSON.parse(localStorage.getItem('crucigramaCategoriasFloraActivas') || 'null');
                        setCategoriasFloraActivas(prev => {
                            const base = floraActivasGuardadas || prev;
                            const activasValidas = base.filter(id => floraNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('flora');
                        });

                        const nickNube = data.nickname || data.nombre || data.name;
                        if (nickNube) {
                            setPlayerName(nickNube);
                            setInputPlayerName(nickNube);
                            localStorage.setItem('crucigramaPlayerName', nickNube);
                        }
                    }
                } catch (e) {
                    console.error("Error al cargar totopos de la nube:", e);
                }
            }
        };
        cargarTotoposNube();
        cargarRankingGlobal();
    }, [user]);

    useEffect(() => {
        generarNuevoJuego();
    }, [nivel, modoDificil, tipoContenido, categoriasFaunaActivas, categoriasFloraActivas]);

    useEffect(() => {
        const dialElement = dialRef.current;
        if (!dialElement) return;

        const handleTouchMoveNonPassive = (e) => {
            if (!isDragging) return;
            e.preventDefault(); 
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.dataset.nodeIndex !== undefined) {
                const index = parseInt(target.dataset.nodeIndex, 10);
                setLetrasElegidas(prev => {
                    if (!prev.includes(index)) return [...prev, index];
                    return prev;
                });
            }
        };

        dialElement.addEventListener('touchmove', handleTouchMoveNonPassive, { passive: false });
        return () => {
            dialElement.removeEventListener('touchmove', handleTouchMoveNonPassive);
        };
    }, [isDragging]);

    useEffect(() => {
        if (palabrasResueltas.length === placements.length && placements.length > 0 && !pendingGlobalScore) {
            reproducirSonido(3); 
            setPendingGlobalScore({ level: nivel, intentos: intentos });

            const activoActual = tipoContenido === 'flora' ? categoriasFloraActivas : categoriasFaunaActivas;
            if (activoActual.length === 1 && nivel >= 3) {
                const avisoClave = `avisoCategoria_crucigrama_nivel_${nivel}`;
                const yaMostrado = sessionStorage.getItem(avisoClave);
                if (!yaMostrado) {
                    sessionStorage.setItem(avisoClave, 'true');
                    setFeedbackModal({
                        show: true,
                        title: "Desafío Bajo",
                        message: "Has dominado esta categoría con facilidad. Abre el selector de categorías para añadir más grupos y subir la dificultad."
                    });
                }
            }

            setTotopos(prevTotopos => {
                const nuevosTotopos = prevTotopos + recompensaActual;
                localStorage.setItem('totopos', nuevosTotopos);

                const currentUser = user || auth.currentUser;
                if (currentUser) {
                    const abonarTotopos = async () => {
                        try {
                            const userRef = doc(db, 'usuarios', currentUser.uid);
                            const userSnap = await getDoc(userRef);
                            
                            if (userSnap.exists()) {
                                await updateDoc(userRef, {
                                    totopos: increment(recompensaActual),
                                    totoposHistoricos: increment(recompensaActual)
                                });
                            } else {
                                await setDoc(userRef, {
                                    email: currentUser.email,
                                    totopos: nuevosTotopos,
                                    totoposHistoricos: nuevosTotopos,
                                    avatar: 'default',
                                    avataresDesbloqueados: ['default'],
                                    categoriasFaunaDesbloqueadas: categoriaInicialPorDefecto('fauna'),
                                    categoriasFloraDesbloqueadas: categoriaInicialPorDefecto('flora')
                                }, { merge: true });
                            }
                        } catch (err) {
                            console.error("Error al abonar totopos:", err);
                        }
                    };
                    abonarTotopos();
                }

                return nuevosTotopos;
            });
        }
    }, [palabrasResueltas, placements, nivel, intentos, user, recompensaActual, pendingGlobalScore, categoriasFaunaActivas, categoriasFloraActivas, tipoContenido]);

    const generarNuevoJuego = () => {
        setVidas(prev => {
            if (prev <= 0) {
                localStorage.setItem('crucigramaVidas', MAX_VIDAS);
                return MAX_VIDAS;
            }
            return prev;
        });
        setShowGameOverModal(false);

        const baseDatosActiva = obtenerBaseDatosActiva(tipoContenido, categoriasFaunaActivas, categoriasFloraActivas);
        const poolSeguro = baseDatosActiva.length > 0 ? baseDatosActiva : filtrarContenidoPorCategorias(listaAnimales, categoriaInicialPorDefecto('fauna'));
        const cantidadAnimales = Math.min(2 + nivel, 6);
        const candidatos = [...poolSeguro]
            .filter(a => a && a.diidxaza && limpiarPalabra(a.diidxaza, modoDificil).length > 2)
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidadAnimales);

        const data = generarTableroCrucigrama(candidatos, modoDificil);
        setMatriz(data.matriz);
        setPlacements(data.placements);
        setRespuestasUsuario({});
        setPalabrasResueltas([]);
        setActivePlacement(null);
        setIntentosErroneosPalabras({});
        setFichasVistas([]);
        setGuardadoEnNivel(false);
    };

    const abrirDialParaPalabra = (p) => {
        reproducirSonido(1); 
        if (palabrasResueltas.includes(p.id)) return;
        setActivePlacement(p);

        if (!fichasVistas.includes(p.id)) {
            setFichasVistas(prev => [...prev, p.id]);
        }

        const letrasMezcladas = p.text.split('').sort(() => Math.random() - 0.5);
        setDialSeleccion(letrasMezcladas);
        setLetrasElegidas([]);
    };

    const handleCellClick = (celda) => {
        reproducirSonido(1); 
        if (celda.empty || !celda.words || celda.words.length === 0) return;
        let wordId = celda.words.find(id => !palabrasResueltas.includes(id)) || celda.words[0];
        const targetPlacement = placements.find(p => p.id === wordId);
        if (targetPlacement) {
            abrirDialParaPalabra(targetPlacement);
        }
    };

    const usarPistaRevelar = () => {
        reproducirSonido(1); 
        if (!activePlacement) return;
        const COSTO_PISTA = 10;
        
        if (totopos < COSTO_PISTA) {
            setFeedbackModal({
                show: true,
                title: "Totopos Insuficientes",
                message: `Necesitas al menos ${COSTO_PISTA} Totopos para usar la pista de revelacion.`
            });
            return;
        }

        const nuevosTotopos = totopos - COSTO_PISTA;
        setTotopos(nuevosTotopos);
        localStorage.setItem('totopos', nuevosTotopos);

        const nuevasRespuestas = { ...respuestasUsuario };
        for (let i = 0; i < activePlacement.text.length; i++) {
            let pr = activePlacement.startY + (i * activePlacement.dirY);
            let pc = activePlacement.startX + (i * activePlacement.dirX);
            nuevasRespuestas[`${pr}-${pc}`] = activePlacement.text[i];
        }
        setRespuestasUsuario(nuevasRespuestas);

        if (!palabrasResueltas.includes(activePlacement.id)) {
            setPalabrasResueltas(prev => [...prev, activePlacement.id]);
        }

        reproducirSonido(2); 
        setActivePlacement(null);
        setLetrasElegidas([]);
        setFeedbackModal({
            show: true,
            title: "Pista Aplicada",
            message: `Se han gastado ${COSTO_PISTA} Totopos para revelar la palabra correctamente.`
        });
    };

    const esLarga = dialSeleccion.length > 10;
    const dialSize = esLarga ? "w-64 h-64" : "w-52 h-52";
    const center = esLarga ? 128 : 104;
    const radius = esLarga ? 100 : 75;

    const getNodeCoords = (index) => {
        const total = dialSeleccion.length;
        if (total === 0) return { x: center, y: center };
        const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
        return {
            x: center + Math.cos(angle) * radius,
            y: center + Math.sin(angle) * radius
        };
    };

    const handleTouchStartNode = (index) => {
        reproducirSonido(1); 
        setIsDragging(true);
        setLetrasElegidas(prev => {
            if (!prev.includes(index)) return [index];
            return prev;
        });
    };

    const handleTouchEnterNode = (index) => {
        if (!isDragging) return;
        setLetrasElegidas(prev => {
            if (!prev.includes(index)) return [...prev, index];
            return prev;
        });
    };

    const handleMouseUpGlobal = () => {
        if (isDragging) setIsDragging(false);
    };

    const handleMouseMoveGlobal = (e) => {
        if (!isDragging || !dialRef.current) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.dataset.nodeIndex !== undefined) {
            const index = parseInt(target.dataset.nodeIndex, 10);
            setLetrasElegidas(prev => {
                if (!prev.includes(index)) return [...prev, index];
                return prev;
            });
        }
    };

    const limpiarDial = () => {
        reproducirSonido(1); 
        setLetrasElegidas([]);
    };

    const verificarYAplicarPalabra = () => {
        reproducirSonido(1); 
        if (!activePlacement) return;

        const longitudRequerida = activePlacement.text.length;
        if (letrasElegidas.length !== longitudRequerida) {
            setFeedbackModal({
                show: true,
                title: "Palabra Incompleta",
                message: `Selecciona exactamente ${longitudRequerida} letras para formar la palabra antes de comprobar.`
            });
            return;
        }

        const palabraFormada = letrasElegidas.map(i => dialSeleccion[i]).join('');

        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);
        localStorage.setItem('crucigramaIntentos', nuevosIntentos);

        if (palabraFormada === activePlacement.text) {
            reproducirSonido(2); 
            const nuevasRespuestas = { ...respuestasUsuario };
            for (let i = 0; i < activePlacement.text.length; i++) {
                let pr = activePlacement.startY + (i * activePlacement.dirY);
                let pc = activePlacement.startX + (i * activePlacement.dirX);
                nuevasRespuestas[`${pr}-${pc}`] = activePlacement.text[i];
            }
            setRespuestasUsuario(nuevasRespuestas);

            if (!palabrasResueltas.includes(activePlacement.id)) {
                setPalabrasResueltas(prev => [...prev, activePlacement.id]);
            }

            setActivePlacement(null);
            setLetrasElegidas([]);
        } else {
            const idPalabraSeguro = activePlacement.number; 
            const erroresDePalabra = intentosErroneosPalabras[idPalabraSeguro] || {};
            const errorCount = (erroresDePalabra[palabraFormada] || 0) + 1;

            setIntentosErroneosPalabras(prev => ({
                ...prev,
                [idPalabraSeguro]: {
                    ...(prev[idPalabraSeguro] || {}),
                    [palabraFormada]: errorCount
                }
            }));

            const todasVistas = placements.length > 0 && fichasVistas.length === placements.length;

            if (!todasVistas) {
                setFeedbackModal({
                    show: true,
                    title: "Palabra Incorrecta",
                    message: "Combinacion incorrecta. Aun no has visto todas las fichas del tablero por primera vez, ¡así que no pierdes vidas!"
                });
            } else if (errorCount < 3) {
                setFeedbackModal({
                    show: true,
                    title: "Intento Erroneo",
                    message: `Llevas ${errorCount} de 3 intentos con este mismo error para esta palabra. ¡Te quedan ${3 - errorCount} intentos antes de perder una vida!`
                });
            } else {
                const nuevasVidas = Math.max(0, vidas - 1);
                setVidas(nuevasVidas);
                localStorage.setItem('crucigramaVidas', nuevasVidas);

                if (nuevasVidas === 0) {
                    setActivePlacement(null); 
                    setShowGameOverModal(true);
                } else {
                    setFeedbackModal({
                        show: true,
                        title: "3 Errores en esta Palabra",
                        message: `Has cometido el mismo error 3 veces. Te quedan ${nuevasVidas} ${nuevasVidas === 1 ? 'vida' : 'vidas'}.`
                    });
                }
            }
            setLetrasElegidas([]);
        }
    };

    const confirmarGuardadoGlobal = async () => {
        reproducirSonido(1);
        const nombreLimpio = inputPlayerName.trim();
        if (!nombreLimpio) {
            setFeedbackModal({
                show: true,
                title: "Nombre requerido",
                message: "Por favor escribe un nombre valido para registrarte en el ranking."
            });
            return;
        }

        setPlayerName(nombreLimpio);
        localStorage.setItem('crucigramaPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore || { level: nivel, intentos: intentos };
        const currentUser = user || auth.currentUser;
        const docId = currentUser ? currentUser.uid : nombreLimpio.toLowerCase().replace(/\s+/g, '_');

        try {
            const docRef = doc(db, "ranking_crucigrama", docId);
            const docSnap = await getDoc(docRef);

            let guardar = true;
            if (docSnap.exists()) {
                const dataAntigua = docSnap.data();
                const nivelAntiguo = dataAntigua.level || 1;
                const intentosAntiguos = dataAntigua.intentos || 0;

                if (scoreToSave.level < nivelAntiguo || (scoreToSave.level === nivelAntiguo && scoreToSave.intentos >= intentosAntiguos)) {
                    guardar = false;
                }
            }

            if (guardar) {
                await setDoc(docRef, {
                    name: nombreLimpio,
                    intentos: scoreToSave.intentos,
                    level: scoreToSave.level,
                    fecha: new Date().toISOString()
                }, { merge: true });
            }

            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "Guardado Exitoso",
                message: guardar 
                    ? `Puntaje guardado para el Nivel ${scoreToSave.level}.`
                    : `Ya tienes un record igual o superior registrado.`
            });
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    const handleDesbloquearCategoria = async (tipo, categoriaId, costo) => {
        reproducirSonido(1);
        if (costo > 0 && totopos < costo) {
            setFeedbackModal({
                show: true,
                title: "Totopos insuficientes",
                message: `Te faltan ${costo - totopos} totopos para desbloquear esta categoria.`
            });
            return;
        }

        const nuevosTotopos = totopos - costo;
        const setDesbloqueadas = tipo === 'flora' ? setCategoriasFloraDesbloqueadas : setCategoriasFaunaDesbloqueadas;
        const setActivas = tipo === 'flora' ? setCategoriasFloraActivas : setCategoriasFaunaActivas;
        const claveLocal = tipo === 'flora' ? 'categoriasFloraDesbloqueadas' : 'categoriasFaunaDesbloqueadas';
        const campoNube = tipo === 'flora' ? 'categoriasFloraDesbloqueadas' : 'categoriasFaunaDesbloqueadas';

        let nuevasDesbloqueadas = [];
        setDesbloqueadas(prev => {
            nuevasDesbloqueadas = prev.includes(categoriaId) ? prev : [...prev, categoriaId];
            localStorage.setItem(claveLocal, JSON.stringify(nuevasDesbloqueadas));
            return nuevasDesbloqueadas;
        });

        setActivas(prev => {
            const actualizadas = prev.includes(categoriaId) ? prev : [...prev, categoriaId];
            if (tipo === 'flora') {
                localStorage.setItem('crucigramaCategoriasFloraActivas', JSON.stringify(actualizadas));
            } else {
                localStorage.setItem('crucigramaCategoriasFaunaActivas', JSON.stringify(actualizadas));
            }
            return actualizadas;
        });

        if (costo > 0) {
            setTotopos(nuevosTotopos);
            localStorage.setItem('totopos', nuevosTotopos);
        }

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            try {
                const payload = { [campoNube]: nuevasDesbloqueadas };
                if (costo > 0) payload.totopos = nuevosTotopos;
                await updateDoc(doc(db, 'usuarios', currentUser.uid), payload);
            } catch (err) {
                console.error("Error al sincronizar categoria desbloqueada:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "Categoria desbloqueada",
            message: costo > 0
                ? `Gastaste ${costo} totopos. Ya puedes practicar esta categoria.`
                : "¡La reclamaste gratis por tu Nivel de Cuenta!"
        });
    };

    const handleToggleCategoriaActiva = (tipo, categoriaId) => {
        reproducirSonido(1);
        const setActivas = tipo === 'flora' ? setCategoriasFloraActivas : setCategoriasFaunaActivas;
        const claveStorage = tipo === 'flora' ? 'crucigramaCategoriasFloraActivas' : 'crucigramaCategoriasFaunaActivas';

        setActivas(prev => {
            const yaActiva = prev.includes(categoriaId);
            let nuevasActivas = [];
            if (yaActiva) {
                if (prev.length === 1) return prev;
                nuevasActivas = prev.filter(id => id !== categoriaId);
            } else {
                nuevasActivas = [...prev, categoriaId];
            }
            localStorage.setItem(claveStorage, JSON.stringify(nuevasActivas));
            return nuevasActivas;
        });
    };

    const handleCambiarTipoContenido = (nuevoModo) => {
        reproducirSonido(1);
        setTipoContenido(nuevoModo);
        localStorage.setItem('tipoContenidoJuego', nuevoModo);
    };

    const reiniciarNivelActual = () => {
        reproducirSonido(1);
        setVidas(MAX_VIDAS);
        localStorage.setItem('crucigramaVidas', MAX_VIDAS);
        setIntentosErroneosPalabras({});
        setFichasVistas([]);
        setPendingGlobalScore(null);
        setShowGameOverModal(false);
        setShowConfirmRestartModal(false);
        generarNuevoJuego();
    };

    const reiniciarJuegoCompleto = () => {
        reproducirSonido(1);
        localStorage.removeItem('crucigramaNivel');
        localStorage.removeItem('crucigramaIntentos');
        localStorage.removeItem('crucigramaVidas');
        localStorage.removeItem('crucigramaModoDificil');
        localStorage.removeItem('crucigramaPlayerName');
        setNivel(1);
        setIntentos(0);
        setVidas(MAX_VIDAS);
        localStorage.setItem('crucigramaVidas', MAX_VIDAS);
        setModoDificil(false);
        setPlayerName('');
        setInputPlayerName('');
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setShowConfirmRestartModal(false);
        setIntentosErroneosPalabras({});
        setFichasVistas([]);
        generarNuevoJuego();
    };

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(collection(db, "ranking_crucigrama"), orderBy("level", "desc"), orderBy("intentos", "asc"), limit(10));
            const querySnapshot = await getDocs(q);
            const docs = [];
            querySnapshot.forEach((docSnap) => {
                docs.push({ id: docSnap.id, ...docSnap.data() });
            });
            setRanking(docs);
        } catch (error) {
            console.error("Error al cargar ranking:", error);
        }
        setCargandoRanking(false);
    };

    const siguienteNivel = () => {
        reproducirSonido(1);
        const proximoNivel = nivel + 1;
        setNivel(proximoNivel);
        setVidas(MAX_VIDAS);
        localStorage.setItem('crucigramaNivel', proximoNivel);
        localStorage.setItem('crucigramaVidas', MAX_VIDAS);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setIntentosErroneosPalabras({});
        setFichasVistas([]);
    };

    const nivelCompletado = palabrasResueltas.length === placements.length && placements.length > 0;

    return (
        <div 
            className="max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 flex flex-col items-center select-none w-full pb-[env(safe-area-inset-bottom)]"
            onMouseUp={handleMouseUpGlobal}
            onTouchEnd={handleMouseUpGlobal}
        >
            <header className="text-center mb-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-950">Crucigrama Diidxazá</h2>
                <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1 flex items-center justify-center gap-2 flex-wrap">
                    <span>Nivel {nivel}</span>
                    <span>•</span>
                    <span>Intentos: {intentos}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5" title={`Vidas: ${vidas}/${MAX_VIDAS}`}>
                        {Array.from({ length: MAX_VIDAS }).map((_, i) => (
                            <img 
                                key={i} 
                                src="/tuna-vida.png" 
                                alt="vida" 
                                className={`w-4 h-4 object-contain inline-block transition-opacity ${i < vidas ? 'opacity-100' : 'opacity-30 grayscale'}`} 
                                onError={(e)=>{e.target.style.display='none'}} 
                            />
                        ))}
                    </span>
                    <span>•</span>
                    <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                        <img src="/totopo.png" alt="Totopos" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                        {totopos} Totopos
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido(1);
                        setShowSelectorCategorias(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-full border-2 border-amber-300 shadow-sm transition-colors cursor-pointer"
                >
                    Categorias
                    <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {tipoContenido === 'flora'
                            ? categoriasFloraActivas.length
                            : tipoContenido === 'ambos'
                                ? categoriasFaunaActivas.length + categoriasFloraActivas.length
                                : categoriasFaunaActivas.length}
                    </span>
                </button>
            </header>

            {nivelCompletado && (
                <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3 text-center animate-bounce">
                    <p className="text-lg sm:text-xl font-bold text-green-900 mb-1">¡Excelente! Crucigrama Resuelto</p>
                    <p className="text-xs font-bold text-amber-700 mb-2 inline-flex items-center justify-center gap-1">
                        +{recompensaActual} 
                        <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                        Totopos añadidos a tu morral (Total: {totopos})
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm cursor-pointer">Siguiente Nivel</button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col lg:grid lg:grid-cols-[1fr_320px_320px] gap-6 items-center lg:items-start justify-center mt-1">
                
                <div className="w-full p-3 sm:p-5 bg-amber-100/50 border-2 border-amber-300 rounded-2xl shadow-inner overflow-x-auto overflow-y-auto custom-scrollbar flex justify-center items-center min-h-[380px] max-h-[550px]">
                    <div className="m-auto flex justify-center items-center min-w-max">
                        <div 
                            className="grid gap-1 sm:gap-1.5 p-1.5 justify-center mx-auto" 
                            style={{ gridTemplateColumns: `repeat(${matriz[0]?.length || 1}, max-content)` }}
                        >
                            {matriz.map((fila, r) => 
                                fila.map((celda, c) => {
                                    if (celda.empty) {
                                        return <div key={`${r}-${c}`} className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-10 lg:h-10 bg-transparent"></div>;
                                    }

                                    const resuelta = celda.words.some(id => palabrasResueltas.includes(id));
                                    const letraGuardada = respuestasUsuario[`${r}-${c}`] || '';
                                    
                                    return (
                                        <div 
                                            key={`${r}-${c}`} 
                                            onClick={() => handleCellClick(celda)}
                                            className={`relative w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-10 lg:h-10 flex items-center justify-center font-bold text-[12px] sm:text-[16px] md:text-xl lg:text-xl uppercase border-2 rounded-md shadow-sm transition-all select-none cursor-pointer hover:scale-105
                                                ${resuelta ? 'bg-green-500 text-white border-green-600' : letraGuardada ? 'bg-amber-50 text-amber-950 border-amber-500' : 'bg-white border-amber-400 text-amber-950 hover:bg-amber-100'}
                                            `}
                                        >
                                            {celda.number && (
                                                <span className="absolute top-0.5 left-0.5 sm:top-0.5 sm:left-1 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-amber-800 z-10 pointer-events-none">
                                                    {celda.number}
                                                </span>
                                            )}
                                            <span>{letraGuardada}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                    <h3 className="font-bold text-amber-900 border-b-2 border-amber-200 pb-1.5 text-center lg:text-left text-sm sm:text-base">
                        Pistas ({palabrasResueltas.length}/{placements.length}):
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full max-h-[440px] lg:max-h-none overflow-y-auto lg:overflow-y-visible pr-1 custom-scrollbar">
                        {placements.map((p) => {
                            const resuelto = palabrasResueltas.includes(p.id);
                            const direccion = p.dirX === 1 ? "Horizontal" : "Vertical";

                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => abrirDialParaPalabra(p)}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all shadow-sm bg-white cursor-pointer hover:border-amber-400 hover:shadow-md ${resuelto ? 'border-green-400 bg-green-50/60 opacity-75 cursor-default' : 'border-amber-200'}`}
                                >
                                    <div className="w-11 h-11 bg-orange-100/50 rounded-lg overflow-hidden flex items-center justify-center border border-amber-100 flex-shrink-0 relative">
                                        <span className="absolute top-0.5 left-1 text-[9px] font-black text-amber-700 bg-white/80 px-1 rounded">{p.number}</span>
                                        <img src={p.animal.image} alt={p.animal.spanish} className="max-w-[80%] max-h-[80%] object-contain" onError={(e) => { e.target.src = "🐾"; }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{direccion}</p>
                                        <p className="text-sm font-bold text-amber-950 truncate">
                                            {p.animal.spanish}
                                        </p>
                                        {resuelto ? (
                                            <p className="text-xs text-green-700 font-bold truncate">✓ {p.animal.diidxaza}</p>
                                        ) : (
                                            <p className="text-[11px] text-amber-600 font-medium">Click para resolver</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                    <h3 className="font-bold text-amber-900 border-b-2 border-amber-200 pb-1.5 text-center lg:text-left text-sm sm:text-base flex items-center justify-center lg:justify-start gap-1.5">
                        <img 
                            src="/guiechachi.png" 
                            alt="Guiechachi" 
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                            }}
                        />
                        <span style={{ display: 'none' }}>🏆</span>
                        Ranking Global
                    </h3>
                    <div className="bg-white rounded-xl p-3 shadow-md border border-amber-200 w-full max-h-[440px] lg:max-h-none overflow-y-auto lg:overflow-y-visible custom-scrollbar">
                        {cargandoRanking ? (
                            <p className="text-center text-sm text-gray-500 py-2">Cargando puntajes...</p>
                        ) : ranking.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-2">Aun no hay scores. ¡Sé el primero!</p>
                        ) : (
                            <div>
                                {ranking.map((r, i) => (
                                    <div key={r.id || i} className="flex justify-between items-center border-b py-2 text-xs sm:text-sm border-gray-100 last:border-0 hover:bg-amber-50 rounded px-2 transition-colors">
                                        <span className="font-medium text-amber-950 truncate pr-2">
                                            <span className="text-orange-500 font-bold mr-1.5">{i + 1}.</span> {r.name} 
                                            <span className="text-[11px] text-amber-700 font-bold ml-1.5">(Nivel {r.level})</span>
                                        </span>
                                        <span className="font-bold text-amber-900 flex-shrink-0">{r.intentos} int.</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {activePlacement && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative max-h-[95vh] overflow-y-auto custom-scrollbar">
                        
                        <button 
                            onClick={() => {
                                reproducirSonido(1);
                                setActivePlacement(null);
                                setLetrasElegidas([]);
                            }}
                            className="absolute top-3 right-4 sm:top-4 sm:right-5 text-gray-400 hover:text-gray-700 font-bold text-xl cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-orange-100 rounded-2xl p-2 mb-2 border border-amber-200 flex items-center justify-center shadow-inner mt-2">
                            <img src={activePlacement.animal.image} alt={activePlacement.animal.spanish} className="max-w-full max-h-full object-contain drop-shadow-md" />
                        </div>
                        <h3 className="font-bold text-amber-950 text-lg mb-0.5 text-center leading-tight">{activePlacement.animal.spanish}</h3>
                        <p className="text-[11px] sm:text-xs text-amber-800 mb-1 font-medium text-center">Arrastra el dedo para seleccionar {activePlacement.text.length} letras</p>

                        <button
                            onClick={usarPistaRevelar}
                            className="mb-3 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold py-1 px-3 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            Revelar palabra (-10 
                            <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block align-middle" onError={(e)=>{e.target.style.display='none'}} />
                            )
                        </button>

                        <div className="flex gap-0.5 sm:gap-1 max-w-[280px] sm:max-w-none flex-wrap mb-3 sm:mb-4 min-h-[34px] items-center bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200 w-full justify-center">
                            {letrasElegidas.length === 0 ? (
                                <span className="text-xs text-amber-600/70 italic">Forma la palabra...</span>
                            ) : (
                                letrasElegidas.map((idx, i) => (
                                    <span key={i} className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-600 text-white font-bold rounded-md flex items-center justify-center text-xs sm:text-sm shadow-sm animate-pop flex-shrink-0">
                                        {dialSeleccion[idx]}
                                    </span>
                                ))
                            )}
                        </div>

                        <div 
                            ref={dialRef}
                            onMouseMove={handleMouseMoveGlobal}
                            className={`relative ${dialSize} my-1 flex items-center justify-center touch-none select-none`}
                        >
                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-200 pointer-events-none"></div>
                            
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                {letrasElegidas.map((nodeIndex, i) => {
                                    if (i === 0) return null;
                                    const prevCoords = getNodeCoords(letrasElegidas[i - 1]);
                                    const currCoords = getNodeCoords(nodeIndex);
                                    return (
                                        <line
                                            key={i}
                                            x1={prevCoords.x}
                                            y1={prevCoords.y}
                                            x2={currCoords.x}
                                            y2={currCoords.y}
                                            stroke="#b45309"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                        />
                                    );
                                })}
                            </svg>

                            {dialSeleccion.map((letra, index) => {
                                const coords = getNodeCoords(index);
                                const relX = coords.x - center;
                                const relY = coords.y - center;
                                const seleccionada = letrasElegidas.includes(index);

                                return (
                                    <button
                                        key={index}
                                        data-node-index={index}
                                        onMouseDown={() => handleTouchStartNode(index)}
                                        onMouseEnter={() => handleTouchEnterNode(index)}
                                        onTouchStart={() => handleTouchStartNode(index)}
                                        style={{ transform: `translate(${relX}px, ${relY}px)` }}
                                        className={`absolute z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full font-black text-lg shadow-md transition-all flex items-center justify-center select-none cursor-pointer
                                            ${seleccionada ? 'bg-amber-700 text-white scale-95 border-2 border-amber-900 shadow-inner' : 'bg-amber-600 hover:bg-amber-500 text-white border-2 border-amber-700'}
                                        `}
                                    >
                                        {letra}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3 w-full mt-3 sm:mt-4">
                            <button 
                                onClick={limpiarDial}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2 rounded-xl text-sm shadow-sm transition-colors border border-amber-300 cursor-pointer"
                            >
                                Borrar
                            </button>
                            <button 
                                onClick={verificarYAplicarPalabra}
                                disabled={!activePlacement || letrasElegidas.length !== activePlacement.text.length}
                                className={`flex-1 font-bold py-2 rounded-xl text-sm shadow-md transition-all cursor-pointer ${
                                    !activePlacement || letrasElegidas.length !== activePlacement.text.length 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                Comprobar ({letrasElegidas.length}/{activePlacement?.text?.length || 0})
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {showGameOverModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-4xl mb-2">💔</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-1">¡Te has quedado sin vidas!</h3>
                        <p className="text-xs text-amber-800 mb-4">
                            Estas en el Nivel {nivel}. Elige una opcion para continuar:
                        </p>
                        
                        <div className="flex flex-col gap-2.5 w-full">
                            {totopos >= 15 ? (
                                <button 
                                    onClick={() => {
                                        reproducirSonido(1);
                                        setTotopos(prev => {
                                            const nuevo = prev - 15;
                                            localStorage.setItem('totopos', nuevo);
                                            return nuevo;
                                        });
                                        setVidas(MAX_VIDAS);
                                        localStorage.setItem('crucigramaVidas', MAX_VIDAS);
                                        setShowGameOverModal(false);
                                    }}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                                >
                                    <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block" onError={(e)=>{e.target.style.display='none'}} />
                                    Recuperar 5 Vidas (-15 Totopos)
                                </button>
                            ) : (
                                <button disabled className="w-full bg-gray-200 text-gray-400 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed inline-flex items-center justify-center gap-1.5">
                                    <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block" onError={(e)=>{e.target.style.display='none'}} />
                                    Necesitas 15 Totopos para revivir
                                </button>
                            )}

                            <button 
                                onClick={reiniciarNivelActual} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Reiniciar Nivel {nivel} (5 Vidas)
                            </button>

                            <button 
                                onClick={() => {
                                    reproducirSonido(1);
                                    setShowGameOverModal(false);
                                    setVidas(1);
                                    localStorage.setItem('crucigramaVidas', 1);
                                }}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Seguir Intentando (1 Vida de Respiro)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">Guardar Record</h3>
                        <p className="text-xs text-amber-800 text-center mb-4">Ingresa tu nombre para guardar tu puntaje en el ranking global.</p>
                        
                        <input 
                            type="text" 
                            placeholder="Escribe tu nombre" 
                            value={inputPlayerName} 
                            onChange={(e) => setInputPlayerName(e.target.value)} 
                            className="border-2 border-amber-300 p-3 rounded-lg w-full mb-5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium" 
                            autoFocus
                        />
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => {
                                    reproducirSonido(1);
                                    setShowGuardarModal(false);
                                }} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmarGuardadoGlobal} 
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">🔄</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">Opcion de Reinicio</h3>
                        <p className="text-xs text-amber-800 mb-5">
                            ¿Deseas reiniciar unicamente el Nivel {nivel} o comenzar de nuevo desde el Nivel 1?
                        </p>
                        
                        <div className="flex flex-col gap-2.5 w-full">
                            <button 
                                onClick={reiniciarNivelActual} 
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Reiniciar Nivel {nivel} (5 Vidas)
                            </button>
                            
                            <button 
                                onClick={reiniciarJuegoCompleto} 
                                className="w-full bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Reiniciar Todo (Volver a Nivel 1)
                            </button>

                            <button 
                                onClick={() => {
                                    reproducirSonido(1);
                                    setShowConfirmRestartModal(false);
                                }} 
                                className="w-full bg-amber-100 hover:bg-amber-200 text-amber-950 py-2 rounded-xl font-bold text-xs border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">🏠</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menu Principal?</h3>
                        <p className="text-xs text-amber-800 mb-5">Si sales ahora, asegurate de haber guardado tu progreso en esta partida.</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => {
                                    reproducirSonido(1);
                                    setShowMenuModal(false);
                                }} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmarSalidaMenu} 
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>
                        
                        <button 
                            onClick={() => {
                                reproducirSonido(1);
                                setFeedbackModal({ show: false, title: '', message: '' });
                            }} 
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {showSelectorCategorias && (
                <SelectorCategorias
                    tipoContenido={tipoContenido}
                    onCambiarTipoContenido={handleCambiarTipoContenido}
                    fauna={{
                        desbloqueadas: categoriasFaunaDesbloqueadas,
                        activas: categoriasFaunaActivas,
                        onToggleActiva: (id) => handleToggleCategoriaActiva('fauna', id),
                        onDesbloquear: (id, costo) => handleDesbloquearCategoria('fauna', id, costo)
                    }}
                    flora={{
                        desbloqueadas: categoriasFloraDesbloqueadas,
                        activas: categoriasFloraActivas,
                        onToggleActiva: (id) => handleToggleCategoriaActiva('flora', id),
                        onDesbloquear: (id, costo) => handleDesbloquearCategoria('flora', id, costo)
                    }}
                    totopos={totopos}
                    nivelCuenta={nivelCuenta}
                    onClose={() => {
                        reproducirSonido(1);
                        setShowSelectorCategorias(false);
                    }}
                />
            )}
        </div>
    );
}