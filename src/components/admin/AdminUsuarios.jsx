import React, { useEffect, useMemo, useState } from 'react';
import Icono from '../Icono.jsx';
import AdminConfirmacion from './AdminConfirmacion.jsx';
import { VIDAS_POR_JUEGO, normalizarVidas } from '../../utils/vidas.js';
import { calcularNivelCuenta } from '../../utils/Nivelcuenta.js';
import { generarCSV, descargarArchivo } from '../../utils/csv.js';
import {
    actualizarRolUsuario,
    buscarUsuarios,
    cargarUsuarioDetalle,
    cargarUsuariosPagina,
    regalarTotoposUsuario,
} from '../../services/admin/adminUsuarios.js';

const formatearFecha = (valor) => {
    if (!valor) return '—';
    const fecha = valor?.toDate ? valor.toDate() : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '—';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const rolTexto = (rol) => (rol === 'admin' ? 'Administrador' : 'Usuario');

const nivelJuego = (progreso, juego) => {
    const datos = progreso?.[juego];
    return datos?.nivel ?? datos?.level ?? '—';
};

export default function AdminUsuarios({ user, onToast, puedeCambiarRoles = false }) {
    const [usuarios, setUsuarios] = useState([]);
    const [ultimo, setUltimo] = useState(null);
    const [hayMas, setHayMas] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState(null);
    const [buscando, setBuscando] = useState(false);
    const [seleccionado, setSeleccionado] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [cantidad, setCantidad] = useState('');
    const [motivo, setMotivo] = useState('');
    const [contarHistorico, setContarHistorico] = useState(false);
    const [rolSeleccionado, setRolSeleccionado] = useState('');
    const [confirmacion, setConfirmacion] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const listaVisible = resultadosBusqueda ?? usuarios;

    const cargarInicial = async () => {
        setCargando(true);
        setError(false);
        try {
            const { usuarios: lista, ultimo: ultimoDoc, hayMas: mas } = await cargarUsuariosPagina();
            setUsuarios(lista);
            setUltimo(ultimoDoc);
            setHayMas(mas);
            setResultadosBusqueda(null);
        } catch (err) {
            console.error('No se pudieron cargar los usuarios:', err);
            setError(true);
        } finally {
            setCargando(false);
        }
    };

    const cargarMas = async () => {
        if (!ultimo || !hayMas) return;
        setCargando(true);
        try {
            const { usuarios: lista, ultimo: ultimoDoc, hayMas: mas } = await cargarUsuariosPagina({ despues: ultimo });
            setUsuarios((previos) => [...previos, ...lista]);
            setUltimo(ultimoDoc);
            setHayMas(mas);
        } catch (err) {
            console.error('No se pudieron cargar más usuarios:', err);
            onToast?.('No se pudieron cargar más usuarios.', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarInicial();
    }, []);

    const ejecutarBusqueda = async (evento) => {
        evento.preventDefault();
        const texto = busqueda.trim();
        if (!texto) {
            setResultadosBusqueda(null);
            return;
        }

        setBuscando(true);
        try {
            const encontrados = await buscarUsuarios(texto);
            setResultadosBusqueda(encontrados);
        } catch (err) {
            console.error('No se pudo buscar usuarios:', err);
            onToast?.('No se pudo realizar la búsqueda.', 'error');
        } finally {
            setBuscando(false);
        }
    };

    const abrirDetalle = async (usuario) => {
        setSeleccionado(usuario);
        setDetalle(usuario);
        setRolSeleccionado(usuario.role === 'admin' ? 'admin' : '');
        setCantidad('');
        setMotivo('');
        setContarHistorico(false);
        setCargandoDetalle(true);
        try {
            const fresco = await cargarUsuarioDetalle(usuario.id);
            if (fresco) {
                setDetalle(fresco);
                setRolSeleccionado(fresco.role === 'admin' ? 'admin' : '');
            }
        } catch (err) {
            console.error('No se pudo cargar el detalle del usuario:', err);
        } finally {
            setCargandoDetalle(false);
        }
    };

    const refrescarLista = async () => {
        if (resultadosBusqueda) {
            const encontrados = await buscarUsuarios(busqueda);
            setResultadosBusqueda(encontrados);
        } else {
            await cargarInicial();
        }
    };

    const pedirRegalo = () => {
        const monto = Math.floor(Number(cantidad));
        if (!Number.isFinite(monto) || monto <= 0 || monto > 10000) {
            onToast?.('La cantidad debe estar entre 1 y 10000 totopos.', 'error');
            return;
        }
        setConfirmacion({
            tipo: 'regalo',
            titulo: 'Regalar totopos',
            mensaje: `¿Enviar ${monto} totopos a ${detalle?.nombre || detalle?.email || 'este usuario'}?`,
            peligro: false,
            cantidad: monto,
        });
    };

    const pedirRol = () => {
        if (!puedeCambiarRoles) {
            onToast?.('Los cambios de rol requieren el custom claim admin. Ejecuta el script de administrador.', 'info');
            return;
        }
        if (esMiUsuario) {
            onToast?.('No puedes cambiar tu propio rol desde este panel.', 'info');
            return;
        }
        const rolActual = detalle?.role === 'admin' ? 'admin' : '';
        if (rolSeleccionado === rolActual) {
            onToast?.('El usuario ya tiene ese rol.', 'info');
            return;
        }
        setConfirmacion({
            tipo: 'rol',
            titulo: rolSeleccionado === 'admin' ? 'Asignar administrador' : 'Quitar administrador',
            mensaje: `¿Cambiar el rol de ${detalle?.nombre || detalle?.email || 'este usuario'} a ${rolTexto(rolSeleccionado)}?`,
            peligro: rolSeleccionado !== 'admin',
        });
    };

    const confirmarAccion = async () => {
        if (!confirmacion || !detalle) return;
        setProcesando(true);

        try {
            if (confirmacion.tipo === 'regalo') {
                await regalarTotoposUsuario({
                    uid: detalle.id,
                    cantidad: confirmacion.cantidad,
                    motivo,
                    contarHistorico,
                    actor: user,
                });
                onToast?.(`Se regalaron ${confirmacion.cantidad} totopos.`, 'exito');
                setCantidad('');
                setMotivo('');
                setContarHistorico(false);
            } else {
                await actualizarRolUsuario({
                    uid: detalle.id,
                    rol: rolSeleccionado,
                    actor: user,
                });
                onToast?.('Rol actualizado correctamente.', 'exito');
            }

            setConfirmacion(null);
            const fresco = await cargarUsuarioDetalle(detalle.id);
            if (fresco) {
                setDetalle(fresco);
                setRolSeleccionado(fresco.role === 'admin' ? 'admin' : '');
            }
            await refrescarLista();
        } catch (err) {
            console.error('No se pudo completar la acción administrativa:', err);
            const mensaje = err?.message === 'ULTIMO_ADMIN'
                ? 'No puedes quitar el rol al último administrador por rol.'
                : 'No se pudo completar la acción. Inténtalo de nuevo.';
            onToast?.(mensaje, 'error');
        } finally {
            setProcesando(false);
        }
    };

    const exportar = () => {
        const filas = listaVisible;
        if (filas.length === 0) {
            onToast?.('No hay usuarios para exportar.', 'info');
            return;
        }

        const csv = generarCSV(filas, [
            { titulo: 'Nombre', valor: (u) => u.nombre || '' },
            { titulo: 'Correo', valor: (u) => u.email || '' },
            { titulo: 'UID', valor: (u) => u.id },
            { titulo: 'Rol', valor: (u) => rolTexto(u.role) },
            { titulo: 'Totopos', valor: (u) => u.totopos ?? 0 },
            { titulo: 'Totopos históricos', valor: (u) => u.totoposHistoricos ?? 0 },
            { titulo: 'Vidas', valor: (u) => Object.values(normalizarVidas(u.vidas)).reduce((total, valor) => total + valor, 0) },
            { titulo: 'Creado', valor: (u) => formatearFecha(u.createdAt) },
            { titulo: 'Racha', valor: (u) => u.rachaReto?.dias ?? 0 },
        ]);

        descargarArchivo('usuarios-bidxaga.csv', csv);
        onToast?.('CSV de usuarios generado.', 'exito');
    };

    const vidasDetalle = useMemo(() => normalizarVidas(detalle?.vidas), [detalle?.vidas]);
    const esMiUsuario = detalle?.id === user?.uid;
    const nivelCuenta = calcularNivelCuenta(
        Math.max(Number(detalle?.totoposHistoricos) || 0, Number(detalle?.totopos) || 0)
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                        <Icono nombre="users" className="w-5 h-5 text-amber-700" /> Usuarios
                    </h2>
                    <p className="text-[11px] text-amber-700 font-medium">
                        {listaVisible.length} cargados {resultadosBusqueda ? 'en la búsqueda' : 'en esta página'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={exportar}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Icono nombre="clipboard" className="w-4 h-4" /> CSV
                    </button>
                    <button
                        type="button"
                        onClick={cargarInicial}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Icono nombre="refresh" className="w-4 h-4" /> Actualizar
                    </button>
                </div>
            </div>

            <form onSubmit={ejecutarBusqueda} className="bg-white rounded-2xl border-2 border-amber-200 p-3 shadow-sm flex flex-col sm:flex-row gap-2">
                <label className="relative flex-1">
                    <span className="sr-only">Buscar usuarios</span>
                    <Icono nombre="search" className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(evento) => setBusqueda(evento.target.value)}
                        placeholder="Correo, nombre o UID"
                        className="w-full bg-amber-50 border border-amber-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                    />
                </label>
                <button
                    type="submit"
                    disabled={buscando}
                    className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                    {buscando ? 'Buscando…' : 'Buscar'}
                </button>
                {resultadosBusqueda && (
                    <button
                        type="button"
                        onClick={() => {
                            setBusqueda('');
                            setResultadosBusqueda(null);
                            cargarInicial();
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                    >
                        Limpiar
                    </button>
                )}
            </form>

            {cargando && listaVisible.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((indice) => (
                        <div key={indice} className="h-24 bg-amber-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold text-red-800">No se pudieron cargar los usuarios.</p>
                    <button type="button" onClick={cargarInicial} className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                        Reintentar
                    </button>
                </div>
            ) : listaVisible.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                    <Icono nombre="users" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-900">No se encontraron usuarios.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {listaVisible.map((usuario) => (
                        <article key={usuario.id} className="bg-white rounded-2xl border-2 border-amber-200 p-3 shadow-sm flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-amber-950 truncate">{usuario.nombre || 'Sin nombre'}</p>
                                    <p className="text-[11px] text-amber-800 truncate">{usuario.email || 'Sin correo'}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                    usuario.role === 'admin'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                    {rolTexto(usuario.role)}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-amber-800">
                                <span>Totopos: {usuario.totopos ?? 0}</span>
                                <span>Vidas: {Object.values(normalizarVidas(usuario.vidas)).reduce((total, valor) => total + valor, 0)}</span>
                                <span>Creado: {formatearFecha(usuario.createdAt)}</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => abrirDetalle(usuario)}
                                className="self-start mt-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                                <Icono nombre="eye" className="w-3 h-3" /> Ver detalle
                            </button>
                        </article>
                    ))}
                </div>
            )}

            {!resultadosBusqueda && hayMas && (
                <button
                    type="button"
                    onClick={cargarMas}
                    disabled={cargando}
                    className="self-center bg-amber-100 hover:bg-amber-200 disabled:opacity-60 text-amber-950 border border-amber-300 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
                >
                    {cargando ? 'Cargando…' : 'Cargar más usuarios'}
                </button>
            )}

            {seleccionado && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="detalle-usuario" className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-amber-700">Detalle de usuario</p>
                                <h2 id="detalle-usuario" className="text-lg font-black text-amber-950 truncate">{detalle?.nombre || 'Sin nombre'}</h2>
                                <p className="text-xs text-amber-800 truncate">{detalle?.email || 'Sin correo'}</p>
                            </div>
                            <button type="button" onClick={() => setSeleccionado(null)} aria-label="Cerrar detalle" className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer">
                                <Icono nombre="x" className="w-5 h-5" />
                            </button>
                        </div>

                        {cargandoDetalle && !detalle ? (
                            <p className="text-center text-xs text-amber-900 py-6 font-bold">Cargando detalle…</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900">
                                    <p><strong>UID:</strong> <span className="break-all">{detalle?.id}</span></p>
                                    <p><strong>Rol:</strong> {rolTexto(detalle?.role)}</p>
                                    <p><strong>Creado:</strong> {formatearFecha(detalle?.createdAt)}</p>
                                    <p><strong>Nivel de cuenta:</strong> {nivelCuenta}</p>
                                    <p><strong>Totopos:</strong> {detalle?.totopos ?? 0}</p>
                                    <p><strong>Históricos:</strong> {detalle?.totoposHistoricos ?? 0}</p>
                                </div>

                                <section className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                                    <h3 className="text-[11px] font-black uppercase text-amber-800 mb-2">Vidas por juego</h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {Object.entries(VIDAS_POR_JUEGO).map(([juego, config]) => (
                                            <div key={juego} className="flex items-center justify-between text-[10px] font-bold text-amber-900 bg-white border border-amber-200 rounded-lg px-2 py-1">
                                                <span>{config.etiqueta}</span>
                                                <span>{vidasDetalle[juego] ?? config.inicial}/{config.max}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                                    <h3 className="text-[11px] font-black uppercase text-amber-800 mb-2">Progreso y logros</h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {Object.keys(VIDAS_POR_JUEGO).map((juego) => (
                                            <div key={juego} className="text-[10px] font-bold text-amber-900 bg-white border border-amber-200 rounded-lg px-2 py-1">
                                                {VIDAS_POR_JUEGO[juego].etiqueta}: Nivel {nivelJuego(detalle?.progreso, juego)}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-800 mt-2">
                                        Logros: {Array.isArray(detalle?.logrosDesbloqueados) ? detalle.logrosDesbloqueados.length : 0}
                                    </p>
                                    <p className="text-[10px] font-bold text-amber-800 mt-1">
                                        Reto: {detalle?.retoDiario?.aciertos ?? '—'}/{detalle?.retoDiario?.total ?? 5} · Racha: {detalle?.rachaReto?.dias ?? 0}
                                    </p>
                                </section>

                                <section className="mt-3 bg-white border-2 border-amber-200 rounded-2xl p-3">
                                    <h3 className="text-[11px] font-black uppercase text-amber-800 mb-2">Regalar totopos</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="10000"
                                            value={cantidad}
                                            onChange={(evento) => setCantidad(evento.target.value)}
                                            placeholder="Cantidad (1–10000)"
                                            aria-label="Cantidad de totopos a regalar"
                                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                        />
                                        <input
                                            type="text"
                                            value={motivo}
                                            onChange={(evento) => setMotivo(evento.target.value)}
                                            maxLength={300}
                                            placeholder="Motivo (opcional)"
                                            aria-label="Motivo del regalo"
                                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-amber-800 mt-2">
                                        <input type="checkbox" checked={contarHistorico} onChange={(evento) => setContarHistorico(evento.target.checked)} />
                                        Contar para totopos históricos y nivel de cuenta
                                    </label>
                                    <button type="button" onClick={pedirRegalo} className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                                        Regalar totopos
                                    </button>
                                </section>

                                <section className="mt-3 bg-white border-2 border-amber-200 rounded-2xl p-3">
                                    <h3 className="text-[11px] font-black uppercase text-amber-800 mb-2">Rol administrativo</h3>
                                    {esMiUsuario ? (
                                        <p className="text-[10px] text-amber-700">
                                            No puedes cambiar tu propio rol desde este panel. Pídeselo a otro administrador.
                                        </p>
                                    ) : !puedeCambiarRoles ? (
                                        <p className="text-[10px] text-amber-700">
                                            Los cambios de rol requieren el custom claim <code>admin</code>. Ejecuta el script de administrador y vuelve a iniciar sesión.
                                        </p>
                                    ) : (
                                        <>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <select
                                                    value={rolSeleccionado}
                                                    onChange={(evento) => setRolSeleccionado(evento.target.value)}
                                                    aria-label="Rol del usuario"
                                                    className="flex-1 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-amber-950 outline-none focus:border-amber-500"
                                                >
                                                    <option value="">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                                <button type="button" onClick={pedirRol} className="bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer">
                                                    Guardar rol
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-amber-700 mt-2">
                                                El último administrador por rol no puede quitarse el rol. Los administradores por custom claim no aparecen en este conteo.
                                            </p>
                                        </>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                </div>
            )}

            <AdminConfirmacion
                abierto={Boolean(confirmacion)}
                titulo={confirmacion?.titulo || ''}
                mensaje={confirmacion?.mensaje || ''}
                onConfirmar={confirmarAccion}
                onCancelar={() => setConfirmacion(null)}
                textoConfirmar={confirmacion?.tipo === 'regalo' ? 'Regalar' : 'Cambiar rol'}
                peligro={Boolean(confirmacion?.peligro)}
                cargando={procesando}
            />
        </div>
    );
}
