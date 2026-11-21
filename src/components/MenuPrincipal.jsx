import React, { useEffect, useMemo, useState } from 'react';
import { useSonido } from '../hooks/useSonido';
import { useRepaso } from '../hooks/useRepaso';
import { useRetoDiario } from '../hooks/useRetoDiario';
import { useInstalacionPWA } from '../hooks/useInstalacionPWA';
import Icono from './Icono';
import SugerenciaModal from './SugerenciaModal';
import { generarPalabraDelDia } from '../utils/retoDiario';
import { compartirTexto } from '../utils/compartir';
import { almacen } from '../utils/almacen.js';

export default function MenuPrincipal({ setVistaActual, user }) {
    const { reproducirSonido } = useSonido();
    const { pendientes, total: palabrasTotal, dominadas } = useRepaso(user);
    const { completadoHoy, reto, rachaActual, hoy } = useRetoDiario(user);
    const { disponible: instalacionNativa, instalar } = useInstalacionPWA();
    const palabraDelDia = useMemo(() => generarPalabraDelDia(hoy), [hoy]);
    const [estadoCompartir, setEstadoCompartir] = useState(null);
    const [recordatorioOculto, setRecordatorioOculto] = useState(() => almacen.getItem('recordatorioRachaOculto') === hoy);

    useEffect(() => {
        setRecordatorioOculto(almacen.getItem('recordatorioRachaOculto') === hoy);
    }, [hoy]);

    const ocultarRecordatorio = () => {
        almacen.setItem('recordatorioRachaOculto', hoy);
        setRecordatorioOculto(true);
    };

    const mostrarRecordatorio = !completadoHoy && !recordatorioOculto;

    const nivelesJuegos = useMemo(() => ({
        memorama: Number(almacen.getItem('memoramaNivel')) || 1,
        trivia: Number(almacen.getItem('triviaNivel')) || 1,
        crucigrama: Number(almacen.getItem('crucigramaNivel')) || 1,
        sopa: Number(almacen.getItem('sopaLetrasNivel')) || 1,
    }), []);

    const juegos = [
        {
            id: 'memorama',
            nombre: 'Memorama',
            desc: 'Encuentra los pares',
            icono: 'layers',
            nivel: nivelesJuegos.memorama,
            clasesIcono: 'bg-amber-100 text-amber-800 border-amber-200',
            clasesNivel: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
            id: 'trivia',
            nombre: 'Reto Trivia',
            desc: 'Pon a prueba tu velocidad',
            icono: 'zap',
            nivel: nivelesJuegos.trivia,
            clasesIcono: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            clasesNivel: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        },
        {
            id: 'crucigrama',
            nombre: 'Crucigrama',
            desc: 'Completa con pistas',
            icono: 'pencil',
            nivel: nivelesJuegos.crucigrama,
            clasesIcono: 'bg-orange-100 text-orange-800 border-orange-200',
            clasesNivel: 'bg-orange-50 text-orange-800 border-orange-200',
        },
        {
            id: 'sopa',
            nombre: 'Sopa de Letras',
            desc: 'Busca las palabras',
            icono: 'search',
            nivel: nivelesJuegos.sopa,
            clasesIcono: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            clasesNivel: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
    ];

    // Estados para controlar los modales de la interfaz de usuario
    const [mostrarModalApoyo, setMostrarModalApoyo] = useState(false);
    const [mostrarModalCreditos, setMostrarModalCreditos] = useState(false);
    const [mostrarModalInstalar, setMostrarModalInstalar] = useState(false);
    const [mostrarModalSugerencia, setMostrarModalSugerencia] = useState(false);

    // Estado para alternar entre plataformas en la ventana de instalacion ('android' o 'iphone')
    const [plataformaInstalacion, setPlataformaInstalacion] = useState('android');

    // Estado para dar retroalimentacion visual al copiar al portapapeles
    const [copiadoTexto, setCopiadoTexto] = useState('');

    const copiarAlPortapapeles = (texto, claveUnica) => {
        navigator.clipboard.writeText(texto).then(() => {
            setCopiadoTexto(claveUnica);
            setTimeout(() => setCopiadoTexto(''), 2000);
        });
    };

    // Estilo comun para la etiqueta vertical de nivel en el lateral del boton
    const estiloNivelVertical = "absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 rounded-l-2xl text-[10px]";

    const mensajeCompartir = estadoCompartir === 'copiado'
        ? '¡Copiado!'
        : estadoCompartir === 'compartido'
            ? '¡Compartido!'
            : estadoCompartir === 'no-disponible'
                ? 'No disponible'
                : '';

    const compartirPalabraDelDia = async () => {
        try { reproducirSonido('click1'); } catch (e) {}
        const resultado = await compartirTexto({
            titulo: 'Palabra del día - Bidxaga Saa',
            texto: `Palabra del día en diidxazá: «${palabraDelDia.diidxaza}» significa «${palabraDelDia.spanish}».`,
        });

        if (resultado === 'cancelado') return;
        setEstadoCompartir(resultado);
        setTimeout(() => setEstadoCompartir(null), 2500);
    };

    const abrirInstalacion = async () => {
        try { reproducirSonido('click1'); } catch (e) {}

        if (instalacionNativa) {
            const resultado = await instalar();
            if (resultado === 'accepted') return;
        }

        setMostrarModalInstalar(true);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center select-none w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">

            {/* Cabecera */}
            <div className="w-full text-center mb-5 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-200/40 to-transparent rounded-3xl filter blur-xl -z-10 transform scale-95"></div>
                <img
                    src="/images/banner.png"
                    alt="Banner Diidxaza"
                    className="mx-auto max-w-full max-h-24 sm:max-h-28 w-auto h-auto drop-shadow-xl rounded-3xl border border-amber-200/60"
                />
                <h1 className="mt-3 text-xl sm:text-2xl font-black text-amber-950 tracking-tight leading-snug">
                    Elige cómo quieres aprender <span className="text-amber-700 underline decoration-amber-400 decoration-wavy decoration-2">diidxazá</span> hoy
                </h1>
            </div>

            {/* HOY */}
            <div className="w-full flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                    <Icono nombre="calendar" className="w-4 h-4" />
                </span>
                <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">Hoy</h2>
                <div className="flex-1 h-px bg-amber-200/70" />
            </div>

            {mostrarRecordatorio && (
                <div className="w-full mb-3 bg-orange-50 border border-orange-300 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm">
                    <Icono nombre="flame" className="w-4 h-4 text-orange-600 shrink-0" />
                    <p className="flex-1 min-w-0 text-[11px] font-bold text-orange-950 leading-tight">
                        {rachaActual > 0
                            ? `Tu racha de ${rachaActual} ${rachaActual === 1 ? 'día' : 'días'} está en juego`
                            : 'Completa el reto de hoy para empezar tu racha'}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            reproducirSonido('click1');
                            setVistaActual('reto');
                        }}
                        className="text-[10px] font-black bg-orange-700 hover:bg-orange-800 text-white px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
                    >
                        Ir
                    </button>
                    <button
                        type="button"
                        onClick={ocultarRecordatorio}
                        aria-label="Ocultar recordatorio"
                        className="text-orange-700 hover:text-orange-900 p-1 cursor-pointer shrink-0"
                    >
                        <Icono nombre="x" className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6">
                {/* RETO DIARIO */}
                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido('click1');
                        setVistaActual('reto');
                    }}
                    className="text-left bg-gradient-to-br from-amber-700 to-orange-800 hover:from-amber-800 hover:to-orange-900 active:scale-[0.99] text-white rounded-3xl p-4 shadow-lg border-2 border-amber-500 transition-transform cursor-pointer flex flex-col"
                >
                    <div className="flex items-start justify-between gap-2">
                        <span className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                            <Icono nombre="flame" className="w-7 h-7" />
                        </span>
                        <span className="bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-black inline-flex items-center gap-1">
                            <Icono nombre="flame" className="w-3 h-3" />
                            {rachaActual} {rachaActual === 1 ? 'día' : 'días'}
                        </span>
                    </div>

                    <h3 className="mt-3 font-black text-xl leading-tight">Reto Diario</h3>
                    <p className="text-[11px] text-amber-100 font-medium mt-1">
                        {completadoHoy
                            ? `Completado ${reto?.aciertos ?? 0}/${reto?.total ?? 5} · +${reto?.recompensa ?? 0} totopos`
                            : '5 preguntas · hasta 50 totopos'}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-black">
                        {completadoHoy ? 'Ver resultado' : 'Empezar reto'}
                        <Icono nombre="arrowRight" className="w-4 h-4" />
                    </span>
                </button>

                {/* PALABRA DEL DÍA */}
                <div className="bg-white border-2 border-amber-200 rounded-3xl p-4 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Palabra del día</p>
                        <button
                            type="button"
                            onClick={compartirPalabraDelDia}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shrink-0"
                        >
                            <Icono nombre="share" className="w-3 h-3" /> Compartir
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <img
                            src={palabraDelDia.image}
                            alt={palabraDelDia.spanish}
                            className="w-14 h-14 object-contain bg-amber-50 rounded-xl border border-amber-200 p-1 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="min-w-0">
                            <p className="text-base font-black text-amber-950 truncate">{palabraDelDia.diidxaza}</p>
                            <p className="text-xs text-amber-700 font-medium truncate">
                                {palabraDelDia.spanish} · {palabraDelDia.tipo === 'flora' ? 'Flora' : 'Fauna'}
                            </p>
                        </div>
                    </div>

                    {mensajeCompartir && (
                        <span className="text-[10px] font-bold text-emerald-700 mt-2">{mensajeCompartir}</span>
                    )}
                </div>
            </div>

            {/* JUEGA */}
            <div className="w-full flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                    <Icono nombre="gamepad" className="w-4 h-4" />
                </span>
                <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">Juega</h2>
                <div className="flex-1 h-px bg-amber-200/70" />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mb-6">
                {juegos.map((juego) => (
                    <button
                        key={juego.id}
                        type="button"
                        onClick={() => {
                            reproducirSonido('click1');
                            setVistaActual(juego.id);
                        }}
                        className="group bg-white hover:bg-amber-50/70 border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-2 min-h-[124px] cursor-pointer"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${juego.clasesIcono}`}>
                                <Icono nombre={juego.icono} className="w-6 h-6" />
                            </span>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${juego.clasesNivel}`}>
                                Nivel {juego.nivel}
                            </span>
                        </div>

                        <div className="min-w-0">
                            <p className="font-black text-amber-950 text-sm leading-tight">{juego.nombre}</p>
                            <p className="hidden sm:block text-[11px] text-amber-700 font-medium mt-0.5">{juego.desc}</p>
                        </div>

                        <span className="mt-auto text-[11px] font-black text-amber-800 inline-flex items-center gap-1">
                            Jugar <Icono nombre="arrowRight" className="w-3 h-3" />
                        </span>
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido('click1');
                        setVistaActual('duelo');
                    }}
                    className="col-span-2 group bg-gradient-to-br from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-3xl p-4 shadow-lg border-2 border-emerald-500 transition-transform active:scale-[0.99] text-left flex items-center gap-3 cursor-pointer"
                >
                    <span className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                        <Icono nombre="users" className="w-7 h-7" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-lg leading-tight flex items-center gap-2">
                            Duelo de Memoria
                            <span className="text-[9px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded-full">1v1</span>
                        </p>
                        <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                            Reta a un amigo por turnos. Gana quien encuentre más parejas.
                        </p>
                    </div>
                    <Icono nombre="arrowRight" className="w-5 h-5 shrink-0" />
                </button>
            </div>

            {/* TU AVANCE */}
            <div className="w-full flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                    <Icono nombre="chart" className="w-4 h-4" />
                </span>
                <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">Tu avance</h2>
                <div className="flex-1 h-px bg-amber-200/70" />
            </div>

            <button
                type="button"
                onClick={() => {
                    reproducirSonido('click1');
                    setVistaActual('progreso');
                }}
                className="w-full mb-6 bg-white hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-colors cursor-pointer"
            >
                <span className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
                    <Icono nombre="chart" className="w-6 h-6 text-amber-800" />
                </span>

                <div className="flex-1 min-w-0 text-left">
                    <p className="font-black text-amber-950 text-sm">Mi progreso</p>
                    <p className="text-[11px] text-amber-700 font-medium truncate">
                        {palabrasTotal > 0
                            ? `${palabrasTotal} palabras · ${dominadas} dominadas · ${rachaActual} ${rachaActual === 1 ? 'día' : 'días'} de racha`
                            : 'Empieza a registrar tu avance'}
                    </p>
                    {pendientes > 0 && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-orange-800 bg-orange-100 border border-orange-200 rounded-full px-2 py-0.5">
                            <Icono nombre="repeat" className="w-3 h-3" /> {pendientes} por reforzar
                        </span>
                    )}
                </div>

                <Icono nombre="arrowRight" className="w-5 h-5 text-amber-700 shrink-0" />
            </button>

            {/* MÁS */}
            <div className="w-full flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                    <Icono nombre="sparkles" className="w-4 h-4" />
                </span>
                <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">Más</h2>
                <div className="flex-1 h-px bg-amber-200/70" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mb-6">
                <button
                    type="button"
                    onClick={abrirInstalacion}
                    className="bg-white hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center shadow-sm transition-colors cursor-pointer"
                >
                    <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                        <Icono nombre="smartphone" className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-black text-emerald-900 leading-tight">Instalar app</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido('click1');
                        setMostrarModalSugerencia(true);
                    }}
                    className="bg-white hover:bg-teal-50 border-2 border-teal-200 hover:border-teal-400 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center shadow-sm transition-colors cursor-pointer"
                >
                    <span className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
                        <Icono nombre="megaphone" className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-black text-teal-900 leading-tight">Sugerir</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido('click1');
                        setMostrarModalApoyo(true);
                    }}
                    className="bg-white hover:bg-orange-50 border-2 border-orange-200 hover:border-orange-400 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center shadow-sm transition-colors cursor-pointer"
                >
                    <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center border border-orange-200">
                        <Icono nombre="coffee" className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-black text-orange-900 leading-tight">Apoyar</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        reproducirSonido('click1');
                        setMostrarModalCreditos(true);
                    }}
                    className="bg-white hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center shadow-sm transition-colors cursor-pointer"
                >
                    <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                        <Icono nombre="sparkles" className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-black text-amber-900 leading-tight">Créditos</span>
                </button>
            </div>

            <p className="text-[10px] font-bold text-amber-800 text-center">
                Bidxaga Saa · Diidxazá del Istmo
            </p>


            {/* --- VENTANA MODAL: COMO INSTALAR EN CELULAR --- */}
            {mostrarModalInstalar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                reproducirSonido('click1');
                                setMostrarModalInstalar(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-4">
                            <Icono nombre="smartphone" className="w-9 h-9 text-amber-700" />
                            <h3 className="text-xl font-bold text-amber-950 mt-1">Instala la App en tu Dispositivo</h3>
                            <p className="text-xs text-amber-800 mt-1">
                                Lleva el Diidxazá siempre contigo como si fuera una aplicación normal de tu teléfono.
                            </p>
                        </div>

                        <div className="flex bg-amber-100 p-1 rounded-xl mb-4 border border-amber-200">
                            <button
                                onClick={() => {
                                    reproducirSonido('click1');
                                    setPlataformaInstalacion('android');
                                }}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${plataformaInstalacion === 'android'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-amber-900 hover:text-amber-950'
                                    }`}
                            >
                                <Icono nombre="bot" className="w-4 h-4" /> Android (Chrome)
                            </button>
                            <button
                                onClick={() => {
                                    reproducirSonido('click1');
                                    setPlataformaInstalacion('iphone');
                                }}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${plataformaInstalacion === 'iphone'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-amber-900 hover:text-amber-950'
                                    }`}
                            >
                                <Icono nombre="apple" className="w-4 h-4" /> iPhone (Safari)
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-xs text-amber-950 leading-relaxed space-y-2.5">
                            {plataformaInstalacion === 'android' ? (
                                <>
                                    <p className="font-bold text-amber-900 mb-1">Sigue estos pasos en Google Chrome:</p>
                                    <p>1. Abre esta página web desde el navegador <strong>Google Chrome</strong> en tu celular.</p>
                                    <p>2. Toca el botón de los <strong>tres puntos verticales (⋮)</strong> ubicado en la esquina superior derecha de la pantalla.</p>
                                    <p>3. Busca y selecciona la opción <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</p>
                                    <p>4. Confirma tocando en <strong>"Instalar"</strong> o <strong>"Añadir"</strong>. ¡Listo! El acceso directo aparecerá junto a tus demás aplicaciones.</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-amber-900 mb-1">Sigue estos pasos en Safari:</p>
                                    <p>1. Abre esta página web desde el navegador <strong>Safari</strong> en tu iPhone.</p>
                                    <p>2. Toca el botón de <strong>Compartir</strong> <span className="inline-block bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold">⎋</span> (el icono del cuadrado con una flecha hacia arriba en la barra inferior).</p>
                                    <p>3. Desplázate por las opciones del menú desplegable hasta encontrar <strong>"Agregar a inicio"</strong> (o "Añadir a la pantalla de inicio").</p>
                                    <p>4. Toca en <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo ya tienes la app instalada en tu iPhone!</p>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                reproducirSonido('click1');
                                setMostrarModalInstalar(false);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
                        >
                            Entendido, ¡gracias!
                        </button>
                    </div>
                </div>
            )}

            {/* --- VENTANA MODAL: APOYO Y CONTACTO --- */}
            {mostrarModalApoyo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                reproducirSonido('click1');
                                setMostrarModalApoyo(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-5">
                            <Icono nombre="coffee" className="w-9 h-9 text-amber-700" />
                            <h3 className="text-xl font-bold text-amber-950 mt-1">Apoya este Proyecto Cultural</h3>
                            <p className="text-xs text-amber-800 mt-1">
                                ¡Gracias por ayudar a mantener vivo y difundir el Diidxazá de Unión Hidalgo, Oaxaca! Tu apoyo impulsa la creación de más contenido y herramientas educativas.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                                    <Icono nombre="card" className="w-4 h-4" /> Datos para Depósito / Transferencia
                                </h4>
                                {copiadoTexto && (
                                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full animate-bounce">
                                        {copiadoTexto}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-amber-900 space-y-2 font-medium">
                                <p><strong>Banco:</strong> <span className="text-gray-700">BBVA</span></p>

                                <div
                                    onClick={() => {
                                        reproducirSonido('click1');
                                        copiarAlPortapapeles("012180015626844417", "¡CLABE copiada!");
                                    }}
                                    className="group bg-white p-2 rounded-xl border border-amber-200 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex items-center justify-between"
                                    title="Click para copiar"
                                >
                                    <div>
                                        <strong className="block text-[10px] text-amber-800 uppercase">CLABE Interbancaria (Click para copiar):</strong>
                                        <span className="text-gray-700 font-mono tracking-wide">012180015626844417</span>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Icono nombre="clipboard" className="w-3.5 h-3.5" /></span>
                                </div>

                                <div
                                    onClick={() => {
                                        reproducirSonido('click1');
                                        copiarAlPortapapeles("4152314216691959", "¡Tarjeta copiada sin espacios!");
                                    }}
                                    className="group bg-white p-2 rounded-xl border border-amber-200 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex items-center justify-between"
                                    title="Click para copiar sin espacios"
                                >
                                    <div>
                                        <strong className="block text-[10px] text-amber-800 uppercase">Número de Tarjeta (Click para copiar):</strong>
                                        <span className="text-gray-700 font-mono tracking-wide">4152 3142 1669 1959</span>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Icono nombre="clipboard" className="w-3.5 h-3.5" /></span>
                                </div>

                                <div
                                    onClick={() => {
                                        reproducirSonido('click1');
                                        copiarAlPortapapeles("EDREY MANZO MATUS", "¡Nombre copiado!");
                                    }}
                                    className="group bg-white p-2 rounded-xl border border-amber-200 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex items-center justify-between"
                                    title="Click para copiar nombre"
                                >
                                    <div>
                                        <strong className="block text-[10px] text-amber-800 uppercase">A nombre de (Click para copiar):</strong>
                                        <span className="text-gray-700 font-bold">EDREY MANZO MATUS</span>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Icono nombre="clipboard" className="w-3.5 h-3.5" /></span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                            <h4 className="font-bold text-orange-950 text-sm mb-2 flex items-center gap-1.5">
                                <Icono nombre="globe" className="w-4 h-4" /> Redes Sociales y Contacto
                            </h4>
                            <div className="flex flex-col gap-2 text-xs font-semibold text-amber-900">
                                <a
                                    href="https://instagram.com/edreyngasi"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => reproducirSonido('click1')}
                                    className="flex items-center justify-between hover:bg-orange-100 transition-colors bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm"
                                >
                                    <span className="flex items-center gap-2"><Icono nombre="camera" className="w-4 h-4" /> Instagram: <span className="font-normal text-gray-600">@edreyngasi</span></span>
                                    <span className="text-orange-700 font-bold">Ir →</span>
                                </a>

                                <a
                                    href="https://www.facebook.com/ezamna/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => reproducirSonido('click1')}
                                    className="flex items-center justify-between hover:bg-orange-100 transition-colors bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm"
                                >
                                    <span className="flex items-center gap-2"><Icono nombre="book" className="w-4 h-4" /> Facebook: <span className="font-normal text-gray-600">Ver Perfil</span></span>
                                    <span className="text-orange-700 font-bold">Ir →</span>
                                </a>

                                <div
                                    onClick={() => {
                                        reproducirSonido('click1');
                                        copiarAlPortapapeles("zamna.ed@gmail.com", "¡Correo copiado!");
                                    }}
                                    className="group flex items-center justify-between hover:bg-orange-100 transition-colors bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm cursor-pointer"
                                    title="Click para copiar correo"
                                >
                                    <span className="flex items-center gap-2"><Icono nombre="mail" className="w-4 h-4" /> Correo: <span className="font-normal text-gray-600">zamna.ed@gmail.com</span></span>
                                    <span className="text-xs bg-orange-100 text-orange-900 px-2 py-1 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors"><Icono nombre="clipboard" className="w-3.5 h-3.5" /></span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                reproducirSonido('click1');
                                setMostrarModalApoyo(false);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
                        >
                            ¡Entendido, muchas gracias!
                        </button>
                    </div>
                </div>
            )}

            {/* --- VENTANA MODAL: CREDITOS Y PROPOSITO CULTURAL --- */}
            {mostrarModalCreditos && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                reproducirSonido('click1');
                                setMostrarModalCreditos(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-4">
                            <Icono nombre="paw" className="w-9 h-9 text-amber-700" />
                            <h3 className="text-xl font-bold text-amber-950 mt-1">Créditos y Propósito Cultural</h3>
                            <p className="text-xs text-amber-800 font-medium">Proyecto Bidxaga Saa</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 space-y-3 text-xs text-amber-950 leading-relaxed">
                            <p>
                                Este proyecto ha sido desarrollado con mucho orgullo e ilusión por <strong>Edrey Ngasi</strong>, con el firme propósito de preservar, rescatar y difundir el <strong>Diidxazá</strong> (Zapoteco del Istmo) de Unión Hidalgo, Oaxaca.
                            </p>
                            <p>
                                Nada de esto sería posible sin el esfuerzo conjunto de muchas personas que aportan su granito de arena. Queremos reconocer de manera muy especial el invaluable trabajo de <strong>Guiichi bi</strong>, quien ha fungido como un gran amigo, guía y fuente fundamental de conocimiento, abriéndome de nuevo las puertas a una parte de mí que sentía perdida.
                            </p>
                            <p className="text-center italic text-amber-800 font-semibold pt-1">
                                "Preservar nuestra lengua es mantener vivas nuestras raíces."
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                reproducirSonido('click1');
                                setMostrarModalCreditos(false);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {mostrarModalSugerencia && (
                <SugerenciaModal
                    user={user}
                    onClose={() => setMostrarModalSugerencia(false)}
                />
            )}
        </div>
    );
}