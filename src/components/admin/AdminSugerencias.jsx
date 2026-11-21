import React, { useEffect, useMemo, useState } from 'react';
import Icono from '../Icono.jsx';
import AdminConfirmacion from './AdminConfirmacion.jsx';
import { generarCSV, descargarArchivo } from '../../utils/csv.js';
import {
    cargarSugerencias,
    revisarSugerencia,
    revisarSugerenciasLote,
} from '../../services/admin/adminSugerencias.js';

import { detectarSugerenciasDuplicadas } from '../../utils/adminHelpers.js';

const POR_PAGINA = 8;

const ESTADOS = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'convertida', label: 'Convertidas' },
    { id: 'rechazada', label: 'Rechazadas' },
];

const TIPOS = [
    { id: 'todos', label: 'Todos los tipos' },
    { id: 'palabra', label: 'Palabra nueva' },
    { id: 'correccion', label: 'Corrección' },
    { id: 'audio', label: 'Audio' },
    { id: 'otro', label: 'Otro' },
];

const TIPO_LABEL = {
    palabra: 'Palabra',
    correccion: 'Corrección',
    audio: 'Audio',
    otro: 'Otro',
};

const formatearFecha = (timestamp) => {
    if (!timestamp) return 'Sin fecha';
    const fecha = new Date(timestamp);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const claseEstado = (estado) => {
    if (estado === 'aprobada') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (estado === 'convertida') return 'bg-sky-100 text-sky-800 border-sky-200';
    if (estado === 'rechazada') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
};

const ETIQUETA_ESTADO = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    convertida: 'Convertida',
    rechazada: 'Rechazada',
};

const textoParaCopiar = (sugerencia) => (
    [
        `Tipo: ${TIPO_LABEL[sugerencia.tipo] || 'Otro'}`,
        `Palabra: ${sugerencia.palabra || ''}`,
        `Significado: ${sugerencia.significado || ''}`,
        `Categoría: ${sugerencia.categoria || ''}`,
        `Notas: ${sugerencia.notas || ''}`,
        `Contacto: ${sugerencia.contacto || ''}`,
        `Enviado por: ${sugerencia.uid || 'invitado'}`,
        `Fecha: ${formatearFecha(sugerencia.creadoEn)}`,
    ].join('\n')
);

