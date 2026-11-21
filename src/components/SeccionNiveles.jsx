import React from 'react';
import SeccionColapsable from './SeccionColapsable.jsx';
import Icono from './Icono.jsx';
import { NIVEL_MAXIMO, UMBRALES_NIVEL, obtenerNivelCuenta } from '../utils/Nivelcuenta.js';

export default function SeccionNiveles({ abierto, setAbierto, totalHistorico = 0 }) {
    const actual = obtenerNivelCuenta(totalHistorico);

    return (
        <SeccionColapsable
            icono="/guiechachi.png"
            titulo="Camino de Niveles"
            abierto={abierto}
            setAbierto={setAbierto}
            badge={`Nv ${actual.nivel}/${NIVEL_MAXIMO}`}
        >
            <div className="p-3 sm:p-4">
                <p className="text-[11px] text-amber-800 font-medium mb-3 leading-relaxed">
                    Cada nivel se gana con totopos históricos. Los títulos están inspirados en el Istmo:
                    diidxazá, Binnizá, guiechachi y la palabra verdadera.
                </p>

                <ol className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                    {UMBRALES_NIVEL.map((umbral) => {
                        const completado = actual.nivel > umbral.nivel;
                        const esActual = actual.nivel === umbral.nivel;
                        const esSiguiente = actual.siguiente?.nivel === umbral.nivel;

                        return (
                            <li
                                key={umbral.nivel}
                                className={`rounded-xl border px-2.5 py-2 flex items-start gap-2.5 ${
                                    esActual
                                        ? 'bg-amber-100 border-amber-400 ring-1 ring-amber-300'
                                        : completado
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : 'bg-white border-amber-200'
                                }`}
                            >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    esActual
                                        ? 'bg-amber-700 text-white'
                                        : completado
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {completado ? <Icono nombre="check" className="w-3.5 h-3.5" /> : umbral.nivel}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-[11px] font-black truncate ${esActual ? 'text-amber-950' : 'text-amber-900'}`}>
                                            Nv {umbral.nivel} · {umbral.titulo}
                                        </p>
                                        <span className={`text-[9px] font-black uppercase shrink-0 px-1.5 py-0.5 rounded-full ${
                                            esActual
                                                ? 'bg-amber-700 text-white'
                                                : completado
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : esSiguiente
                                                        ? 'bg-sky-100 text-sky-800'
                                                        : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {esActual ? 'Actual' : completado ? 'Logrado' : esSiguiente ? 'Siguiente' : 'Bloqueado'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-amber-700 font-medium leading-tight mt-0.5">
                                        {umbral.descripcion}
                                    </p>
                                    <p className="text-[9px] font-bold text-amber-600 mt-0.5">
                                        Desde {umbral.totoposMin.toLocaleString('es-MX')} totopos históricos
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </SeccionColapsable>
    );
}
