// 👤 Avatares completos (imagen única, se equipan directo)
export const CATALOGO_AVATARES = [
    { id: 'default', nombre: 'Totopo Clásico', costo: 0, archivo: 'default' },
    { id: 'iguana', nombre: 'Iguana Istmeña', costo: 50, archivo: 'iguana' },
    { id: 'tortuga', nombre: 'Tortuga Lagunera', costo: 75, archivo: 'tortuga' },
    { id: 'huipil', nombre: 'Flor de Huipil', costo: 100, archivo: 'huipil' },
    { id: 'colibri', nombre: 'Colibrí Dorado', costo: 150, archivo: 'colibri' },
    { id: 'jaguar', nombre: 'Jaguar Zapoteco', costo: 200, archivo: 'jaguar' },
    { id: 'mezcal', nombre: 'Copa de Mezcal', costo: 250, archivo: 'mezcal' },
    { id: 'sol', nombre: 'Sol del Istmo', costo: 300, archivo: 'sol' },
    { id: 'guiechachi', nombre: 'Guiechachi', costo: 350, archivo: 'guiechachi' },
    { id: 'palmera', nombre: 'Palmera Real', costo: 400, archivo: 'palmera' },
];

// 💍 Accesorios (capa SVG que se aplica DENTRO del Creador de Avatar,
// sobre un avatar personalizado — no se "equipan" de forma independiente)
export const CATALOGO_ACCESORIOS = [
    { id: 'collar1', nombre: 'Collar Tradicional', costo: 120, archivo: 'collar1.svg' },
    { id: 'gafas1', nombre: 'Gafas de Sol', costo: 150, archivo: 'gafas1.svg' },
];

// Helpers de búsqueda, útiles para no repetir .find() en cada componente
export const buscarAvatar = (id) => CATALOGO_AVATARES.find(a => a.id === id);
export const buscarAccesorio = (id) => CATALOGO_ACCESORIOS.find(a => a.id === id);