export default function AdminSugerencias({ user, onPendientesChange, onToast }) {
    const [sugerencias, setSugerencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(0);
    const [seleccion, setSeleccion] = useState(null);
    const [seleccionMultiple, setSeleccionMultiple] = useState([]);
    const [confirmacion, setConfirmacion] = useState(null);
    const [nota, setNota] = useState('');
    const [procesando, setProcesando] = useState(false);

    const cargar = async () => {
        setCargando(true);
        setError(false);
        try {
            const lista = await cargarSugerencias();
            setSugerencias(lista);
        } catch (err) {
            console.error('No se pudieron cargar las sugerencias:', err);
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
    }, [filtroEstado, filtroTipo, busqueda]);

    const filtradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return sugerencias.filter((sugerencia) => {
            if (filtroEstado !== 'todas' && sugerencia.estado !== filtroEstado) return false;
            if (filtroTipo !== 'todos' && sugerencia.tipo !== filtroTipo) return false;
            if (!texto) return true;

            const contenido = `${sugerencia.palabra || ''} ${sugerencia.significado || ''} ${sugerencia.categoria || ''} ${sugerencia.contacto || ''} ${sugerencia.uid || ''}`.toLowerCase();
            return contenido.includes(texto);
        });
    }, [sugerencias, filtroEstado, filtroTipo, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaSegura = Math.min(pagina, totalPaginas - 1);
    const visibles = filtradas.slice(paginaSegura * POR_PAGINA, (paginaSegura + 1) * POR_PAGINA);
    const pendientes = sugerencias.filter((sugerencia) => sugerencia.estado === 'pendiente').length;

    // Detecta palabras repetidas en la lista cargada para evitar revisar dos veces lo mismo.
    const duplicadas = useMemo(() => detectarSugerenciasDuplicadas(sugerencias), [sugerencias]);

    const pendientesVisibles = visibles.filter((sugerencia) => sugerencia.estado === 'pendiente');
    const todosVisiblesSeleccionados = pendientesVisibles.length > 0
        && pendientesVisibles.every((sugerencia) => seleccionMultiple.includes(sugerencia.id));

    const alternarSeleccion = (id) => {
        setSeleccionMultiple((actual) => (
            actual.includes(id) ? actual.filter((item) => item !== id) : [...actual, id]
        ));
    };

    const alternarSeleccionVisibles = () => {
        const ids = pendientesVisibles.map((sugerencia) => sugerencia.id);
        setSeleccionMultiple((actual) => {
            if (todosVisiblesSeleccionados) {
                return actual.filter((id) => !ids.includes(id));
            }
            return Array.from(new Set([...actual, ...ids]));
        });
    };

    const exportar = () => {
        if (filtradas.length === 0) {
            onToast?.('No hay sugerencias para exportar.', 'info');
            return;
        }

        const csv = generarCSV(filtradas, [
            { titulo: 'Tipo', valor: (s) => TIPO_LABEL[s.tipo] || s.tipo || '' },
            { titulo: 'Estado', valor: (s) => ETIQUETA_ESTADO[s.estado] || s.estado || '' },
            { titulo: 'Palabra', valor: (s) => s.palabra || '' },
            { titulo: 'Significado', valor: (s) => s.significado || '' },
            { titulo: 'Categoría', valor: (s) => s.categoria || '' },
            { titulo: 'Notas', valor: (s) => s.notas || '' },
            { titulo: 'Contacto', valor: (s) => s.contacto || '' },
            { titulo: 'UID', valor: (s) => s.uid || 'invitado' },
            { titulo: 'Nota admin', valor: (s) => s.notaAdmin || '' },
            { titulo: 'Fecha', valor: (s) => formatearFecha(s.creadoEn) },
        ]);

        descargarArchivo('sugerencias-bidxaga.csv', csv);
        onToast?.('CSV de sugerencias generado.', 'exito');
    };

    const copiar = async (sugerencia) => {
        try {
            await navigator.clipboard.writeText(textoParaCopiar(sugerencia));
            onToast?.('Datos copiados al portapapeles.', 'exito');
        } catch {
            onToast?.('No se pudo copiar. Revisa los permisos del navegador.', 'error');
        }
    };

    const pedirRevision = (sugerencia, estado) => {
        setSeleccion(null);
        setNota('');
        setConfirmacion({ modo: 'individual', sugerencia, estado });
    };

    const pedirRevisionLote = (estado) => {
        if (seleccionMultiple.length === 0) {
            onToast?.('Selecciona al menos una sugerencia pendiente.', 'info');
            return;
        }
        setNota('');
        setConfirmacion({ modo: 'lote', ids: [...seleccionMultiple], estado });
    };

    const confirmarRevision = async () => {
        if (!confirmacion) return;
        setProcesando(true);

        try {
            if (confirmacion.modo === 'lote') {
                await revisarSugerenciasLote({
                    ids: confirmacion.ids,
                    estado: confirmacion.estado,
                    nota,
                    user,
                });
                onToast?.(
                    `${confirmacion.ids.length} sugerencias ${confirmacion.estado === 'aprobada' ? 'aprobadas' : 'rechazadas'}.`,
                    'exito'
                );
                setSeleccionMultiple([]);
            } else {
                await revisarSugerencia({
                    id: confirmacion.sugerencia.id,
                    estado: confirmacion.estado,
                    nota,
                    user,
                });
                onToast?.(
                    confirmacion.estado === 'aprobada' ? 'Sugerencia aprobada.' : 'Sugerencia rechazada.',
                    'exito'
                );
            }

            setConfirmacion(null);
            setNota('');
            await cargar();
            onPendientesChange?.();
        } catch (err) {
            console.error('No se pudo revisar la sugerencia:', err);
            onToast?.('No se pudo actualizar la sugerencia. Inténtalo de nuevo.', 'error');
        } finally {
            setProcesando(false);
        }
    };

    const marcarConvertida = async (sugerencia) => {
        setProcesando(true);
        try {
            await revisarSugerencia({
                id: sugerencia.id,
                estado: 'convertida',
                nota: nota || sugerencia.notaAdmin || '',
                user,
            });
            onToast?.('Sugerencia marcada como convertida en el catálogo.', 'exito');
            setSeleccion(null);
            setNota('');
            await cargar();
            onPendientesChange?.();
        } catch (err) {
            console.error('No se pudo marcar como convertida:', err);
            onToast?.('No se pudo marcar la sugerencia. Inténtalo de nuevo.', 'error');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                        <Icono nombre="megaphone" className="w-5 h-5 text-amber-700" /> Sugerencias de hablantes
                    </h2>
                    <p className="text-[11px] text-amber-700 font-medium">
                        {pendientes} pendientes · {sugerencias.length} cargadas
                    </p>
                </div>

                <div className="flex gap-2 self-start">
                    <button
                        type="button"
                        onClick={exportar}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Icono nombre="clipboard" className="w-4 h-4" /> CSV
                    </button>
                    <button
                        type="button"
                        onClick={cargar}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Icono nombre="refresh" className="w-4 h-4" /> Actualizar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-amber-200 p-3 shadow-sm flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {ESTADOS.map((estado) => (
                        <button
                            key={estado.id}
                            type="button"
                            onClick={() => setFiltroEstado(estado.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                filtroEstado === estado.id
                                    ? 'bg-amber-700 text-white border-amber-800'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            {estado.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
                    <label className="relative">
                        <span className="sr-only">Buscar sugerencias</span>
                        <Icono nombre="search" className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(evento) => setBusqueda(evento.target.value)}
                            placeholder="Buscar palabra, significado, contacto o UID"
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                        />
                    </label>

                    <select
                        value={filtroTipo}
                        onChange={(evento) => setFiltroTipo(evento.target.value)}
                        className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                    >
                        {TIPOS.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {pendientesVisibles.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-amber-900 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={todosVisiblesSeleccionados}
                            onChange={alternarSeleccionVisibles}
                        />
                        Seleccionar pendientes de esta página ({pendientesVisibles.length})
                    </label>

                    {seleccionMultiple.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-amber-900">{seleccionMultiple.length} seleccionadas</span>
                            <button
                                type="button"
                                onClick={() => pedirRevisionLote('aprobada')}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                                <Icono nombre="check" className="w-3 h-3" /> Aprobar
                            </button>
                            <button
                                type="button"
                                onClick={() => pedirRevisionLote('rechazada')}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                                <Icono nombre="x" className="w-3 h-3" /> Rechazar
                            </button>
                            <button
                                type="button"
                                onClick={() => setSeleccionMultiple([])}
                                className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[10px] font-bold cursor-pointer"
                            >
                                Limpiar
                            </button>
                        </div>
                    )}
                </div>
            )}

            {cargando ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((indice) => (
                        <div key={indice} className="h-24 bg-amber-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold text-red-800">No se pudieron cargar las sugerencias.</p>
                    <button
                        type="button"
                        onClick={cargar}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                        Reintentar
                    </button>
                </div>
            ) : visibles.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                    <Icono nombre="megaphone" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-900">No hay sugerencias con este filtro.</p>
                    <p className="text-xs text-amber-700 mt-1">Cuando alguien envíe una palabra o corrección aparecerá aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {visibles.map((sugerencia) => (
                        <article key={sugerencia.id} className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {sugerencia.estado === 'pendiente' && (
                                        <input
                                            type="checkbox"
                                            checked={seleccionMultiple.includes(sugerencia.id)}
                                            onChange={() => alternarSeleccion(sugerencia.id)}
                                            aria-label={`Seleccionar ${sugerencia.palabra}`}
                                        />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                                        {TIPO_LABEL[sugerencia.tipo] || 'Otro'}
                                    </span>
                                    {duplicadas.has(sugerencia.id) && (
                                        <span className="text-[10px] font-black uppercase tracking-wide bg-orange-100 text-orange-800 border border-orange-200 rounded-full px-2 py-0.5">
                                            Duplicada
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-black uppercase rounded-full px-2 py-0.5 border ${claseEstado(sugerencia.estado)}`}>
                                    {ETIQUETA_ESTADO[sugerencia.estado] || sugerencia.estado || 'Pendiente'}
                                </span>
                            </div>

                            <p className="text-sm font-black text-amber-950 leading-tight">{sugerencia.palabra}</p>
                            <p className="text-xs text-amber-900 font-medium mt-0.5">{sugerencia.significado}</p>
                            {sugerencia.categoria && (
                                <p className="text-[11px] text-amber-700 mt-1">Categoría: {sugerencia.categoria}</p>
                            )}
                            {sugerencia.notas && (
                                <p className="text-[11px] text-amber-700 mt-1 line-clamp-2">{sugerencia.notas}</p>
                            )}
                            {sugerencia.contacto && (
                                <p className="text-[10px] text-amber-800 mt-1 truncate">Contacto: {sugerencia.contacto}</p>
                            )}
                            <p className="text-[10px] text-amber-800 mt-1">{formatearFecha(sugerencia.creadoEn)}</p>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setSeleccion(sugerencia)}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <Icono nombre="eye" className="w-3 h-3" /> Detalle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copiar(sugerencia)}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <Icono nombre="clipboard" className="w-3 h-3" /> Copiar
                                </button>

                                {sugerencia.estado === 'pendiente' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => pedirRevision(sugerencia, 'aprobada')}
                                            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Icono nombre="check" className="w-3 h-3" /> Aprobar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => pedirRevision(sugerencia, 'rechazada')}
                                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Icono nombre="x" className="w-3 h-3" /> Rechazar
                                        </button>
                                    </>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!cargando && !error && filtradas.length > POR_PAGINA && (
                <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                    <button
                        type="button"
                        onClick={() => setPagina((actual) => Math.max(0, actual - 1))}
                        disabled={paginaSegura === 0}
                        className="text-[11px] font-bold text-amber-900 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                    >
                        <Icono nombre="arrowLeft" className="w-3.5 h-3.5" /> Anterior
                    </button>
                    <span className="text-[11px] font-bold text-amber-800">
                        Página {paginaSegura + 1} de {totalPaginas}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPagina((actual) => Math.min(totalPaginas - 1, actual + 1))}
                        disabled={paginaSegura >= totalPaginas - 1}
                        className="text-[11px] font-bold text-amber-900 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                    >
                        Siguiente <Icono nombre="arrowRight" className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {seleccion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="detalle-sugerencia"
                        className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto"
                    >
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <p className="text-[10px] font-black uppercase text-amber-700">{TIPO_LABEL[seleccion.tipo] || 'Otro'}</p>
                                <h2 id="detalle-sugerencia" className="text-lg font-black text-amber-950">{seleccion.palabra}</h2>
                                <p className="text-sm text-amber-900 font-medium">{seleccion.significado}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSeleccion(null)}
                                aria-label="Cerrar detalle"
                                className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer"
                            >
                                <Icono nombre="x" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs text-amber-900">
                            <p><strong>Categoría:</strong> {seleccion.categoria || 'Sin categoría'}</p>
                            <p className="whitespace-pre-wrap"><strong>Notas:</strong> {seleccion.notas || 'Sin notas'}</p>
                            <p><strong>Contacto:</strong> {seleccion.contacto || 'No proporcionado'}</p>
                            <p><strong>Enviado por:</strong> {seleccion.uid || 'Invitado'}</p>
                            <p><strong>Fecha:</strong> {formatearFecha(seleccion.creadoEn)}</p>
                            <p><strong>Estado:</strong> {ETIQUETA_ESTADO[seleccion.estado] || seleccion.estado || 'Pendiente'}</p>
                            {duplicadas.has(seleccion.id) && (
                                <p className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-orange-900">
                                    <strong>Atención:</strong> hay otra sugerencia con la misma palabra en la lista cargada.
                                </p>
                            )}
                            {seleccion.notaAdmin && (
                                <p className="bg-amber-50 border border-amber-200 rounded-xl p-2">
                                    <strong>Nota del revisor:</strong> {seleccion.notaAdmin}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => copiar(seleccion)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg px-3 py-2 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                                <Icono nombre="clipboard" className="w-3.5 h-3.5" /> Copiar datos
                            </button>

                            {seleccion.estado === 'aprobada' && (
                                <button
                                    type="button"
                                    onClick={() => marcarConvertida(seleccion)}
                                    disabled={procesando}
                                    className="bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white rounded-lg px-3 py-2 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <Icono nombre="check" className="w-3.5 h-3.5" /> Marcar convertida
                                </button>
                            )}

                            {seleccion.estado === 'pendiente' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => pedirRevision(seleccion, 'aprobada')}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-2 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Icono nombre="check" className="w-3.5 h-3.5" /> Aprobar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => pedirRevision(seleccion, 'rechazada')}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Icono nombre="x" className="w-3.5 h-3.5" /> Rechazar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AdminConfirmacion
                abierto={Boolean(confirmacion)}
                titulo={
                    confirmacion?.modo === 'lote'
                        ? `${confirmacion.estado === 'aprobada' ? 'Aprobar' : 'Rechazar'} ${confirmacion.ids.length} sugerencias`
                        : (confirmacion?.estado === 'aprobada' ? 'Aprobar sugerencia' : 'Rechazar sugerencia')
                }
                mensaje={
                    confirmacion
                        ? (confirmacion.modo === 'lote'
                            ? `Se revisarán ${confirmacion.ids.length} sugerencias seleccionadas.`
                            : `«${confirmacion.sugerencia.palabra}» — ${confirmacion.sugerencia.significado}`)
                        : ''
                }
                nota={nota}
                onNotaChange={setNota}
                onConfirmar={confirmarRevision}
                onCancelar={() => { setConfirmacion(null); setNota(''); }}
                textoConfirmar={confirmacion?.estado === 'aprobada' ? 'Aprobar' : 'Rechazar'}
                peligro={confirmacion?.estado === 'rechazada'}
                cargando={procesando}
            />
        </div>
    );
}
