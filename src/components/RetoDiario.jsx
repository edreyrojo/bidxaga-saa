import React, { useEffect, useMemo, useState } from 'react';
import { useRetoDiario } from '../hooks/useRetoDiario.js';
import { useTotopos } from '../hooks/useTotopos.js';
import { useLogros } from '../hooks/useLogros.js';
import { useSonido } from '../hooks/useSonido.js';
import { generarRetoDiario } from '../utils/retoDiario.js';
import { registrarRespuesta } from '../utils/repaso.js';
import { compartirTexto } from '../utils/compartir.js';
import Icono from './Icono.jsx';

const formatearFecha = (fechaISO) => {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
};

export default function RetoDiario({ user, onBack }) {
    const { reproducirSonido } = useSonido();
    const { abonar } = useTotopos(user);
    const { desbloquear } = useLogros(user);
    const {
        hoy,
        reto,
        completadoHoy,
        rachaActual,
        recompensaMaxima,
        completarReto,
    } = useRetoDiario(user);

    const preguntas = useMemo(() => generarRetoDiario(hoy), [hoy]);

    const [indice, setIndice] = useState(0);
    const [aciertos, setAciertos] = useState(0);
    const [seleccion, setSeleccion] = useState(null);
    const [estado, setEstado] = useState(null);
    const [terminado, setTerminado] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [modoPractica, setModoPractica] = useState(false);
    const [estadoCompartir, setEstadoCompartir] = useState(null);

    useEffect(() => {
        setIndice(0);
        setAciertos(0);
        setSeleccion(null);
        setEstado(null);
        setTerminado(false);
        setResultado(null);
        setModoPractica(false);
    }, [hoy]);

    const pregunta = preguntas[indice];
    const progreso = Math.round(((indice + (estado ? 1 : 0)) / preguntas.length) * 100);

    const reiniciarPractica = () => {
        try { reproducirSonido('click1'); } catch (e) {}
        setIndice(0);
        setAciertos(0);
        setSeleccion(null);
        setEstado(null);
        setTerminado(false);
        setResultado(null);
        setModoPractica(true);
    };

    const mensajeCompartir = estadoCompartir === 'copiado'
        ? '¡Copiado al portapapeles!'
        : estadoCompartir === 'compartido'
            ? '¡Compartido!'
            : estadoCompartir === 'no-disponible'
                ? 'No se pudo compartir en este navegador.'
                : '';

    const compartirResultado = async (datos) => {
        try { reproducirSonido('click1'); } catch (e) {}
        const resultadoCompartir = await compartirTexto({
            titulo: 'Reto Diario - Bidxaga Saa',
            texto: `Hice ${datos.aciertos}/${preguntas.length} en el Reto Diario de Bidxaga Saa. Racha: ${datos.racha} ${datos.racha === 1 ? 'día' : 'días'}.`,
        });

        if (resultadoCompartir === 'cancelado') return;
        setEstadoCompartir(resultadoCompartir);
        setTimeout(() => setEstadoCompartir(null), 2500);
    };

    const finalizar = (totalAciertos) => {
        setTerminado(true);

        if (modoPractica) {
            setResultado({
                aciertos: totalAciertos,
                recompensa: 0,
                racha: rachaActual,
                practica: true,
            });
            return;
        }

        const cierre = completarReto(totalAciertos, preguntas.length);

        if (!cierre.yaCompletado) {
            if (cierre.recompensa > 0) abonar(cierre.recompensa);
            desbloquear('logro_reto_diario');
            if (cierre.racha >= 7) desbloquear('logro_racha_7');
            if (cierre.racha >= 30) desbloquear('logro_racha_30');
        }

        setResultado({
            aciertos: totalAciertos,
            recompensa: cierre.recompensa,
            racha: cierre.racha,
            yaCompletado: cierre.yaCompletado,
            practica: false,
        });
    };

    const responder = (opcion) => {
        if (estado !== null || terminado || !pregunta) return;

        const esCorrecta = opcion === pregunta.correcta;
        const nuevosAciertos = aciertos + (esCorrecta ? 1 : 0);

        setAciertos(nuevosAciertos);
        setSeleccion(opcion);
        setEstado(esCorrecta ? 'correcta' : 'incorrecta');
        try { reproducirSonido(esCorrecta ? 'click2' : 'click1'); } catch (e) {}

        registrarRespuesta(
            {
                tipo: pregunta.tipo,
                id: pregunta.objetivo.id,
                palabra: pregunta.diidxaza,
                spanish: pregunta.spanish,
            },
            esCorrecta
        );

        setTimeout(() => {
            if (indice + 1 >= preguntas.length) {
                finalizar(nuevosAciertos);
            } else {
                setIndice((actual) => actual + 1);
                setSeleccion(null);
                setEstado(null);
            }
        }, 1100);
    };

    const claseOpcion = (opcion) => {
        if (estado === null) {
            return 'bg-white border-amber-200 text-amber-950 hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98]';
        }
        if (opcion === pregunta.correcta) {
            return 'bg-emerald-100 border-emerald-500 text-emerald-950';
        }
        if (opcion === seleccion) {
            return 'bg-red-100 border-red-500 text-red-950';
        }
        return 'bg-white/60 border-amber-100 text-amber-700 opacity-60';
    };

    const mostrarResumenHoy = completadoHoy && !terminado && !modoPractica;

    return (
        <div className="max-w-3xl mx-auto px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] select-none">
            <div className="flex items-center justify-between gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => {
                        try { reproducirSonido('click1'); } catch (e) {}
                        onBack?.();
                    }}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
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
                    <Icono nombre="flame" className="w-9 h-9 text-orange-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">Reto Diario</h1>
                <p className="text-xs sm:text-sm text-amber-700 font-medium capitalize">{formatearFecha(hoy)}</p>
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                    Gana hasta {recompensaMaxima} totopos y mantén tu racha.
                </p>
            </header>

            {mostrarResumenHoy ? (
                <div className="bg-white rounded-3xl border-2 border-emerald-300 shadow-xl p-6 text-center animate-fade-in">
                    <div className="flex justify-center mb-2">
                        <Icono nombre="party" className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-black text-emerald-900">¡Reto de hoy completado!</h2>
                    <p className="text-sm text-amber-800 font-medium mt-1">
                        Acertaste {reto?.aciertos ?? 0} de {reto?.total ?? preguntas.length}.
                    </p>

                    <div className="grid grid-cols-2 gap-2 my-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Recompensa</p>
                            <p className="text-lg font-black text-amber-900 flex items-center justify-center gap-1">
                                +{reto?.recompensa ?? 0}
                                <img src="/totopo.png" alt="totopos" className="w-4 h-4 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            </p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Racha</p>
                            <p className="text-lg font-black text-orange-900">{rachaActual} {rachaActual === 1 ? 'día' : 'días'} <Icono nombre="flame" className="w-4 h-4 inline-block" /></p>
                        </div>
                    </div>

                    <p className="text-xs text-amber-700 mb-4">Vuelve mañana para no romper la racha.</p>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => compartirResultado({ aciertos: reto?.aciertos ?? 0, racha: rachaActual })}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl shadow-md text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                            <Icono nombre="share" className="w-4 h-4" /> Compartir resultado
                        </button>
                        {mensajeCompartir && (
                            <p className="text-[11px] font-bold text-emerald-700">{mensajeCompartir}</p>
                        )}
                        <button
                            type="button"
                            onClick={reiniciarPractica}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl shadow-md text-sm cursor-pointer"
                        >
                            Practicar de nuevo (sin recompensa)
                        </button>
                        <button
                            type="button"
                            onClick={() => onBack?.()}
                            className="w-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 rounded-2xl border border-amber-300 text-sm cursor-pointer"
                        >
                            Volver al menú
                        </button>
                    </div>
                </div>
            ) : terminado && resultado ? (
                <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl p-6 text-center animate-fade-in">
                    <div className="flex justify-center mb-2">
                        {resultado.practica
                            ? <Icono nombre="book" className="w-10 h-10 text-amber-600" />
                            : <Icono nombre="flag" className="w-10 h-10 text-amber-600" />}
                    </div>
                    <h2 className="text-xl font-black text-amber-950">
                        {resultado.practica ? 'Práctica completada' : 'Reto completado'}
                    </h2>
                    <p className="text-sm text-amber-800 font-medium mt-1">
                        Acertaste {resultado.aciertos} de {preguntas.length}.
                    </p>

                    <div className="grid grid-cols-2 gap-2 my-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Recompensa</p>
                            <p className="text-lg font-black text-amber-900">
                                {resultado.recompensa > 0 ? `+${resultado.recompensa}` : '0'}
                                {resultado.recompensa > 0 && (
                                    <img src="/totopo.png" alt="totopos" className="w-4 h-4 object-contain inline-block ml-1" onError={(e) => { e.target.style.display = 'none'; }} />
                                )}
                            </p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Racha</p>
                            <p className="text-lg font-black text-orange-900">{resultado.racha} {resultado.racha === 1 ? 'día' : 'días'} <Icono nombre="flame" className="w-4 h-4 inline-block" /></p>
                        </div>
                    </div>

                    {resultado.practica ? (
                        <p className="text-xs text-amber-700 mb-4">La práctica no otorga totopos; la recompensa de hoy ya está guardada.</p>
                    ) : (
                        <p className="text-xs text-amber-700 mb-4">Tu recompensa se guardó una sola vez. Vuelve mañana por un nuevo reto.</p>
                    )}

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => compartirResultado(resultado)}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl shadow-md text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                            <Icono nombre="share" className="w-4 h-4" /> Compartir resultado
                        </button>
                        {mensajeCompartir && (
                            <p className="text-[11px] font-bold text-emerald-700">{mensajeCompartir}</p>
                        )}
                        <button
                            type="button"
                            onClick={reiniciarPractica}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl shadow-md text-sm cursor-pointer"
                        >
                            Practicar de nuevo
                        </button>
                        <button
                            type="button"
                            onClick={() => onBack?.()}
                            className="w-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 rounded-2xl border border-amber-300 text-sm cursor-pointer"
                        >
                            Volver al menú
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl p-4 sm:p-6 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 mb-2">
                        <span>Pregunta {indice + 1} de {preguntas.length}</span>
                        <span className="bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">
                            {pregunta?.tipo === 'flora' ? (
                                <span className="inline-flex items-center gap-1"><Icono nombre="leaf" className="w-3.5 h-3.5" /> Flora</span>
                            ) : (
                                <span className="inline-flex items-center gap-1"><Icono nombre="paw" className="w-3.5 h-3.5" /> Fauna</span>
                            )}
                        </span>
                    </div>

                    <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden border border-amber-200 mb-5">
                        <div className="bg-amber-600 h-full rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-amber-950 text-center leading-snug mb-5">
                        {pregunta?.pregunta}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pregunta?.opciones.map((opcion) => (
                            <button
                                key={opcion}
                                type="button"
                                onClick={() => responder(opcion)}
                                disabled={estado !== null}
                                className={`w-full min-h-[56px] px-4 py-3 rounded-2xl border-2 font-bold text-sm sm:text-base shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-default ${claseOpcion(opcion)}`}
                            >
                                {opcion}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[58px] mt-4 text-center">
                        {estado && (
                            <>
                                <p className={`text-sm font-black ${estado === 'correcta' ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {estado === 'correcta' ? '¡Correcto!' : `La respuesta era: ${pregunta.correcta}`}
                                </p>
                                <p className="text-xs font-bold text-amber-800 mt-1 flex items-center justify-center gap-1.5">
                                    <span>{pregunta.diidxaza}</span>
                                    <span className="text-amber-500">—</span>
                                    <span>{pregunta.spanish}</span>
                                    {pregunta.image && (
                                        <img src={pregunta.image} alt={pregunta.spanish} className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                    )}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
