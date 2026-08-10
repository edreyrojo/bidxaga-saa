import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';
import { listaFlora } from '../data/flora.js';
import {
    categoriaInicialPorDefecto,
    sincronizarDesbloqueosPorNivel,
    filtrarContenidoPorCategorias
} from '../data/Categoriascontenido.js';
import { calcularNivelCuenta } from '../utils/Nivelcuenta.js';
import SelectorCategorias from './SelectorCategorias.jsx';

// 1. IMPORTAMOS LA CONFIGURACIÓN Y FUNCIONES DE FIREBASE
import { auth, db } from '../firebaseConfig.js';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

const MAX_VIDAS = 10; // 🛡️ Siempre 10 vidas al comenzar el juego, sin importar el valor guardado previamente

const CONFIG_NIVELES = {
    1: { parejas: 4, columnas: 'grid-cols-4', recompensa: 10 },
    2: { parejas: 6, columnas: 'grid-cols-4 text-sm', recompensa: 20 },
    3: { parejas: 8, columnas: 'grid-cols-4', recompensa: 35 },
    4: { parejas: 12, columnas: 'grid-cols-4 sm:grid-cols-6', recompensa: 50 }
};

const getConfigForLevel = (lvl) => {
    return CONFIG_NIVELES[lvl] || { parejas: 12, columnas: 'grid-cols-4 sm:grid-cols-6', recompensa: 50 };
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

// ==========================================
// SUBCOMPONENTE INTEGRADO: TARJETA
// ==========================================
function Tarjeta({ card, handleChoice, flipped, disabled }) {
    const handleClick = () => {
        if (!disabled && !flipped && !card.isMatched) {
            handleChoice(card);
        }
    };

    const textLength = card.content ? card.content.length : 0;

    const responsiveTextClass = () => {
        if (textLength > 12) return "text-[10px] md:text-sm"; // Palabras muy largas
        if (textLength > 8) return "text-xs md:text-base";    // Palabras medianas
        return "text-sm md:text-xl font-bold";                // Palabras cortas (Ideal)
    };

    return (
        <div className="relative aspect-square cursor-pointer perspective group" onClick={handleClick}>
            <div className={`w-full h-full duration-500 transform-style preserve-3d relative ${flipped ? 'rotate-y-180' : ''}`}>

                {/* PARTE FRONTAL (Contenido) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white border-2 border-amber-300 rounded-xl flex flex-col items-center justify-center p-2 shadow-inner hover:border-amber-400 transition-colors">
                    {card.type === 'image' ? (
                        <img
                            src={card.content}
                            alt={card.label}
                            className="w-full h-full object-contain p-1 rounded-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}

                    {/* Contenedor de texto con clases responsivas */}
                    <div className={`${card.type === 'image' ? 'hidden' : 'flex'} flex-col items-center justify-center h-full w-full text-center p-1`}>
                        <p className={`${responsiveTextClass()} text-amber-950 uppercase tracking-tight leading-tight break-words`}>
                            {card.type === 'word' ? card.content : card.label}
                        </p>
                        {card.type === 'word' && (
                            <span className="text-[9px] md:text-xs text-black mt-1 uppercase tracking-wider block">
                                ({card.label})
                            </span>
                        )}
                    </div>
                </div>

                {/* PARTE TRASERA (Ficha oculta) */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-amber-600 border-2 border-white rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:bg-amber-500 group-hover:scale-[1.02]">
                    <span className="text-white/40 font-black text-3xl md:text-5xl select-none">?</span>
                </div>

            </div>
        </div>
    );
}

// ==========================================
// COMPONENTE PRINCIPAL: TABLERO
// ==========================================
export default function Tablero({
    onBack,
    user,
    onSetControles,
    setControlesJuegoActivo
}) {
    const [level, setLevel] = useState(1);
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matches, setMatches] = useState(0);
    const [ranking, setRanking] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [modoDificil, setModoDificil] = useState(false);
    const [tipoContenido, setTipoContenido] = useState(() => {
        return localStorage.getItem('tipoContenidoJuego') || 'fauna';
    });
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    const [totopos, setTotopos] = useState(0); // 🌽 Sistema de Economía Virtual
    const [vidas, setVidas] = useState(MAX_VIDAS); // ❤️ Sistema de Vidas: SIEMPRE arranca en 10
    const [fichasVistas, setFichasVistas] = useState([]); // 🛡️ IDs de cartas ya volteadas al menos una vez
    const [avisoVistasMostrado, setAvisoVistasMostrado] = useState(false); // 🛡️ Control para mostrar el aviso de tablero conocido una sola vez
    const [combosFallidos, setCombosFallidos] = useState({}); // 🛡️ Conteo de veces que se repite la MISMA combinación incorrecta

    // 📚 Sistema de categorías desbloqueables (fauna y flora)
    const [nivelCuenta, setNivelCuenta] = useState(1); // Calculado a partir del total histórico de totopos
    const [categoriasFaunaDesbloqueadas, setCategoriasFaunaDesbloqueadas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFloraDesbloqueadas, setCategoriasFloraDesbloqueadas] = useState(() => categoriaInicialPorDefecto('flora'));
    const [categoriasFaunaActivas, setCategoriasFaunaActivas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFloraActivas, setCategoriasFloraActivas] = useState(() => categoriaInicialPorDefecto('flora'));
    const [showSelectorCategorias, setShowSelectorCategorias] = useState(false);
    const [parejasEnJuego, setParejasEnJuego] = useState(0); // 🛡️ Parejas REALES de esta ronda (puede ser < configActual.parejas si la categoría elegida es chica)

    // Memoria temporal para guardar el récord del nivel anterior completado
    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);

    // Estado para mostrar si estamos cargando los datos de la nube
    const [cargandoRanking, setCargandoRanking] = useState(false);

    // Estados para las Modales Personalizadas
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false); // ⚠️ Estado restaurado para la advertencia del menú
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [showSinVidasModal, setShowSinVidasModal] = useState(false); // 🛑 Modal para cuando se agotan las vidas
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    const configActual = getConfigForLevel(level);

    // Al hacer click en Guardar
    const handleClickGuardar = async () => {
        localStorage.setItem('memoramaNivel', level);
        localStorage.setItem('memoramaModoDificil', modoDificil);
        localStorage.setItem('totopos', totopos);
        localStorage.setItem('memoramaVidas', vidas);

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "⚠️ Récord ya guardado",
                message: "Ya guardaste tu récord global. Avanza o completa un nivel para volver a registrar tu puntaje."
            });
            return;
        }

        const currentUser = user || auth.currentUser;
        let nombreAUsar = playerName;

        // Si está logueado, verificamos y aseguramos tener el nickname más reciente de la nube
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
                        localStorage.setItem('memoramaPlayerName', nickNube);
                    }
                }
            } catch (e) {
                console.error("Error al verificar nickname en la nube:", e);
            }
        }

        // Si está logueado y tiene un nickname configurado, guarda directamente sin mostrar la modal
        if (currentUser && nombreAUsar.trim()) {
            const scoreToSave = pendingGlobalScore || { level: level, turns: turns };
            try {
                await addDoc(collection(db, "ranking"), {
                    name: nombreAUsar.trim(),
                    score: scoreToSave.turns,
                    level: scoreToSave.level,
                    fecha: new Date().toISOString()
                });
                await cargarRankingGlobal();
                setGuardadoEnNivel(true);
                setPendingGlobalScore(null);
                setFeedbackModal({
                    show: true,
                    title: "🎉 ¡Guardado Exitoso!",
                    message: `¡Partida guardada localmente (Nivel ${level}) y récord global registrado para el Nivel ${scoreToSave.level} con ${scoreToSave.turns} turnos!`
                });
            } catch (error) {
                console.error("Error al guardar el puntaje en Firebase:", error);
                setFeedbackModal({
                    show: true,
                    title: "⚠️ Guardado Parcial",
                    message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
                });
            }
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
                level: level,
                onMenuClick: () => {
                    setShowMenuModal(true); // ⚠️ Muestra la advertencia antes de salir
                },
                onGuardarClick: handleClickGuardar,
                onReiniciarClick: () => setShowConfirmRestartModal(true),
                modoDificil: modoDificil,
                onToggleModoDificil: () => {
                    const nuevoModo = !modoDificil;
                    setModoDificil(nuevoModo);
                    localStorage.setItem('memoramaModoDificil', nuevoModo);
                },
                onCambiarTipoContenido: (nuevoModo) => {
                    setTipoContenido(nuevoModo);
                    localStorage.setItem('tipoContenidoJuego', nuevoModo);
                }
            });
        }

        return () => {
            if (registrarControles) {
                registrarControles(null);
            }
        };
    }, [level, modoDificil, tipoContenido, turns, guardadoEnNivel, pendingGlobalScore, onSetControles, setControlesJuegoActivo]);

    // 2. FUNCIÓN PARA LEER DESDE LA NUBE (GLOBAL)
    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(
                collection(db, "ranking"),
                orderBy("level", "desc"),
                orderBy("score", "asc"),
                limit(10)
            );
            const querySnapshot = await getDocs(q);

            const datosRanking = [];
            querySnapshot.forEach((doc) => {
                datosRanking.push({ id: doc.id, ...doc.data() });
            });

            setRanking(datosRanking);
        } catch (error) {
            console.error("Error al cargar el ranking desde Firebase:", error);
        } finally {
            setCargandoRanking(false);
        }
    };

    // 3. CARGA INICIAL DESDE FIREBASE Y RESCATE DE PROGRESO LOCAL
    useEffect(() => {
        cargarRankingGlobal();
        const nivelGuardado = localStorage.getItem('memoramaNivel');
        const modoDificilGuardado = localStorage.getItem('memoramaModoDificil');
        const nombreGuardado = localStorage.getItem('memoramaPlayerName');
        const totoposGuardados = localStorage.getItem('totopos');
        const nivelInicial = nivelGuardado ? parseInt(nivelGuardado, 10) : 1;

        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        if (nombreGuardado) {
            setPlayerName(nombreGuardado);
            setInputPlayerName(nombreGuardado);
        }
        if (totoposGuardados) setTotopos(parseInt(totoposGuardados, 10));

        // 📚 Categorías: recuperamos lo guardado localmente como respaldo inicial
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
            console.error("Error al leer categorías guardadas localmente:", e);
        }

        setVidas(MAX_VIDAS);
        localStorage.setItem('memoramaVidas', MAX_VIDAS);

        setLevel(nivelInicial);

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

                        // 🏅 Nivel de Cuenta, a partir del total histórico (mismo cálculo que el "Lvl" de arriba)
                        const historico = data.totoposHistoricos !== undefined ? data.totoposHistoricos : (data.totopos || 0);
                        const nivelCalc = calcularNivelCuenta(historico);
                        setNivelCuenta(nivelCalc);

                        // 📚 Categorías desbloqueadas en la nube, fusionadas con lo que ya califica gratis por nivel
                        const faunaNube = sincronizarDesbloqueosPorNivel('fauna', data.categoriasFaunaDesbloqueadas || categoriaInicialPorDefecto('fauna'), nivelCalc);
                        const floraNube = sincronizarDesbloqueosPorNivel('flora', data.categoriasFloraDesbloqueadas || categoriaInicialPorDefecto('flora'), nivelCalc);
                        setCategoriasFaunaDesbloqueadas(faunaNube);
                        setCategoriasFloraDesbloqueadas(floraNube);
                        localStorage.setItem('categoriasFaunaDesbloqueadas', JSON.stringify(faunaNube));
                        localStorage.setItem('categoriasFloraDesbloqueadas', JSON.stringify(floraNube));

                        // Si había categorías activas guardadas en la nube, las restauramos; si no, caemos a las gratis
                        setCategoriasFaunaActivas(prev => {
                            const activasValidas = prev.filter(id => faunaNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('fauna');
                        });
                        setCategoriasFloraActivas(prev => {
                            const activasValidas = prev.filter(id => floraNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('flora');
                        });

                        // Si se desbloqueó algo nuevo por nivel que la nube no tenía registrado, lo persistimos
                        if (JSON.stringify(faunaNube) !== JSON.stringify(data.categoriasFaunaDesbloqueadas || [])
                            || JSON.stringify(floraNube) !== JSON.stringify(data.categoriasFloraDesbloqueadas || [])) {
                            updateDoc(userDocRef, {
                                categoriasFaunaDesbloqueadas: faunaNube,
                                categoriasFloraDesbloqueadas: floraNube
                            }).catch(err => console.error("Error al sincronizar categorías por nivel:", err));
                        }

                        const nickNube = data.nickname || data.nombre || data.name;
                        if (nickNube) {
                            setPlayerName(nickNube);
                            setInputPlayerName(nickNube);
                            localStorage.setItem('memoramaPlayerName', nickNube);
                        }
                    }
                } catch (e) {
                    console.error("Error al cargar datos de la nube:", e);
                }
            }
        };
        cargarDatosNube();
    }, [user]);

    useEffect(() => {
        iniciarJuego(level);
    }, [level, modoDificil, tipoContenido, categoriasFaunaActivas, categoriasFloraActivas]);

    // Detectar automáticamente cuando se completa un nivel
    useEffect(() => {
        if (matches === parejasEnJuego && parejasEnJuego > 0 && !pendingGlobalScore) {
            setPendingGlobalScore({ level: level, turns: turns });

            setTotopos(prevTotopos => {
                const nuevosTotopos = prevTotopos + configActual.recompensa;
                localStorage.setItem('totopos', nuevosTotopos);

                const currentUser = user || auth.currentUser;
                if (currentUser) {
                    const abonarTotopos = async () => {
                        try {
                            const userRef = doc(db, 'usuarios', currentUser.uid);
                            const userSnap = await getDoc(userRef);

                            if (userSnap.exists()) {
                                await updateDoc(userRef, {
                                    totopos: increment(configActual.recompensa),
                                    totoposHistoricos: increment(configActual.recompensa)
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
    }, [matches, parejasEnJuego, level, turns, user, configActual.recompensa, pendingGlobalScore]);

    // 🛡️ Detectar exactamente cuando se han visto todas las fichas por primera vez
    useEffect(() => {
        if (!avisoVistasMostrado && cards.length > 0 && fichasVistas.length >= cards.length) {
            setAvisoVistasMostrado(true);
            setFeedbackModal({
                show: true,
                title: "👀 ¡Tablero conocido!",
                message: "¡Has visto todas las fichas del tablero! A partir de ahora, si repites una combinación incorrecta 3 veces, perderás una vida."
            });
        }
    }, [fichasVistas, cards.length, avisoVistasMostrado]);

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
        localStorage.setItem('memoramaPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore || { level: level, turns: turns };

        try {
            await addDoc(collection(db, "ranking"), {
                name: nombreLimpio,
                score: scoreToSave.turns,
                level: scoreToSave.level,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "🎉 ¡Guardado Exitoso!",
                message: `¡Partida guardada localmente (Nivel ${level}) y récord global registrado para el Nivel ${scoreToSave.level} con ${scoreToSave.turns} turnos!`
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

    // Reinicia TODO el progreso y vuelve al Nivel 1, con 10 vidas
    const confirmarReiniciar = () => {
        localStorage.removeItem('memoramaNivel');
        localStorage.removeItem('memoramaModoDificil');
        localStorage.removeItem('memoramaPlayerName');
        localStorage.removeItem('memoramaVidas');
        setLevel(1);
        setModoDificil(false);
        setPlayerName('');
        setInputPlayerName('');
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
        setShowConfirmRestartModal(false);
        setShowSinVidasModal(false);
        setVidas(MAX_VIDAS);
        setFichasVistas([]);
        setAvisoVistasMostrado(false);
        setCombosFallidos({});
        localStorage.setItem('memoramaVidas', MAX_VIDAS);
        iniciarJuego(1);
    };

    // 🆕 Reinicia SOLO el nivel actual con 10 vidas
    const reiniciarNivelActual = () => {
        setVidas(MAX_VIDAS);
        localStorage.setItem('memoramaVidas', MAX_VIDAS);
        setFichasVistas([]);
        setAvisoVistasMostrado(false);
        setCombosFallidos({});
        setPendingGlobalScore(null);
        setShowSinVidasModal(false);
        setShowConfirmRestartModal(false);
        iniciarJuego(level);

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            updateDoc(doc(db, 'usuarios', currentUser.uid), { vidas: MAX_VIDAS }).catch(err => {
                console.error("Error al sincronizar vidas al reiniciar nivel:", err);
            });
        }
    };

    const iniciarJuego = (nivelActual) => {
        const baseDatosActiva = obtenerBaseDatosActiva(tipoContenido, categoriasFaunaActivas, categoriasFloraActivas);

        // 🛡️ Si por alguna razón el pool queda vacío (ej. categorías recién cambiadas), no tronamos: usamos fauna doméstica de respaldo
        const poolSeguro = baseDatosActiva.length > 0 ? baseDatosActiva : filtrarContenidoPorCategorias(listaAnimales, categoriaInicialPorDefecto('fauna'));

        // 🛡️ El nivel puede pedir más parejas de las que la(s) categoría(s) elegidas alcanzan a ofrecer
        // (ej. "Felinos" solo tiene 6). En ese caso jugamos con TODO lo disponible, no con un tablero incompleto.
        const parejasDelNivel = getConfigForLevel(nivelActual).parejas;
        const parejasReales = Math.min(parejasDelNivel, poolSeguro.length);
        setParejasEnJuego(parejasReales);

        const animalesSeleccionados = [...poolSeguro]
            .sort(() => Math.random() - 0.5)
            .slice(0, parejasReales);

        const cartasImagenes = animalesSeleccionados.map(animal => ({
            id: `img-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'image',
            content: animal.image,
            label: animal.spanish,
            isMatched: false
        }));

        const cartasPalabras = animalesSeleccionados.map(animal => ({
            id: `word-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'word',
            content: modoDificil ? animal.spanish : animal.diidxaza,
            label: animal.spanish,
            isMatched: false
        }));

        const mazoMezclado = [...cartasImagenes, ...cartasPalabras].sort(() => Math.random() - 0.5);

        setCards(mazoMezclado);
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(0);
        setMatches(0);
        setFichasVistas([]);
        setAvisoVistasMostrado(false);
        setCombosFallidos({});
        setGuardadoEnNivel(false);
    };

    const siguienteNivel = () => {
        const proximoNivel = level + 1;
        setLevel(proximoNivel);
        localStorage.setItem('memoramaNivel', proximoNivel);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
    };

    const handleChoice = (card) => {
        setFichasVistas(prev => (prev.includes(card.id) ? prev : [...prev, card.id]));
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(prevTurns => prevTurns + 1);
        setDisabled(false);
    };

    const descontarVida = async (cantidad) => {
        const nuevasVidas = Math.max(0, vidas - cantidad);
        setVidas(nuevasVidas);
        localStorage.setItem('memoramaVidas', nuevasVidas);

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            try {
                await updateDoc(doc(db, 'usuarios', currentUser.uid), { vidas: nuevasVidas });
            } catch (err) {
                console.error("Error al actualizar vidas en la nube:", err);
            }
        }

        if (nuevasVidas === 0) {
            setShowSinVidasModal(true);
        }
    };

    const comprarVidasRescate = async () => {
        const costoPaquete = 40;
        const vidasGanadas = 3;

        if (totopos < costoPaquete) {
            setFeedbackModal({
                show: true,
                title: "🌽 Totopos insuficientes",
                message: `Te faltan ${costoPaquete - totopos} totopos para comprar el paquete de 3 vidas. ¡Sigue jugando o completa niveles!`
            });
            return;
        }

        const nuevosTotopos = totopos - costoPaquete;
        const nuevasVidas = vidas + vidasGanadas;

        setTotopos(nuevosTotopos);
        setVidas(nuevasVidas);
        localStorage.setItem('totopos', nuevosTotopos);
        localStorage.setItem('memoramaVidas', nuevasVidas);
        setShowSinVidasModal(false);

        const currentUser = user || auth.currentUser;
        if (currentUser) {
            try {
                await updateDoc(doc(db, 'usuarios', currentUser.uid), {
                    totopos: nuevosTotopos,
                    vidas: nuevasVidas
                });
            } catch (err) {
                console.error("Error al gastar totopos por vidas:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "❤️ ¡Vidas Recargadas!",
            message: `¡Has comprado ${vidasGanadas} vidas extra por ${costoPaquete} totopos! Puedes continuar jugando.`
        });
    };

    // 📚 Desbloquear una categoría pagando totopos actuales (el desbloqueo gratis por nivel ya se aplica solo)
    const handleDesbloquearCategoria = async (tipo, categoriaId, costo) => {
        if (costo > 0 && totopos < costo) {
            setFeedbackModal({
                show: true,
                title: "🌽 Totopos insuficientes",
                message: `Te faltan ${costo - totopos} totopos para desbloquear esta categoría.`
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
        // La categoría recién comprada se activa automáticamente para que se note el cambio
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
                console.error("Error al sincronizar categoría desbloqueada:", err);
            }
        }

        setFeedbackModal({
            show: true,
            title: "🔓 ¡Categoría desbloqueada!",
            message: costo > 0
                ? `Gastaste ${costo} totopos. Ya puedes practicar esta categoría.`
                : "¡La reclamaste gratis por tu Nivel de Cuenta!"
        });
    };

    // Activa/desactiva una categoría YA desbloqueada dentro de la selección de práctica actual
    const handleToggleCategoriaActiva = (tipo, categoriaId) => {
        const setActivas = tipo === 'flora' ? setCategoriasFloraActivas : setCategoriasFaunaActivas;
        setActivas(prev => {
            const yaActiva = prev.includes(categoriaId);
            if (yaActiva) {
                // No permitimos dejar 0 categorías activas
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== categoriaId);
            }
            return [...prev, categoriaId];
        });
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);
            if (choiceOne.pairId === choiceTwo.pairId) {
                setCards(prevCards => prevCards.map(card => card.pairId === choiceOne.pairId ? { ...card, isMatched: true } : card));
                setMatches(prev => prev + 1);
                resetTurn();
            } else {
                setTimeout(() => {
                    const todasVistas = cards.length > 0 && fichasVistas.length >= cards.length;
                    const comboKey = [choiceOne.pairId, choiceTwo.pairId].sort().join('|');

                    if (!todasVistas) {
                        // Aún no se han visto todas las fichas
                    } else if (modoDificil) {
                        descontarVida(1);
                    } else {
                        setCombosFallidos(prev => {
                            const conteoActual = (prev[comboKey] || 0) + 1;
                            const actualizado = { ...prev, [comboKey]: conteoActual };

                            if (conteoActual >= 3) {
                                descontarVida(1);
                                actualizado[comboKey] = 0;
                                setFeedbackModal({
                                    show: true,
                                    title: "⚠️ ¡3 Errores con esta combinación!",
                                    message: "Has repetido el mismo par incorrecto 3 veces."
                                });
                            }
                            return actualizado;
                        });
                    }

                    resetTurn();
                }, 1000);
            }
        }
    }, [choiceOne, choiceTwo, modoDificil, cards.length, fichasVistas]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-2 select-none pb-[env(safe-area-inset-bottom)]">

            <header className="text-center mb-2">
                <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-1 max-h-16 sm:max-h-20 w-auto object-contain" />
                <p className="text-xs sm:text-sm text-amber-800 font-medium flex flex-wrap justify-center items-center gap-2">
                    <span>Nivel {level}</span> •
                    <span>Turnos: {turns}</span> •
                    <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                        <img src="/totopo.png" alt="Totopos" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                        <span style={{ display: 'none' }}>🌽</span>
                        {totopos} Totopos
                    </span> •
                    <span className="text-red-600 font-bold inline-flex items-center gap-1">
                        <img src="/tuna-vida.png" alt="Vidas" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                        <span style={{ display: 'none' }}>❤️</span>
                        {vidas} Vidas
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => setShowSelectorCategorias(true)}
                    className="mt-2 inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-full border-2 border-amber-300 shadow-sm transition-colors cursor-pointer"
                >
                    📚 Categorías
                    <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {tipoContenido === 'flora'
                            ? categoriasFloraActivas.length
                            : tipoContenido === 'ambos'
                                ? categoriasFaunaActivas.length + categoriasFloraActivas.length
                                : categoriasFaunaActivas.length}
                    </span>
                </button>
            </header>

            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-4 items-start justify-center">

                <div className="flex flex-col items-center w-full">
                    {matches === parejasEnJuego && parejasEnJuego > 0 && (
                        <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-3 mb-2 text-center animate-bounce">
                            <p className="text-base sm:text-lg font-bold text-green-900 mb-0.5">🎉 ¡Nivel {level} completado!</p>
                            <p className="text-xs font-bold text-amber-700 mb-2 inline-flex items-center justify-center gap-1">
                                +{configActual.recompensa}
                                <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                                Totopos añadidos a tu morral (Total: {totopos})
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-md text-xs sm:text-sm cursor-pointer">Siguiente Nivel</button>
                            </div>
                        </div>
                    )}

                    <div className={`grid ${configActual.columnas} gap-2.5 w-full max-w-xl`}>
                        {cards.map(card => (
                            <Tarjeta
                                key={card.id}
                                card={card}
                                handleChoice={handleChoice}
                                flipped={card === choiceOne || card === choiceTwo || card.isMatched}
                                disabled={disabled || vidas === 0}
                            />
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto lg:max-w-none">
                    <div className="bg-white rounded-2xl p-3.5 shadow-md border-2 border-amber-200">
                        {/* Título de Ranking con Collar Guiechachi en PNG */}
                        <h3 className="font-black text-amber-900 text-center mb-2.5 text-sm sm:text-base flex items-center justify-center gap-1.5">
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
                            Ranking Global - Memorama
                        </h3>
                        {cargandoRanking ? (
                            <p className="text-center text-xs text-gray-500 py-2">Cargando puntajes globales...</p>
                        ) : ranking.length === 0 ? (
                            <p className="text-center text-xs text-gray-500 py-2">Aún no hay scores en la nube. ¡Sé el primero!</p>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto pr-1">
                                {ranking.map((r, i) => (
                                    <div key={r.id || i} className="flex justify-between items-center border-b py-1.5 text-xs border-gray-100 last:border-0 hover:bg-amber-50 rounded px-2 transition-colors">
                                        <span className="font-bold text-amber-950 truncate max-w-[180px]">
                                            <span className="text-orange-600 font-black mr-1">{i + 1}.</span> {r.name}
                                            <span className="text-[9px] text-amber-700 font-bold ml-1.5 bg-amber-100 px-1 py-0.5 rounded">Niv {r.level}</span>
                                        </span>
                                        <span className="font-black text-amber-900 whitespace-nowrap">{r.score} turnos</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 🛑 MODAL: TE QUEDASTE SIN VIDAS */}
            {showSinVidasModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-red-500 w-full max-w-sm flex flex-col items-center text-center animate-fade-in relative">
                        <div className="text-5xl mb-2 animate-bounce">💔</div>
                        <h3 className="text-2xl font-black text-red-700 mb-1">¡Te has quedado sin vidas!</h3>
                        <p className="text-xs text-amber-900 mb-5 font-medium">
                            Has agotado tus corazones. Puedes gastar totopos para rellenar tus vidas y continuar o reiniciar el progreso.
                        </p>

                        <div className="flex flex-col gap-2.5 w-full">
                            <button
                                onClick={comprarVidasRescate}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md text-sm transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <img src="/tuna-vida.png" alt="vida" className="w-5 h-5 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                <span>Comprar 3 Vidas (40</span>
                                <img src="/totopo.png" alt="totopo" className="w-4 h-4 object-contain inline-block" onError={(e) => e.target.style.display = 'none'} />
                                <span>)</span>
                            </button>

                            <button
                                onClick={reiniciarNivelActual}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                🔄 Reiniciar Nivel {level} (10 Vidas)
                            </button>
                            <button
                                onClick={confirmarReiniciar}
                                className="w-full bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer border border-amber-400"
                            >
                                ⚠️ Reiniciar Todo (Volver a Nivel 1)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PERSONALIZADA PARA GUARDAR PROGRESO */}
            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
                                onClick={() => setShowGuardarModal(false)}
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

            {/* ⚠️ MODAL DE CONFIRMACIÓN PARA VOLVER AL MENÚ */}
            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menú Principal?</h3>
                        <p className="text-xs text-amber-800 mb-5">Si sales ahora, asegúrate de haber guardado tu progreso. ¿Estás seguro?</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowMenuModal(false)}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setShowMenuModal(false);
                                    if (onBack) onBack();
                                }}
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA REINICIAR */}
            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="text-3xl mb-2">🔄</div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Reiniciar Progreso?</h3>
                        <p className="text-xs text-amber-800 mb-5">Se borrará tu nivel actual y volverás al Nivel 1. ¿Estás seguro?</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowConfirmRestartModal(false)}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarReiniciar}
                                className="flex-1 bg-amber-950 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                            >
                                Sí, reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE MENSAJES / FEEDBACK GENERAL */}
            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>

                        <button
                            onClick={() => setFeedbackModal({ show: false, title: '', message: '' })}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {/* 📚 MODAL: SELECTOR DE CATEGORÍAS DESBLOQUEABLES */}
            {showSelectorCategorias && (
                <SelectorCategorias
                    tipo={tipoContenido === 'flora' ? 'flora' : 'fauna'}
                    desbloqueadas={tipoContenido === 'flora' ? categoriasFloraDesbloqueadas : categoriasFaunaDesbloqueadas}
                    activas={tipoContenido === 'flora' ? categoriasFloraActivas : categoriasFaunaActivas}
                    totopos={totopos}
                    nivelCuenta={nivelCuenta}
                    onToggleActiva={(id) => handleToggleCategoriaActiva(tipoContenido === 'flora' ? 'flora' : 'fauna', id)}
                    onDesbloquear={(id, costo) => handleDesbloquearCategoria(tipoContenido === 'flora' ? 'flora' : 'fauna', id, costo)}
                    onClose={() => setShowSelectorCategorias(false)}
                />
            )}

        </div>
    );
}