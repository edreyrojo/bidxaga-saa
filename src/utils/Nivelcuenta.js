/**
 * Niveles de cuenta de Bidxaga Saa.
 *
 * Los títulos están inspirados en el Istmo de Tehuantepec y en el diidxazá:
 * Binnizá (gente de las nubes), guiechachi (flor), Bidxaga Saa (palabra
 * verdadera) y referencias a la laguna y a Tehuantepec.
 *
 * Los primeros cinco conservan los umbrales históricos para no alterar el
 * nivel que ya tienen los jugadores actuales. A partir del nivel 6 se añaden
 * metas pensadas para jugadores constantes.
 */
export const UMBRALES_NIVEL = [
    {
        nivel: 1,
        totoposMin: 0,
        titulo: 'Recién Llegado',
        descripcion: 'Tu primera palabra en diidxazá.',
    },
    {
        nivel: 2,
        totoposMin: 100,
        titulo: 'Explorador Istmeño',
        descripcion: 'Ya reconoces el sonido de la lengua.',
    },
    {
        nivel: 3,
        totoposMin: 300,
        titulo: 'Estudiante Zapoteco',
        descripcion: 'Tus primeras frases toman forma.',
    },
    {
        nivel: 4,
        totoposMin: 600,
        titulo: 'Conocedor Diidxazá',
        descripcion: 'Entiendes el ritmo y las palabras del Istmo.',
    },
    {
        nivel: 5,
        totoposMin: 1000,
        titulo: 'Maestro Zapoteco',
        descripcion: 'Compartes lo aprendido con tu comunidad.',
    },
    {
        nivel: 6,
        totoposMin: 2000,
        titulo: 'Guardián de la Palabra',
        descripcion: 'Cuidas el diidxazá para las nuevas generaciones.',
    },
    {
        nivel: 7,
        totoposMin: 3500,
        titulo: 'Voz del Istmo',
        descripcion: 'Tu voz lleva la palabra por la llanura y el mar.',
    },
    {
        nivel: 8,
        totoposMin: 5500,
        titulo: 'Semilla de Binnizá',
        descripcion: 'Como la gente de las nubes, creces con la palabra.',
    },
    {
        nivel: 9,
        totoposMin: 8000,
        titulo: 'Tejedor de Historias',
        descripcion: 'Tejes relatos con hilos de diidxazá.',
    },
    {
        nivel: 10,
        totoposMin: 12000,
        titulo: 'Flor de Guiechachi',
        descripcion: 'Tu aprendizaje florece como el guiechachi.',
    },
    {
        nivel: 11,
        totoposMin: 18000,
        titulo: 'Sabio de la Laguna',
        descripcion: 'La laguna guarda tu constancia.',
    },
    {
        nivel: 12,
        totoposMin: 26000,
        titulo: 'Corazón de Tehuantepec',
        descripcion: 'Late al ritmo de la llanura y el mar.',
    },
    {
        nivel: 13,
        totoposMin: 38000,
        titulo: 'Leyenda de Bidxaga Saa',
        descripcion: 'Tu nombre ya cuenta historias.',
    },
    {
        nivel: 14,
        totoposMin: 55000,
        titulo: 'Binnizá de Honor',
        descripcion: 'Honras la memoria de la gente de las nubes.',
    },
    {
        nivel: 15,
        totoposMin: 80000,
        titulo: 'Bidxaga Saa',
        descripcion: 'Palabra verdadera: eres parte de la lengua.',
    },
];

export const NIVEL_MAXIMO = UMBRALES_NIVEL[UMBRALES_NIVEL.length - 1].nivel;

const normalizarTotal = (totalHistorico) => {
    const total = Number(totalHistorico);
    return Number.isFinite(total) && total > 0 ? total : 0;
};

/**
 * Devuelve el nivel actual, su título y el siguiente umbral.
 */
export const obtenerNivelCuenta = (totalHistorico) => {
    const total = normalizarTotal(totalHistorico);
    let indiceActual = 0;

    UMBRALES_NIVEL.forEach((umbral, indice) => {
        if (total >= umbral.totoposMin) indiceActual = indice;
    });

    const actual = UMBRALES_NIVEL[indiceActual];
    const siguiente = UMBRALES_NIVEL[indiceActual + 1] || null;

    return {
        ...actual,
        total,
        siguiente,
        esMaximo: !siguiente,
    };
};

export const calcularNivelCuenta = (totalHistorico) => obtenerNivelCuenta(totalHistorico).nivel;

/**
 * Progreso dentro del nivel actual. En el nivel máximo devuelve 100 %.
 */
export const calcularProgresoNivel = (totalHistorico) => {
    const info = obtenerNivelCuenta(totalHistorico);

    if (!info.siguiente) {
        return {
            nivel: info.nivel,
            titulo: info.titulo,
            necesario: info.totoposMin,
            porcentaje: 100,
            faltan: 0,
            esMaximo: true,
            siguiente: null,
        };
    }

    const rango = info.siguiente.totoposMin - info.totoposMin;
    const avance = Math.max(0, info.total - info.totoposMin);
    const porcentaje = rango > 0 ? Math.min(100, (avance / rango) * 100) : 0;

    return {
        nivel: info.nivel,
        titulo: info.titulo,
        necesario: info.siguiente.totoposMin,
        porcentaje,
        faltan: Math.max(0, info.siguiente.totoposMin - info.total),
        esMaximo: false,
        siguiente: info.siguiente,
    };
};
