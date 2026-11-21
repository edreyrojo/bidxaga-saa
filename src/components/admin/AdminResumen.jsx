import React from 'react';
import Icono from '../Icono.jsx';

const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = new Date(timestamp);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
};

const valor = (numero) => (numero === null || numero === undefined ? '—' : numero);

const TIPO_LABEL = {
    palabra: 'Palabra',
    correccion: 'Corrección',
    audio: 'Audio',
    otro: 'Otro',
};

const ACCION_LABEL = {
    sugerencia_aprobada: 'Sugerencia aprobada',
    sugerencia_rechazada: 'Sugerencia rechazada',
};

function TarjetaResumen({ icono, etiqueta, numero, color }) {
    return (
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-2 ${color}`}>
                <Icono nombre={icono} className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-amber-950 leading-none">{valor(numero)}</p>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mt-1">{etiqueta}</p>
        </div>
    );
}

export default function AdminResumen({
    datos,
    cargando,
    error,
    onRecargar,
    onIrSugerencias,
    onIrUsuarios,
    onIrAvisos,
    onIrRankings,
    onAbrirPanelAnterior,
    onOpenGenerador,
}) {
    if (cargando && !datos) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((indice) => (
                    <div key={indice} className="h-28 bg-amber-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <Icono nombre="alert" className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="flex-1 text-xs font-bold text-red-800">
                        No se pudieron cargar todas las métricas. Revisa tu conexión o los permisos.
                    </p>
                    <button
                        type="button"
                        onClick={onRecargar}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <TarjetaResumen icono="users" etiqueta="Usuarios" numero={datos?.usuarios} color="bg-amber-100 text-amber-800 border-amber-200" />
                <TarjetaResumen icono="sparkles" etiqueta="Nuevos 7 días" numero={datos?.usuariosNuevos} color="bg-emerald-100 text-emerald-800 border-emerald-200" />
                <TarjetaResumen icono="megaphone" etiqueta="Sugerencias pendientes" numero={datos?.sugerenciasPendientes} color="bg-orange-100 text-orange-800 border-orange-200" />
                <TarjetaResumen icono="book" etiqueta="Avisos publicados" numero={datos?.avisos} color="bg-yellow-100 text-yellow-800 border-yellow-200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h2 className="font-black text-amber-950 text-sm flex items-center gap-2">
                            <Icono nombre="megaphone" className="w-4 h-4 text-amber-700" /> Últimas sugerencias
                        </h2>
                        <button
                            type="button"
                            onClick={onIrSugerencias}
                            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
                        >
                            Ver todas
                        </button>
                    </div>

                    {(!datos?.sugerenciasRecientes || datos.sugerenciasRecientes.length === 0) ? (
                        <p className="text-xs text-amber-700 font-medium">Todavía no hay sugerencias.</p>
                    ) : (
                        <ul className="space-y-2">
                            {datos.sugerenciasRecientes.map((sugerencia) => (
                                <li key={sugerencia.id} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-black text-amber-950 truncate">{sugerencia.palabra}</p>
                                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                                            {TIPO_LABEL[sugerencia.tipo] || 'Otro'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-800 truncate">{sugerencia.significado}</p>
                                    <p className="text-[10px] text-amber-800 mt-0.5">{formatearFecha(sugerencia.creadoEn)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm">
                    <h2 className="font-black text-amber-950 text-sm flex items-center gap-2 mb-3">
                        <Icono nombre="clipboard" className="w-4 h-4 text-amber-700" /> Actividad administrativa
                    </h2>

                    {(!datos?.logsRecientes || datos.logsRecientes.length === 0) ? (
                        <p className="text-xs text-amber-700 font-medium">Aún no hay acciones registradas.</p>
                    ) : (
                        <ul className="space-y-2">
                            {datos.logsRecientes.map((log) => (
                                <li key={log.id} className="flex items-start gap-2 text-[11px] text-amber-900">
                                    <Icono nombre="check" className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{ACCION_LABEL[log.accion] || log.accion}</p>
                                        <p className="text-[10px] text-amber-800 truncate">
                                            {log.actorNombre || 'Admin'} · {formatearFecha(log.creadoEn)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <section className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm">
                <h2 className="font-black text-amber-950 text-sm mb-3">Acciones rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={onIrSugerencias}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3 text-left flex items-center gap-2 cursor-pointer"
                    >
                        <Icono nombre="megaphone" className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">Revisar sugerencias</span>
                    </button>
                    <button
                        type="button"
                        onClick={onIrUsuarios}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3 text-left flex items-center gap-2 cursor-pointer"
                    >
                        <Icono nombre="users" className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">Buscar usuario</span>
                    </button>
                    <button
                        type="button"
                        onClick={onIrAvisos}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3 text-left flex items-center gap-2 cursor-pointer"
                    >
                        <Icono nombre="book" className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">Publicar aviso</span>
                    </button>
                    <button
                        type="button"
                        onClick={onIrRankings}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3 text-left flex items-center gap-2 cursor-pointer"
                    >
                        <Icono nombre="trophy" className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">Ver rankings</span>
                    </button>
                    <button
                        type="button"
                        onClick={onAbrirPanelAnterior}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3 text-left flex items-center gap-2 cursor-pointer"
                    >
                        <Icono nombre="settings" className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">Panel anterior</span>
                    </button>
                    <button
                        type="button"
                        onClick={onOpenGenerador}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3 text-left flex items-center gap-2 cursor-pointer"
                    >
                        <Icono nombre="wrench" className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">Generador de avatares</span>
                    </button>
                </div>
            </section>
        </div>
    );
}
