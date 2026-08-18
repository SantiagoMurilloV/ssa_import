import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { trackPageView, trackProductView } from '../api/track.api.js';
import ProductCard from '../components/home/ProductCard.jsx';

export default function CatalogPage() {
  const { products, categories, status } = useCatalog();
  const { catalogo, encargos } = useSiteContent();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('cat') ?? 'Todo');

  useEffect(() => {
    trackPageView();
    trackProductView();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setFilter(cat);
  }, [searchParams]);

  const visible = products.filter((product) => {
    if (filter === 'Todo') return true;
    if (filter === 'En stock') return product.inStock;
    if (filter === 'Preventa') return !product.inStock;
    return product.category === filter;
  });

  const filters = ['Todo', 'En stock', 'Preventa', ...categories];

  return (
    <section className="section catalog-section">
      {/* El título va oculto: la página se explica sola con los filtros y la
          grilla, pero el h1 sigue estando para SEO y lectores de pantalla. */}
      <h1 className="sr-only">{catalogo.title}</h1>
      <p className="catalog-lead">{catalogo.lead}</p>

      <div className="catalog-bar">
        <div className="chips-row chips-scroll">
          {filters.map((label) => (
            <button
              key={label}
              className={`chip ${filter === label ? 'active' : ''}`}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="catalog-count">{visible.length} productos</span>
      </div>

      {status === 'loading' && <p style={{ color: 'var(--ink-55)' }}>Cargando catálogo…</p>}
      {status === 'ready' && visible.length === 0 && (
        <p style={{ color: 'var(--ink-55)' }}>No hay productos en esta categoría por ahora.</p>
      )}

      <div className="products-grid" data-stagger>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div
        className="glass-card"
        data-reveal
        style={{
          marginTop: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
          padding: '32px 36px',
          background: 'rgba(150,138,190,.2)'
        }}
      >
        <div>
          <h2 className="serif-title" style={{ fontSize: 26, margin: '0 0 6px' }}>
            {encargos.titleLine1}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-60)', margin: 0 }}>
            Encárganos cualquier producto de EE. UU. y te cotizamos en menos de 24 horas.
          </p>
        </div>
        <Link className="btn-dark" to="/#encargos" style={{ flexShrink: 0, padding: '14px 28px' }}>
          Hacer un encargo
        </Link>
      </div>
    </section>
  );
}
