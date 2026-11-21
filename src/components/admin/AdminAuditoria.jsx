import React, { useEffect, useMemo, useState } from 'react';
import Icono from '../Icono.jsx';
import { cargarLogsAdmin } from '../../services/admin/adminLogs.js';
import { generarCSV, descargarArchivo } from '../../utils/csv.js';

const POR_PAGINA = 12;

const ACCIONES = [
    { id: 'todas', label: 'Todas' },
    { id: 'sugerencia_aprobada', label: 'Sugerencia aprobada' },
    { id: 'sugerencia_rechazada', label: 'Sugerencia rechazada' },
    { id: 'sugerencia_convertida', label: 'Sugerencia convertida' },
    { id: 'sugerencias_aprobadas_lote', label: 'Sugerencias aprobadas en lote' },
    { id: 'sugerencias_rechazadas_lote', label: 'Sugerencias rechazadas en lote' },
    { id: 'aviso_creado', label: 'Aviso creado' },
    { id: 'aviso_editado', label: 'Aviso editado' },
    { id: 'aviso_activado', label: 'Aviso activado' },
    { id: 'aviso_desactivado', label: 'Aviso desactivado' },
    { id: 'aviso_eliminado', label: 'Aviso eliminado' },
    { id: 'totopos_regalados', label: 'Totopos regalados' },
    { id: 'rol_admin_asignado', label: 'Rol admin asignado' },
    { id: 'rol_admin_removido', label: 'Rol admin removido' },
    { id: 'ranking_eliminado', label: 'Ranking eliminado' },
    { id: 'ranking_renombrado', label: 'Ranking renombrado' },
    { id: 'ranking_compactado', label: 'Ranking compactado' },
    { id: 'password_reset_enviado', label: 'Restablecimiento enviado' },
];

const ETIQUETAS = Object.fromEntries(ACCIONES.map((accion) => [accion.id, accion.label]));

const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = new Date(timestamp);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function AdminAuditoria({ onToast }) {
    const [logs, setLogs] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [accion, setAccion] = useState('todas');
    const [busqueda, setBusqueda] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [pagina, setPagina] = useState(0);

    const cargar = async () => {
        setCargando(true);
        setError(false);
        try {
            const lista = await cargarLogsAdmin(300);
            setLogs(lista);
        } catch (err) {
            console.error('No se pudo cargar la auditoría:', err);
            setError(true);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    useEffect(() => {
        setPagina(0);
    }, [accion, busqueda, desde, hasta]);

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        const inicio = desde ? new Date(`${desde}T00:00:00`).getTime() : null;
        const fin = hasta ? new Date(`${hasta}T23:59:59`).getTime() : null;

        return logs.filter((log) => {
            if (accion !== 'todas' && log.accion !== accion) return false;
            if (inicio && Number(log.creadoEn) < inicio) return false;
            if (fin && Number(log.creadoEn) > fin) return false;
            if (!texto) return true;

            return `${log.actorNombre || ''} ${log.actorUid || ''} ${log.objetivo || ''} ${log.accion || ''}`
                .toLowerCase()
                .includes(texto);
        });
    }, [logs, accion, busqueda, desde, hasta]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaSegura = Math.min(pagina, totalPaginas - 1);
    const visibles = filtrados.slice(paginaSegura * POR_PAGINA, (paginaSegura + 1) * POR_PAGINA);

    const exportar = () => {
        if (filtrados.length === 0) {
            onToast?.('No hay registros de auditoría para exportar.', 'info');
            return;
        }

        const csv = generarCSV(filtrados, [
            { titulo: 'Fecha', valor: (log) => formatearFecha(log.creadoEn) },
            { titulo: 'Admin', valor: (log) => log.actorNombre || '' },
            { titulo: 'UID admin', valor: (log) => log.actorUid || '' },
            { titulo: 'Acción', valor: (log) => ETIQUETAS[log.accion] || log.accion },
            { titulo: 'Objetivo', valor: (log) => log.objetivo || '' },
            { titulo: 'Detalle', valor: (log) => JSON.stringify(log.detalle || {}) },
        ]);

        descargarArchivo('auditoria-bidxaga.csv', csv);
        onToast?.('CSV de auditoría generado.', 'exito');
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                        <Icono nombre="clipboard" className="w-5 h-5 text-amber-700" /> Auditoría
                    </h2>
                    <p className="text-[11px] text-amber-700 font-medium">
                        Últimos 300 registros · {filtrados.length} visibles
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                        value={accion}
                        onChange={(evento) => setAccion(evento.target.value)}
                        aria-label="Filtrar por acción"
                        className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                    >
                        {ACCIONES.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={desde}
                        onChange={(evento) => setDesde(evento.target.value)}
                        aria-label="Desde"
                        className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                    />

                    <input
                        type="date"
                        value={hasta}
                        onChange={(evento) => setHasta(evento.target.value)}
                        aria-label="Hasta"
                        className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                    />
                </div>

                <label className="relative">
                    <span className="sr-only">Buscar en auditoría</span>
                    <Icono nombre="search" className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(evento) => setBusqueda(evento.target.value)}
                        placeholder="Buscar admin, UID, objetivo o acción"
                        className="w-full bg-amber-50 border border-amber-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                    />
                </label>
            </div>

            {cargando ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((indice) => <div key={indice} className="h-16 bg-amber-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold text-red-800">No se pudo cargar la auditoría.</p>
                    <button type="button" onClick={cargar} className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">Reintentar</button>
                </div>
            ) : visibles.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                    <Icono nombre="clipboard" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-900">No hay registros con estos filtros.</p>
                </div>
            ) : (
                <ol className="space-y-1.5">
                    {visibles.map((log) => (
                        <li key={log.id} className="bg-white rounded-xl border border-amber-200 px-3 py-2 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                    <Icono nombre="checkCircle" className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-amber-950 truncate">{ETIQUETAS[log.accion] || log.accion}</p>
                                        <p className="text-[10px] font-medium text-amber-700 truncate">{log.actorNombre || 'Admin'} · {formatearFecha(log.creadoEn)}</p>
                                        <p className="text-[10px] text-amber-600 truncate">{log.objetivo}</p>
                                    </div>
                                </div>
                            </div>
                            {log.detalle && Object.keys(log.detalle).length > 0 && (
                                <details className="mt-1">
                                    <summary className="text-[10px] font-bold text-amber-700 cursor-pointer">Ver detalle</summary>
                                    <pre className="mt-1 text-[10px] bg-amber-50 border border-amber-200 rounded-lg p-2 overflow-x-auto text-amber-900">
                                        {JSON.stringify(log.detalle, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </li>
                    ))}
                </ol>
            )}

            {!cargando && !error && filtrados.length > POR_PAGINA && (
                <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                    <button type="button" onClick={() => setPagina((actual) => Math.max(0, actual - 1))} disabled={paginaSegura === 0} className="text-[11px] font-bold text-amber-900 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1">
                        <Icono nombre="arrowLeft" className="w-3.5 h-3.5" /> Anterior
                    </button>
                    <span className="text-[11px] font-bold text-amber-800">Página {paginaSegura + 1} de {totalPaginas}</span>
                    <button type="button" onClick={() => setPagina((actual) => Math.min(totalPaginas - 1, actual + 1))} disabled={paginaSegura >= totalPaginas - 1} className="text-[11px] font-bold text-amber-900 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1">
                        Siguiente <Icono nombre="arrowRight" className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
