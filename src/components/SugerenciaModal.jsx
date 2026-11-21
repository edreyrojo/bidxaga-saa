import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useSonido } from '../hooks/useSonido.js';
import Icono from './Icono.jsx';

const TIPOS = [
    { id: 'palabra', label: 'Palabra nueva' },
    { id: 'correccion', label: 'Corrección' },
    { id: 'audio', label: 'Audio / pronunciación' },
    { id: 'otro', label: 'Otro' },
];

const FORM_INICIAL = {
    tipo: 'palabra',
    palabra: '',
    significado: '',
    categoria: '',
    notas: '',
    contacto: '',
    website: '',
};

export default function SugerenciaModal({ user, onClose }) {
    const { reproducirSonido } = useSonido();
    const [form, setForm] = useState(FORM_INICIAL);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');

    const cambiar = (campo) => (evento) => {
        setForm((previo) => ({ ...previo, [campo]: evento.target.value }));
        if (error) setError('');
    };

    const enviar = async (evento) => {
        evento.preventDefault();

        // Campo trampa para bots: si viene lleno, no se envía nada.
        if (form.website) {
            setEnviado(true);
            return;
        }

        const palabra = form.palabra.trim();
        const significado = form.significado.trim();

        if (palabra.length < 2) {
            setError('Escribe la palabra o frase en diidxazá.');
            return;
        }
        if (significado.length < 1) {
            setError('Escribe el significado en español.');
            return;
        }

        setEnviando(true);
        setError('');

        try {
            await addDoc(collection(db, 'sugerencias'), {
                tipo: form.tipo,
                palabra: palabra.slice(0, 120),
                significado: significado.slice(0, 240),
                categoria: form.categoria.trim().slice(0, 80),
                notas: form.notas.trim().slice(0, 500),
                contacto: form.contacto.trim().slice(0, 120),
                uid: user?.uid || null,
                estado: 'pendiente',
                origen: 'app',
                creadoEn: Date.now(),
            });

            setEnviado(true);
        } catch (err) {
            console.error('No se pudo enviar la sugerencia:', err);
            setError('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-300 w-full max-w-md relative animate-fade-in max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar sugerencia"
                    className="absolute top-3 right-3 text-amber-700 hover:text-amber-950 p-1 cursor-pointer"
                >
                    <Icono nombre="x" className="w-5 h-5" />
                </button>

                {enviado ? (
                    <div className="text-center py-4">
                        <div className="flex justify-center mb-3">
                            <Icono nombre="checkCircle" className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-black text-amber-950">¡Gracias por tu aporte!</h2>
                        <p className="text-xs text-amber-800 mt-2 mb-5 leading-relaxed">
                            Tu sugerencia fue enviada. Un administrador la revisará antes de incorporarla.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-2xl text-sm shadow-md cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-1">
                            <Icono nombre="megaphone" className="w-5 h-5 text-amber-700" />
                            <h2 className="text-lg font-black text-amber-950">Sugerir palabra o corrección</h2>
                        </div>
                        <p className="text-[11px] text-amber-700 mb-4 leading-relaxed">
                            ¿Hablas diidxazá o conoces una variante? Comparte palabras, significados o correcciones.
                            Si quieres aportar audio, deja un contacto y lo coordinamos.
                        </p>

                        <form onSubmit={enviar} className="flex flex-col gap-2.5">
                            <label className="text-[11px] font-bold text-amber-900">
                                Tipo de aporte
                                <select
                                    value={form.tipo}
                                    onChange={cambiar('tipo')}
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                >
                                    {TIPOS.map((tipo) => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="text-[11px] font-bold text-amber-900">
                                Palabra o frase en diidxazá *
                                <input
                                    type="text"
                                    value={form.palabra}
                                    onChange={cambiar('palabra')}
                                    maxLength={120}
                                    placeholder="Ej. Guendaxunu"
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                />
                            </label>

                            <label className="text-[11px] font-bold text-amber-900">
                                Significado en español *
                                <input
                                    type="text"
                                    value={form.significado}
                                    onChange={cambiar('significado')}
                                    maxLength={240}
                                    placeholder="Ej. mamey"
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                />
                            </label>

                            <label className="text-[11px] font-bold text-amber-900">
                                Categoría o variante
                                <input
                                    type="text"
                                    value={form.categoria}
                                    onChange={cambiar('categoria')}
                                    maxLength={80}
                                    placeholder="Ej. frutos, variante de Unión Hidalgo"
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                />
                            </label>

                            <label className="text-[11px] font-bold text-amber-900">
                                Notas
                                <textarea
                                    value={form.notas}
                                    onChange={cambiar('notas')}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Explica la corrección, el uso o la pronunciación."
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500 resize-none"
                                />
                            </label>

                            <label className="text-[11px] font-bold text-amber-900">
                                Contacto (opcional)
                                <input
                                    type="text"
                                    value={form.contacto}
                                    onChange={cambiar('contacto')}
                                    maxLength={120}
                                    placeholder="Correo, WhatsApp o comunidad"
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                />
                            </label>

                            {/* Campo trampa para bots */}
                            <input
                                type="text"
                                value={form.website}
                                onChange={cambiar('website')}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                className="hidden"
                            />

                            {error && (
                                <p className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={enviando}
                                className="mt-1 w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-bold py-3 rounded-2xl text-sm shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                                <Icono nombre="send" className="w-4 h-4" />
                                {enviando ? 'Enviando…' : 'Enviar sugerencia'}
                            </button>

                            <p className="text-[10px] text-amber-800 text-center">
                                No necesitas cuenta. Las sugerencias se revisan antes de publicarse.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
