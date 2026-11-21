import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';
import { listaFlora } from '../data/flora.js';
import {
    categoriaInicialPorDefecto,
    sincronizarDesbloqueosPorNivel,
    filtrarContenidoPorCategorias
} from '../data/Categoriascontenido.js';
import { calcularNivelCuenta } from '../utils/Nivelcuenta.js';
import { almacen } from '../utils/almacen.js';
import { VIDAS_POR_JUEGO } from '../utils/vidas.js';
import { prepararRankingGlobal } from '../utils/rankingGlobal.js';
import { registrarRespuesta, seleccionarConRepaso } from '../utils/repaso.js';
import SelectorCategorias from './SelectorCategorias.jsx';
import { useSonido } from '../hooks/useSonido';
import { useVidasJuego } from '../hooks/useVidasJuego.js';
import { useTotopos } from '../hooks/useTotopos.js';
import { useProgresoJuego } from '../hooks/useProgresoJuego.js';
import { useLogros } from '../hooks/useLogros.js';
import Icono from './Icono.jsx';

import { auth, db } from '../firebaseConfig.js';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const MAX_VIDAS = VIDAS_POR_JUEGO.memorama.max;

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

function Tarjeta({ card, handleChoice, flipped, disabled }) {
    const handleClick = () => {
        if (!disabled && !flipped && !card.isMatched) {
            handleChoice(card);
        }
    };

    const textLength = card.content ? card.content.length : 0;

    const responsiveTextClass = () => {
        if (textLength > 12) return "text-[10px] md:text-sm"; 
        if (textLength > 8) return "text-xs md:text-base";    
        return "text-sm md:text-xl font-bold";            
    };

    return (
        <div className="relative aspect-square cursor-pointer perspective group" onClick={handleClick}>
            <div className={`w-full h-full duration-500 transform-style preserve-3d relative ${flipped ? 'rotate-y-180' : ''}`}>

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

                <div className="absolute inset-0 w-full h-full backface-hidden bg-amber-600 border-2 border-white rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:bg-amber-500 group-hover:scale-[1.02]">
                    <span className="text-white/40 font-black text-3xl md:text-5xl select-none">?</span>
                </div>

            </div>
        </div>
    );
}

