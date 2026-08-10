
export const UMBRALES_NIVEL = [
    { nivel: 1, totoposMin: 0 },
    { nivel: 2, totoposMin: 100 },
    { nivel: 3, totoposMin: 300 },
    { nivel: 4, totoposMin: 600 },
    { nivel: 5, totoposMin: 1000 },
];

export const calcularNivelCuenta = (totalHistorico) => {
    if (totalHistorico < 100) return 1;
    if (totalHistorico < 300) return 2;
    if (totalHistorico < 600) return 3;
    if (totalHistorico < 1000) return 4;
    return 5;
};