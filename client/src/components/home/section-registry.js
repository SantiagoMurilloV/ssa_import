import QuienesSomos from './QuienesSomos.jsx';
import Destacados from './Destacados.jsx';
import Encargos from './Encargos.jsx';
import Newsletter from './Newsletter.jsx';
import { LAYOUT_SECTION_KEYS } from '../../../../server/src/config/default-site-content.js';

// El hero va siempre primero y no es reordenable.
export const SECTION_COMPONENTS = {
  quienesSomos: QuienesSomos,
  destacados: Destacados,
  encargos: Encargos,
  newsletter: Newsletter
};

// Misma normalización que el server: descarta claves desconocidas, deduplica
// y agrega al final las que falten.
export function resolveHomeSections(layout) {
  const incoming = Array.isArray(layout?.sections) ? layout.sections : [];
  const seen = new Set();
  const sections = [];
  for (const entry of incoming) {
    if (!LAYOUT_SECTION_KEYS.includes(entry?.key) || seen.has(entry.key)) continue;
    seen.add(entry.key);
    sections.push({ key: entry.key, visible: entry.visible !== false });
  }
  for (const key of LAYOUT_SECTION_KEYS) {
    if (!seen.has(key)) sections.push({ key, visible: true });
  }
  return sections.filter((section) => section.visible && SECTION_COMPONENTS[section.key]);
}
