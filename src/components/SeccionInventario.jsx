import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { CATALOGO_AVATARES, CATALOGO_ACCESORIOS } from '../data/catalogoActivos.js';
import SeccionColapsable from './SeccionColapsable.jsx';

// Catálogo general de elementos disponibles en la plataforma (Avatares y Accesorios de Mercado)
// 🔧 Se construye a partir del catálogo único compartido, así nunca vuelve a desincronizarse
// con lo que se vende en la Tienda (antes 'guiechachi' y 'palmera' faltaban aquí).
const CATALOGO_COMPLETO = [
    ...CATALOGO_AVATARES.map(a => ({ id: a.id, nombre: a.nombre, tipo: 'avatar', archivo: a.archivo })),
    ...CATALOGO_ACCESORIOS.map(a => ({ id: a.id, nombre: a.nombre, tipo: 'accesorio', archivo: a.archivo })),
];

export default function SeccionInventario({
    user,
    avataresDesbloqueados = [],
    setAvataresDesbloqueados,
    accesoriosDesbloqueados = [],
    setAccesoriosDesbloqueados = () => {},
    avatarActual,
    setAvatarActual,
    setMensaje,
    onAbrirCreador = null, // 🆕 Permite saltar directo al Creador de Avatar al pulsar "Usar" en un accesorio
    inventarioAbierto,     // 🛠️ Antes llegaba pero nunca se usaba: el inventario jamás se podía colapsar
    setInventarioAbierto
}) {
    const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'avatar', 'accesorio'

    // Filtrar elementos según correspondan a avatares o accesorios desbloqueados
    const itemsEnInventario = CATALOGO_COMPLETO.filter(item => {
        if (item.tipo === 'avatar') {
            return avataresDesbloqueados.includes(item.id);
        } else if (item.tipo === 'accesorio') {
            return accesoriosDesbloqueados.includes(item.id);
        }
        return false;
    });

    const itemsFiltrados = itemsEnInventario.filter(item => {
        if (filtroTipo === 'todos') return true;
        return item.tipo === filtroTipo;
    });

    // Función para equipar un avatar, o para saltar al Creador en el caso de un accesorio
    // (los accesorios no tienen un "slot" propio: siempre se aplican como capa DENTRO
    // de un avatar personalizado, por eso aquí no se "equipan" directamente).
    const handleEquiparItem = async (item) => {
        try {
            if (item.tipo === 'avatar') {
                setAvatarActual(item.id);

                if (user) {
                    const userRef = doc(db, 'usuarios', user.uid);
                    await updateDoc(userRef, {
                        avatar: item.id
                    });
                }
                if (setMensaje) setMensaje(`Has equipado el avatar: ${item.nombre}`);
            } else if (item.tipo === 'accesorio') {
                if (setMensaje) setMensaje(`Abriendo el Creador de Avatar para usar: ${item.nombre}...`);
                if (onAbrirCreador) onAbrirCreador();
            }
        } catch (error) {
            console.error("Error al equipar el elemento:", error);
            if (setMensaje) setMensaje("Error al actualizar el equipo en la nube.");
        }
    };

    return (
        <SeccionColapsable
            icono="/palmera.png"
            titulo="Inventario de Objetos"
            abierto={inventarioAbierto}
            setAbierto={setInventarioAbierto}
            badge={`${itemsEnInventario.length} obj.`}
        >
            <div className="p-4">
                {/* Pestañas de filtrado */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFiltroTipo('todos')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroTipo === 'todos' ? 'bg-amber-600 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFiltroTipo('avatar')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroTipo === 'avatar' ? 'bg-amber-600 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                    >
                        Avatares
                    </button>
                    <button
                        onClick={() => setFiltroTipo('accesorio')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroTipo === 'accesorio' ? 'bg-amber-600 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                    >
                        Accesorios
                    </button>
                </div>

                {/* Cuadrícula de ítems del inventario */}
                {itemsFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-amber-700/70 text-sm">
                        No tienes elementos en esta categoría. Visita la tienda para adquirir nuevos ítems.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {itemsFiltrados.map((item) => {
                            const esEquipado = avatarActual === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                                        esEquipado
                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-md'
                                            : 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                                    }`}
                                >
                                    <div className="w-16 h-16 flex items-center justify-center mb-2 bg-white rounded-xl shadow-inner border border-amber-100 overflow-hidden">
                                        {item.tipo === 'avatar' ? (
                                            <img
                                                src={`/avatares/${item.archivo}.png`}
                                                alt={item.nombre}
                                                className="w-full h-full object-contain p-1"
                                                onError={(e) => { e.target.src = '/totopo.png'; }}
                                            />
                                        ) : (
                                            <img
                                                src={`/avatares/mercado/${item.archivo}`}
                                                alt={item.nombre}
                                                className="w-full h-full object-contain p-1"
                                                onError={(e) => { e.target.src = '/totopo.png'; }}
                                            />
                                        )}
                                    </div>

                                    <span className="text-xs font-bold text-amber-900 text-center mb-2 line-clamp-1">
                                        {item.nombre}
                                    </span>

                                    <button
                                        onClick={() => handleEquiparItem(item)}
                                        disabled={esEquipado}
                                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            esEquipado
                                                ? 'bg-emerald-600 text-white cursor-default shadow-none'
                                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow'
                                        }`}
                                    >
                                        {item.tipo === 'accesorio'
                                            ? 'Usar en Creador'
                                            : (esEquipado ? 'Equipado' : 'Equipar')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SeccionColapsable>
    );
}