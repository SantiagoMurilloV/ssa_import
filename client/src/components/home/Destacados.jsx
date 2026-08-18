import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import ProductCard, { tinteFor } from './ProductCard.jsx';

export default function Destacados() {
  const { products, categories } = useCatalog();
  const { destacados } = useSiteContent();
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  // Solo lo que se marca como destacado en el admin
  const visible = products.filter((product) => product.featured);

  // Sin destacados la sección no queda vacía: se muestran las categorías, cada
  // una con la foto de uno de sus productos de fondo.
  const categoryCards = categories.map((category) => {
    const items = products.filter((product) => product.category === category);
    const cover = items.map((item) => item.photos?.[0]).find((photo) => photo?.mediaType !== 'video');
    return { category, count: items.length, cover, tinte: tinteFor(category) };
  });

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setEdges({ start: track.scrollLeft <= 4, end: track.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    syncEdges();
    window.addEventListener('resize', syncEdges);
    return () => window.removeEventListener('resize', syncEdges);
  }, [syncEdges, visible.length]);

  // Avanza casi una pantalla del carrusel, dejando ver la tarjeta del borde
  const scrollBy = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  };

  // Nada que mostrar: ni destacados ni categorías
  if (visible.length === 0 && categoryCards.length === 0) return null;

  return (
    <section id="catalogo" className="section">
      <div className="section-head" data-reveal data-fx="left">
        <h2 className="section-title">
          {visible.length > 0 ? (
            <>
              {destacados.title} <em>{destacados.subtitle}</em>
            </>
          ) : (
            <>
              Explora <em>por categoría</em>
            </>
          )}
        </h2>
        <div className="section-head-actions">
          <div className="carousel-nav" hidden={visible.length === 0}>
            <button
              className="carousel-btn"
              onClick={() => scrollBy(-1)}
              disabled={edges.start}
              aria-label="Ver destacados anteriores"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              className="carousel-btn"
              onClick={() => scrollBy(1)}
              disabled={edges.end}
              aria-label="Ver más destacados"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <Link className="pill-link" to="/catalogo">
            {destacados.ctaCatalogo}
          </Link>
        </div>
      </div>
      {visible.length > 0 ? (
        <>
          <div className="chips-row chips-scroll chips-row-home">
            {categories.map((category) => (
              <Link
                className="chip"
                key={category}
                to={`/catalogo?cat=${encodeURIComponent(category)}`}
              >
                {category}
              </Link>
            ))}
          </div>
          <div className="carousel-track" ref={trackRef} onScroll={syncEdges} data-stagger>
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="category-grid" data-stagger>
          {categoryCards.map(({ category, count, cover, tinte }) => (
            <Link
              className="category-card"
              key={category}
              to={`/catalogo?cat=${encodeURIComponent(category)}`}
            >
              <span className="category-photo">
                {cover ? (
                  <img src={cover.url} alt="" loading="lazy" />
                ) : (
                  <span
                    className="category-photo-empty"
                    style={{
                      background: `repeating-linear-gradient(-45deg, ${tinte} 0 14px, rgba(255,255,255,.5) 14px 28px)`
                    }}
                  />
                )}
              </span>
              <span className="category-name">{category}</span>
              <span className="category-count">
                {count} {count === 1 ? 'producto' : 'productos'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
