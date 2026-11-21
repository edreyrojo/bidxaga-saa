export const escaparCSV = (valor) => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    if (/[",\n\r]/.test(texto)) {
        return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
};

export const generarCSV = (filas, columnas) => {
    const encabezados = columnas.map((columna) => escaparCSV(columna.titulo)).join(',');
    const lineas = filas.map((fila) => (
        columnas.map((columna) => {
            const valor = typeof columna.valor === 'function'
                ? columna.valor(fila)
                : fila[columna.clave];
            return escaparCSV(valor);
        }).join(',')
    ));

    return `\uFEFF${[encabezados, ...lineas].join('\r\n')}`;
};

export const descargarArchivo = (nombre, contenido, tipo = 'text/csv;charset=utf-8') => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
};
