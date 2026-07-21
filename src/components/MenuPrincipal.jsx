import React, { useState } from 'react';

export default function MenuPrincipal({ setVistaActual }) {
    // Estados para controlar los modales de la interfaz de usuario
    const [mostrarModalApoyo, setMostrarModalApoyo] = useState(false);
    const [mostrarModalCreditos, setMostrarModalCreditos] = useState(false);
    const [mostrarModalInstalar, setMostrarModalInstalar] = useState(false);

    // Estado para alternar entre plataformas en la ventana de instalación ('android' o 'iphone')
    const [plataformaInstalacion, setPlataformaInstalacion] = useState('android');

    // Estado para dar retroalimentación visual al copiar al portapapeles
    const [copiadoTexto, setCopiadoTexto] = useState('');

    const copiarAlPortapapeles = (texto, claveUnica) => {
        navigator.clipboard.writeText(texto).then(() => {
            setCopiadoTexto(claveUnica);
            setTimeout(() => setCopiadoTexto(''), 2000); // Se quita el aviso a los 2 segundos
        });
    };

    return (
        <div className="max-w-md mx-auto px-5 py-8 sm:py-12 flex flex-col items-center select-none w-full pb-[env(safe-area-inset-bottom)]">

            {/* Cabecera / Elemento Gráfico Icónico */}
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
                <div className="inline-block px-3 py-1 bg-amber-100/80 border border-amber-300/60 rounded-full mb-2.5">
                    <p className="text-[11px] font-extrabold tracking-widest text-amber-900 uppercase">Portal Educativo</p>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight leading-snug">
                    Elige cómo quieres aprender <span className="text-amber-700 underline decoration-amber-400 decoration-wavy decoration-2">diidxazá</span> hoy
                </h1>
            </div>

            {/* SECCIÓN DE JUEGOS CON UN ESTILO VISUAL DE TARJETAS ELEVADAS */}
            <div className="flex flex-col gap-4 w-full mb-8">

                {/* 1. Tarjeta Botón Memorama */}
                <button
                    onClick={() => setVistaActual('memorama')}
                    className="group relative bg-white hover:bg-amber-50/80 active:scale-98 text-amber-950 p-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-amber-200/80 hover:border-amber-400 flex items-center justify-between overflow-hidden"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-500 to-amber-700"></div>
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

                {/* 2. Tarjeta Botón Sopa de Letras */}
                <button
                    onClick={() => setVistaActual('sopa')}
                    className="group relative bg-white hover:bg-emerald-50/80 active:scale-98 text-emerald-950 p-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-emerald-200/80 hover:border-emerald-400 flex items-center justify-between overflow-hidden"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-500 to-emerald-700"></div>
                    <div className="flex items-center gap-4 pl-2">
                        <span className="text-3xl p-3 bg-emerald-100/80 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">🔎</span>
                        <div className="text-left">
                            <span className="text-lg sm:text-xl block font-black text-emerald-950 tracking-tight">Sopa de Letras</span>
                            <span className="text-xs font-medium text-emerald-800/80">Busca las palabras ocultas</span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-emerald-100/60 flex items-center justify-center text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 mr-1 shadow-xs">
                        <span className="text-sm font-bold">→</span>
                    </div>
                </button>

                {/* 3. Tarjeta Botón Crucigrama */}
                <button
                    onClick={() => setVistaActual('crucigrama')}
                    className="group relative bg-white hover:bg-orange-50/80 active:scale-98 text-orange-950 p-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-orange-200/80 hover:border-orange-400 flex items-center justify-between overflow-hidden"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-500 to-orange-700"></div>
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

            </div>

            {/* SECCIÓN INFERIOR: BOTONES SECUNDARIOS ESTILIZADOS */}
            <div className="w-full bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-inner">

                {/* Botón de Cómo Instalar */}
                <button
                    onClick={() => setMostrarModalInstalar(true)}
                    className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl border border-amber-900 flex items-center justify-center gap-2.5 transition-all shadow-md text-sm"
                >
                    <span className="text-base">📱</span> ¿Cómo instalar esta App en tu celular?
                </button>

                {/* Botón de Invítame un Café / Apoyo */}
                <button
                    onClick={() => setMostrarModalApoyo(true)}
                    className="w-full bg-white hover:bg-amber-100/60 active:scale-98 text-amber-950 font-bold py-3 px-4 rounded-xl border border-amber-300/80 flex items-center justify-center gap-2.5 transition-all shadow-sm text-sm"
                >
                    <span className="text-base">☕</span> Invítame un café / Apoya el proyecto
                </button>

                {/* Botón de Créditos */}
                <button
                    onClick={() => setMostrarModalCreditos(true)}
                    className="w-full py-2 text-amber-800 hover:text-amber-950 text-xs font-extrabold tracking-wide uppercase transition-colors text-center"
                >
                    ✨ Ver Créditos y Propósito Cultural
                </button>
            </div>

            {/* --- VENTANA MODAL: ¿CÓMO INSTALAR EN CELULAR? --- */}
            {mostrarModalInstalar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">

                        {/* Botón de cerrar */}
                        <button
                            onClick={() => setMostrarModalInstalar(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
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

                        {/* SELECTOR DE PLATAFORMA (PESTAÑAS) */}
                        <div className="flex bg-amber-100 p-1 rounded-xl mb-4 border border-amber-200">
                            <button
                                onClick={() => setPlataformaInstalacion('android')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${plataformaInstalacion === 'android'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'text-amber-900 hover:text-amber-950'
                                    }`}
                            >
                                🤖 Android (Chrome)
                            </button>
                            <button
                                onClick={() => setPlataformaInstalacion('iphone')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${plataformaInstalacion === 'iphone'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'text-amber-900 hover:text-amber-950'
                                    }`}
                            >
                                🍏 iPhone (Safari)
                            </button>
                        </div>

                        {/* CONTENIDO DE INSTRUCCIONES */}
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

                        {/* Botón de Cerrar Modal */}
                        <button
                            onClick={() => setMostrarModalInstalar(false)}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors"
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

                        {/* Botón de cerrar */}
                        <button
                            onClick={() => setMostrarModalApoyo(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
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

                        {/* SECCIÓN DE DEPÓSITOS / CUENTAS (CON COPIA AL PORTAPAPELES) */}
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

                        {/* SECCIÓN DE REDES SOCIALES Y CONTACTO (CON ENLACES REALES Y CORREO CLICKEABLE) */}
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

                        {/* Botón de Cerrar Modal */}
                        <button
                            onClick={() => setMostrarModalApoyo(false)}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors"
                        >
                            ¡Entendido, muchas gracias!
                        </button>

                    </div>
                </div>
            )}

            {/* --- VENTANA MODAL: CRÉDITOS Y PROPÓSITO CULTURAL --- */}
            {mostrarModalCreditos && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 w-full max-w-md flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">

                        {/* Botón de cerrar */}
                        <button
                            onClick={() => setMostrarModalCreditos(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-4">
                            <span className="text-3xl">🐾</span>
                            <h3 className="text-xl font-bold text-amber-950 mt-1">Créditos y Propósito Cultural</h3>
                            <p className="text-xs text-amber-800 font-medium">Proyecto Bidxaga Saa</p>
                        </div>

                        {/* CONTENIDO DE AGRADECIMIENTOS */}
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

                        {/* Botón de Cerrar Modal */}
                        <button
                            onClick={() => setMostrarModalCreditos(false)}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors"
                        >
                            Cerrar
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}