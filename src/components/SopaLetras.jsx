import React, { useState, useEffect, useRef } from 'react';
import { listaAnimales } from '../data/animales.js';

import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const LETRAS_RELLENO = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'T', 'U', 'X', 'Y', 'Z'];

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

export default function SopaLetras({ onBack }) {
    const [nivel, setNivel] = useState(1);
    const [intentos, setIntentos] = useState(0); 
    const [matriz, setMatriz] = useState([]);
    const [animalesObjetivo, setAnimalesObjetivo] = useState([]);
    const [palabrasEncontradas, setPalabrasEncontradas] = useState([]);
    const [modoDificil, setModoDificil] = useState(false);
    
    const [animalesCoords, setAnimalesCoords] = useState({});

    // Estados del Arrastre
    const [isSelecting, setIsSelecting] = useState(false);
    const [startCell, setStartCell] = useState(null);
    const [currentCell, setCurrentCell] = useState(null);
    const [celdasSeleccionadas, setCeldasSeleccionadas] = useState([]);

    // Estados del Ranking y Fin de Partida
    const [isGameOver, setIsGameOver] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);

    const gridRef = useRef(null);

    // Tamaño dinámico de la cuadrícula
    const tamanoActual = Math.min(5 + nivel, 12); 
    // Número progresivo de palabras por nivel (mínimo 4 en Nivel 1, incrementa 1 por nivel hasta 8)
    const cantidadPalabras = Math.min(3 + nivel, 8); 

    useEffect(() => {
        const nivelGuardado = localStorage.getItem('sopaLetrasNivel');
        const intentosGuardados = localStorage.getItem('sopaLetrasIntentos');
        const modoDificilGuardado = localStorage.getItem('sopaLetrasModoDificil');
        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (intentosGuardados) setIntentos(parseInt(intentosGuardados, 10));
        if (modoDificilGuardado) setModoDificil(modoDificilGuardado === 'true');
        
        cargarRankingGlobal();
    }, []);

    useEffect(() => {
        generarNuevoJuego();
    }, [nivel, modoDificil]);

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

    const handleTouchStart = (e, r, c) => {
        e.preventDefault();
        setIsSelecting(true);
        setStartCell({ r, c });
        setCurrentCell({ r, c });
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (!isSelecting) return;
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.dataset && el.dataset.row !== undefined) {
            const r = parseInt(el.dataset.row, 10);
            const c = parseInt(el.dataset.col, 10);
            if (currentCell && currentCell.r === r && currentCell.c === c) return;
            setCurrentCell({ r, c });
        }
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
        }

        setStartCell(null);
        setCurrentCell(null);
        setCeldasSeleccionadas([]);
    };

    const guardarProgresoLocal = () => {
        localStorage.setItem('sopaLetrasNivel', nivel);
        localStorage.setItem('sopaLetrasIntentos', intentos);
        localStorage.setItem('sopaLetrasModoDificil', modoDificil);
        alert('Progreso guardado localmente.');
    };

    const reiniciarProgresoLocal = () => {
        localStorage.removeItem('sopaLetrasNivel');
        localStorage.removeItem('sopaLetrasIntentos');
        localStorage.removeItem('sopaLetrasModoDificil');
        setNivel(1);
        setIntentos(0);
        setModoDificil(false);
    };

    const cargarRankingGlobal = async () => {
        setCargandoRanking(true);
        try {
            const q = query(collection(db, "ranking_sopa"), orderBy("level", "desc"), orderBy("intentos", "asc"), limit(10));
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
            await addDoc(collection(db, "ranking_sopa"), {
                name: playerName,
                intentos: intentos,
                level: nivel,
                fecha: new Date().toISOString()
            });
            await cargarRankingGlobal();
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
        }
        
        reiniciarProgresoLocal();
        setIsGameOver(false);
        setPlayerName('');
    };

    const finalizarPartida = () => setIsGameOver(true);
    const siguienteNivel = () => setNivel(prev => prev + 1);

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center select-none pb-[env(safe-area-inset-bottom)]"
             onMouseUp={handleMouseUp}
             onTouchEnd={handleMouseUp}
        >
            {isGameOver ? (
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-amber-200 text-center w-full max-w-xl mt-10">
                    <h2 className="text-2xl font-bold mb-4 text-amber-900">¡Partida Finalizada!</h2>
                    <p className="mb-4 text-amber-800">Lograste llegar al <strong>Nivel {nivel}</strong> con un total de <span className="font-bold text-red-600">{intentos}</span> intentos.</p>
                    <input
                        type="text"
                        placeholder="Escribe tu nombre"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="border-2 border-amber-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[16px]"
                    />
                    <div className="flex gap-3 justify-center">
                        <button onClick={guardarPuntaje} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 font-bold shadow-md">
                            Guardar Récord
                        </button>
                        <button onClick={() => setIsGameOver(false)} className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900 font-bold">
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <header className="text-center mb-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-amber-950">🔎 Sopa de Letras</h2>
                        <p className="text-xs sm:text-sm text-amber-800 font-medium mt-1">Nivel {nivel} • Intentos: {intentos}</p>
                    </header>

                    {/* BARRA DE CONTROL LOCAL CON COLORES ARMONIZADOS */}
                    <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-3 shadow-sm text-sm gap-2">
                        <div className="text-amber-950 font-semibold text-xs sm:text-sm">
                            <span className="text-amber-800 font-bold">Cuadrícula:</span> {tamanoActual}x{tamanoActual}
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            <button 
                                onClick={onBack} 
                                className="bg-amber-800 hover:bg-amber-900 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors"
                            >
                                Menú
                            </button>
                            <button onClick={guardarProgresoLocal} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Guardar</button>
                            <button onClick={reiniciarProgresoLocal} className="bg-amber-950 hover:bg-black text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">Reiniciar</button>
                            <button 
                                onClick={() => {
                                    const nuevoModo = !modoDificil;
                                    setModoDificil(nuevoModo);
                                    localStorage.setItem('sopaLetrasModoDificil', nuevoModo);
                                }} 
                                className={`font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors ${modoDificil ? 'bg-green-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700 underline border border-red-300'}`}
                            >
                                {modoDificil ? 'Difícil ON' : 'Difícil OFF'}
                            </button>
                        </div>
                    </div>

                    {/* AVISO DE NIVEL COMPLETADO */}
                    {palabrasEncontradas.length === animalesObjetivo.length && animalesObjetivo.length > 0 && (
                        <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3 text-center animate-bounce">
                            <p className="text-lg sm:text-xl font-bold text-green-900 mb-2">🎉 ¡Excelente! Encontraste todos</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm">
                                    Siguiente Nivel
                                </button>
                                <button onClick={finalizarPartida} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm">
                                    Terminar y Guardar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-3xl flex flex-col md:flex-row gap-6 items-center md:items-start justify-center mt-2">
                        {/* MATRIZ DINÁMICA DE LA SOPA DE LETRAS CON TOUCH-NONE */}
                        <div 
                            ref={gridRef}
                            onTouchMove={handleTouchMove}
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
                                            onTouchStart={(e) => handleTouchStart(e, r, c)}
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
                </>
            )}

            {/* TABLA DE RANKING GLOBAL */}
            {!isGameOver && (
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
            )}
        </div>
    );
}