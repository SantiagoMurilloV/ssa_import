// Código de seguimiento. La gente lo escribe como puede ("ssa 482913",
// "SSA482913", "482913"): aquí se normaliza al formato SSA-###### que valida
// el admin. Devuelve null si no tiene forma de referencia.
export const REFERENCE_PATTERN = /^SSA-\d{6}$/;

export const normalizeReference = (raw) => {
  const compact = String(raw ?? '').toUpperCase().replace(/[\s_-]/g, '');
  const digits = compact.startsWith('SSA') ? compact.slice(3) : compact;
  return /^\d{6}$/.test(digits) ? `SSA-${digits}` : null;
};
