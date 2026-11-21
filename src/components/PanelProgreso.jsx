import React from 'react';
import { useProgresoAprendizaje } from '../hooks/useProgresoAprendizaje.js';
import { useSonido } from '../hooks/useSonido.js';
import Icono from './Icono.jsx';

const ICONOS_JUEGO = {
    memorama: 'layers',
    trivia: 'zap',
    crucigrama: 'pencil',
    sopa: 'search',
};

const nombreDia = (fechaISO) => {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    return new Date(anio, mes - 1, dia)
        .toLocaleDateString('es-MX', { weekday: 'short' })
        .replace('.', '')
        .slice(0, 3);
};

function TarjetaStat({ valor, etiqueta, color = 'amber' }) {
    const estilos = {
        amber: 'border-amber-200 text-amber-800',
        emerald: 'border-emerald-200 text-emerald-800',
        orange: 'border-orange-200 text-orange-800',
        red: 'border-red-200 text-red-700',
    };

    return (
        <div className={`bg-white border-2 rounded-2xl px-3 py-3 text-center shadow-sm ${estilos[color] || estilos.amber}`}>
            <p className="text-2xl font-black leading-none">{valor}</p>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-wide">{etiqueta}</p>
        </div>
    );
}

export default function PanelProgreso({ user, onBack }) {
    const { reproducirSonido } = useSonido();
    const {
        total,
        dominadas,
        pendientes,
        precision,
        errores,
        actividad,
        totalActividad,
        niveles,
        porCategoria,
        logrosDesbloqueados,
        totalLogros,
        rachaActual,
        completadoHoy,
        reto,
    } = useProgresoAprendizaje(user);

    const maxActividad = Math.max(1, ...actividad.map((dia) => dia.respuestas));
    const porcentajeLogros = totalLogros > 0
        ? Math.round((logrosDesbloqueados.length / totalLogros) * 100)
        : 0;

    return (
        <div className="max-w-3xl mx-auto px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] select-none">
            <div className="flex items-center justify-between gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => {
                        try { reproducirSonido('click1'); } catch (e) {}
                        onBack?.();
                    }}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm cursor-pointer"
                >
                    ← Menú
                </button>

                <span className="bg-orange-100 text-orange-900 border border-orange-300 rounded-full px-3 py-1 text-xs font-black inline-flex items-center gap-1">
                    <Icono nombre="flame" className="w-3.5 h-3.5" />
                    {rachaActual} {rachaActual === 1 ? 'día' : 'días'}
                </span>
            </div>

            <header className="text-center mb-4">
                <div className="flex justify-center mb-1">
                    <Icono nombre="chart" className="w-9 h-9 text-amber-700" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">Mi Progreso</h1>
                <p className="text-xs sm:text-sm text-amber-700 font-medium">
                    Lo que has aprendido con Bidxaga Saa
                </p>
            </header>

            {total === 0 && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center mb-4">
                    <p className="text-sm font-bold text-amber-900">Aún no hay palabras registradas.</p>
                    <p className="text-xs text-amber-700 mt-1">
                        Juega un nivel o completa el reto diario y aquí verás tu avance.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <TarjetaStat valor={total} etiqueta="Practicadas" color="amber" />
                <TarjetaStat valor={dominadas} etiqueta="Dominadas" color="emerald" />
                <TarjetaStat valor={pendientes} etiqueta="Por reforzar" color="orange" />
                <TarjetaStat valor={`${precision}%`} etiqueta="Precisión" color="amber" />
            </div>

            <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="font-black text-amber-950 text-sm">Actividad de los últimos 7 días</h2>
                    <span className="text-[11px] font-bold text-amber-700">{totalActividad} respuestas</span>
                </div>

                <div className="flex items-end justify-between gap-1.5 h-36">
                    {actividad.map((dia) => {
                        const altura = dia.respuestas === 0
                            ? 2
                            : Math.max(8, Math.round((dia.respuestas / maxActividad) * 100));

                        return (
                            <div key={dia.fecha} className="flex-1 h-full flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-amber-800 leading-none">
                                    {dia.respuestas > 0 ? dia.respuestas : ''}
                                </span>
                                <div className="w-full flex-1 flex items-end justify-center">
                                    <div
                                        role="img"
                                        className={`w-3/4 rounded-t-lg transition-all duration-300 ${
                                            dia.respuestas > 0 ? 'bg-amber-600' : 'bg-amber-100'
                                        }`}
                                        style={{ height: `${altura}%` }}
                                        title={`${dia.fecha}: ${dia.respuestas} respuestas`}
                                        aria-label={`${dia.fecha}: ${dia.respuestas} respuestas`}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-amber-700">{nombreDia(dia.fecha)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="font-black text-amber-950 text-sm">Niveles actuales</h2>
                    <span className="text-[11px] font-bold text-amber-700">4 juegos</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {niveles.map((juego) => (
                        <div key={juego.id} className="bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5 flex items-center gap-2">
                            <Icono nombre={ICONOS_JUEGO[juego.id] || 'gamepad'} className="w-5 h-5 text-amber-800 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-black text-amber-950 truncate">{juego.nombre}</p>
                                <p className="text-[11px] font-bold text-amber-700">Nivel {juego.nivel}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="font-black text-amber-950 text-sm">Vocabulario por categoría</h2>
                    <span className="text-[11px] font-bold text-amber-700">{errores} errores</span>
                </div>

                {porCategoria.length === 0 ? (
                    <p className="text-xs text-amber-700 font-medium">
                        Todavía no hay categorías practicadas.
                    </p>
                ) : (
                    <ul className="space-y-2.5">
                        {porCategoria.slice(0, 8).map((categoria) => {
                            const porcentaje = categoria.total > 0
                                ? Math.round((categoria.dominadas / categoria.total) * 100)
                                : 0;

                            return (
                                <li key={categoria.id}>
                                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-amber-900 mb-1">
                                        <span className="truncate">{categoria.nombre}</span>
                                        <span className="shrink-0">{categoria.dominadas}/{categoria.total}</span>
                                    </div>
                                    <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden border border-amber-200">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${porcentaje}%` }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="font-black text-amber-950 text-sm">Logros</h2>
                    <span className="text-[11px] font-bold text-amber-700">
                        {logrosDesbloqueados.length}/{totalLogros}
                    </span>
                </div>

                <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden border border-amber-200 mb-2">
                    <div
                        className="bg-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${porcentajeLogros}%` }}
                    />
                </div>

                <p className="text-[11px] font-medium text-amber-700">
                    {user
                        ? 'Los logros se guardan en tu cuenta.'
                        : 'Inicia sesión para guardar tus logros en la nube.'}
                </p>

                <div className="mt-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-2xl px-3 py-2">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Reto de hoy</p>
                        <p className="text-xs font-black text-orange-950">
                            {completadoHoy
                                ? `Completado ${reto?.aciertos ?? 0}/${reto?.total ?? 5}`
                                : 'Pendiente'}
                        </p>
                    </div>
                    <span className="text-sm font-black text-orange-900 inline-flex items-center gap-1">
                        <Icono nombre="flame" className="w-4 h-4" />
                        {rachaActual}
                    </span>
                </div>
            </div>
        </div>
    );
}
