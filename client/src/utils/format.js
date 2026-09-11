export const formatCOP = (value) =>
  `$ ${Number(value ?? 0).toLocaleString('es-CO').replace(/,/g, '.')}`;

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });

// "hace 5 min", "hace 3 h", "ayer"… o la fecha si ya pasó más de una semana
export const relativeTime = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};
