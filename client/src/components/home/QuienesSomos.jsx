import { useSiteContent } from '../../context/SiteContentContext.jsx';

export default function QuienesSomos() {
  const content = useSiteContent();
  const section = content.quienesSomos;
  const photo = content.images?.quienesSomos?.[0];

  return (
    <section id="quienes" className="section" data-reveal data-fx="clip">
      <div className="glass-card editorial-grid">
        <div
          className="editorial-photo"
          style={photo ? { backgroundImage: `url(${photo.url})` } : undefined}
        >
          {!photo && <span className="photo-tag">{section.photoLabel}</span>}
        </div>
        <div className="editorial-body">
          <div className="eyebrow">{section.eyebrow}</div>
          <h2 className="serif-title">
            {section.title}{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--lavanda)' }}>{section.highlight}</em>
          </h2>
          <p className="body-text">{section.body1}</p>
          <p className="body-text" style={{ marginBottom: 0 }}>
            {section.body2}
          </p>
        </div>
      </div>
    </section>
  );
}
