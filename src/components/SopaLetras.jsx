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
import ConfiguracionModal from './ConfiguracionModal';
import { useSonido } from '../hooks/useSonido.js';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

const LETRAS_RELLENO = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'T', 'U', 'X', 'Y', 'Z'];

const RECOMPENSAS_SOPA = {
    1: 20,
    2: 30,
    3: 45,
    4: 60
};

const obtenerCostoVidas = (lvl) => {
    if (lvl === 1) return 10;
    if (lvl === 2) return 15;
    return 20;
};

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

const obtenerCeldasRuta = (r1, c1, r2, c2) => {
    let celdas = [];
    const deltaR = r2 - r1;
    const deltaC = c2 - c1;

    if (deltaR === 0) {
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);
        for (let c = minC; c <= maxC; c++) celdas.push({ r: r1, c });
    } else if (deltaC === 0) {
        const minR = Math.min(r1, r2);
        const maxR = Math.max(r1, r2);
        for (let r = minR; r <= maxR; r++) celdas.push({ r, c: c1 });
    } else if (Math.abs(deltaR) === Math.abs(deltaC)) {
        const steps = Math.abs(deltaR);
        const stepR = deltaR > 0 ? 1 : -1;
        const stepC = deltaC > 0 ? 1 : -1;
        for (let i = 0; i <= steps; i++) {
            celdas.push({ r: r1 + i * stepR, c: c1 + i * stepC });
        }
    }
    return celdas;
};

