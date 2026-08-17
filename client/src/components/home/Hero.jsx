import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import { useHeroParallax } from '../../hooks/useReveal.js';

export default function Hero() {
  const { hero } = useSiteContent();
  useHeroParallax();

  // El globo es un custom element que necesita d3 + topojson (cargados en index.html)
  useEffect(() => {
    import('../../lib/globe-3d.js');
  }, []);

  return (
    <header id="tanda" className="hero">
      <div className="hero-globe-mask">
        <div className="hero-globe" data-parallax="globo">
          <globe-3d style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
      </div>
      <div className="hero-veil" />
      <div className="hero-content" data-parallax="hero">
        <div className="hero-badge">
          <span className="flag-us" />
          <span>{hero.badge}</span>
          <span className="flag-co" />
        </div>
        <h1 className="hero-title">
          {hero.titleLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < hero.titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="hero-lead">{hero.lead}</p>
        <div className="hero-ctas">
          <Link className="btn-dark" to="/catalogo">
            {hero.ctaPrimary}
          </Link>
          <a className="btn-light" href="#como">
            {hero.ctaSecondary}
          </a>
        </div>
      </div>
    </header>
  );
}
