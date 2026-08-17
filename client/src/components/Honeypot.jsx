// Trampa para bots: un campo que parece legítimo, invisible para las personas.
// Los formularios envían `website: ''`; si llega con texto, lo llenó un bot que
// completa todos los inputs del DOM y el server rechaza el envío.
export default function Honeypot({ value, onChange }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        border: 0,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap'
      }}
    >
      <label htmlFor="website">Sitio web</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
