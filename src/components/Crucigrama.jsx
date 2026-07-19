import React, { useState, useEffect } from 'react';
import { listaAnimales } from '../data/animales.js';

import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const limpiarPalabra = (texto) => {
    return texto
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^A-Z]/g, "");        
};

// --- ALGORITMO GENERADOR DE CRUCIGRAMAS ---
const generarTableroCrucigrama = (candidatos) => {
    let grid = {}; // Almacena las celdas ocupadas por 'x,y'
    let placements = []; // Almacena la info de las palabras colocadas
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
        const text = limpiarPalabra(animal.diidxaza);
        if (index === 0) {
            addPlacement(animal, text, 0, 0, 1, 0, numberCounter++);
            return;
        }

        let placed = false;
        // Intentar cruzar con palabras ya colocadas
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

        // Si no pudo cruzar, la coloca debajo de todo
        if (!placed) {
            addPlacement(animal, text, minX, maxY + 2, 1, 0, numberCounter++);
        }
    });

    // Traducir coordenadas a una Matriz Positiva 2D
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


export default function Crucigrama() {
    const [nivel, setNivel] = useState(1);
    const [intentos, setIntentos] = useState(0);
    const [placements, setPlacements] = useState([]);
    const [matriz, setMatriz] = useState([]);
    
    // Almacena las letras ingresadas: clave "r-c" (fila-columna)
    const [respuestasUsuario, setRespuestasUsuario] = useState({});
    const [palabrasResueltas, setPalabrasResueltas] = useState([]);

    const [isGameOver, setIsGameOver] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);

    useEffect(() => {
        const nivelGuardado = localStorage.getItem('crucigramaNivel');
        const intentosGuardados = localStorage.getItem('crucigramaIntentos');
        if (nivelGuardado) setNivel(parseInt(nivelGuardado, 10));
        if (intentosGuardados) setIntentos(parseInt(intentosGuardados, 10));
        
        cargarRankingGlobal();
    }, []);

    useEffect(() => {
        generarNuevoJuego();
    }, [nivel]);

    const generarNuevoJuego = () => {
        const cantidadAnimales = Math.min(2 + nivel, 6);
        const candidatos = [...listaAnimales]
            .filter(a => limpiarPalabra(a.diidxaza).length > 2)
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidadAnimales);

        const data = generarTableroCrucigrama(candidatos);
        setMatriz(data.matriz);
        setPlacements(data.placements);
        setRespuestasUsuario({});
        setPalabrasResueltas([]);
    };

    const handleInputChange = (r, c, valor) => {
        const letraMayus = valor.toUpperCase().slice(-1);
        const key = `${r}-${c}`;
        
        const nuevasRespuestas = { ...respuestasUsuario, [key]: letraMayus };
        setRespuestasUsuario(nuevasRespuestas);
        setIntentos(prev => prev + 1);

        // Verificar automáticamente si se completó alguna palabra
        let nuevasResueltas = [...palabrasResueltas];
        placements.forEach(p => {
            if (nuevasResueltas.includes(p.id)) return;

            let palabraFormada = "";
            for (let i = 0; i < p.text.length; i++) {
                let pr = p.startY + (i * p.dirY);
                let pc = p.startX + (i * p.dirX);
                palabraFormada += (nuevasRespuestas[`${pr}-${pc}`] || "");
            }

            if (palabraFormada === p.text) {
                nuevasResueltas.push(p.id);
            }
        });

        if (nuevasResueltas.length !== palabrasResueltas.length) {
            setPalabrasResueltas(nuevasResueltas);
        }
    };

    const guardarProgresoLocal = () => {
        localStorage.setItem('crucigramaNivel', nivel);
        localStorage.setItem('crucigramaIntentos', intentos);
        alert('Progreso guardado localmente.');
    };

    const reiniciarProgresoLocal = () => {
        localStorage.removeItem('crucigramaNivel');
        localStorage.removeItem('crucigramaIntentos');
        setNivel(1);
        setIntentos(0);
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
        <div className="max-w-4xl mx-auto px-2 py-4 flex flex-col items-center select-none w-full">
            {isGameOver ? (
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-amber-200 text-center w-full max-w-xl mt-10">
                    <h2 className="text-2xl font-bold mb-4 text-amber-900">¡Partida Finalizada!</h2>
                    <p className="mb-4 text-amber-800">Llegaste al <strong>Nivel {nivel}</strong> con un total de <span className="font-bold text-red-600">{intentos}</span> teclas presionadas.</p>
                    <input type="text" placeholder="Escribe tu nombre" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="border-2 border-amber-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <div className="flex gap-3 justify-center">
                        <button onClick={guardarPuntaje} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 font-bold shadow-md">Guardar Récord</button>
                        <button onClick={() => setIsGameOver(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-bold">Cancelar</button>
                    </div>
                </div>
            ) : (
                <>
                    <header className="text-center mb-4">
                        <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-2 max-w-full h-auto drop-shadow-sm" />
                        <h2 className="text-3xl font-bold text-amber-950">✏️ Crucigrama Diidxazá</h2>
                        <p className="text-sm text-amber-800 font-medium mt-1">Nivel {nivel} • Teclas: {intentos}</p>
                    </header>

                    <div className="w-full max-w-2xl flex flex-wrap justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 shadow-sm text-sm">
                        <div className="text-amber-950 font-semibold">
                            <span className="text-amber-800 font-bold">Reto:</span> Rellena las casillas
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <button onClick={guardarProgresoLocal} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1 rounded-lg shadow-sm">Guardar Progreso</button>
                            <button onClick={reiniciarProgresoLocal} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-lg shadow-sm">Reiniciar</button>
                        </div>
                    </div>

                    {nivelCompletado && (
                        <div className="w-full max-w-2xl bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-4 text-center animate-bounce">
                            <p className="text-xl font-bold text-green-900 mb-2">🎉 ¡Excelente! Crucigrama Resuelto</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={siguienteNivel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">Siguiente Nivel</button>
                                <button onClick={finalizarPartida} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">Terminar y Guardar</button>
                            </div>
                        </div>
                    )}

                    {/* CONTENEDOR PRINCIPAL: TABLERO + PISTAS */}
                    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl justify-center items-start mt-2">
                        
                        {/* TABLERO DEL CRUCIGRAMA */}
                        <div className="overflow-x-auto w-full lg:w-auto p-4 bg-amber-100/50 border-2 border-amber-300 rounded-2xl shadow-inner flex justify-center">
                            <div 
                                className="grid gap-1 p-2" 
                                style={{ gridTemplateColumns: `repeat(${matriz[0]?.length || 1}, minmax(32px, 40px))` }}
                            >
                                {matriz.map((fila, r) => 
                                    fila.map((celda, c) => {
                                        if (celda.empty) {
                                            return <div key={`${r}-${c}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-transparent"></div>;
                                        }

                                        // Si las palabras que cruzan aquí ya se resolvieron, pintar verde
                                        const resuelta = celda.words.some(id => palabrasResueltas.includes(id));
                                        
                                        return (
                                            <div key={`${r}-${c}`} className="relative w-8 h-8 sm:w-10 sm:h-10">
                                                {/* Número de pista en la esquina */}
                                                {celda.number && (
                                                    <span className="absolute top-0 left-1 text-[9px] font-black text-amber-800 z-10 pointer-events-none">
                                                        {celda.number}
                                                    </span>
                                                )}
                                                <input
                                                    type="text"
                                                    maxLength={1}
                                                    value={respuestasUsuario[`${r}-${c}`] || ''}
                                                    onChange={(e) => handleInputChange(r, c, e.target.value)}
                                                    disabled={resuelta}
                                                    className={`w-full h-full text-center font-bold text-lg sm:text-xl uppercase border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md shadow-sm transition-all
                                                        ${resuelta ? 'bg-green-500 text-white border-green-600' : 'bg-white border-amber-400 text-amber-950'}
                                                    `}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* LISTA DE PISTAS LATERAL */}
                        <div className="w-full lg:w-80 flex flex-col gap-3">
                            <h3 className="font-bold text-amber-900 border-b-2 border-amber-200 pb-1 text-center lg:text-left">
                                📋 Pistas del Crucigrama
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                {placements.map((p) => {
                                    const resuelto = palabrasResueltas.includes(p.id);
                                    const direccion = p.dirX === 1 ? "Horizontal" : "Vertical";

                                    return (
                                        <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all shadow-sm bg-white ${resuelto ? 'border-green-400 bg-green-50/60 opacity-70' : 'border-amber-200'}`}>
                                            <div className="w-12 h-12 bg-orange-100/50 rounded-lg overflow-hidden flex items-center justify-center border border-amber-100 flex-shrink-0 relative">
                                                <span className="absolute top-0.5 left-1 text-[10px] font-black text-amber-700 bg-white/70 px-1 rounded">{p.number}</span>
                                                <img src={p.animal.image} alt={p.animal.spanish} className="max-w-[80%] max-h-[80%] object-contain" onError={(e) => { e.target.src = "🐾"; }} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{direccion}</p>
                                                <p className="text-sm font-bold text-amber-950">
                                                    {p.animal.spanish}
                                                </p>
                                                {resuelto && <p className="text-xs text-green-700 font-bold mt-0.5">✅ {p.animal.diidxaza}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </>
            )}

            {!isGameOver && (
                <div className="mt-12 w-full max-w-md">
                    <h3 className="font-bold text-amber-900 text-center mb-3 text-xl">🏆 Ranking - Crucigrama</h3>
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
                                    <span className="font-bold text-amber-900">{r.intentos} teclas</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}