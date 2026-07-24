import React, { useState, useEffect, useRef } from 'react';
import { listaAnimales } from '../data/animales.js';
import ConfiguracionModal from './ConfiguracionModal';

import { db, auth } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

const LETRAS_RELLENO = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'T', 'U', 'X', 'Y', 'Z'];

// Recompensas de totopos mejor equilibradas para evitar números rojos en Nivel 1
const RECOMPENSAS_SOPA = {
    1: 20, // Subido de 10 a 20 para superar el costo base de vidas
    2: 30,
    3: 45,
    4: 60
};

// Costo de vidas dinámico según el nivel (más accesible al inicio)
const obtenerCostoVidas = (lvl) => {
    if (lvl === 1) return 10;
    if (lvl === 2) return 15;
    return 20; // Niveles superiores
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

export default function SopaLetras({ 
    onBack, 
    user, 
    isOpenConfig, 
    onCloseConfig,
    onSetControles,
    setControlesJuegoActivo 
}) {
    const [nivel, setNivel] = useState(1);
    const [intentos, setIntentos] = useState(0); 
    const [vidas, setVidas] = useState(3); // 💖 Sistema de Vidas orgánico
    const [matriz, setMatriz] = useState([]);
    const [animalesObjetivo, setAnimalesObjetivo] = useState([]);
    const [palabrasEncontradas, setPalabrasEncontradas] = useState([]);
    const [modoDificil, setModoDificil] = useState(false);
    const [totopos, setTotopos] = useState(0); // 🌽 Sistema de Economía Virtual
    
    const [animalesCoords, setAnimalesCoords] = useState({});

    // Estados del Arrastre
    const [isSelecting, setIsSelecting] = useState(false);
    const [startCell, setStartCell] = useState(null);
    const [currentCell, setCurrentCell] = useState(null);
    const [celdasSeleccionadas, setCeldasSeleccionadas] = useState([]);

    // Referencia para sincronizar el estado de selección en eventos táctiles nativos sin re-renderizar
    const isSelectingRef = useRef(false);
    useEffect(() => {
        isSelectingRef.current = isSelecting;
    }, [isSelecting]);

    // Estados del Ranking y Control de Guardado Unificado
    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);

    // Estados para las Modales Personalizadas (con z-[70] para prioridad visual absoluta)
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [showComprarVidasModal, setShowComprarVidasModal] = useState(false); // 💖 Modal de vidas agotadas
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    // Soporte para control externo o interno del modal de configuración
    const [internalConfigOpen, setInternalConfigOpen] = useState(false);
    const isConfigOpen = isOpenConfig !== undefined ? isOpenConfig : internalConfigOpen;
    const handleCloseConfig = onCloseConfig || (() => setInternalConfigOpen(false));

    const gridRef = useRef(null);

    // Tamaño dinámico y progresivo de la cuadrícula
    const tamanoActual = Math.min(5 + nivel, 12); 
    const cantidadPalabras = Math.min(3 + nivel, 8); 
    const recompensaActual = RECOMPENSAS_SOPA[nivel] || 60;
    const costoActualVidas = obtenerCostoVidas(nivel);

    // Función auxiliar para guardar automáticamente si hay sesión activa y nickname configurado
    const confirmarGuardadoAutomatico = async (nombreLimpio) => {
        const scoreToSave = pendingGlobalScore || { level: nivel, intentos: intentos };

        try {
            await addDoc(collection(db, "ranking_sopa"), {
                name: nombreLimpio,
                intentos: scoreToSave.intentos,
                level: scoreToSave.level,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "🎉 ¡Guardado Exitoso!",
                message: `¡Hola ${nombreLimpio}! Récord registrado automáticamente en el ranking global para el Nivel ${scoreToSave.level} (${scoreToSave.intentos} intentos).`
            });
        } catch (error) {
            console.error("Error al guardar el puntaje en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "⚠️ Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    // Al hacer click en Guardar con verificación de sesión y nickname
    const handleClickGuardar = async () => {
        localStorage.setItem('sopaLetrasNivel', nivel);
        localStorage.setItem('sopaLetrasIntentos', intentos);
        localStorage.setItem('sopaLetrasVidas', vidas);
        localStorage.setItem('sopaLetrasModoDificil', modoDificil);
        localStorage.setItem('totopos', totopos);

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Récord ya guardado",
                message: `Ya guardaste tu récord global para el Nivel ${nivel}. Avanza al siguiente nivel para volver a registrar tu puntaje en el ranking.`
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
                console.error("Error al verificar nickname en la nube:", e);
            }
        }

        if (currentUser && nombreAUsar.trim()) {
            confirmarGuardadoAutomatico(nombreAUsar.trim());
        } else {
            setInputPlayerName(nombreAUsar);
            setShowGuardarModal(true);
        }
    };

    // Sincronizar controles globales con App.jsx y ConfiguracionModal
    useEffect(() => {
        const registrarControles = onSetControles || setControlesJuegoActivo;
        if (registrarControles) {
            registrarControles({
                level: nivel,
                onMenuClick: () => setShowMenuModal(true),
                onGuardarClick: handleClickGuardar,
                onReiniciarClick: () => setShowConfirmRestartModal(true),
                modoDificil: modoDificil,
                onToggleModoDificil: () => {
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
    }, [nivel, modoDificil, intentos, vidas, guardadoEnNivel, pendingGlobalScore, onSetControles, setControlesJuegoActivo]);

    // Cargar datos locales y sincronizar totopos y nickname de la nube si hay sesión activa
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
                        const nickNube = data.nickname || data.nombre || data.name;
                        if (nickNube) {
                            setPlayerName(nickNube);
                            setInputPlayerName(nickNube);
                            localStorage.setItem('sopaLetrasPlayerName', nickNube);
                        }
                    }
                } catch (e) {
                    console.error("Error al cargar datos de la nube:", e);
                }
            }
        };
        cargarDatosNube();
        cargarRankingGlobal();
    }, [user]);

    useEffect(() => {
        generarNuevoJuego();
    }, [nivel, modoDificil]);

    // Solución nativa y limpia para touchstart y touchmove sin advertencias pasivas de consola
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

    // Detectar cuando se completa el nivel de forma segura
    useEffect(() => {
        if (palabrasEncontradas.length === animalesObjetivo.length && animalesObjetivo.length > 0) {
            if (pendingGlobalScore) return;

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
                                totopos: increment(recompensaActual)
                            });
                        } else {
                            await setDoc(userRef, {
                                email: currentUser.email,
                                totopos: recompensaActual,
                                avatar: 'default',
                                avataresDesbloqueados: ['default']
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
        const candidatos = [...listaAnimales]
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

        let celdas = [];
        const { r: r1, c: c1 } = startCell;
        const { r: r2, c: c2 } = currentCell;

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
        if (celdasSeleccionadas.length === 0) return;

        setIntentos(prev => prev + 1); 

        let textoSeleccionado = celdasSeleccionadas.map(cell => matriz[cell.r][cell.c]).join('');
        let textoInvertido = [...textoSeleccionado].reverse().join('');

        const animalEncontrado = animalesObjetivo.find(animal => {
            const palabraLimpia = limpiarPalabra(animal.diidxaza, modoDificil);
            return (palabraLimpia === textoSeleccionado || palabraLimpia === textoInvertido) 
                    && !palabrasEncontradas.includes(animal.id);
        });

        if (animalEncontrado) {
            setPalabrasEncontradas(prev => [...prev, animalEncontrado.id]);
        } else {
            // Si falla la selección en Modo Difícil, pierde una vida
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
        if (totopos < costoActualVidas) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Totopos insuficientes",
                message: "No tienes suficientes totopos para comprar vidas. ¡Completa niveles o juega otros minijuegos para ganar más!"
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
                console.error("Error al descontar totopos en Firebase:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "❤️ ¡Vidas Recargadas!",
            message: `Has recuperado 3 vidas por ${costoActualVidas} totopos. ¡A seguir jugando!`
        });
    };

    const confirmarGuardadoGlobal = async () => {
        const nombreLimpio = inputPlayerName.trim();
        if (!nombreLimpio) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Nombre requerido",
                message: "Por favor escribe un nombre válido para registrarte en el ranking."
            });
            return;
        }

        setPlayerName(nombreLimpio);
        localStorage.setItem('sopaLetrasPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore || { level: nivel, intentos: intentos };

        try {
            await addDoc(collection(db, "ranking_sopa"), {
                name: nombreLimpio,
                intentos: scoreToSave.intentos,
                level: scoreToSave.level,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "🎉 ¡Guardado Exitoso!",
                message: `¡Partida guardada y récord global registrado para el Nivel ${scoreToSave.level} con ${scoreToSave.intentos} intentos!`
            });
        } catch (error) {
            console.error("Error al guardar el puntaje en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "⚠️ Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    const confirmarReiniciar = () => {
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
        const proximoNivel = nivel + 1;
        setNivel(proximoNivel);
        setVidas(3);
        localStorage.setItem('sopaLetrasNivel', proximoNivel);
        localStorage.setItem('sopaLetrasVidas', 3);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center select-none pb-[env(safe-area-inset-bottom)]"
             onMouseUp={handleMouseUp}
             onTouchEnd={handleMouseUp}
        >
            <header className="text-center mb-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-950">🔎 Sopa de Letras</h2>
                <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1">
                    <span className="text-red-600 font-bold">❤️ {vidas} Vidas</span> • Nivel {nivel} • Intentos: {intentos} • <span className="text-orange-600 font-bold">🌽 {totopos} Totopos</span>
                </p>
            </header>

            {/* MODAL DE CONFIGURACIÓN UNIFICADO */}
            <ConfiguracionModal
                isOpen={isConfigOpen}
                onClose={handleCloseConfig}
                level={nivel}
                onMenuClick={onBack ? () => setShowMenuModal(true) : null}
                onGuardarClick={handleClickGuardar}
                onReiniciarClick={() => setShowConfirmRestartModal(true)}
                modoDificil={modoDificil}
                onToggleModoDificil={() => {
                    const nuevoModo = !modoDificil;
                    setModoDificil(nuevoModo);
                    localStorage.setItem('sopaLetrasModoDificil', nuevoModo);
                }}
            />

            {/* AVISO DE NIVEL COMPLETADO */}
            {palabrasEncontradas.length === animalesObjetivo.length && animalesObjetivo.length > 0 && (
                <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3 text-center animate-bounce shadow-md">
                    <p className="text-lg sm:text-xl font-bold text-green-900 mb-1">🎉 ¡Excelente! Encontraste todas las palabras</p>
                    <p className="text-xs font-bold text-amber-700 mb-2">
                        +{recompensaActual} 🌽 Totopos añadidos a tu morral
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button type="button" onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm transition-transform active:scale-95 cursor-pointer">
                            Siguiente Nivel ➡️
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-3xl flex flex-col md:flex-row gap-6 items-center md:items-start justify-center mt-2">
                {/* MATRIZ DINÁMICA DE LA SOPA DE LETRAS */}
                <div 
                    ref={gridRef}
                    className="grid gap-1 p-2 bg-amber-100 border-2 border-amber-300 rounded-2xl shadow-xl w-full max-w-[380px] sm:max-w-[420px] aspect-square auto-rows-fr touch-none select-none"
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
                                    className={`flex items-center justify-center font-bold text-xs sm:text-sm rounded-md cursor-pointer transition-all duration-75 select-none ${estiloCelda}`}
                                >
                                    {letra}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* PANEL LATERAL DE PISTAS */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <h3 className="font-bold text-amber-900 text-center md:text-left border-b border-amber-200 pb-1">
                        📋 Ocultos ({palabrasEncontradas.length}/{animalesObjetivo.length}):
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                        {animalesObjetivo.map((animal) => {
                            const encontrado = palabrasEncontradas.includes(animal.id);
                            return (
                                <div key={animal.id} className={`flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl border transition-all shadow-sm bg-white ${encontrado ? 'border-green-400 bg-green-50/60 opacity-60' : 'border-amber-200'}`}>
                                    <div className="w-12 h-12 bg-orange-100/50 rounded-lg overflow-hidden flex items-center justify-center border border-amber-100 flex-shrink-0">
                                        <img src={animal.image} alt={animal.spanish} className="max-w-full max-h-full object-contain" onError={(e) => { e.target.src = "🔍"; }} />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{animal.spanish}</p>
                                        <p className={`text-base font-bold transition-all mt-0.5 ${encontrado ? 'text-green-700 line-through' : 'text-amber-950'}`}>
                                            {encontrado ? animal.diidxaza : '????'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL DE VIDAS AGOTADAS / COMPRAR (z-[70]) */}
            {showComprarVidasModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-red-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-4xl mb-2">💔</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¡Te has quedado sin vidas!</h3>
                        <p className="text-xs text-amber-800 mb-4">Puedes gastar {costoActualVidas} 🌽 Totopos para recuperar 3 vidas y continuar tu partida.</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                type="button"
                                onClick={confirmarReiniciar} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Reiniciar Nivel
                            </button>
                            <button 
                                type="button"
                                onClick={comprarVidas} 
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Comprar ({costoActualVidas} 🌽)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PERSONALIZADA PARA GUARDAR PROGRESO (z-[70]) */}
            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">💾 Guardar Récord</h3>
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
                                type="button"
                                onClick={() => setShowGuardarModal(false)} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                onClick={confirmarGuardadoGlobal} 
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA VOLVER AL MENÚ (z-[70]) */}
            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menú Principal?</h3>
                        <p className="text-xs text-amber-800 mb-5">Asegúrate de haber guardado tu progreso antes de salir para evitar perder tus avances.</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                type="button"
                                onClick={() => setShowMenuModal(false)} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setShowMenuModal(false); if (onBack) onBack(); }} 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA REINICIAR (z-[70]) */}
            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">🔄</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Reiniciar Progreso?</h3>
                        <p className="text-xs text-amber-800 mb-5">Se borrará tu nivel actual, intentos y volverás al Nivel 1. ¿Estás seguro?</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                type="button"
                                onClick={() => setShowConfirmRestartModal(false)} 
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                onClick={confirmarReiniciar} 
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Sí, reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE MENSAJES / FEEDBACK GENERAL (z-[70]) */}
            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>
                        
                        <button 
                            type="button"
                            onClick={() => setFeedbackModal({ show: false, title: '', message: '' })} 
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {/* TABLA DE RANKING GLOBAL */}
            <div className="mt-12 w-full max-w-md">
                <h3 className="font-bold text-amber-900 text-center mb-3 text-xl">🏆 Ranking - Sopa de Letras</h3>
                <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                    {cargandoRanking ? (
                        <p className="text-center text-sm text-gray-500 py-2">Cargando puntajes globales...</p>
                    ) : ranking.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-2">Aún no hay scores en la nube. ¡Sé el primero!</p>
                    ) : (
                        ranking.map((r, i) => (
                            <div key={r.id || i} className="flex justify-between items-center border-b py-2 text-sm border-gray-100 last:border-0 hover:bg-amber-50 rounded px-2 transition-colors">
                                <span className="font-medium text-amber-950">
                                    <span className="text-orange-500 font-bold mr-2">{i + 1}.</span> {r.name} 
                                    <span className="text-xs text-amber-700 font-bold ml-2">(Nivel {r.level})</span>
                                </span>
                                <span className="font-bold text-amber-900">{r.intentos} intentos</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}