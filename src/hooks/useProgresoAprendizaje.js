import { useMemo } from 'react';
import { almacen } from '../utils/almacen.js';
import { obtenerActividadDiaria } from '../utils/repaso.js';
import { sumarDias } from '../utils/fechas.js';
import { useRepaso } from './useRepaso.js';
import { useRetoDiario } from './useRetoDiario.js';
import { useLogros } from './useLogros.js';
import { listaAnimales } from '../data/animales.js';
import { listaFlora } from '../data/flora.js';
import { CATEGORIAS_FAUNA, CATEGORIAS_FLORA } from '../data/Categoriascontenido.js';
import { CATALOGO_LOGROS } from '../data/logros.js';

const NOMBRES_CATEGORIA = new Map(
    [...CATEGORIAS_FAUNA, ...CATEGORIAS_FLORA].map((categoria) => [categoria.id, categoria.nombre])
);
const CATEGORIA_FAUNA = new Map(listaAnimales.map((animal) => [animal.id, animal.categoria]));
const CATEGORIA_FLORA = new Map(listaFlora.map((planta) => [planta.id, planta.categoria]));

export function useProgresoAprendizaje(user) {
    const repaso = useRepaso(user);
    const reto = useRetoDiario(user);
    const { logrosDesbloqueados } = useLogros(user);

    const hoy = reto.hoy;

    const porCategoria = useMemo(() => {
        const mapa = new Map();

        repaso.palabras.forEach((registro) => {
            const categoriaId = registro.tipo === 'flora'
                ? CATEGORIA_FLORA.get(registro.id)
                : CATEGORIA_FAUNA.get(registro.id);
            if (!categoriaId) return;

            const actual = mapa.get(categoriaId) || {
                id: categoriaId,
                nombre: NOMBRES_CATEGORIA.get(categoriaId) || categoriaId,
                total: 0,
                dominadas: 0,
                errores: 0,
            };

            actual.total += 1;
            if ((registro.caja || 0) >= 4) actual.dominadas += 1;
            actual.errores += registro.errores || 0;
            mapa.set(categoriaId, actual);
        });

        return [...mapa.values()].sort((a, b) => b.total - a.total || b.errores - a.errores);
    }, [repaso.palabras]);

    const aciertos = repaso.palabras.reduce((total, registro) => total + (registro.aciertos || 0), 0);
    const errores = repaso.palabras.reduce((total, registro) => total + (registro.errores || 0), 0);
    const precision = aciertos + errores > 0
        ? Math.round((aciertos / (aciertos + errores)) * 100)
        : 0;

    const actividad = useMemo(() => {
        const datos = obtenerActividadDiaria();
        const dias = [];

        for (let i = 6; i >= 0; i -= 1) {
            const fecha = sumarDias(hoy, -i);
            const dia = datos[fecha] || {};
            dias.push({
                fecha,
                respuestas: dia.respuestas || 0,
                aciertos: dia.aciertos || 0,
            });
        }

        return dias;
    }, [hoy]);

    const niveles = useMemo(() => [
        { id: 'memorama', nombre: 'Memorama', nivel: Number(almacen.getItem('memoramaNivel')) || 1 },
        { id: 'trivia', nombre: 'Reto Trivia', nivel: Number(almacen.getItem('triviaNivel')) || 1 },
        { id: 'crucigrama', nombre: 'Crucigrama', nivel: Number(almacen.getItem('crucigramaNivel')) || 1 },
        { id: 'sopa', nombre: 'Sopa de Letras', nivel: Number(almacen.getItem('sopaLetrasNivel')) || 1 },
    ], []);

    const totalActividad = actividad.reduce((total, dia) => total + dia.respuestas, 0);

    return {
        ...repaso,
        rachaActual: reto.rachaActual,
        completadoHoy: reto.completadoHoy,
        reto: reto.reto,
        aciertos,
        errores,
        precision,
        porCategoria,
        actividad,
        totalActividad,
        niveles,
        logrosDesbloqueados,
        totalLogros: CATALOGO_LOGROS.length,
        hoy,
    };
}
