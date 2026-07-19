import React, { useState } from 'react';

export default function MenuPrincipal({ setVistaActual }) {
    // Estados para controlar los modales
    const [mostrarModalApoyo, setMostrarModalApoyo] = useState(false);
    const [mostrarModalCreditos, setMostrarModalCreditos] = useState(false);

    return (
        <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
            {/* Reutilizamos tu banner icónico */}
            <img src="/images/banner.png" alt="Banner Diidxaza" className="mx-auto mb-6 max-w-full h-auto drop-shadow-md" />

            <h1 className="text-3xl font-bold text-amber-950 mb-1 text-center"></h1>
            <p className="text-amber-800 mb-6 text-center font-medium">Elige cómo quieres aprender diidxazá hoy:</p>

            <div className="flex flex-col gap-3.5 w-full">
                {/* 1. Botón Memorama */}
                <button
                    onClick={() => setVistaActual('memorama')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-amber-700 flex flex-col items-center"
                >
                    <span className="text-xl">🎴 Memorama</span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">Encuentra los pares y haz memoria</span>
                </button>

                {/* 2. Botón Sopa de Letras */}
                <button
                    onClick={() => setVistaActual('sopa')}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-green-700 flex flex-col items-center"
                >
                    <span className="text-xl">🔎 Sopa de Letras</span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">Busca las palabras ocultas</span>
                </button>

                {/* 3. Botón Crucigrama */}
                <button
                    onClick={() => setVistaActual('crucigrama')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 border-2 border-orange-700 flex flex-col items-center"
                >
                    <span className="text-xl">✏️ Crucigrama</span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">Completa los nombres con pistas</span>
                </button>
            </div>

            {/* SECCIÓN INFERIOR: BOTONES SECUNDARIOS (Créditos / Apoyo) */}
            <div className="w-full border-t border-amber-200 mt-8 pt-6 flex flex-col gap-3">
                
                {/* Botón de Invítame un Café / Apoyo (Abre el Modal) */}
                <button
                    onClick={() => setMostrarModalApoyo(true)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2.5 px-4 rounded-xl border border-amber-300 flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
                >
                    <span>☕</span> Invítame un café / Apoya el proyecto
                </button>

                {/* Botón de Créditos (Abre el Modal) */}
                <button
                    onClick={() => setMostrarModalCreditos(true)}
                    className="text-amber-800 hover:text-amber-950 text-xs font-semibold py-2 transition-colors text-center"
                >
                    ✨ Ver Créditos y Propósito Cultural
                </button>
            </div>

            {/* --- VENTANA MODAL (CUADRO FLOTANTE) DE APOYO Y CONTACTO --- */}
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

                        {/* SECCIÓN DE DEPÓSITOS / CUENTAS */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                            <h4 className="font-bold text-amber-950 text-sm mb-2 flex items-center gap-1.5">
                                <span>💳</span> Datos para Depósito / Transferencia
                            </h4>
                            <div className="text-xs text-amber-900 space-y-1.5 font-medium">
                                <p><strong>Banco:</strong> <span className="text-gray-700">BBVA</span></p>
                                <p><strong>CLABE Interbancaria:</strong> <span className="text-gray-700 font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">012180015626844417</span></p>
                                <p><strong>Número de Tarjeta:</strong> <span className="text-gray-700 font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">4152 3142 1669 1959</span></p>
                                <p><strong>A nombre de:</strong> <span className="text-gray-700">EDREY MANZO MATUS</span></p>
                            </div>
                        </div>

                        {/* SECCIÓN DE REDES SOCIALES Y CONTACTO */}
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                            <h4 className="font-bold text-orange-950 text-sm mb-2 flex items-center gap-1.5">
                                <span>🌐</span> Redes Sociales y Contacto
                            </h4>
                            <div className="flex flex-col gap-2 text-xs font-semibold text-amber-900">
                                <a href="https://instagram.com/tuusuario" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-amber-600 transition-colors bg-white p-2 rounded-xl border border-orange-100 shadow-sm">
                                    <span>📸</span> Instagram: <span className="font-normal text-gray-600">@edreyngasi</span>
                                </a>
                                <a href="https://facebook.com/tuusuario" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-amber-600 transition-colors bg-white p-2 rounded-xl border border-orange-100 shadow-sm">
                                    <span>📘</span> Facebook: <span className="font-normal text-gray-600">www.facebook.com/ezamna/</span>
                                </a>
                                <a href="mailto:tuemail@example.com" className="flex items-center gap-2 hover:text-amber-600 transition-colors bg-white p-2 rounded-xl border border-orange-100 shadow-sm">
                                    <span>📧</span> Correo: <span className="font-normal text-gray-600">zamna.ed@gmail.com</span>
                                </a>
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

            {/* --- VENTANA MODAL (CUADRO FLOTANTE) DE CRÉDITOS Y PROPÓSITO CULTURAL --- */}
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
                                "Preservar nuestra lengua es mantener vivos nuestros raíces."
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