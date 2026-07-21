import React, { useState, useEffect, useRef } from 'react';
import { listaAnimales } from '../data/animales.js';

import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

// --- ALGORITMO GENERADOR DE CRUCIGRAMAS ---
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
        const text = limpiarPalabra(animal.diidxaza, modoDificil);
        if (index === 0) {
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

export default function Crucigrama({ onBack }) {
    const [nivel, setNivel] = useState(1);
    const [intentos, setIntentos] = useState(0);
    const [placements, setPlacements] = useState([]);
    const [matriz, setMatriz] = useState([]);
    
    const [respuestasUsuario, setRespuestasUsuario] = useState({});
    const [palabrasResueltas, setPalabrasResueltas] = useState([]);
    const [modoDificil, setModoDificil] = useState(false);

    // Estados para el Dial Circular Táctil
    const [activePlacement, setActivePlacement] = useState(null);
    const [dialSeleccion, setDialSeleccion] = useState([]);
    const [letrasElegidas, setLetrasElegidas] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const dialRef = useRef(null);

    const [isGameOver, setIsGameOver] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);

    useEffect(() => {
        const nivelGuardado = localStorage.getItem('crucigramaNivel');
        const intentosGuardados = localStorage.getItem('crucigramaIntentos');
        const modoDificilGuardado = localStorage.getItem('crucigramaModoDificil');
        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (intentosGuardados) setIntentos(parseInt(intentosGuardados, 10));
        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        
        cargarRankingGlobal();
    }, []);

    useEffect(() => {
        generarNuevoJuego();
    }, [nivel, modoDificil]);

    const generarNuevoJuego = () => {
        const cantidadAnimales = Math.min(2 + nivel, 6);
        const candidatos = [...listaAnimales]
            .filter(a => limpiarPalabra(a.diidxaza, modoDificil).length > 2)
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidadAnimales);

        const data = generarTableroCrucigrama(candidatos, modoDificil);
        setMatriz(data.matriz);
        setPlacements(data.placements);
        setRespuestasUsuario({});
        setPalabrasResueltas([]);
        setActivePlacement(null);
    };

    const abrirDialParaPalabra = (p) => {
        if (palabrasResueltas.includes(p.id)) return;
        setActivePlacement(p);
        const letrasMezcladas = p.text.split('').sort(() => Math.random() - 0.5);
        setDialSeleccion(letrasMezcladas);
        setLetrasElegidas([]);
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

    // --- EVENTOS DEL DIAL (Anti-Duplicados) ---
    const handleTouchStartNode = (index) => {
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

    const handleTouchMoveGlobal = (e) => {
        if (!isDragging || !dialRef.current) return;
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

    const limpiarDial = () => setLetrasElegidas([]);

    const verificarYAplicarPalabra = () => {
        if (!activePlacement) return;
        const palabraFormada = letrasElegidas.map(i => dialSeleccion[i]).join('');

        setIntentos(prev => prev + 1);

        if (palabraFormada === activePlacement.text) {
            const nuevasRespuestas = { ...respuestasUsuario };
            for (let i = 0; i < activePlacement.text.length; i++) {
                let pr = activePlacement.startY + (i * activePlacement.dirY);
                let pc = activePlacement.startX + (i * activePlacement.dirX);
                nuevasRespuestas[`${pr}-${pc}`] = activePlacement.text[i];
            }
            setRespuestasUsuario(nuevasRespuestas);

            if (!palabrasResueltas.includes(activePlacement.id)) {
                setPalabrasResueltas([...palabrasResueltas, activePlacement.id]);
            }

            setActivePlacement(null);
            setLetrasElegidas([]);
        } else {
            alert("⚠️ La palabra no es correcta. ¡Inténtalo de nuevo!");
            setLetrasElegidas([]);
        }
    };

    const guardarProgresoLocal = () => {
        localStorage.setItem('crucigramaNivel', nivel);
        localStorage.setItem('crucigramaIntentos', intentos);
        localStorage.setItem('crucigramaModoDificil', modoDificil);
        alert('Progreso guardado localmente.');
    };

    const reiniciarProgresoLocal = () => {
        localStorage.removeItem('crucigramaNivel');
        localStorage.removeItem('crucigramaIntentos');
        localStorage.removeItem('crucigramaModoDificil');
        setNivel(1);
        setIntentos(0);
        setModoDificil(false);
    };

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(collection(db, "ranking_crucigrama"), orderBy("level", "desc"), orderBy("intentos", "asc"), limit(10));
            const querySnapshot = await getDocs(q);
            const docs = [];
            querySnapshot.forEach((doc) => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            setRanking(docs);
        } catch (error) {
            console.error("Error al cargar ranking:", error);
        }
        setCargandoRanking(false);
    };

    const guardarPuntaje = async () => {
        if (!playerName.trim()) return;
        try {
            await addDoc(collection(db, "ranking_crucigrama"), {
                name: playerName,
                intentos: intentos,
                level: nivel,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
        } catch (error) {
            console.error("Error al guardar:", error);
        }
        
        reiniciarProgresoLocal();
        setIsGameOver(false);
        setPlayerName('');
    };

    const finalizarPartida = () => setIsGameOver(true);
    const siguienteNivel = () => setNivel(prev => prev + 1);

    const nivelCompletado = palabrasResueltas.length === placements.length && placements.length > 0;

    return (
        <div 
            className="max-w-4xl mx-auto px-3 py-4 flex flex-col items-center select-none w-full pb-[env(safe-area-inset-bottom)]"
            onMouseUp={handleMouseUpGlobal}
            onTouchEnd={handleMouseUpGlobal}
        >
            {isGameOver ? (
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-amber-200 text-center w-full max-w-xl mt-6">
                    <h2 className="text-2xl font-bold mb-4 text-amber-900">¡Partida Finalizada!</h2>
                    <p className="mb-4 text-amber-800">Llegaste al <strong>Nivel {nivel}</strong> con un total de <span className="font-bold text-red-600">{intentos}</span> intentos.</p>
                    <input type="text" placeholder="Escribe tu nombre" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="border-2 border-amber-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[16px]" />
                    <div className="flex gap-3 justify-center">
                        <button onClick={guardarPuntaje} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 font-bold shadow-md">Guardar Récord</button>
                        <button onClick={() => setIsGameOver(false)} className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900 font-bold">Cancelar</button>
                    </div>
                </div>
            ) : (
                <>
                    <header className="text-center mb-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-amber-950">✏️ Crucigrama Diidxazá</h2>
                        <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1">Nivel {nivel} • Intentos: {intentos}</p>
                    </header>

                    {/* BARRA DE CONTROL */}
                    <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-3 shadow-sm text-sm gap-2">
                        <div className="text-amber-950 font-semibold text-xs sm:text-sm">
                            <span className="text-amber-800 font-bold">Instrucción:</span> Toca una pista para resolver.
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            <button onClick={onBack} className="bg-amber-800 hover:bg-amber-900 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Menú Principal</button>
                            <button onClick={guardarProgresoLocal} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Guardar</button>
                            <button onClick={reiniciarProgresoLocal} className="bg-amber-950 hover:bg-black text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Reiniciar</button>
                            <button 
                                onClick={() => {
                                    const nuevoModo = !modoDificil;
                                    setModoDificil(nuevoModo);
                                    localStorage.setItem('crucigramaModoDificil', nuevoModo);
                                }} 
                                className={`font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors ${modoDificil ? 'bg-green-600 text-white' : 'bg-red-600 text-white underline decoration-white'}`}
                            >
                                {modoDificil ? 'Difícil ON' : 'Difícil OFF'}
                            </button>
                        </div>
                    </div>

                    {nivelCompletado && (
                        <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3 text-center animate-bounce">
                            <p className="text-lg sm:text-xl font-bold text-green-900 mb-2">🎉 ¡Excelente! Crucigrama Resuelto</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm">Siguiente Nivel</button>
                                <button onClick={finalizarPartida} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm">Terminar y Guardar</button>
                            </div>
                        </div>
                    )}

                    {/* CONTENEDOR PRINCIPAL: TABLERO + PISTAS */}
                    <div className="flex flex-col lg:flex-row gap-4 w-full max-w-5xl justify-center items-center lg:items-start mt-1">
                        
                        {/* TABLERO DEL CRUCIGRAMA OPTIMIZADO PARA MÓVILES */}
                        <div className="w-full lg:w-auto p-2 sm:p-4 bg-amber-100/50 border-2 border-amber-300 rounded-2xl shadow-inner overflow-x-auto custom-scrollbar flex justify-center">
                            <div className="flex justify-center min-w-max mx-auto">
                                <div 
                                    className="grid gap-0.5 sm:gap-1 p-1" 
                                    style={{ gridTemplateColumns: `repeat(${matriz[0]?.length || 1}, max-content)` }}
                                >
                                    {matriz.map((fila, r) => 
                                        fila.map((celda, c) => {
                                            if (celda.empty) {
                                                return <div key={`${r}-${c}`} className="w-7 h-7 sm:w-9 sm:h-9 md:w-[42px] md:h-[42px] bg-transparent"></div>;
                                            }

                                            const resuelta = celda.words.some(id => palabrasResueltas.includes(id));
                                            const letraGuardada = respuestasUsuario[`${r}-${c}`] || '';
                                            
                                            return (
                                                <div 
                                                    key={`${r}-${c}`} 
                                                    className={`relative w-7 h-7 sm:w-9 sm:h-9 md:w-[42px] md:h-[42px] flex items-center justify-center font-bold text-[12px] sm:text-[16px] md:text-xl uppercase border-2 rounded-md shadow-sm transition-all select-none
                                                        ${resuelta ? 'bg-green-500 text-white border-green-600' : letraGuardada ? 'bg-amber-50 text-amber-950 border-amber-500' : 'bg-white border-amber-400 text-amber-950'}
                                                    `}
                                                >
                                                    {celda.number && (
                                                        <span className="absolute top-0.5 left-0.5 sm:top-0.5 sm:left-1 text-[8px] sm:text-[9px] font-black text-amber-800 z-10 pointer-events-none">
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

                        {/* LISTA DE PISTAS LATERAL */}
                        <div className="w-full lg:w-80 flex flex-col gap-2.5">
                            <h3 className="font-bold text-amber-900 border-b-2 border-amber-200 pb-1 text-center lg:text-left text-sm sm:text-base">
                                📋 Pistas del Crucigrama
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full">
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
                                                    <p className="text-xs text-green-700 font-bold truncate">✅ {p.animal.diidxaza}</p>
                                                ) : (
                                                    <p className="text-[11px] text-amber-600 font-medium">Click aquí</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </>
            )}

            {/* MODAL DE DIAL CIRCULAR OPTIMIZADO */}
            {activePlacement && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-amber-300 w-full max-w-sm flex flex-col items-center animate-fade-in relative max-h-[95vh] overflow-y-auto custom-scrollbar">
                        
                        <button 
                            onClick={() => { setActivePlacement(null); setLetrasElegidas([]); }}
                            className="absolute top-3 right-4 sm:top-4 sm:right-5 text-gray-400 hover:text-gray-700 font-bold text-xl"
                        >
                            ✕
                        </button>

                        {/* IMAGEN DEL ANIMAL AMPLIADA */}
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-orange-100 rounded-2xl p-2.5 mb-2 border border-amber-200 flex items-center justify-center shadow-inner mt-2">
                            <img src={activePlacement.animal.image} alt={activePlacement.animal.spanish} className="max-w-full max-h-full object-contain drop-shadow-md" />
                        </div>
                        <h3 className="font-bold text-amber-950 text-lg mb-0.5 text-center leading-tight">{activePlacement.animal.spanish}</h3>
                        <p className="text-[11px] sm:text-xs text-amber-800 mb-2 font-medium text-center">Arrastra el dedo sobre las letras</p>

                        {/* SLOTS DE RESPUESTA SÚPER JUNTOS Y COMPACTOS EN MÓVIL Y ESCRITORIO */}
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
                            onTouchMove={handleTouchMoveGlobal}
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
                                        onTouchStart={(e) => {
                                            e.preventDefault();
                                            handleTouchStartNode(index);
                                        }}
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
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2 rounded-xl text-sm shadow-sm transition-colors border border-amber-300"
                            >
                                Borrar
                            </button>
                            <button 
                                onClick={verificarYAplicarPalabra}
                                disabled={letrasElegidas.length === 0}
                                className={`flex-1 font-bold py-2 rounded-xl text-sm shadow-md transition-all ${letrasElegidas.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                                Comprobar
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {!isGameOver && (
                <div className="mt-10 w-full max-w-md px-2">
                    <h3 className="font-bold text-amber-900 text-center mb-2.5 text-lg">🏆 Ranking - Crucigrama</h3>
                    <div className="bg-white rounded-xl p-3 shadow-md border border-amber-200">
                        {cargandoRanking ? (
                            <p className="text-center text-sm text-gray-500 py-2">Cargando puntajes globales...</p>
                        ) : ranking.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-2">Aún no hay scores en la nube. ¡Sé el primero!</p>
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
            )}
        </div>
    );
}