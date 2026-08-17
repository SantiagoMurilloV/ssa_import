// ESPEJO de la regla del server (ssa_admin/server/src/config/shipping-config.js):
// ciudad listada → su tarifa; el resto → tarifa por defecto.
export const normalizeCityName = (name) =>
  String(name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const resolveShippingFee = (city, config) => {
  if (!config) return 0;
  const normalized = normalizeCityName(city);
  const match = (config.cities ?? []).find((c) => normalizeCityName(c.name) === normalized);
  return match ? match.fee : config.defaultFee ?? 0;
};
