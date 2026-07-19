import React, { useState, useEffect, useRef } from 'react';
import { listaAnimales } from '../data/animales.js';

// RUTA CORREGIDA SEGÚN TU CONFIGURACIÓN
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const LETRAS_RELLENO = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'T', 'U', 'X', 'Y', 'Z'];

// Función auxiliar para limpiar la palabra (sin acentos, sin saltillos, en mayúsculas)
const limpiarPalabra = (texto) => {
    return texto
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^A-Z]/g, "");        
};

export default function SopaLetras() {
    const [nivel, setNivel] = useState(1);
    const [intentos, setIntentos] = useState(0); 
    const [matriz, setMatriz] = useState([]);
    const [animalesObjetivo, setAnimalesObjetivo] = useState([]);
    const [palabrasEncontradas, setPalabrasEncontradas] = useState([]);
    
    // Mapeo para guardar las coordenadas exactas de cada animal en el tablero
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

    // El tamaño de la cuadrícula crece progresivamente con el nivel (Mínimo 6, Máximo 12)
    const tamanoActual = Math.min(5 + nivel, 12); 

    // 1. CARGAR PROGRESO Y RANKING AL INICIAR
    useEffect(() => {
        const nivelGuardado = localStorage.getItem('sopaLetrasNivel');
        const intentosGuardados = localStorage.getItem('sopaLetrasIntentos');
        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (intentosGuardados) setIntentos(parseInt(intentosGuardados, 10));
        
        cargarRankingGlobal();
    }, []);

    // 2. GENERACIÓN DEL TABLERO AL CAMBIAR DE NIVEL
    useEffect(() => {
        generarNuevoJuego();
    }, [nivel]);

    const generarNuevoJuego = () => {
        // Seleccionamos animales que quepan en la cuadrícula actual
        const candidatos = [...listaAnimales]
            .filter(a => limpiarPalabra(a.diidxaza).length <= tamanoActual && limpiarPalabra(a.diidxaza).length > 1)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);

        let nuevaMatriz = Array(tamanoActual).fill(null).map(() => Array(tamanoActual).fill(''));
        let nuevoMapaCoords = {};

        candidatos.forEach((animal) => {
            const palabraLimpia = limpiarPalabra(animal.diidxaza);
            let colocada = false;
            let intentosColocacion = 0;
            // Direcciones permitidas: Horizontal (H), Vertical (V) y Diagonales (D1, D2)
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
                    // Diagonal Abajo-Derecha
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
                    // Diagonal Arriba-Derecha
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
                }
            }
        });

        // Rellenar espacios vacíos
        for (let r = 0; r < tamanoActual; r++) {
            for (let c = 0; c < tamanoActual; c++) {
                if (nuevaMatriz[r][c] === '') {
                    nuevaMatriz[r][c] = LETRAS_RELLENO[Math.floor(Math.random() * LETRAS_RELLENO.length)];
                }
            }
        }

        setMatriz(nuevaMatriz);
        setAnimalesObjetivo(candidatos);
        setAnimalesCoords(nuevoMapaCoords);
        setPalabrasEncontradas([]);
        setCeldasSeleccionadas([]);
    };

    // Función para saber si una celda pertenece a una palabra ya encontrada
    const isCellMatched = (r, c) => {
        return palabrasEncontradas.some(animalId => {
            const celdasAnimal = animalesCoords[animalId] || [];
            return celdasAnimal.some(cell => cell.r === r && cell.c === c);
        });
    };

    // 3. CÁLCULO DE LA SELECCIÓN (INCLUYE HORIZONTAL, VERTICAL Y DIAGONAL)
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
            // Horizontal
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC; c <= maxC; c++) celdas.push({ r: r1, c });
        } else if (deltaC === 0) { 
            // Vertical
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR; r <= maxR; r++) celdas.push({ r, c: c1 });
        } else if (Math.abs(deltaR) === Math.abs(deltaC)) { 
            // Diagonal
            const steps = Math.abs(deltaR);
            const stepR = deltaR > 0 ? 1 : -1;
            const stepC = deltaC > 0 ? 1 : -1;
            for (let i = 0; i <= steps; i++) {
                celdas.push({ r: r1 + i * stepR, c: c1 + i * stepC });
            }
        }
        
        setCeldasSeleccionadas(celdas);
    }, [startCell, currentCell]);

    // 4. CONTROLADORES MOUSE & TOUCH
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
        setIsSelecting(true);
        setStartCell({ r, c });
        setCurrentCell({ r, c });
    };

    const handleTouchMove = (e) => {
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

    // 5. VALIDACIÓN DE PALABRA
    const verificarSeleccion = () => {
        if (celdasSeleccionadas.length === 0) return;

        setIntentos(prev => prev + 1); 

        let textoSeleccionado = celdasSeleccionadas.map(cell => matriz[cell.r][cell.c]).join('');
        let textoInvertido = [...textoSeleccionado].reverse().join('');

        const animalEncontrado = animalesObjetivo.find(animal => {
            const palabraLimpia = limpiarPalabra(animal.diidxaza);
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

    // 6. FUNCIONES DE PROGRESO Y RANKING
    const guardarProgresoLocal = () => {
        localStorage.setItem('sopaLetrasNivel', nivel);
        localStorage.setItem('sopaLetrasIntentos', intentos);
        alert('Progreso guardado localmente.');
    };

    const reiniciarProgresoLocal = () => {
        localStorage.removeItem('sopaLetrasNivel');
        localStorage.removeItem('sopaLetrasIntentos');
        setNivel(1);
        setIntentos(0);
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center select-none"
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
                        className="border-2 border-amber-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-3 justify-center">
                        <button onClick={guardarPuntaje} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 font-bold shadow-md">
                            Guardar Récord
                        </button>
                        <button onClick={() => setIsGameOver(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-bold">
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <header className="text-center mb-4">
                        <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-2 max-w-full h-auto drop-shadow-sm" />
                        <h2 className="text-3xl font-bold text-amber-950">🔎 Sopa de Letras</h2>
                        <p className="text-sm text-amber-800 font-medium mt-1">Nivel {nivel} • Intentos: {intentos}</p>
                    </header>

                    {/* BARRA DE CONTROL LOCAL */}
                    <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 shadow-sm text-sm">
                        <div className="text-amber-950 font-semibold">
                            <span className="text-amber-800 font-bold">Cuadrícula:</span> {tamanoActual}x{tamanoActual}
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <button onClick={guardarProgresoLocal} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1 rounded-lg shadow-sm">
                                Guardar Progreso
                            </button>
                            <button onClick={reiniciarProgresoLocal} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-lg shadow-sm">
                                Reiniciar
                            </button>
                        </div>
                    </div>

                    {/* AVISO DE NIVEL COMPLETADO */}
                    {palabrasEncontradas.length === animalesObjetivo.length && animalesObjetivo.length > 0 && (
                        <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-4 text-center animate-bounce">
                            <p className="text-xl font-bold text-green-900 mb-2">🎉 ¡Excelente! Encontraste todos</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                                    Siguiente Nivel
                                </button>
                                <button onClick={finalizarPartida} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                                    Terminar y Guardar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-3xl flex flex-col md:flex-row gap-6 items-center md:items-start justify-center mt-2">
                        {/* MATRIZ DINÁMICA DE LA SOPA DE LETRAS */}
                        <div 
                            ref={gridRef}
                            onTouchMove={handleTouchMove}
                            className="grid gap-1 p-2 bg-amber-100 border-2 border-amber-300 rounded-2xl shadow-xl w-full max-w-[380px] sm:max-w-[420px] aspect-square auto-rows-fr"
                            style={{ gridTemplateColumns: `repeat(${tamanoActual}, minmax(0, 1fr))` }}
                        >
                            {matriz.map((fila, r) => 
                                fila.map((letra, c) => {
                                    const isHighlighted = celdasSeleccionadas.some(cell => cell.r === r && cell.c === c);
                                    const matched = isCellMatched(r, c);
                                    
                                    // Definición de colores según el estado de la celda
                                    let estiloCelda = 'bg-white hover:bg-amber-50 border border-amber-200/60 text-amber-950';
                                    if (matched) {
                                        estiloCelda = 'bg-green-500 text-white font-bold shadow-sm scale-100 border-green-600';
                                    } else if (isHighlighted) {
                                        estiloCelda = 'bg-orange-400 text-white scale-95 shadow-inner font-bold';
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