export default function SopaLetras({
    onBack,
    user,
    isOpenConfig,
    onCloseConfig,
    onSetControles,
    setControlesJuegoActivo
}) {
    const { reproducirSonido } = useSonido();

    const [nivel, setNivel] = useState(1);
    const [intentos, setIntentos] = useState(0);
    const [vidas, setVidas] = useState(3);
    const [matriz, setMatriz] = useState([]);
    const [animalesObjetivo, setAnimalesObjetivo] = useState([]);
    const [palabrasEncontradas, setPalabrasEncontradas] = useState([]);
    const [modoDificil, setModoDificil] = useState(false);
    const [tipoContenido, setTipoContenido] = useState(() => {
        return localStorage.getItem('tipoContenidoJuego') || 'fauna';
    });
    const [totopos, setTotopos] = useState(0);

    const [nivelCuenta, setNivelCuenta] = useState(1);
    const [categoriasFaunaDesbloqueadas, setCategoriasFaunaDesbloqueadas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFloraDesbloqueadas, setCategoriasFloraDesbloqueadas] = useState(() => categoriaInicialPorDefecto('flora'));
    const [categoriasFaunaActivas, setCategoriasFaunaActivas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFloraActivas, setCategoriasFloraActivas] = useState(() => categoriaInicialPorDefecto('flora'));
    const [showSelectorCategorias, setShowSelectorCategorias] = useState(false);

    const [animalesCoords, setAnimalesCoords] = useState({});

    const [isSelecting, setIsSelecting] = useState(false);
    const [startCell, setStartCell] = useState(null);
    const [currentCell, setCurrentCell] = useState(null);
    const [celdasSeleccionadas, setCeldasSeleccionadas] = useState([]);

    const isSelectingRef = useRef(false);
    useEffect(() => {
        isSelectingRef.current = isSelecting;
    }, [isSelecting]);

    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);

    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [showComprarVidasModal, setShowComprarVidasModal] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    const [internalConfigOpen, setInternalConfigOpen] = useState(false);
    const isConfigOpen = isOpenConfig !== undefined ? isOpenConfig : internalConfigOpen;
    const handleCloseConfig = onCloseConfig || (() => setInternalConfigOpen(false));

    const gridRef = useRef(null);

    const tamanoActual = Math.min(5 + nivel, 12);
    const cantidadPalabras = Math.min(3 + nivel, 8);
    const recompensaActual = RECOMPENSAS_SOPA[nivel] || 60;
    const costoActualVidas = obtenerCostoVidas(nivel);

    const confirmarGuardadoAutomatico = async (nombreLimpio) => {
        const scoreToSave = pendingGlobalScore || { level: nivel, intentos: intentos };
        const currentUser = user || auth.currentUser;
        const docId = currentUser ? currentUser.uid : nombreLimpio.toLowerCase().replace(/\s+/g, '_');

        try {
            const docRef = doc(db, "ranking_sopa", docId);
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
                    ? `${nombreLimpio}: Record registrado en Nivel ${scoreToSave.level} (${scoreToSave.intentos} int.).`
                    : `Ya tienes un record igual o superior registrado.`
            });
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "Guardado Local",
                message: "Progreso guardado localmente."
            });
        }
    };

    const handleClickGuardar = async () => {
        try {
            reproducirSonido('click1');
        } catch (e) {}
        
        localStorage.setItem('sopaLetrasNivel', nivel);
        localStorage.setItem('sopaLetrasIntentos', intentos);
        localStorage.setItem('sopaLetrasVidas', vidas);
        localStorage.setItem('sopaLetrasModoDificil', modoDificil);
        localStorage.setItem('totopos', totopos);

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "Record ya registrado",
                message: `Ya guardaste tu record en Nivel ${nivel}.`
            });
            return;
        }

        const currentUser = user || auth.currentUser;
        let nombreAUsar = playerName;

        if (currentUser) {
            try {
                const userDocRef = doc(db, 'usuarios', currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const nickNube = data.nickname || data.nombre || data.name;
                    if (nickNube) {
                        nombreAUsar = nickNube;
                        setPlayerName(nickNube);
                        setInputPlayerName(nickNube);
                        localStorage.setItem('sopaLetrasPlayerName', nickNube);
                    }
                }
            } catch (e) {
                console.error("Error al verificar nickname:", e);
            }
        }

        if (currentUser && nombreAUsar.trim()) {
            confirmarGuardadoAutomatico(nombreAUsar.trim());
        } else {
            setInputPlayerName(nombreAUsar);
            setShowGuardarModal(true);
        }
    };

    useEffect(() => {
        const registrarControles = onSetControles || setControlesJuegoActivo;
        if (registrarControles) {
            registrarControles({
                level: nivel,
                onMenuClick: () => { try { reproducirSonido('click1'); } catch(e){} setShowMenuModal(true); },
                onGuardarClick: handleClickGuardar,
                onReiniciarClick: () => { try { reproducirSonido('click1'); } catch(e){} setShowConfirmRestartModal(true); },
                modoDificil: modoDificil,
                onToggleModoDificil: () => {
                    try { reproducirSonido('click1'); } catch(e){}
                    const nuevoModo = !modoDificil;
                    setModoDificil(nuevoModo);
                    localStorage.setItem('sopaLetrasModoDificil', nuevoModo);
                }
            });
        }

        return () => {
            if (registrarControles) {
                registrarControles(null);
            }
        };
    }, [nivel, modoDificil, tipoContenido, intentos, vidas, guardadoEnNivel, pendingGlobalScore, onSetControles, setControlesJuegoActivo]);

    useEffect(() => {
        const nivelGuardado = localStorage.getItem('sopaLetrasNivel');
        const intentosGuardados = localStorage.getItem('sopaLetrasIntentos');
        const vidasGuardadas = localStorage.getItem('sopaLetrasVidas');
        const modoDificilGuardado = localStorage.getItem('sopaLetrasModoDificil');
        const nombreGuardado = localStorage.getItem('sopaLetrasPlayerName');
        const totoposGuardados = localStorage.getItem('totopos');

        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (intentosGuardados) setIntentos(parseInt(intentosGuardados, 10));
        if (vidasGuardadas) setVidas(parseInt(vidasGuardadas, 10));
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
                setCategoriasFaunaActivas(prev => prev.filter(id => faunaGuardadas.includes(id)).length ? prev.filter(id => faunaGuardadas.includes(id)) : categoriaInicialPorDefecto('fauna'));
            }
            const floraGuardadas = JSON.parse(localStorage.getItem('categoriasFloraDesbloqueadas') || 'null');
            if (floraGuardadas) {
                setCategoriasFloraDesbloqueadas(floraGuardadas);
                setCategoriasFloraActivas(prev => prev.filter(id => floraGuardadas.includes(id)).length ? prev.filter(id => floraGuardadas.includes(id)) : categoriaInicialPorDefecto('flora'));
            }
        } catch (e) {
            console.error("Error al leer categorias:", e);
        }

        const cargarDatosNube = async () => {
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

                        setCategoriasFaunaActivas(prev => {
                            const activasValidas = prev.filter(id => faunaNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('fauna');
                        });
                        setCategoriasFloraActivas(prev => {
                            const activasValidas = prev.filter(id => floraNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('flora');
                        });

                        const nickNube = data.nickname || data.nombre || data.name;
                        if (nickNube) {
                            setPlayerName(nickNube);
                            setInputPlayerName(nickNube);
                            localStorage.setItem('sopaLetrasPlayerName', nickNube);
                        }
                    }
                } catch (e) {
                    console.error("Error al cargar datos de nube:", e);
                }
            }
        };
        cargarDatosNube();
        cargarRankingGlobal();
    }, [user]);

    useEffect(() => {
        generarNuevoJuego();
    }, [nivel, modoDificil, tipoContenido, categoriasFaunaActivas, categoriasFloraActivas]);

    useEffect(() => {
        const gridNode = gridRef.current;
        if (!gridNode) return;

        const handleTouchStartActive = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el && el.dataset && el.dataset.row !== undefined) {
                const r = parseInt(el.dataset.row, 10);
                const c = parseInt(el.dataset.col, 10);
                setIsSelecting(true);
                isSelectingRef.current = true;
                setStartCell({ r, c });
                setCurrentCell({ r, c });
            }
        };

        const handleTouchMoveActive = (e) => {
            e.preventDefault();
            if (!isSelectingRef.current) return;
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el && el.dataset && el.dataset.row !== undefined) {
                const r = parseInt(el.dataset.row, 10);
                const c = parseInt(el.dataset.col, 10);
                setCurrentCell(prev => (prev && prev.r === r && prev.c === c) ? prev : { r, c });
            }
        };

        gridNode.addEventListener('touchstart', handleTouchStartActive, { passive: false });
        gridNode.addEventListener('touchmove', handleTouchMoveActive, { passive: false });

        return () => {
            gridNode.removeEventListener('touchstart', handleTouchStartActive);
            gridNode.removeEventListener('touchmove', handleTouchMoveActive);
        };
    }, []);

    useEffect(() => {
        if (palabrasEncontradas.length === animalesObjetivo.length && animalesObjetivo.length > 0) {
            if (pendingGlobalScore) return;

            try { reproducirSonido('click3'); } catch (e) {}

            setPendingGlobalScore({ level: nivel, intentos: intentos });

            const nuevosTotopos = totopos + recompensaActual;
            setTotopos(nuevosTotopos);
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
                                totopos: recompensaActual,
                                totoposHistoricos: recompensaActual,
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
        }
    }, [palabrasEncontradas, animalesObjetivo, nivel, intentos, user, recompensaActual, pendingGlobalScore, totopos]);

    const generarNuevoJuego = () => {
        const baseDatosActiva = obtenerBaseDatosActiva(tipoContenido, categoriasFaunaActivas, categoriasFloraActivas);
        const poolSeguro = baseDatosActiva.length > 0 ? baseDatosActiva : filtrarContenidoPorCategorias(listaAnimales, categoriaInicialPorDefecto('fauna'));
        const candidatos = [...poolSeguro]
            .filter(a => limpiarPalabra(a.diidxaza, modoDificil).length <= tamanoActual && limpiarPalabra(a.diidxaza, modoDificil).length > 1)
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidadPalabras);

        let nuevaMatriz = Array(tamanoActual).fill(null).map(() => Array(tamanoActual).fill(''));
        let nuevoMapaCoords = {};
        let listaColocados = [];

        candidatos.forEach((animal) => {
            const palabraLimpia = limpiarPalabra(animal.diidxaza, modoDificil);
            let colocada = false;
            let intentosColocacion = 0;
            const direcciones = ['H', 'V', 'D1', 'D2'];

            while (!colocada && intentosColocacion < 100) {
                intentosColocacion++;
                const direccion = direcciones[Math.floor(Math.random() * direcciones.length)];
                const filaRandom = Math.floor(Math.random() * tamanoActual);
                const colRandom = Math.floor(Math.random() * tamanoActual);

                let puedeColocar = true;
                let celdasTemp = [];

                if (direccion === 'H' && colRandom + palabraLimpia.length <= tamanoActual) {
                    for (let i = 0; i < palabraLimpia.length; i++) {
                        if (nuevaMatriz[filaRandom][colRandom + i] !== '' && nuevaMatriz[filaRandom][colRandom + i] !== palabraLimpia[i]) {
                            puedeColocar = false; break;
                        }
                    }
                    if (puedeColocar) {
                        for (let i = 0; i < palabraLimpia.length; i++) {
                            nuevaMatriz[filaRandom][colRandom + i] = palabraLimpia[i];
                            celdasTemp.push({ r: filaRandom, c: colRandom + i });
                        }
                        colocada = true;
                    }
                } else if (direccion === 'V' && filaRandom + palabraLimpia.length <= tamanoActual) {
                    for (let i = 0; i < palabraLimpia.length; i++) {
                        if (nuevaMatriz[filaRandom + i][colRandom] !== '' && nuevaMatriz[filaRandom + i][colRandom] !== palabraLimpia[i]) {
                            puedeColocar = false; break;
                        }
                    }
                    if (puedeColocar) {
                        for (let i = 0; i < palabraLimpia.length; i++) {
                            nuevaMatriz[filaRandom + i][colRandom] = palabraLimpia[i];
                            celdasTemp.push({ r: filaRandom + i, c: colRandom });
                        }
                        colocada = true;
                    }
                } else if (direccion === 'D1' && filaRandom + palabraLimpia.length <= tamanoActual && colRandom + palabraLimpia.length <= tamanoActual) {
                    for (let i = 0; i < palabraLimpia.length; i++) {
                        if (nuevaMatriz[filaRandom + i][colRandom + i] !== '' && nuevaMatriz[filaRandom + i][colRandom + i] !== palabraLimpia[i]) {
                            puedeColocar = false; break;
                        }
                    }
                    if (puedeColocar) {
                        for (let i = 0; i < palabraLimpia.length; i++) {
                            nuevaMatriz[filaRandom + i][colRandom + i] = palabraLimpia[i];
                            celdasTemp.push({ r: filaRandom + i, c: colRandom + i });
                        }
                        colocada = true;
                    }
                } else if (direccion === 'D2' && filaRandom - palabraLimpia.length >= -1 && colRandom + palabraLimpia.length <= tamanoActual) {
                    for (let i = 0; i < palabraLimpia.length; i++) {
                        if (nuevaMatriz[filaRandom - i][colRandom + i] !== '' && nuevaMatriz[filaRandom - i][colRandom + i] !== palabraLimpia[i]) {
                            puedeColocar = false; break;
                        }
                    }
                    if (puedeColocar) {
                        for (let i = 0; i < palabraLimpia.length; i++) {
                            nuevaMatriz[filaRandom - i][colRandom + i] = palabraLimpia[i];
                            celdasTemp.push({ r: filaRandom - i, c: colRandom + i });
                        }
                        colocada = true;
                    }
                }

                if (colocada) {
                    nuevoMapaCoords[animal.id] = celdasTemp;
                    listaColocados.push(animal);
                }
            }
        });

        for (let r = 0; r < tamanoActual; r++) {
            for (let c = 0; c < tamanoActual; c++) {
                if (nuevaMatriz[r][c] === '') {
                    nuevaMatriz[r][c] = LETRAS_RELLENO[Math.floor(Math.random() * LETRAS_RELLENO.length)];
                }
            }
        }

        setMatriz(nuevaMatriz);
        setAnimalesObjetivo(listaColocados);
        setAnimalesCoords(nuevoMapaCoords);
        setPalabrasEncontradas([]);
        setCeldasSeleccionadas([]);
        setGuardadoEnNivel(false);
    };

    const isCellMatched = (r, c) => {
        return palabrasEncontradas.some(animalId => {
            const celdasAnimal = animalesCoords[animalId] || [];
            return celdasAnimal.some(cell => cell.r === r && cell.c === c);
        });
    };

    useEffect(() => {
        if (!startCell || !currentCell) {
            setCeldasSeleccionadas([]);
            return;
        }
        const celdas = obtenerCeldasRuta(startCell.r, startCell.c, currentCell.r, currentCell.c);
        setCeldasSeleccionadas(celdas);
    }, [startCell, currentCell]);

    const handleMouseDown = (r, c) => {
        setIsSelecting(true);
        setStartCell({ r, c });
        setCurrentCell({ r, c });
    };

    const handleMouseEnter = (r, c) => {
        if (!isSelecting) return;
        setCurrentCell({ r, c });
    };

    const handleMouseUp = () => {
        if (!isSelecting) return;
        setIsSelecting(false);
        verificarSeleccion();
    };

    const verificarSeleccion = () => {
        if (!startCell || !currentCell) return;

        const celdasActuales = obtenerCeldasRuta(startCell.r, startCell.c, currentCell.r, currentCell.c);
        if (celdasActuales.length === 0) return;

        setIntentos(prev => prev + 1);

        let textoSeleccionado = celdasActuales.map(cell => matriz[cell.r][cell.c]).join('');
        let textoInvertido = [...textoSeleccionado].reverse().join('');

        const animalEncontrado = animalesObjetivo.find(animal => {
            const palabraLimpia = limpiarPalabra(animal.diidxaza, modoDificil);
            return (palabraLimpia === textoSeleccionado || palabraLimpia === textoInvertido)
                && !palabrasEncontradas.includes(animal.id);
        });

        if (animalEncontrado) {
            try { reproducirSonido('click2'); } catch (e) {}
            const nuevasEncontradas = [...palabrasEncontradas, animalEncontrado.id];
            setPalabrasEncontradas(nuevasEncontradas);
        } else {
            if (modoDificil) {
                const nuevasVidas = vidas - 1;
                setVidas(nuevasVidas);
                localStorage.setItem('sopaLetrasVidas', nuevasVidas);

                if (nuevasVidas <= 0) {
                    setShowComprarVidasModal(true);
                }
            }
        }

        setStartCell(null);
        setCurrentCell(null);
        setCeldasSeleccionadas([]);
    };

    const comprarVidas = async () => {
        try { reproducirSonido('click1'); } catch (e) {}
        if (totopos < costoActualVidas) {
            setFeedbackModal({
                show: true,
                title: "Totopos insuficientes",
                message: "No tienes suficientes totopos para recuperar vidas."
            });
            return;
        }

        const nuevosTotopos = totopos - costoActualVidas;
        setTotopos(nuevosTotopos);
        localStorage.setItem('totopos', nuevosTotopos);

        setVidas(3);
        localStorage.setItem('sopaLetrasVidas', 3);
        setShowComprarVidasModal(false);

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            try {
                const userRef = doc(db, 'usuarios', currentUser.uid);
                await updateDoc(userRef, {
                    totopos: increment(-costoActualVidas)
                });
            } catch (err) {
                console.error("Error al descontar totopos:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "Vidas Recargadas",
            message: `Recuperaste 3 vidas por ${costoActualVidas} totopos.`
        });
    };

    const confirmarGuardadoGlobal = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        try { reproducirSonido('click1'); } catch (e) {}
        const nombreLimpio = inputPlayerName.trim();
        if (!nombreLimpio) {
            setFeedbackModal({
                show: true,
                title: "Nombre requerido",
                message: "Ingresa un nombre valido para guardar."
            });
            return;
        }

        setPlayerName(nombreLimpio);
        localStorage.setItem('sopaLetrasPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore || { level: nivel, intentos: intentos };
        const currentUser = user || auth.currentUser;
        const docId = currentUser ? currentUser.uid : nombreLimpio.toLowerCase().replace(/\s+/g, '_');

        try {
            const docRef = doc(db, "ranking_sopa", docId);
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
            console.error("Error al guardar:", error);
            setFeedbackModal({
                show: true,
                title: "Guardado Local",
                message: "Progreso guardado localmente."
            });
        }
    };

    const handleDesbloquearCategoria = async (tipo, categoriaId, costo) => {
        try { reproducirSonido('click1'); } catch (e) {}
        if (costo > 0 && totopos < costo) {
            setFeedbackModal({
                show: true,
                title: "Totopos insuficientes",
                message: `Te faltan ${costo - totopos} totopos.`
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
        setActivas(prev => (prev.includes(categoriaId) ? prev : [...prev, categoriaId]));

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
                console.error("Error al sincronizar categoria:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "Categoria Desbloqueada",
            message: costo > 0 ? `Gastaste ${costo} totopos.` : "¡Categoria reclamada por tu Nivel de Cuenta!"
        });
    };

    const handleToggleCategoriaActiva = (tipo, categoriaId) => {
        try { reproducirSonido('click1'); } catch (e) {}
        const setActivas = tipo === 'flora' ? setCategoriasFloraActivas : setCategoriasFaunaActivas;
        setActivas(prev => {
            const yaActiva = prev.includes(categoriaId);
            if (yaActiva) {
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== categoriaId);
            }
            return [...prev, categoriaId];
        });
    };

    const handleCambiarTipoContenido = (nuevoModo) => {
        try { reproducirSonido('click1'); } catch (e) {}
        setTipoContenido(nuevoModo);
        localStorage.setItem('tipoContenidoJuego', nuevoModo);
    };

    const confirmarReiniciar = () => {
        try { reproducirSonido('click1'); } catch (e) {}
        localStorage.removeItem('sopaLetrasNivel');
        localStorage.removeItem('sopaLetrasIntentos');
        localStorage.removeItem('sopaLetrasVidas');
        localStorage.removeItem('sopaLetrasModoDificil');
        localStorage.removeItem('sopaLetrasPlayerName');
        setNivel(1);
        setIntentos(0);
        setVidas(3);
        setModoDificil(false);
        setPlayerName('');
        setInputPlayerName('');
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setShowConfirmRestartModal(false);
        setShowComprarVidasModal(false);
        generarNuevoJuego();
    };

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(collection(db, "ranking_sopa"), orderBy("level", "desc"), orderBy("intentos", "asc"), limit(10));
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
        try { reproducirSonido('click1'); } catch (e) {}
        const proximoNivel = nivel + 1;
        setNivel(proximoNivel);
        setVidas(3);
        localStorage.setItem('sopaLetrasNivel', proximoNivel);
        localStorage.setItem('sopaLetrasVidas', 3);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col items-center select-none pb-[env(safe-area-inset-bottom)]"
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
        >
            <header className="text-center mb-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-950 flex items-center justify-center gap-2">
                    🔎 Sopa de Letras
                </h2>
                <div className="text-xs sm:text-sm text-amber-800 font-medium mt-1 flex flex-wrap justify-center items-center gap-2.5">
                    <span className="text-red-600 font-bold inline-flex items-center gap-1">
                        <img src="/tuna-vida.png" alt="Vidas" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                        <span style={{ display: 'none' }}>❤️</span>
                        {vidas}
                    </span>
                    <span>•</span>
                    <span className="font-bold">Niv {nivel}</span>
                    <span>•</span>
                    <span>{intentos} int.</span>
                    <span>•</span>
                    <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                        <img src="/totopo.png" alt="Totopos" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                        <span style={{ display: 'none' }}>🌽</span>
                        {totopos}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => { try { reproducirSonido('click1'); } catch(e){} setShowSelectorCategorias(true); }}
                    className="mt-2 inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-full border-2 border-amber-300 shadow-sm transition-colors cursor-pointer"
                >
                    📚 Categorias
                    <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {tipoContenido === 'flora'
                            ? categoriasFloraActivas.length
                            : tipoContenido === 'ambos'
                                ? categoriasFaunaActivas.length + categoriasFloraActivas.length
                                : categoriasFaunaActivas.length}
                    </span>
                </button>
            </header>

            <ConfiguracionModal
                isOpen={isConfigOpen}
                onClose={() => { try { reproducirSonido('click1'); } catch(e){} handleCloseConfig(); }}
                level={nivel}
                onMenuClick={onBack ? () => { try { reproducirSonido('click1'); } catch(e){} setShowMenuModal(true); } : null}
                onGuardarClick={handleClickGuardar}
                onReiniciarClick={() => { try { reproducirSonido('click1'); } catch(e){} setShowConfirmRestartModal(true); }}
                modoDificil={modoDificil}
                onToggleModoDificil={() => {
                    try { reproducirSonido('click1'); } catch (e) {}
                    const nuevoModo = !modoDificil;
                    setModoDificil(nuevoModo);
                    localStorage.setItem('sopaLetrasModoDificil', nuevoModo);
                }}
            />

            {palabrasEncontradas.length === animalesObjetivo.length && animalesObjetivo.length > 0 && (
                <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3 text-center animate-bounce shadow-md">
                    <p className="text-lg sm:text-xl font-bold text-green-900 mb-1">¡Nivel Completado!</p>
                    <p className="text-xs font-bold text-amber-700 mb-2 inline-flex items-center justify-center gap-1">
                        +{recompensaActual}
                        <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button type="button" onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm transition-transform active:scale-95 cursor-pointer">
                            Siguiente Nivel ➡️
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-5xl flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6 items-center lg:items-start justify-center mt-2">
                <div className="flex flex-col items-center w-full">
                    <div
                        ref={gridRef}
                        className="grid gap-1.5 p-3 bg-amber-100 border-2 border-amber-300 rounded-2xl shadow-xl w-full max-w-[390px] sm:max-w-[450px] lg:max-w-[540px] aspect-square auto-rows-fr touch-none select-none"
                        style={{ gridTemplateColumns: `repeat(${tamanoActual}, minmax(0, 1fr))` }}
                    >
                        {matriz.map((fila, r) =>
                            fila.map((letra, c) => {
                                const isHighlighted = celdasSeleccionadas.some(cell => cell.r === r && cell.c === c);
                                const matched = isCellMatched(r, c);

                                let estiloCelda = 'bg-white hover:bg-amber-50 border border-amber-200/60 text-amber-950';
                                if (isHighlighted) {
                                    estiloCelda = 'bg-orange-400 text-white scale-95 shadow-inner font-bold border-orange-500';
                                } else if (matched) {
                                    estiloCelda = 'bg-green-500 text-white font-bold shadow-sm scale-100 border-green-600';
                                }

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        data-row={r}
                                        data-col={c}
                                        onMouseDown={() => handleMouseDown(r, c)}
                                        onMouseEnter={() => handleMouseEnter(r, c)}
                                        className={`flex items-center justify-center font-bold text-xs sm:text-sm lg:text-base rounded-md cursor-pointer transition-all duration-75 select-none ${estiloCelda}`}
                                    >
                                        {letra}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6 w-full max-w-md lg:max-w-none">
                    <div className="flex flex-col gap-3 w-full bg-white/60 p-4 rounded-2xl border border-amber-200 shadow-sm">
                        <h3 className="font-bold text-amber-900 border-b border-amber-200 pb-1.5 text-sm sm:text-base flex items-center justify-between">
                            <span>📋 Ocultos:</span>
                            <span className="text-amber-700 font-extrabold">{palabrasEncontradas.length}/{animalesObjetivo.length}</span>
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[300px] lg:max-h-[340px] overflow-y-auto pr-1">
                            {animalesObjetivo.map((animal) => {
                                const encontrado = palabrasEncontradas.includes(animal.id);
                                return (
                                    <div key={animal.id} className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all shadow-sm bg-white ${encontrado ? 'border-green-400 bg-green-50/60 opacity-60' : 'border-amber-200'}`}>
                                        <div className="w-9 h-9 bg-orange-100/50 rounded-lg overflow-hidden flex items-center justify-center border border-amber-100 flex-shrink-0">
                                            <img src={animal.image} alt={animal.spanish} className="max-w-full max-h-full object-contain" onError={(e) => { e.target.src = "🔍"; }} />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider truncate">{animal.spanish}</p>
                                            <p className={`text-xs lg:text-sm font-bold transition-all truncate ${encontrado ? 'text-green-700 line-through' : 'text-amber-950'}`}>
                                                {encontrado ? animal.diidxaza : '????'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-md border border-amber-200 w-full">
                        <h3 className="font-bold text-amber-900 text-center mb-2.5 text-sm sm:text-base flex items-center justify-center gap-1.5">
                            <img
                                src="/guiechachi.png"
                                alt="Guiechachi"
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                                }}
                            />
                            <span style={{ display: 'none' }}>🏆</span>
                            Ranking Sopa
                        </h3>
                        {cargandoRanking ? (
                            <p className="text-center text-xs text-gray-500 py-2">Cargando puntajes...</p>
                        ) : ranking.length === 0 ? (
                            <p className="text-center text-xs text-gray-500 py-2">Aun no hay records.</p>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-1">
                                {ranking.map((r, i) => (
                                    <div key={r.id || i} className="flex justify-between items-center border-b py-1.5 text-xs border-gray-100 last:border-0 hover:bg-amber-50 rounded px-2 transition-colors">
                                        <span className="font-medium text-amber-950 truncate max-w-[180px]">
                                            <span className="text-orange-500 font-bold mr-1">{i + 1}.</span> {r.name}
                                            <span className="text-[10px] text-amber-700 font-bold ml-1">(N{r.level})</span>
                                        </span>
                                        <span className="font-bold text-amber-900 whitespace-nowrap">{r.intentos} int.</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showComprarVidasModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-red-300 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="text-4xl mb-2">💔</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¡Sin vidas!</h3>
                        <p className="text-xs text-amber-800 mb-4 inline-flex items-center justify-center gap-1 flex-wrap">
                            Recupera 3 vidas por {costoActualVidas}
                            <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block align-middle" onError={(e) => { e.target.style.display = 'none' }} />
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={confirmarReiniciar}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Reiniciar
                            </button>
                            <button
                                type="button"
                                onClick={comprarVidas}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                            >
                                Comprar ({costoActualVidas}
                                <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                                )
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={confirmarGuardadoGlobal} className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center relative">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">💾 Guardar Record</h3>
                        <p className="text-xs text-amber-800 text-center mb-4">Ingresa tu nombre para registrarte en el ranking.</p>

                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={inputPlayerName}
                            onChange={(e) => setInputPlayerName(e.target.value)}
                            className="border-2 border-amber-300 p-3 rounded-lg w-full mb-5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                            autoFocus
                        />

                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => { try { reproducirSonido('click1'); } catch(e){} setShowGuardarModal(false); }}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menu?</h3>
                        <p className="text-xs text-amber-800 mb-5">Guarda tu progreso antes de salir para no perderlo.</p>

                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => { try { reproducirSonido('click1'); } catch(e){} setShowMenuModal(false); }}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => { try { reproducirSonido('click1'); } catch(e){} setShowMenuModal(false); if (onBack) onBack(); }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="text-3xl mb-2">🔄</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Reiniciar Progreso?</h3>
                        <p className="text-xs text-amber-800 mb-5">Volveras al Nivel 1. ¿Deseas continuar?</p>

                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => { try { reproducirSonido('click1'); } catch(e){} setShowConfirmRestartModal(false); }}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarReiniciar}
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>

                        <button
                            type="button"
                            onClick={() => { try { reproducirSonido('click1'); } catch(e){} setFeedbackModal({ show: false, title: '', message: '' }); }}
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
                        try { reproducirSonido('click1'); } catch(e){}
                        setShowSelectorCategorias(false);
                    }}
                />
            )}
        </div>
    );
}