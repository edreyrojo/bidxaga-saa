/** Fecha local en formato YYYY-MM-DD. */
export const obtenerFechaLocal = (fecha = new Date()) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

/** Suma o resta días a una fecha YYYY-MM-DD sin problemas de zona horaria. */
export const sumarDias = (fechaISO, dias) => {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    fecha.setDate(fecha.getDate() + dias);
    return obtenerFechaLocal(fecha);
};

export const fechaAnterior = (fechaISO) => sumarDias(fechaISO, -1);
