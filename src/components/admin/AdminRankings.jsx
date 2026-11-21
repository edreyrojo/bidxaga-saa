import React, { useEffect, useState } from 'react';
import Icono from '../Icono.jsx';
import AdminConfirmacion from './AdminConfirmacion.jsx';
import { generarCSV, descargarArchivo } from '../../utils/csv.js';
import {
    JUEGOS_RANKING,
    cargarRankingAdmin,
    eliminarRegistroRanking,
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

export default function AdminRankings({ user, onToast }) {
    const [juego, setJuego] = useState('memorama');
    const [fecha, setFecha] = useState(fechaHoy());
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [porEliminar, setPorEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const cargar = async () => {
        if (juego === 'reto' && !fecha) {
            onToast?.('Selecciona una fecha para el Reto Diario.', 'error');
            return;
        }
        setCargando(true);
        setError(false);
        try {
            const lista = await cargarRankingAdmin({ juego, fecha });
            setRegistros(lista);
        } catch (err) {
            console.error('No se pudo cargar el ranking:', err);
            setError(true);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [juego, fecha]);

    const filtrados = registros.filter((registro) => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return true;
        return `${registro.name || ''} ${registro.nombre || ''} ${registro.id || ''}`.toLowerCase().includes(texto);
    });

    const exportar = () => {
        if (filtrados.length === 0) {
            onToast?.('No hay registros para exportar.', 'info');
            return;
        }

        const columnas = [
            { titulo: 'Posición', valor: (_registro, indice) => indice + 1 },
            { titulo: 'Nombre', valor: (registro) => registro.name || registro.nombre || '' },
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

        const filas = filtrados.map((registro, indice) => ({ ...registro, _indice: indice }));
        const csv = generarCSV(filas, columnas.map((columna) => ({
            ...columna,
            valor: (fila) => (columna.titulo === 'Posición' ? fila._indice + 1 : columna.valor(fila)),
        })));

        descargarArchivo(`ranking-${juego}-${juego === 'reto' ? fecha : 'global'}.csv`, csv);
        onToast?.('CSV del ranking generado.', 'exito');
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
                        Hasta 100 registros por consulta · {filtrados.length} visibles
                    </p>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={exportar} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Icono nombre="clipboard" className="w-4 h-4" /> CSV
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
                                <p className="text-xs font-black text-amber-950 truncate">{registro.name || registro.nombre || 'Anónimo'}</p>
                                <p className="text-[10px] font-medium text-amber-700">{metricas(registro, juego)}</p>
                                <p className="text-[10px] text-amber-700 truncate">{registro.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPorEliminar(registro)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg px-2 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                                <Icono nombre="trash" className="w-3 h-3" /> Borrar
                            </button>
                        </li>
                    ))}
                </ol>
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
