import React, { useEffect, useMemo, useState } from 'react';
import Icono from '../Icono.jsx';
import AdminConfirmacion from './AdminConfirmacion.jsx';
import { generarCSV, descargarArchivo } from '../../utils/csv.js';
import { esAnomaliaRanking as esAnomalia } from '../../utils/adminHelpers.js';
import {
    JUEGOS_RANKING,
    cargarRankingAdmin,
    cargarTodoRankingAdmin,
    eliminarRegistroRanking,
    renombrarRegistroRanking,
} from '../../services/admin/adminRankings.js';

const fechaHoy = () => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

const formatearFecha = (valor) => {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const metricas = (registro, juego) => {
    if (juego === 'reto') {
        return `${registro.aciertos ?? 0}/${registro.total ?? 5} aciertos · Racha ${registro.racha ?? 0}`;
    }
    if (juego === 'memorama') {
        return `Nivel ${registro.level ?? registro.nivel ?? '—'} · ${registro.score ?? 0} puntos · ${registro.turnos ?? registro.turns ?? 0} turnos`;
    }
    if (juego === 'trivia') {
        return `Nivel ${registro.level ?? registro.nivel ?? '—'} · ${registro.errores ?? 0} errores`;
    }
    return `Nivel ${registro.level ?? registro.nivel ?? '—'} · ${registro.intentos ?? 0} intentos`;
};

const nombreRegistro = (registro) => registro.name || registro.nombre || 'Anónimo';

export default function AdminRankings({ user, onToast }) {
    const [juego, setJuego] = useState('memorama');
    const [fecha, setFecha] = useState(fechaHoy());
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [soloAnomalias, setSoloAnomalias] = useState(false);
    const [ultimo, setUltimo] = useState(null);
    const [hayMas, setHayMas] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [exportandoTodo, setExportandoTodo] = useState(false);
    const [porEliminar, setPorEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [porRenombrar, setPorRenombrar] = useState(null);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [renombrando, setRenombrando] = useState(false);

    const cargar = async () => {
        if (juego === 'reto' && !fecha) {
            onToast?.('Selecciona una fecha para el Reto Diario.', 'error');
            return;
        }
        setCargando(true);
        setError(false);
        try {
            const pagina = await cargarRankingAdmin({ juego, fecha, limite: 100 });
            setRegistros(pagina.registros);
            setUltimo(pagina.ultimo);
            setHayMas(pagina.hayMas);
        } catch (err) {
            console.error('No se pudo cargar el ranking:', err);
            setError(true);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        setBusqueda('');
        setSoloAnomalias(false);
        cargar();
    }, [juego, fecha]);

    const cargarMas = async () => {
        if (!ultimo || cargandoMas) return;
        setCargandoMas(true);
        try {
            const pagina = await cargarRankingAdmin({ juego, fecha, limite: 100, despues: ultimo });
            setRegistros((actual) => [...actual, ...pagina.registros]);
            setUltimo(pagina.ultimo);
            setHayMas(pagina.hayMas);
        } catch (err) {
            console.error('No se pudo cargar más del ranking:', err);
            onToast?.('No se pudo cargar más registros.', 'error');
        } finally {
            setCargandoMas(false);
        }
    };

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return registros.filter((registro) => {
            if (soloAnomalias && !esAnomalia(registro, juego)) return false;
            if (!texto) return true;
            return `${registro.name || ''} ${registro.nombre || ''} ${registro.id || ''}`.toLowerCase().includes(texto);
        });
    }, [registros, busqueda, soloAnomalias, juego]);

    const anomalias = useMemo(
        () => registros.filter((registro) => esAnomalia(registro, juego)).length,
        [registros, juego]
    );

    const exportarFilas = (filas, sufijo = '') => {
        const columnas = [
            { titulo: 'Posición', valor: (_registro, indice) => indice + 1 },
            { titulo: 'Nombre', valor: (registro) => nombreRegistro(registro) },
            { titulo: 'UID', valor: (registro) => registro.id || '' },
        ];

        if (juego === 'reto') {
            columnas.push(
                { titulo: 'Aciertos', valor: (registro) => registro.aciertos ?? 0 },
                { titulo: 'Total', valor: (registro) => registro.total ?? 5 },
                { titulo: 'Racha', valor: (registro) => registro.racha ?? 0 },
                { titulo: 'Fecha', valor: (registro) => formatearFecha(registro.completadoEn) }
            );
        } else if (juego === 'memorama') {
            columnas.push(
                { titulo: 'Nivel', valor: (registro) => registro.level ?? registro.nivel ?? '' },
                { titulo: 'Puntos', valor: (registro) => registro.score ?? 0 },
                { titulo: 'Turnos', valor: (registro) => registro.turnos ?? registro.turns ?? 0 }
            );
        } else if (juego === 'trivia') {
            columnas.push(
                { titulo: 'Nivel', valor: (registro) => registro.level ?? registro.nivel ?? '' },
                { titulo: 'Errores', valor: (registro) => registro.errores ?? 0 }
            );
        } else {
            columnas.push(
                { titulo: 'Nivel', valor: (registro) => registro.level ?? registro.nivel ?? '' },
                { titulo: 'Intentos', valor: (registro) => registro.intentos ?? 0 }
            );
        }

        columnas.push({ titulo: 'Anomalía', valor: (registro) => (esAnomalia(registro, juego) ? 'Sí' : 'No') });

        const filasConIndice = filas.map((registro, indice) => ({ ...registro, _indice: indice }));
        const csv = generarCSV(filasConIndice, columnas.map((columna) => ({
            ...columna,
            valor: (fila) => (columna.titulo === 'Posición' ? fila._indice + 1 : columna.valor(fila)),
        })));

        descargarArchivo(`ranking-${juego}-${juego === 'reto' ? fecha : 'global'}${sufijo}.csv`, csv);
    };

    const exportar = () => {
        if (filtrados.length === 0) {
            onToast?.('No hay registros para exportar.', 'info');
            return;
        }
        exportarFilas(filtrados);
        onToast?.('CSV del ranking generado.', 'exito');
    };

    const exportarTodo = async () => {
        setExportandoTodo(true);
        try {
            const todos = await cargarTodoRankingAdmin({ juego, fecha });
            if (todos.length === 0) {
                onToast?.('No hay registros para exportar.', 'info');
                return;
            }
            exportarFilas(todos, '-completo');
            onToast?.(`Se exportaron ${todos.length} registros.`, 'exito');
        } catch (err) {
            console.error('No se pudo exportar todo el ranking:', err);
            onToast?.('No se pudo exportar el ranking completo.', 'error');
        } finally {
            setExportandoTodo(false);
        }
    };

    const pedirRenombrar = (registro) => {
        setPorRenombrar(registro);
        setNuevoNombre(nombreRegistro(registro));
    };

    const confirmarRenombrar = async () => {
        if (!porRenombrar) return;
        setRenombrando(true);
        try {
            await renombrarRegistroRanking({
                juego,
                fecha,
                id: porRenombrar.id,
                nuevoNombre,
                nombreAnterior: nombreRegistro(porRenombrar),
                actor: user,
            });
            onToast?.('Nombre actualizado.', 'exito');
            setPorRenombrar(null);
            setNuevoNombre('');
            await cargar();
        } catch (err) {
            console.error('No se pudo renombrar el registro:', err);
            onToast?.('No se pudo renombrar el registro.', 'error');
        } finally {
            setRenombrando(false);
        }
    };

    const confirmarEliminar = async () => {
        if (!porEliminar) return;
        setEliminando(true);
        try {
            await eliminarRegistroRanking({
                juego,
                fecha,
                id: porEliminar.id,
                nombre: porEliminar.name || porEliminar.nombre,
                actor: user,
            });
            onToast?.('Registro eliminado.', 'exito');
            setPorEliminar(null);
            await cargar();
        } catch (err) {
            console.error('No se pudo eliminar el registro:', err);
            onToast?.('No se pudo eliminar el registro.', 'error');
        } finally {
            setEliminando(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                        <Icono nombre="trophy" className="w-5 h-5 text-amber-700" /> Rankings
                    </h2>
                    <p className="text-[11px] text-amber-700 font-medium">
                        {registros.length} cargados · {filtrados.length} visibles · {anomalias} anomalías
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={exportar} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Icono nombre="clipboard" className="w-4 h-4" /> CSV
                    </button>
                    <button type="button" onClick={exportarTodo} disabled={exportandoTodo} className="bg-amber-100 hover:bg-amber-200 disabled:opacity-60 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Icono nombre="clipboard" className="w-4 h-4" /> {exportandoTodo ? 'Exportando…' : 'Todo'}
                    </button>
                    <button type="button" onClick={cargar} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Icono nombre="refresh" className="w-4 h-4" /> Actualizar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-amber-200 p-3 shadow-sm flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {JUEGOS_RANKING.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setJuego(item.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                juego === item.id
                                    ? 'bg-amber-700 text-white border-amber-800'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            {item.nombre}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
                    <label className="relative">
                        <span className="sr-only">Buscar en el ranking</span>
                        <Icono nombre="search" className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(evento) => setBusqueda(evento.target.value)}
                            placeholder="Buscar por nombre o UID"
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                        />
                    </label>

                    {juego === 'reto' && (
                        <input
                            type="date"
                            value={fecha}
                            onChange={(evento) => setFecha(evento.target.value)}
                            aria-label="Fecha del Reto Diario"
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                        />
                    )}
                </div>

                <label className="flex items-center gap-2 text-[11px] font-bold text-amber-900 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={soloAnomalias}
                        onChange={(evento) => setSoloAnomalias(evento.target.checked)}
                    />
                    Mostrar solo anomalías (puntajes, niveles o datos fuera de rango)
                </label>
            </div>

            {cargando ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((indice) => <div key={indice} className="h-16 bg-amber-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold text-red-800">No se pudo cargar el ranking.</p>
                    <button type="button" onClick={cargar} className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">Reintentar</button>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                    <Icono nombre="trophy" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-900">No hay registros para este juego y fecha.</p>
                </div>
            ) : (
                <ol className="space-y-1.5">
                    {filtrados.map((registro, indice) => (
                        <li key={registro.id} className="bg-white rounded-xl border border-amber-200 px-3 py-2 shadow-sm flex items-center gap-2">
                            <span className="w-7 text-center text-xs font-black text-amber-700">{indice + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-amber-950 truncate flex items-center gap-1.5">
                                    {nombreRegistro(registro)}
                                    {esAnomalia(registro, juego) && (
                                        <span className="text-[9px] font-black uppercase bg-orange-100 text-orange-800 border border-orange-200 rounded-full px-1.5 py-0.5">
                                            Anomalía
                                        </span>
                                    )}
                                </p>
                                <p className="text-[10px] font-medium text-amber-700">{metricas(registro, juego)}</p>
                                <p className="text-[10px] text-amber-700 truncate">{registro.id}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => pedirRenombrar(registro)}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg px-2 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <Icono nombre="pencil" className="w-3 h-3" /> Renombrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPorEliminar(registro)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg px-2 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <Icono nombre="trash" className="w-3 h-3" /> Borrar
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {!cargando && !error && hayMas && !soloAnomalias && !busqueda && (
                <button
                    type="button"
                    onClick={cargarMas}
                    disabled={cargandoMas}
                    className="self-center bg-amber-100 hover:bg-amber-200 disabled:opacity-60 text-amber-950 border border-amber-300 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
                >
                    {cargandoMas ? 'Cargando…' : 'Cargar más registros'}
                </button>
            )}

            {porRenombrar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="renombrar-ranking" className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-2xl w-full max-w-sm">
                        <h2 id="renombrar-ranking" className="text-lg font-black text-amber-950 mb-1">Renombrar registro</h2>
                        <p className="text-[11px] text-amber-700 font-medium mb-3">
                            Este cambio se refleja en el ranking público y queda auditado.
                        </p>
                        <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">Nombre visible</label>
                        <input
                            type="text"
                            value={nuevoNombre}
                            maxLength={60}
                            onChange={(evento) => setNuevoNombre(evento.target.value)}
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => setPorRenombrar(null)} className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl px-3 py-2 text-[11px] font-bold cursor-pointer">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmarRenombrar} disabled={renombrando || !nuevoNombre.trim()} className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded-xl px-3 py-2 text-[11px] font-bold cursor-pointer">
                                {renombrando ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AdminConfirmacion
                abierto={Boolean(porEliminar)}
                titulo="Eliminar registro"
                mensaje={porEliminar ? `¿Eliminar el registro de ${porEliminar.name || porEliminar.nombre || 'este jugador'}?` : ''}
                onConfirmar={confirmarEliminar}
                onCancelar={() => setPorEliminar(null)}
                textoConfirmar="Eliminar"
                peligro
                cargando={eliminando}
            />
        </div>
    );
}
