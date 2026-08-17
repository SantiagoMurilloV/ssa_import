export const formatCOP = (value) =>
  `$ ${Number(value ?? 0).toLocaleString('es-CO').replace(/,/g, '.')}`;
