import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

// Catálogo general de elementos disponibles en la plataforma (Avatares y Accesorios de Mercado)
const CATALOGO_COMPLETO = [
    // Avatares base y de pago
    { id: 'default', nombre: 'Totopo Clásico', tipo: 'avatar', archivo: 'default' },
    { id: 'iguana', nombre: 'Iguana Istmeña', tipo: 'avatar', archivo: 'iguana' },
    { id: 'tortuga', nombre: 'Tortuga Lagunera', tipo: 'avatar', archivo: 'tortuga' },
    { id: 'huipil', nombre: 'Flor de Huipil', tipo: 'avatar', archivo: 'huipil' },
    { id: 'colibri', nombre: 'Colibrí Dorado', tipo: 'avatar', archivo: 'colibri' },
    { id: 'jaguar', nombre: 'Jaguar Zapoteco', tipo: 'avatar', archivo: 'jaguar' },
    { id: 'mezcal', nombre: 'Copa de Mezcal', tipo: 'avatar', archivo: 'mezcal' },
    { id: 'sol', nombre: 'Sol del Istmo', tipo: 'avatar', archivo: 'sol' },

    // Accesorios del mercado (Artículos SVG)
    { id: 'gafas1', nombre: 'Gafas de Sol', tipo: 'accesorio', archivo: 'gafas1.svg' },
    { id: 'collar1', nombre: 'Collar Tradicional', tipo: 'accesorio', archivo: 'collar1.svg' }
];

export default function SeccionInventario({
    user,
    avataresDesbloqueados = [],
    setAvataresDesbloqueados,
    accesoriosDesbloqueados = [],
    setAccesoriosDesbloqueados = () => {},
    avatarActual,
    setAvatarActual,
    setMensaje
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

    // Función para equipar un avatar o accesorio seleccionado
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
                if (setMensaje) setMensaje(`Accesorio ${item.nombre} listo para usar en el creador.`);
            }
        } catch (error) {
            console.error("Error al equipar el elemento:", error);
            if (setMensaje) setMensaje("Error al actualizar el equipo en la nube.");
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 border-amber-200 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 border-b border-amber-200 pb-3">
                <h3 className="text-lg font-extrabold text-amber-900 tracking-wide">
                    Inventario de Miscelánea y Avatares
                </h3>
                <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                    {itemsEnInventario.length} Objetos en Propiedad
                </span>
            </div>

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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
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
                                    {esEquipado ? 'Equipado' : 'Equipar'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}