export default function Tablero({
    onBack,
    user,
    onSetControles,
    setControlesJuegoActivo
}) {
    const { reproducirSonido } = useSonido();

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
        return almacen.getItem('tipoContenidoJuego') || 'fauna';
    });
    const [guardadoEnNivel, setGuardadoEnNivel] = useState(false);
    const { totopos, abonar, gastar, comprar } = useTotopos(user);
    const { vidas, setVidas } = useVidasJuego('memorama', user);
    const { progresoRemoto, listo: progresoListo, guardarProgreso } = useProgresoJuego('memorama', user);
    const { desbloquear, listo: logrosListos } = useLogros(user);
    const [progresoAplicado, setProgresoAplicado] = useState(false);
    const [fichasVistas, setFichasVistas] = useState([]); 
    const [avisoVistasMostrado, setAvisoVistasMostrado] = useState(false); 
    const [combosFallidos, setCombosFallidos] = useState({}); 

    const [nivelCuenta, setNivelCuenta] = useState(1); 
    const [categoriasFaunaDesbloqueadas, setCategoriasFaunaDesbloqueadas] = useState(() => categoriaInicialPorDefecto('fauna'));
    const [categoriasFloraDesbloqueadas, setCategoriasFloraDesbloqueadas] = useState(() => categoriaInicialPorDefecto('flora'));
    
    const [categoriasFaunaActivas, setCategoriasFaunaActivas] = useState(() => {
        try {
            const guardadas = JSON.parse(almacen.getItem('memoramaCategoriasFaunaActivas') || 'null');
            return guardadas && guardadas.length > 0 ? guardadas : categoriaInicialPorDefecto('fauna');
        } catch (e) {
            return categoriaInicialPorDefecto('fauna');
        }
    });

    const [categoriasFloraActivas, setCategoriasFloraActivas] = useState(() => {
        try {
            const guardadas = JSON.parse(almacen.getItem('memoramaCategoriasFloraActivas') || 'null');
            return guardadas && guardadas.length > 0 ? guardadas : categoriaInicialPorDefecto('flora');
        } catch (e) {
            return categoriaInicialPorDefecto('flora');
        }
    });

    const [showSelectorCategorias, setShowSelectorCategorias] = useState(false);
    const [parejasEnJuego, setParejasEnJuego] = useState(0); 

    const [pendingGlobalScore, setPendingGlobalScore] = useState(null);
    const [cargandoRanking, setCargandoRanking] = useState(false);

    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [inputPlayerName, setInputPlayerName] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false); 
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [showSinVidasModal, setShowSinVidasModal] = useState(false); 
    const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '' });

    const configActual = getConfigForLevel(level);

    useEffect(() => {
        if (vidas === 0) {
            setShowSinVidasModal(true);
        } else {
            setShowSinVidasModal(false);
        }
    }, [vidas]);

    const handleClickGuardar = async () => {
        reproducirSonido('click1');

        if (guardadoEnNivel && !pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "Récord ya guardado",
                message: "Ya guardaste tu récord global. Avanza o completa un nivel para volver a registrar tu puntaje."
            });
            return;
        }

        // 🛡️ Solo se guarda un nivel realmente completado.
        if (!pendingGlobalScore) {
            setFeedbackModal({
                show: true,
                title: "Nivel sin completar",
                message: "Encuentra todas las parejas del nivel antes de guardar tu récord."
            });
            return;
        }

        const scoreToSave = pendingGlobalScore;
        if (!Number.isFinite(scoreToSave.turns) || scoreToSave.turns <= 0) {
            setFeedbackModal({
                show: true,
                title: "Récord inválido",
                message: "El nivel no tiene un puntaje válido. Vuelve a completarlo para guardarlo."
            });
            return;
        }

        almacen.setItem('memoramaNivel', level);
        almacen.setItem('memoramaModoDificil', modoDificil);

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
                        almacen.setItem('memoramaPlayerName', nickNube);
                    }
                }
            } catch (e) {
                console.error("Error al verificar nickname en la nube:", e);
            }
        }

        if (!currentUser) {
            setFeedbackModal({
                show: true,
                title: "Inicia sesión para el ranking",
                message: "Tu progreso se guarda en este dispositivo. Para aparecer en el ranking global, inicia sesión."
            });
            return;
        }

        if (nombreAUsar.trim()) {
            try {
                const rankingRef = doc(db, "ranking", currentUser.uid);
                const rankingSnap = await getDoc(rankingRef);

                if (rankingSnap.exists()) {
                    const anterior = rankingSnap.data();
                    const nivelAnterior = Number(anterior.level) || 0;
                    const scoreAnterior = Number(anterior.score);
                    const scoreAnteriorValido = Number.isFinite(scoreAnterior) && scoreAnterior > 0;

                    const esPeor = scoreToSave.level < nivelAnterior
                        || (scoreToSave.level === nivelAnterior && scoreToSave.turns >= scoreAnterior);

                    if (scoreAnteriorValido && esPeor) {
                        setGuardadoEnNivel(true);
                        setPendingGlobalScore(null);
                        await cargarRankingGlobal();
                        setFeedbackModal({
                            show: true,
                            title: "Récord no mejorado",
                            message: `Tu mejor récord es Nivel ${nivelAnterior} con ${scoreAnterior} turnos. Este intento no lo superó.`
                        });
                        return;
                    }
                }

                await setDoc(rankingRef, {
                    uid: currentUser.uid,
                    name: nombreAUsar.trim(),
                    score: scoreToSave.turns,
                    level: scoreToSave.level,
                    completado: true,
                    fecha: new Date().toISOString()
                }, { merge: true });

                await cargarRankingGlobal();
                setGuardadoEnNivel(true);
                setPendingGlobalScore(null);
                setFeedbackModal({
                    show: true,
                    title: "Guardado Exitoso",
                    message: `Partida guardada localmente (Nivel ${level}) y récord global registrado para el Nivel ${scoreToSave.level} con ${scoreToSave.turns} turnos.`
                });
            } catch (error) {
                console.error("Error al guardar el puntaje en Firebase:", error);
                setFeedbackModal({
                    show: true,
                    title: "Guardado Parcial",
                    message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
                });
            }
        } else {
            setInputPlayerName(nombreAUsar);
            setShowGuardarModal(true);
        }
    };

    useEffect(() => {
        const registrarControles = onSetControles || setControlesJuegoActivo;
        if (registrarControles) {
            registrarControles({
                level: level,
                onMenuClick: () => {
                    reproducirSonido('click1');
                    setShowMenuModal(true); 
                },
                onGuardarClick: pendingGlobalScore ? handleClickGuardar : null,
                onReiniciarClick: reiniciarNivelActual,
                onReiniciarDesdeCeroClick: confirmarReiniciar,
                modoDificil: modoDificil,
                onToggleModoDificil: () => {
                    reproducirSonido('click1');
                    const nuevoModo = !modoDificil;
                    setModoDificil(nuevoModo);
                    almacen.setItem('memoramaModoDificil', nuevoModo);
                }
            });
        }

        return () => {
            if (registrarControles) {
                registrarControles(null);
            }
        };
    }, [level, modoDificil, tipoContenido, turns, guardadoEnNivel, pendingGlobalScore, onSetControles, setControlesJuegoActivo]);

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(
                collection(db, "ranking"),
                orderBy("level", "desc"),
                orderBy("score", "asc"),
                limit(200)
            );
            const querySnapshot = await getDocs(q);

            const datosRanking = [];
            querySnapshot.forEach((docSnap) => {
                datosRanking.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Un jugador puede tener documentos antiguos; la tabla muestra solo su mejor récord.
            setRanking(prepararRankingGlobal(datosRanking, 'memorama', 10));
        } catch (error) {
            console.error("Error al cargar el ranking desde Firebase:", error);
        } finally {
            setCargandoRanking(false);
        }
    };

    useEffect(() => {
        cargarRankingGlobal();
        const nivelGuardado = almacen.getItem('memoramaNivel');
        const modoDificilGuardado = almacen.getItem('memoramaModoDificil');
        const nombreGuardado = almacen.getItem('memoramaPlayerName');
        const nivelInicial = nivelGuardado ? parseInt(nivelGuardado, 10) : 1;

        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        if (nombreGuardado) {
            setPlayerName(nombreGuardado);
            setInputPlayerName(nombreGuardado);
        }
        try {
            const faunaGuardadas = JSON.parse(almacen.getItem('categoriasFaunaDesbloqueadas') || 'null');
            if (faunaGuardadas) {
                setCategoriasFaunaDesbloqueadas(faunaGuardadas);
            }
            const floraGuardadas = JSON.parse(almacen.getItem('categoriasFloraDesbloqueadas') || 'null');
            if (floraGuardadas) {
                setCategoriasFloraDesbloqueadas(floraGuardadas);
            }

            const faunaActivasGuardadas = JSON.parse(almacen.getItem('memoramaCategoriasFaunaActivas') || 'null');
            if (faunaActivasGuardadas) {
                const validas = faunaActivasGuardadas.filter(id => (faunaGuardadas || categoriaInicialPorDefecto('fauna')).includes(id));
                if (validas.length > 0) setCategoriasFaunaActivas(validas);
            }

            const floraActivasGuardadas = JSON.parse(almacen.getItem('memoramaCategoriasFloraActivas') || 'null');
            if (floraActivasGuardadas) {
                const validas = floraActivasGuardadas.filter(id => (floraGuardadas || categoriaInicialPorDefecto('flora')).includes(id));
                if (validas.length > 0) setCategoriasFloraActivas(validas);
            }
        } catch (e) {
            console.error("Error al leer categorías guardadas localmente:", e);
        }

        setLevel(nivelInicial);

        const cargarDatosNube = async () => {
            const currentUser = user || auth.currentUser;
            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'usuarios', currentUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        const historico = data.totoposHistoricos !== undefined ? data.totoposHistoricos : (data.totopos || 0);
                        const nivelCalc = calcularNivelCuenta(historico);
                        setNivelCuenta(nivelCalc);

                        const faunaNube = sincronizarDesbloqueosPorNivel('fauna', [
                            ...(data.categoriasFaunaDesbloqueadas || categoriaInicialPorDefecto('fauna')),
                            ...categoriasFaunaDesbloqueadas
                        ], nivelCalc);
                        const floraNube = sincronizarDesbloqueosPorNivel('flora', [
                            ...(data.categoriasFloraDesbloqueadas || categoriaInicialPorDefecto('flora')),
                            ...categoriasFloraDesbloqueadas
                        ], nivelCalc);
                        setCategoriasFaunaDesbloqueadas(faunaNube);
                        setCategoriasFloraDesbloqueadas(floraNube);
                        almacen.setItem('categoriasFaunaDesbloqueadas', JSON.stringify(faunaNube));
                        almacen.setItem('categoriasFloraDesbloqueadas', JSON.stringify(floraNube));

                        const faunaActivasGuardadas = JSON.parse(almacen.getItem('memoramaCategoriasFaunaActivas') || 'null');
                        setCategoriasFaunaActivas(prev => {
                            const base = faunaActivasGuardadas || prev;
                            const activasValidas = base.filter(id => faunaNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('fauna');
                        });

                        const floraActivasGuardadas = JSON.parse(almacen.getItem('memoramaCategoriasFloraActivas') || 'null');
                        setCategoriasFloraActivas(prev => {
                            const base = floraActivasGuardadas || prev;
                            const activasValidas = base.filter(id => floraNube.includes(id));
                            return activasValidas.length ? activasValidas : categoriaInicialPorDefecto('flora');
                        });

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
                            almacen.setItem('memoramaPlayerName', nickNube);
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
        if (!progresoListo) return;

        if (progresoRemoto) {
            if (Number.isInteger(progresoRemoto.nivel)) setLevel(progresoRemoto.nivel);
            if (typeof progresoRemoto.modoDificil === 'boolean') setModoDificil(progresoRemoto.modoDificil);
            if (['fauna', 'flora', 'ambos'].includes(progresoRemoto.tipoContenido)) {
                setTipoContenido(progresoRemoto.tipoContenido);
            }
            if (Array.isArray(progresoRemoto.categoriasFaunaActivas) && progresoRemoto.categoriasFaunaActivas.length > 0) {
                setCategoriasFaunaActivas(progresoRemoto.categoriasFaunaActivas);
            }
            if (Array.isArray(progresoRemoto.categoriasFloraActivas) && progresoRemoto.categoriasFloraActivas.length > 0) {
                setCategoriasFloraActivas(progresoRemoto.categoriasFloraActivas);
            }
        }

        setProgresoAplicado(true);
    }, [progresoListo, progresoRemoto]);

    useEffect(() => {
        if (!progresoAplicado) return;
        guardarProgreso({
            nivel: level,
            modoDificil,
            tipoContenido,
            categoriasFaunaActivas,
            categoriasFloraActivas
        });
    }, [progresoAplicado, level, modoDificil, tipoContenido, categoriasFaunaActivas, categoriasFloraActivas, guardarProgreso]);

    useEffect(() => {
        iniciarJuego(level);
    }, [level, modoDificil, tipoContenido, categoriasFaunaActivas, categoriasFloraActivas]);

    useEffect(() => {
        if (matches === parejasEnJuego && parejasEnJuego > 0 && !pendingGlobalScore && !guardadoEnNivel) {
            reproducirSonido('click3');
            setPendingGlobalScore({ level: level, turns: turns });

            const totalCategoriasActivas = tipoContenido === 'flora' 
                ? categoriasFloraActivas.length 
                : tipoContenido === 'ambos' 
                    ? categoriasFaunaActivas.length + categoriasFloraActivas.length 
                    : categoriasFaunaActivas.length;

            if (totalCategoriasActivas === 1 && level >= 3) {
                const avisoClave = `avisoCategoria_memorama_${tipoContenido}_nivel_${level}`;
                const yaMostrado = sessionStorage.getItem(avisoClave);

                if (!yaMostrado) {
                    sessionStorage.setItem(avisoClave, 'true');
                    setFeedbackModal({
                        show: true,
                        title: "¡Desafío Bajo!",
                        message: "Has dominado esta categoría con facilidad. Abre el selector de categorías para añadir más grupos y subir la dificultad."
                    });
                }
            }

            abonar(configActual.recompensa);

            // "Sin fallar" = se necesitaron exactamente los turnos de las parejas.
            if (logrosListos && turns === parejasEnJuego) {
                desbloquear('logro_memoria_1');
            }
        }
    }, [matches, parejasEnJuego, level, turns, user, configActual.recompensa, pendingGlobalScore, guardadoEnNivel, abonar, desbloquear, logrosListos, tipoContenido, categoriasFaunaActivas, categoriasFloraActivas]);

    useEffect(() => {
        if (!avisoVistasMostrado && cards.length > 0 && fichasVistas.length >= cards.length) {
            setAvisoVistasMostrado(true);
            setFeedbackModal({
                show: true,
                title: "Tablero conocido",
                message: "Has visto todas las fichas del tablero. A partir de ahora, si repites una combinación incorrecta 3 veces, perderás una vida."
            });
        }
    }, [fichasVistas, cards.length, avisoVistasMostrado]);

    const confirmarGuardadoGlobal = async () => {
        reproducirSonido('click1');

        const currentUser = user || auth.currentUser;
        if (!currentUser) {
            setShowGuardarModal(false);
            setFeedbackModal({
                show: true,
                title: "Inicia sesión para el ranking",
                message: "Tu progreso se guarda en este dispositivo. Para aparecer en el ranking global, inicia sesión."
            });
            return;
        }

        const nombreLimpio = inputPlayerName.trim();
        if (!nombreLimpio) {
            setFeedbackModal({
                show: true,
                title: "Nombre requerido",
                message: "Por favor escribe un nombre válido para registrarte en el ranking."
            });
            return;
        }

        if (!pendingGlobalScore || !Number.isFinite(pendingGlobalScore.turns) || pendingGlobalScore.turns <= 0) {
            setShowGuardarModal(false);
            setFeedbackModal({
                show: true,
                title: "Nivel sin completar",
                message: "Encuentra todas las parejas del nivel antes de guardar tu récord."
            });
            return;
        }

        setPlayerName(nombreLimpio);
        almacen.setItem('memoramaPlayerName', nombreLimpio);
        setShowGuardarModal(false);

        const scoreToSave = pendingGlobalScore;
        const docId = currentUser.uid;

        try {
            const rankingRef = doc(db, "ranking", docId);
            const rankingSnap = await getDoc(rankingRef);

            if (rankingSnap.exists()) {
                const anterior = rankingSnap.data();
                const nivelAnterior = Number(anterior.level) || 0;
                const scoreAnterior = Number(anterior.score);
                const scoreAnteriorValido = Number.isFinite(scoreAnterior) && scoreAnterior > 0;

                const esPeor = scoreToSave.level < nivelAnterior
                    || (scoreToSave.level === nivelAnterior && scoreToSave.turns >= scoreAnterior);

                if (scoreAnteriorValido && esPeor) {
                    setGuardadoEnNivel(true);
                    setPendingGlobalScore(null);
                    await cargarRankingGlobal();
                    setFeedbackModal({
                        show: true,
                        title: "Récord no mejorado",
                        message: `Tu mejor récord es Nivel ${nivelAnterior} con ${scoreAnterior} turnos. Este intento no lo superó.`
                    });
                    return;
                }
            }

            await setDoc(rankingRef, {
                uid: currentUser.uid,
                name: nombreLimpio,
                score: scoreToSave.turns,
                level: scoreToSave.level,
                completado: true,
                fecha: new Date().toISOString()
            }, { merge: true });

            await cargarRankingGlobal();
            setGuardadoEnNivel(true);
            setPendingGlobalScore(null);
            setFeedbackModal({
                show: true,
                title: "Guardado Exitoso",
                message: `Partida guardada localmente (Nivel ${level}) y récord global registrado para el Nivel ${scoreToSave.level} con ${scoreToSave.turns} turnos.`
            });
        } catch (error) {
            console.error("Error al guardar el puntaje en Firebase:", error);
            setFeedbackModal({
                show: true,
                title: "Guardado Parcial",
                message: "Progreso guardado localmente, pero hubo un error al conectar con Firebase."
            });
        }
    };

    const confirmarReiniciar = () => {
        reproducirSonido('click1');
        almacen.removeItem('memoramaNivel');
        almacen.removeItem('memoramaModoDificil');
        almacen.removeItem('memoramaPlayerName');
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
        iniciarJuego(1);
    };

    const reiniciarNivelActual = () => {
        reproducirSonido('click1');
        setVidas(MAX_VIDAS);
        setFichasVistas([]);
        setAvisoVistasMostrado(false);
        setCombosFallidos({});
        setPendingGlobalScore(null);
        setShowSinVidasModal(false);
        setShowConfirmRestartModal(false);
        iniciarJuego(level);
    };

    const iniciarJuego = (nivelActual) => {
        const baseDatosActiva = obtenerBaseDatosActiva(tipoContenido, categoriasFaunaActivas, categoriasFloraActivas);
        const poolSeguro = baseDatosActiva.length > 0 ? baseDatosActiva : filtrarContenidoPorCategorias(listaAnimales, categoriaInicialPorDefecto('fauna'));

        const parejasDelNivel = getConfigForLevel(nivelActual).parejas;
        const parejasReales = Math.min(parejasDelNivel, poolSeguro.length);
        setParejasEnJuego(parejasReales);

        const animalesSeleccionados = seleccionarConRepaso(poolSeguro, parejasReales, tipoContenido);

        const cartasImagenes = animalesSeleccionados.map(animal => ({
            id: `img-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'image',
            content: animal.image,
            label: animal.spanish,
            isMatched: false,
            repaso: { tipo: tipoContenido, id: animal.id, palabra: animal.diidxaza, spanish: animal.spanish }
        }));

        const cartasPalabras = animalesSeleccionados.map(animal => ({
            id: `word-${animal.id}-${Math.random()}`,
            pairId: animal.id,
            type: 'word',
            content: modoDificil ? animal.spanish : animal.diidxaza,
            label: animal.spanish,
            isMatched: false,
            repaso: { tipo: tipoContenido, id: animal.id, palabra: animal.diidxaza, spanish: animal.spanish }
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
        setPendingGlobalScore(null);
    };

    const siguienteNivel = () => {
        reproducirSonido('click1');
        const proximoNivel = level + 1;
        setLevel(proximoNivel);
        setMatches(0);
        almacen.setItem('memoramaNivel', proximoNivel);
        setGuardadoEnNivel(false);
        setPendingGlobalScore(null);
    };

    const handleChoice = (card) => {
        reproducirSonido('click1');
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
        await setVidas(nuevasVidas);

        if (nuevasVidas === 0) {
            setShowSinVidasModal(true);
        }
    };

    const comprarVidasRescate = async () => {
        reproducirSonido('click1');
        const costoPaquete = 40;
        const vidasGanadas = 3;

        if (vidas >= MAX_VIDAS) {
            setFeedbackModal({
                show: true,
                title: "Vidas al máximo",
                message: `Ya tienes tus ${MAX_VIDAS} vidas. No es necesario comprar más.`
            });
            return;
        }

        const resultado = await gastar(costoPaquete);
        if (!resultado.ok) {
            setFeedbackModal({
                show: true,
                title: "Totopos insuficientes",
                message: `Te faltan ${costoPaquete - (resultado.saldo ?? totopos)} totopos para comprar el paquete de 3 vidas. Sigue jugando o completa niveles.`
            });
            return;
        }

        const nuevasVidas = Math.min(MAX_VIDAS, vidas + vidasGanadas);
        const vidasRecuperadas = nuevasVidas - vidas;

        await setVidas(nuevasVidas);
        setShowSinVidasModal(false);

        setFeedbackModal({
            show: true,
            title: "Vidas Recargadas",
            message: vidasRecuperadas > 0
                ? `Has recuperado ${vidasRecuperadas} ${vidasRecuperadas === 1 ? 'vida' : 'vidas'} por ${costoPaquete} totopos. Puedes continuar jugando.`
                : `Ya tenías el máximo de ${MAX_VIDAS} vidas. No se descontaron totopos.`
        });
    };

    const handleDesbloquearCategoria = async (tipo, categoriaId, costo) => {
        reproducirSonido('click1');
        const setDesbloqueadas = tipo === 'flora' ? setCategoriasFloraDesbloqueadas : setCategoriasFaunaDesbloqueadas;
        const setActivas = tipo === 'flora' ? setCategoriasFloraActivas : setCategoriasFaunaActivas;
        const claveLocal = tipo === 'flora' ? 'categoriasFloraDesbloqueadas' : 'categoriasFaunaDesbloqueadas';
        const campoNube = tipo === 'flora' ? 'categoriasFloraDesbloqueadas' : 'categoriasFaunaDesbloqueadas';
        const desbloqueadasActuales = tipo === 'flora'
            ? categoriasFloraDesbloqueadas
            : categoriasFaunaDesbloqueadas;

        const resultado = await comprar(costo, (data) => {
            const actuales = Array.isArray(data?.[campoNube])
                ? data[campoNube]
                : desbloqueadasActuales;
            const nuevas = actuales.includes(categoriaId) ? actuales : [...actuales, categoriaId];
            return { [campoNube]: nuevas };
        });

        if (!resultado.ok) {
            setFeedbackModal({
                show: true,
                title: "Totopos insuficientes",
                message: `Te faltan ${costo - (resultado.saldo ?? totopos)} totopos para desbloquear esta categoría.`
            });
            return;
        }

        const nuevasDesbloqueadas = resultado.extra[campoNube] || desbloqueadasActuales;
        setDesbloqueadas(nuevasDesbloqueadas);
        almacen.setItem(claveLocal, JSON.stringify(nuevasDesbloqueadas));

        setActivas(prev => {
            const actualizadas = prev.includes(categoriaId) ? prev : [...prev, categoriaId];
            if (tipo === 'flora') {
                almacen.setItem('memoramaCategoriasFloraActivas', JSON.stringify(actualizadas));
            } else {
                almacen.setItem('memoramaCategoriasFaunaActivas', JSON.stringify(actualizadas));
            }
            return actualizadas;
        });

        setFeedbackModal({
            show: true,
            title: "Categoría desbloqueada",
            message: costo > 0
                ? `Gastaste ${costo} totopos. Ya puedes practicar esta categoría.`
                : "La reclamaste gratis por tu Nivel de Cuenta."
        });
    };

    const handleToggleCategoriaActiva = (tipo, categoriaId) => {
        reproducirSonido('click1');
        const setActivas = tipo === 'flora' ? setCategoriasFloraActivas : setCategoriasFaunaActivas;
        const claveStorage = tipo === 'flora' ? 'memoramaCategoriasFloraActivas' : 'memoramaCategoriasFaunaActivas';

        setActivas(prev => {
            const yaActiva = prev.includes(categoriaId);
            let nuevasActivas = [];
            if (yaActiva) {
                if (prev.length === 1) return prev;
                nuevasActivas = prev.filter(id => id !== categoriaId);
            } else {
                nuevasActivas = [...prev, categoriaId];
            }
            almacen.setItem(claveStorage, JSON.stringify(nuevasActivas));
            return nuevasActivas;
        });
    };

    const handleCambiarTipoContenido = (nuevoModo) => {
        reproducirSonido('click1');
        setTipoContenido(nuevoModo);
        almacen.setItem('tipoContenidoJuego', nuevoModo);
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);
            if (choiceOne.pairId === choiceTwo.pairId) {
                reproducirSonido('click2');
                registrarRespuesta(choiceOne.repaso, true);
                setCards(prevCards => prevCards.map(card => card.pairId === choiceOne.pairId ? { ...card, isMatched: true } : card));
                setMatches(prev => prev + 1);
                resetTurn();
            } else {
                registrarRespuesta(choiceOne.repaso, false);
                registrarRespuesta(choiceTwo.repaso, false);
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
                                    title: "3 Errores con esta combinación",
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
                    <span className="text-orange-700 font-bold inline-flex items-center gap-1">
                        <img src="/totopo.png" alt="Totopos" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                        <span style={{ display: 'none' }}><Icono nombre="trophy" className="w-4 h-4" /></span>
                        {totopos} Totopos
                    </span> •
                    <span className="text-red-600 font-bold inline-flex items-center gap-1">
                        <img src="/tuna-vida.png" alt="Vidas" className="w-4 h-4 object-contain inline-block" onError={(e) => { e.target.style.display = 'none' }} />
                        <span style={{ display: 'none' }}><Icono nombre="heart" className="w-4 h-4" /></span>
                        {vidas} Vidas
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido('click1');
                        setShowSelectorCategorias(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-full border-2 border-amber-300 shadow-sm transition-colors cursor-pointer"
                >
                    <span className="inline-flex items-center gap-1.5"><Icono nombre="book" className="w-3.5 h-3.5" /> Categorías</span>
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
                            <p className="text-base sm:text-lg font-bold text-green-900 mb-0.5">Nivel {level} completado</p>
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
                            <span style={{ display: 'none' }}><Icono nombre="trophy" className="w-4 h-4" /></span>
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
                                            <span className="text-orange-700 font-black mr-1">{i + 1}.</span> {r.name}
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

            {showSinVidasModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-amber-50 rounded-3xl p-6 shadow-2xl border-4 border-red-500 w-full max-w-sm flex flex-col items-center text-center animate-fade-in relative">
                        <div className="mb-2 animate-bounce flex justify-center"><Icono nombre="heartCrack" className="w-11 h-11 text-red-600" /></div>
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
                                Reiniciar Nivel {level} (10 Vidas)
                            </button>
                            <button
                                onClick={confirmarReiniciar}
                                className="w-full bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer border border-amber-400"
                            >
                                Reiniciar Todo (Volver a Nivel 1)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGuardarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">Guardar Récord</h3>
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
                                    reproducirSonido('click1');
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

            {showMenuModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="mb-2 flex justify-center"><Icono nombre="alert" className="w-8 h-8 text-amber-600" /></div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Volver al Menú Principal?</h3>
                        <p className="text-xs text-amber-800 mb-5">Si sales ahora, asegúrate de haber guardado tu progreso. ¿Estás seguro?</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => {
                                    reproducirSonido('click1');
                                    setShowMenuModal(false);
                                }}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    reproducirSonido('click1');
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

            {showConfirmRestartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <div className="mb-2 flex justify-center"><Icono nombre="refresh" className="w-8 h-8 text-amber-600" /></div>
                        <h3 className="text-xl font-bold text-amber-950 mb-2">¿Reiniciar Progreso?</h3>
                        <p className="text-xs text-amber-800 mb-5">Se borrará tu nivel actual y volverás al Nivel 1. ¿Estás seguro?</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => {
                                    reproducirSonido('click1');
                                    setShowConfirmRestartModal(false);
                                }}
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

            {feedbackModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in text-center">
                        <h3 className="text-xl font-bold text-amber-950 mb-2">{feedbackModal.title}</h3>
                        <p className="text-xs text-amber-800 mb-5">{feedbackModal.message}</p>

                        <button
                            onClick={() => {
                                reproducirSonido('click1');
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
                        reproducirSonido('click1');
                        setShowSelectorCategorias(false);
                    }}
                />
            )}

        </div>
    );
}