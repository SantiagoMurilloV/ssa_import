import { useSiteContent } from '../../context/SiteContentContext.jsx';

const ICONS = [
  ['M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z', 'M12 12l8-4.5M12 12v9M12 12L4 7.5'],
  ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
  [
    'M3 8h11v8H3z',
    'M14 11h4l3 3v2h-7v-5z',
    'M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'
  ]
];

export default function ComoFunciona() {
  const { comoFunciona } = useSiteContent();

  return (
    <section id="como" className="section" style={{ paddingTop: 24 }}>
      <div className="pasos-grid" data-stagger>
        {comoFunciona.pasos.map((paso, i) => (
          <article className="paso-card" key={i}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2A2A35"
              strokeWidth="1.4"
              style={{ marginBottom: 12 }}
            >
              {(ICONS[i] ?? ICONS[0]).map((d, j) => (
                <path key={j} d={d} />
              ))}
            </svg>
            <div className="paso-num">{String(i + 1).padStart(2, '0')}</div>
            <h3>{paso.titulo}</h3>
            <p>{paso.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
