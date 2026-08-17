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
    <section className="section" style={{ paddingTop: 72 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        <h1 className="serif-title" style={{ fontSize: 52, margin: 0 }}>
          {catalogo.title}
        </h1>
        <span style={{ fontSize: 14, color: 'var(--ink-55)' }}>{visible.length} productos</span>
      </div>
      <p style={{ fontSize: 15, color: 'var(--ink-60)', margin: '0 0 30px', maxWidth: 480 }}>
        {catalogo.lead}
      </p>

      <div className="chips-row">
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
          marginTop: 56,
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
