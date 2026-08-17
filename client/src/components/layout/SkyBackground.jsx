import { useEffect, useState } from 'react';

// Fondo animado (nubes + paquetes en paracaídas) del diseño. Se monta solo en
// pantallas grandes y si el usuario no pidió reducir movimiento.
export default function SkyBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || window.innerWidth < 760) return;
    import('../../lib/sky-descent.js').then(() => setEnabled(true));
  }, []);

  return enabled ? <sky-descent /> : null;
}
