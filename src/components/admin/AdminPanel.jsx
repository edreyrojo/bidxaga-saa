import React, { useCallback, useEffect, useState } from 'react';
import Icono from '../Icono.jsx';
import AdminResumen from './AdminResumen.jsx';
import AdminAuditoria from './AdminAuditoria.jsx';
import AdminSugerencias from './AdminSugerencias.jsx';
import AdminUsuarios from './AdminUsuarios.jsx';
import AdminAvisos from './AdminAvisos.jsx';
import AdminRankings from './AdminRankings.jsx';
import AdminToast from './AdminToast.jsx';
import { useAdmin } from '../../hooks/useAdmin.js';
import { cargarResumenAdmin } from '../../services/admin/adminResumen.js';
import { contarSugerenciasPendientes } from '../../services/admin/adminSugerencias.js';

const SECCIONES = [
    { id: 'resumen', label: 'Resumen', icono: 'chart' },
    { id: 'auditoria', label: 'Auditoría', icono: 'clipboard' },
    { id: 'usuarios', label: 'Usuarios', icono: 'users' },
    { id: 'avisos', label: 'Avisos', icono: 'book' },
    { id: 'rankings', label: 'Rankings', icono: 'trophy' },
    { id: 'sugerencias', label: 'Sugerencias', icono: 'megaphone' },
    { id: 'herramientas', label: 'Herramientas', icono: 'wrench' },
];

export default function AdminPanel({
    user,
    rolDocumento,
    onBack,
    onOpenGenerador,
}) {
    const { esAdmin, esAdminClaim, verificando } = useAdmin(user, rolDocumento);
    const [seccion, setSeccion] = useState('resumen');
    const [resumen, setResumen] = useState(null);
    const [cargandoResumen, setCargandoResumen] = useState(true);
    const [errorResumen, setErrorResumen] = useState(false);
    const [pendientes, setPendientes] = useState(null);
    const [toast, setToast] = useState(null);

    const mostrarToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });
    const cerrarToast = useCallback(() => setToast(null), []);

    const cargarResumen = async () => {
        setCargandoResumen(true);
        try {
            const datos = await cargarResumenAdmin();
            setResumen(datos);
            setErrorResumen(Boolean(datos.hayErrores));
        } catch (error) {
            console.error('No se pudo cargar el resumen administrativo:', error);
            setErrorResumen(true);
        } finally {
            setCargandoResumen(false);
        }
    };

    const cargarPendientes = async () => {
        try {
            const total = await contarSugerenciasPendientes();
            setPendientes(total);
        } catch (error) {
            console.error('No se pudieron contar las sugerencias pendientes:', error);
            setPendientes(null);
        }
    };

    const recargarTodo = async () => {
        await Promise.all([cargarResumen(), cargarPendientes()]);
    };

    useEffect(() => {
        if (!esAdmin) return;
        recargarTodo();
    }, [esAdmin]);

    if (verificando && !esAdmin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-amber-900">
                <div className="w-10 h-10 rounded-full border-4 border-amber-300 border-t-amber-700 animate-spin" />
                <p className="text-sm font-bold">Verificando permisos de administrador…</p>
            </div>
        );
    }

    if (!esAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-xl max-w-sm text-center">
                    <Icono nombre="shield" className="w-10 h-10 text-amber-700 mx-auto mb-2" />
                    <h1 className="text-lg font-black text-amber-950">Acceso restringido</h1>
                    <p className="text-xs text-amber-800 mt-2 mb-4">
                        Esta sección solo está disponible para administradores.
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                        Volver al menú
                    </button>
                </div>
            </div>
        );
    }

    const nombreAdmin = user?.displayName || user?.email?.split('@')[0] || 'Administrador';

    return (
        <div className="min-h-screen bg-orange-50 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <header className="bg-gradient-to-br from-amber-800 to-orange-800 rounded-3xl p-4 sm:p-5 border-2 border-amber-500 shadow-lg text-white mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                                <Icono nombre="shield" className="w-7 h-7" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Bidxaga Saa</p>
                                <h1 className="text-xl sm:text-2xl font-black leading-tight">Panel de Administración</h1>
                                <p className="text-[11px] text-amber-100 truncate">{nombreAdmin}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                type="button"
                                onClick={recargarTodo}
                                className="bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Icono nombre="refresh" className="w-4 h-4" /> Actualizar
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-[11px] font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Icono nombre="arrowLeft" className="w-4 h-4" /> Menú
                            </button>
                        </div>
                    </div>
                </header>

                <nav className="flex gap-1.5 overflow-x-auto pb-1 mb-4 custom-scrollbar" aria-label="Secciones de administración">
                    {SECCIONES.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSeccion(item.id)}
                            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                                seccion === item.id
                                    ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                                    : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400'
                            }`}
                        >
                            <Icono nombre={item.icono} className="w-4 h-4" />
                            {item.label}
                            {item.id === 'sugerencias' && pendientes > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                    seccion === item.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                                }`}>
                                    {pendientes}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {seccion === 'resumen' && (
                    <AdminResumen
                        datos={resumen}
                        cargando={cargandoResumen}
                        error={errorResumen}
                        onRecargar={recargarTodo}
                        onIrSugerencias={() => setSeccion('sugerencias')}
                        onIrUsuarios={() => setSeccion('usuarios')}
                        onIrAvisos={() => setSeccion('avisos')}
                        onIrRankings={() => setSeccion('rankings')}
                        onIrAuditoria={() => setSeccion('auditoria')}
                        onOpenGenerador={onOpenGenerador}
                    />
                )}

                {seccion === 'sugerencias' && (
                    <AdminSugerencias
                        user={user}
                        onPendientesChange={recargarTodo}
                        onToast={mostrarToast}
                    />
                )}

                {seccion === 'auditoria' && (
                    <AdminAuditoria onToast={mostrarToast} />
                )}

                {seccion === 'usuarios' && (
                    <AdminUsuarios user={user} onToast={mostrarToast} puedeCambiarRoles={esAdminClaim} />
                )}

                {seccion === 'avisos' && (
                    <AdminAvisos user={user} onToast={mostrarToast} />
                )}

                {seccion === 'rankings' && (
                    <AdminRankings user={user} onToast={mostrarToast} />
                )}

                {seccion === 'herramientas' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <section className="bg-white rounded-2xl border-2 border-amber-200 p-4 shadow-sm">
                            <Icono nombre="wrench" className="w-6 h-6 text-amber-700 mb-2" />
                            <h2 className="font-black text-amber-950 text-sm">Generador de avatares</h2>
                            <p className="text-xs text-amber-800 mt-1 mb-3 leading-relaxed">
                                Herramienta de escritorio para crear y revisar capas de avatares.
                            </p>
                            <button
                                type="button"
                                onClick={onOpenGenerador}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                            >
                                Abrir generador
                            </button>
                        </section>
                    </div>
                )}

                <AdminToast toast={toast} onClose={cerrarToast} />
            </div>
        </div>
    );
}
