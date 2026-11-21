// 🐾 Categorías de FAUNA, en el orden recomendado de progresión
// (empezamos por lo más familiar/fácil para un principiante)
export const CATEGORIAS_FAUNA = [
    { id: 'domesticos', nombre: 'Animales Domésticos y Granja', icono: 'dog', costoTotopos: 0, nivelCuentaRequerido: 1 },
    { id: 'insectos', nombre: 'Insectos y Bichitos', icono: 'bug', costoTotopos: 60, nivelCuentaRequerido: 2 },
    { id: 'mamiferos', nombre: 'Mamíferos Silvestres', icono: 'paw', costoTotopos: 90, nivelCuentaRequerido: 3 },
    { id: 'aves', nombre: 'Aves y Voladores', icono: 'bird', costoTotopos: 110, nivelCuentaRequerido: 4 },
    { id: 'acuaticos', nombre: 'Acuáticos, Reptiles y Anfibios', icono: 'fish', costoTotopos: 130, nivelCuentaRequerido: 4 },
    { id: 'felinos', nombre: 'Felinos', icono: 'cat', costoTotopos: 160, nivelCuentaRequerido: 5 },
];

// 🌿 Categorías de FLORA, en el orden recomendado de progresión
// (empezamos por lo más cotidiano: el maíz, presente en toda la vida diaria del Istmo)
export const CATEGORIAS_FLORA = [
    { id: 'maiz', nombre: 'El Maíz y sus Partes', icono: 'corn', costoTotopos: 0, nivelCuentaRequerido: 1 },
    { id: 'frutos', nombre: 'Frutos y Plantas Alimenticias', icono: 'fruit', costoTotopos: 60, nivelCuentaRequerido: 2 },
    { id: 'medicinales', nombre: 'Hierbas y Plantas Medicinales', icono: 'sprout', costoTotopos: 90, nivelCuentaRequerido: 3 },
    { id: 'flores', nombre: 'Flores y Plantas de Ornato', icono: 'flower', costoTotopos: 110, nivelCuentaRequerido: 4 },
    { id: 'arboles', nombre: 'Árboles y Maderas', icono: 'tree', costoTotopos: 130, nivelCuentaRequerido: 4 },
];

export const obtenerCategoriasPorTipo = (tipo) => (tipo === 'flora' ? CATEGORIAS_FLORA : CATEGORIAS_FAUNA);

// La categoría con costoTotopos 0 siempre es el punto de partida por defecto para un usuario nuevo
export const categoriaInicialPorDefecto = (tipo) => {
    const cats = obtenerCategoriasPorTipo(tipo);
    const gratis = cats.find(c => c.costoTotopos === 0);
    return gratis ? [gratis.id] : (cats[0] ? [cats[0].id] : []);
};

// 🛡️ Combina lo que ya tenía desbloqueado el jugador con lo que ya califica gratis por Nivel de Cuenta
export const sincronizarDesbloqueosPorNivel = (tipo, desbloqueadasActuales = [], nivelCuenta = 1) => {
    const cats = obtenerCategoriasPorTipo(tipo);
    const nuevasPorNivel = cats
        .filter(c => c.nivelCuentaRequerido <= nivelCuenta)
        .map(c => c.id);
    const combinadas = new Set([...desbloqueadasActuales, ...nuevasPorNivel]);
    return Array.from(combinadas);
};

// Filtra un dataset (listaAnimales / listaFlora) dejando solo los items de las categorías activas
export const filtrarContenidoPorCategorias = (dataset, categoriasActivas = []) => {
    if (!categoriasActivas || categoriasActivas.length === 0) return dataset;
    return dataset.filter(item => categoriasActivas.includes(item.categoria));
};