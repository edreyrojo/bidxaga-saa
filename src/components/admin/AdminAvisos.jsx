import React, { useEffect, useState } from 'react';
import Icono from '../Icono.jsx';
import AdminConfirmacion from './AdminConfirmacion.jsx';
import {
    actualizarAviso,
    cambiarActivoAviso,
    cargarAvisosAdmin,
    crearAviso,
    eliminarAviso,
} from '../../services/admin/adminAvisos.js';

const FORM_VACIO = {
    titulo: '',
    mensaje: '',
    prioridad: 'normal',
    activo: true,
    expiraEnLocal: '',
};

const aInputLocal = (ms) => {
    if (!ms) return '';
    const fecha = new Date(ms);
    if (Number.isNaN(fecha.getTime())) return '';
    const desplazamiento = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - desplazamiento).toISOString().slice(0, 16);
};

const formatearFecha = (valor) => {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const estadoAviso = (aviso) => {
    if (aviso.activo === false) return { label: 'Inactivo', clase: 'bg-gray-100 text-gray-700 border-gray-200' };
    if (aviso.expiraEn && Number(aviso.expiraEn) < Date.now()) {
        return { label: 'Expirado', clase: 'bg-red-100 text-red-800 border-red-200' };
    }
    return { label: 'Activo', clase: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
};

export default function AdminAvisos({ user, onToast }) {
    const [avisos, setAvisos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [formulario, setFormulario] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [porEliminar, setPorEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const cargar = async () => {
        setCargando(true);
        setError(false);
        try {
            const lista = await cargarAvisosAdmin();
            setAvisos(lista);
        } catch (err) {
            console.error('No se pudieron cargar los avisos:', err);
            setError(true);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const abrirNuevo = () => {
        setForm(FORM_VACIO);
        setFormulario({ modo: 'crear' });
    };

    const abrirEditar = (aviso) => {
        setForm({
            titulo: aviso.titulo || '',
            mensaje: aviso.mensaje || '',
            prioridad: aviso.prioridad === 'alta' ? 'alta' : 'normal',
            activo: aviso.activo !== false,
            expiraEnLocal: aInputLocal(aviso.expiraEn),
        });
        setFormulario({ modo: 'editar', aviso });
    };

    const guardar = async (evento) => {
        evento.preventDefault();

        if (form.titulo.trim().length < 3) {
            onToast?.('El título debe tener al menos 3 caracteres.', 'error');
            return;
        }
        if (form.mensaje.trim().length < 1) {
            onToast?.('Escribe el mensaje del aviso.', 'error');
            return;
        }

        const expiraEn = form.expiraEnLocal ? new Date(form.expiraEnLocal).getTime() : null;
        if (form.expiraEnLocal && (!Number.isFinite(expiraEn) || expiraEn < Date.now())) {
            onToast?.('La fecha de expiración debe ser futura.', 'error');
            return;
        }

        setGuardando(true);
        try {
            if (formulario?.modo === 'editar') {
                await actualizarAviso({
                    id: formulario.aviso.id,
                    ...form,
                    expiraEn,
                    actor: user,
                });
                onToast?.('Aviso actualizado.', 'exito');
            } else {
                await crearAviso({ ...form, expiraEn, actor: user });
                onToast?.('Aviso publicado.', 'exito');
            }

            setFormulario(null);
            setForm(FORM_VACIO);
            await cargar();
        } catch (err) {
            console.error('No se pudo guardar el aviso:', err);
            onToast?.('No se pudo guardar el aviso. Inténtalo de nuevo.', 'error');
        } finally {
            setGuardando(false);
        }
    };

    const alternarActivo = async (aviso) => {
        try {
            await cambiarActivoAviso({
                id: aviso.id,
                activo: aviso.activo === false,
                actor: user,
            });
            onToast?.(aviso.activo === false ? 'Aviso activado.' : 'Aviso desactivado.', 'exito');
            await cargar();
        } catch (err) {
            console.error('No se pudo cambiar el estado del aviso:', err);
            onToast?.('No se pudo cambiar el estado del aviso.', 'error');
        }
    };

    const confirmarEliminar = async () => {
        if (!porEliminar) return;
        setEliminando(true);
        try {
            await eliminarAviso({ id: porEliminar.id, titulo: porEliminar.titulo, actor: user });
            onToast?.('Aviso eliminado.', 'exito');
            setPorEliminar(null);
            await cargar();
        } catch (err) {
            console.error('No se pudo eliminar el aviso:', err);
            onToast?.('No se pudo eliminar el aviso.', 'error');
        } finally {
            setEliminando(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                        <Icono nombre="book" className="w-5 h-5 text-amber-700" /> Avisos
                    </h2>
                    <p className="text-[11px] text-amber-700 font-medium">
                        {avisos.length} avisos cargados · Los avisos inactivos o expirados no se muestran en la app.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={abrirNuevo} className="bg-amber-700 hover:bg-amber-800 text-white rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Icono nombre="plus" className="w-4 h-4" /> Nuevo aviso
                    </button>
                    <button type="button" onClick={cargar} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Icono nombre="refresh" className="w-4 h-4" /> Actualizar
                    </button>
                </div>
            </div>

            {cargando ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((indice) => <div key={indice} className="h-28 bg-amber-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold text-red-800">No se pudieron cargar los avisos.</p>
                    <button type="button" onClick={cargar} className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">Reintentar</button>
                </div>
            ) : avisos.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                    <Icono nombre="book" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-900">No hay avisos publicados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {avisos.map((aviso) => {
                        const estado = estadoAviso(aviso);
                        return (
                            <article key={aviso.id} className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-black uppercase rounded-full px-2 py-0.5 border ${estado.clase}`}>{estado.label}</span>
                                        {aviso.prioridad === 'alta' && (
                                            <span className="text-[10px] font-black uppercase rounded-full px-2 py-0.5 border bg-orange-100 text-orange-800 border-orange-200">Alta</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-amber-700">{formatearFecha(aviso.fecha)}</span>
                                </div>

                                <h3 className="text-sm font-black text-amber-950">{aviso.titulo}</h3>
                                <p className="text-xs text-amber-800 mt-1 whitespace-pre-wrap line-clamp-3">{aviso.mensaje}</p>

                                {aviso.expiraEn && (
                                    <p className="text-[10px] font-bold text-amber-700 mt-2">Expira: {formatearFecha(aviso.expiraEn)}</p>
                                )}

                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    <button type="button" onClick={() => abrirEditar(aviso)} className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer">
                                        <Icono nombre="pencil" className="w-3 h-3" /> Editar
                                    </button>
                                    <button type="button" onClick={() => alternarActivo(aviso)} className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer">
                                        <Icono nombre={aviso.activo === false ? 'play' : 'lock'} className="w-3 h-3" /> {aviso.activo === false ? 'Activar' : 'Desactivar'}
                                    </button>
                                    <button type="button" onClick={() => setPorEliminar(aviso)} className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer">
                                        <Icono nombre="trash" className="w-3 h-3" /> Eliminar
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {formulario && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
                    <form
                        onSubmit={guardar}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="aviso-form-title"
                        className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <h2 id="aviso-form-title" className="text-lg font-black text-amber-950">
                                {formulario.modo === 'editar' ? 'Editar aviso' : 'Nuevo aviso'}
                            </h2>
                            <button type="button" onClick={() => setFormulario(null)} aria-label="Cerrar formulario" className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer">
                                <Icono nombre="x" className="w-5 h-5" />
                            </button>
                        </div>

                        <label className="block text-[11px] font-bold text-amber-900 mb-2">
                            Título
                            <input
                                type="text"
                                value={form.titulo}
                                onChange={(evento) => setForm((previo) => ({ ...previo, titulo: evento.target.value }))}
                                maxLength={120}
                                className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                            />
                        </label>

                        <label className="block text-[11px] font-bold text-amber-900 mb-2">
                            Mensaje
                            <textarea
                                value={form.mensaje}
                                onChange={(evento) => setForm((previo) => ({ ...previo, mensaje: evento.target.value }))}
                                maxLength={2000}
                                rows={5}
                                className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500 resize-none"
                            />
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="block text-[11px] font-bold text-amber-900">
                                Prioridad
                                <select
                                    value={form.prioridad}
                                    onChange={(evento) => setForm((previo) => ({ ...previo, prioridad: evento.target.value }))}
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="alta">Alta</option>
                                </select>
                            </label>
                            <label className="block text-[11px] font-bold text-amber-900">
                                Expira
                                <input
                                    type="datetime-local"
                                    value={form.expiraEnLocal}
                                    onChange={(evento) => setForm((previo) => ({ ...previo, expiraEnLocal: evento.target.value }))}
                                    className="mt-1 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                />
                            </label>
                        </div>

                        <label className="flex items-center gap-2 text-[11px] font-bold text-amber-800 mt-3">
                            <input
                                type="checkbox"
                                checked={form.activo}
                                onChange={(evento) => setForm((previo) => ({ ...previo, activo: evento.target.checked }))}
                            />
                            Activo (visible en la app)
                        </label>

                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setFormulario(null)} disabled={guardando} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2.5 rounded-xl text-xs border border-amber-300 cursor-pointer disabled:opacity-60">
                                Cancelar
                            </button>
                            <button type="submit" disabled={guardando} className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-60">
                                {guardando ? 'Guardando…' : 'Guardar aviso'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <AdminConfirmacion
                abierto={Boolean(porEliminar)}
                titulo="Eliminar aviso"
                mensaje={porEliminar ? `¿Eliminar «${porEliminar.titulo}»? Esta acción no se puede deshacer.` : ''}
                onConfirmar={confirmarEliminar}
                onCancelar={() => setPorEliminar(null)}
                textoConfirmar="Eliminar"
                peligro
                cargando={eliminando}
            />
        </div>
    );
}
