# Referencia de diseño — SSA Import

Archivos importados del proyecto de Claude Design
(https://claude.ai/design/p/c45430e0-7e62-43fa-8692-a2f0c33e1385):

- `SSA Tienda v6.dc.html` — página principal (home) de la tienda
- `Catalogo.dc.html` — página de catálogo (paleta antigua S&S; en la implementación se adaptó a la paleta SSA v6)
Los dos custom elements de canvas (`globe-3d.js` y `sky-descent.js`) se usan tal
cual en la implementación y viven en `client/src/lib/`. El runtime `support.js` de
Claude Design no se incluye: el diseño se portó a React.

Paleta SSA v6: fondo #FAF7F4, tinta #2A2A35, lavanda #968ABE, salvia #6F927C / #7E9A88, durazno #D6A086.
Tipografías: Italiana (hero), Cormorant Garamond (h1-h3), Instrument Serif (títulos card), Geist (cuerpo).
