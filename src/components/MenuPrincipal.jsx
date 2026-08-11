import React, { useState } from 'react';

export default function MenuPrincipal({ setVistaActual }) {
    // Estados para controlar los modales de la interfaz de usuario
    const [mostrarModalApoyo, setMostrarModalApoyo] = useState(false);
    const [mostrarModalCreditos, setMostrarModalCreditos] = useState(false);
    const [mostrarModalInstalar, setMostrarModalInstalar] = useState(false);

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

    return (
        <div className="max-w-md mx-auto px-5 py-8 sm:py-12 flex flex-col items-center select-none w-full pb-[env(safe-area-inset-bottom)]">

            {/* Cabecera / Elemento Grafico Iconico */}
            <div className="w-full text-center mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-200/40 to-transparent rounded-3xl filter blur-xl -z-10 transform scale-95"></div>
                <img
                    src="/images/banner.png"
                    alt="Banner Diidxaza"
                    className="mx-auto max-w-full h-auto drop-shadow-xl rounded-3xl border border-amber-200/60"
                />
            </div>

            {/* Encabezado Textual Descriptivo */}
            <div className="text-center mb-8 w-full">
                <h1 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight leading-snug">
                    Elige cómo quieres aprender <span className="text-amber-700 underline decoration-amber-400 decoration-wavy decoration-2">diidxazá</span> hoy
                </h1>
            </div>

            {/* SECCION DE JUEGOS CON NIVELES VERTICALES EN EL LATERAL */}
            <div className="flex flex-col gap-3.5 w-full mb-8">

                {/* Memorama - Inicial */}
                <button
                    onClick={() => setVistaActual('memorama')}
                    className="group relative bg-white hover:bg-amber-50/80 active:scale-98 text-amber-950 p-4 pl-9 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-amber-200/80 hover:border-amber-400 flex items-center justify-between overflow-hidden cursor-pointer"
                >
                    <span className={`${estiloNivelVertical} bg-amber-500 text-amber-950/80`}>Inicial</span>
                    <div className="flex items-center gap-4 pl-2">
                        <span className="text-3xl p-3 bg-amber-100/80 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">🎴</span>
                        <div className="text-left">
                            <span className="text-lg sm:text-xl block font-black text-amber-950 tracking-tight">Memorama</span>
                            <span className="text-xs font-medium text-amber-800/80">Encuentra los pares y haz memoria</span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-amber-100/60 flex items-center justify-center text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 mr-1 shadow-xs">
                        <span className="text-sm font-bold">→</span>
                    </div>
                </button>

                {/* Reto Trivia - Intermedio */}
                <button
                    onClick={() => setVistaActual('trivia')}
                    className="group relative bg-white hover:bg-yellow-50/80 active:scale-98 text-amber-950 p-4 pl-9 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-yellow-200/80 hover:border-yellow-400 flex items-center justify-between overflow-hidden cursor-pointer"
                >
                    <span className={`${estiloNivelVertical} bg-yellow-500 text-yellow-950/80`}>Intermedio</span>
                    <div className="flex items-center gap-4 pl-2">
                        <span className="text-3xl p-3 bg-yellow-100/80 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">⚡</span>
                        <div className="text-left">
                            <span className="text-lg sm:text-xl block font-black text-amber-950 tracking-tight">Reto Trivia</span>
                            <span className="text-xs font-medium text-amber-800/80">Pon a prueba tu velocidad mental</span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-yellow-100/60 flex items-center justify-center text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 mr-1 shadow-xs">
                        <span className="text-sm font-bold">→</span>
                    </div>
                </button>

                {/* Crucigrama - Avanzado */}
                <button
                    onClick={() => setVistaActual('crucigrama')}
                    className="group relative bg-white hover:bg-orange-50/80 active:scale-98 text-orange-950 p-4 pl-9 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-orange-200/80 hover:border-orange-400 flex items-center justify-between overflow-hidden cursor-pointer"
                >
                    <span className={`${estiloNivelVertical} bg-orange-500 text-orange-950/80`}>Avanzado</span>
                    <div className="flex items-center gap-4 pl-2">
                        <span className="text-3xl p-3 bg-orange-100/80 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">✏️</span>
                        <div className="text-left">
                            <span className="text-lg sm:text-xl block font-black text-orange-950 tracking-tight">Crucigrama</span>
                            <span className="text-xs font-medium text-orange-800/80">Completa los nombres con pistas</span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-orange-100/60 flex items-center justify-center text-orange-800 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 mr-1 shadow-xs">
                        <span className="text-sm font-bold">→</span>
                    </div>
                </button>

                {/* Sopa de Letras - Experto */}
                <button
                    onClick={() => setVistaActual('sopa')}
                    className="group relative bg-white hover:bg-emerald-50/80 active:scale-98 text-emerald-950 p-4 pl-9 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-emerald-200/80 hover:border-emerald-400 flex items-center justify-between overflow-hidden cursor-pointer"
                >
                    <span className={`${estiloNivelVertical} bg-emerald-500 text-emerald-950/80`}>Experto</span>
                    <div className="flex items-center gap-4 pl-2">
                        <span className="text-3xl p-3 bg-emerald-100/80 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">🔎</span>
                        <div className="text-left">
                            <span className="text-lg sm:text-xl block font-black text-emerald-950 tracking-tight">Sopa de Letras</span>
                            <span className="text-xs font-medium text-emerald-800/80">Busca las palabras ocultas</span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-emerald-100/60 flex items-center justify-center text-emerald-800 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 mr-1 shadow-xs">
                        <span className="text-sm font-bold">→</span>
                    </div>
                </button>

            </div>

            {/* SECCION INFERIOR: BOTONES SECUNDARIOS CON ESTETICA MEJORADA */}
            <div className="w-full bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-inner">

                {/* Boton de Como Instalar (Estilo Esmeralda / Teal moderno) */}
                <button
                    onClick={() => setMostrarModalInstalar(true)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl border border-emerald-800 flex items-center justify-center gap-2.5 transition-all shadow-md text-sm cursor-pointer"
                >
                    <span className="text-base">📱</span> ¿Cómo instalar esta App en tu celular?
                </button>

                {/* Boton de Invitame un Cafe / Apoyo (Estilo Ambar / Naranja calido) */}
                <button
                    onClick={() => setMostrarModalApoyo(true)}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl border border-orange-700 flex items-center justify-center gap-2.5 transition-all shadow-md text-sm cursor-pointer"
                >
                    <span className="text-base">☕</span> Invítame un café / Apoya el proyecto
                </button>

                {/* Boton de Creditos (Estilo Dorado brillante y legible) */}
                <button
                    onClick={() => setMostrarModalCreditos(true)}
                    className="w-full bg-amber-200/80 hover:bg-amber-300/90 active:scale-98 text-amber-950 font-extrabold py-3 px-4 rounded-xl border border-amber-300 flex items-center justify-center gap-2 transition-all shadow-xs text-xs tracking-wide uppercase cursor-pointer"
                >
                    <span>✨</span> Ver Créditos y Propósito Cultural
                </button>
            </div>

            {/* --- VENTANA MODAL: COMO INSTALAR EN CELULAR --- */}
            {mostrarModalInstalar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setMostrarModalInstalar(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-4">
                            <span className="text-3xl">📱</span>
                            <h3 className="text-xl font-bold text-amber-950 mt-1">Instala la App en tu Dispositivo</h3>
                            <p className="text-xs text-amber-800 mt-1">
                                Lleva el Diidxazá siempre contigo como si fuera una aplicación normal de tu teléfono.
                            </p>
                        </div>

                        <div className="flex bg-amber-100 p-1 rounded-xl mb-4 border border-amber-200">
                            <button
                                onClick={() => setPlataformaInstalacion('android')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${plataformaInstalacion === 'android'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-amber-900 hover:text-amber-950'
                                    }`}
                            >
                                🤖 Android (Chrome)
                            </button>
                            <button
                                onClick={() => setPlataformaInstalacion('iphone')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${plataformaInstalacion === 'iphone'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-amber-900 hover:text-amber-950'
                                    }`}
                            >
                                🍏 iPhone (Safari)
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
                            onClick={() => setMostrarModalInstalar(false)}
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
                            onClick={() => setMostrarModalApoyo(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-5">
                            <span className="text-3xl">☕</span>
                            <h3 className="text-xl font-bold text-amber-950 mt-1">Apoya este Proyecto Cultural</h3>
                            <p className="text-xs text-amber-800 mt-1">
                                ¡Gracias por ayudar a mantener vivo y difundir el Diidxazá de Unión Hidalgo, Oaxaca! Tu apoyo impulsa la creación de más contenido y herramientas educativas.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                                    <span>💳</span> Datos para Depósito / Transferencia
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
                                    onClick={() => copiarAlPortapapeles("012180015626844417", "¡CLABE copiada!")}
                                    className="group bg-white p-2 rounded-xl border border-amber-200 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex items-center justify-between"
                                    title="Click para copiar"
                                >
                                    <div>
                                        <strong className="block text-[10px] text-amber-800 uppercase">CLABE Interbancaria (Click para copiar):</strong>
                                        <span className="text-gray-700 font-mono tracking-wide">012180015626844417</span>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">📋</span>
                                </div>

                                <div
                                    onClick={() => copiarAlPortapapeles("4152314216691959", "¡Tarjeta copiada sin espacios!")}
                                    className="group bg-white p-2 rounded-xl border border-amber-200 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex items-center justify-between"
                                    title="Click para copiar sin espacios"
                                >
                                    <div>
                                        <strong className="block text-[10px] text-amber-800 uppercase">Número de Tarjeta (Click para copiar):</strong>
                                        <span className="text-gray-700 font-mono tracking-wide">4152 3142 1669 1959</span>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">📋</span>
                                </div>

                                <div
                                    onClick={() => copiarAlPortapapeles("EDREY MANZO MATUS", "¡Nombre copiado!")}
                                    className="group bg-white p-2 rounded-xl border border-amber-200 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex items-center justify-between"
                                    title="Click para copiar nombre"
                                >
                                    <div>
                                        <strong className="block text-[10px] text-amber-800 uppercase">A nombre de (Click para copiar):</strong>
                                        <span className="text-gray-700 font-bold">EDREY MANZO MATUS</span>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">📋</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                            <h4 className="font-bold text-orange-950 text-sm mb-2 flex items-center gap-1.5">
                                <span>🌐</span> Redes Sociales y Contacto
                            </h4>
                            <div className="flex flex-col gap-2 text-xs font-semibold text-amber-900">
                                <a
                                    href="https://instagram.com/edreyngasi"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between hover:bg-orange-100 transition-colors bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm"
                                >
                                    <span className="flex items-center gap-2"><span>📸</span> Instagram: <span className="font-normal text-gray-600">@edreyngasi</span></span>
                                    <span className="text-orange-600 font-bold">Ir →</span>
                                </a>

                                <a
                                    href="https://www.facebook.com/ezamna/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between hover:bg-orange-100 transition-colors bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm"
                                >
                                    <span className="flex items-center gap-2"><span>📘</span> Facebook: <span className="font-normal text-gray-600">Ver Perfil</span></span>
                                    <span className="text-orange-600 font-bold">Ir →</span>
                                </a>

                                <div
                                    onClick={() => copiarAlPortapapeles("zamna.ed@gmail.com", "¡Correo copiado!")}
                                    className="group flex items-center justify-between hover:bg-orange-100 transition-colors bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm cursor-pointer"
                                    title="Click para copiar correo"
                                >
                                    <span className="flex items-center gap-2"><span>📧</span> Correo: <span className="font-normal text-gray-600">zamna.ed@gmail.com</span></span>
                                    <span className="text-xs bg-orange-100 text-orange-900 px-2 py-1 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">📋</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setMostrarModalApoyo(false)}
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
                            onClick={() => setMostrarModalCreditos(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-4">
                            <span className="text-3xl">🐾</span>
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
                            onClick={() => setMostrarModalCreditos(false)}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}