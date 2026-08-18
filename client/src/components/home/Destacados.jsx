import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import ProductCard from './ProductCard.jsx';

export default function Destacados() {
  const { products, categories } = useCatalog();
  const { destacados } = useSiteContent();

  // Destacados marcados en el admin; si no hay ninguno, los primeros 3 del catálogo
  const featured = products.filter((p) => p.featured);
  const visible = (featured.length > 0 ? featured : products).slice(0, 8);

  if (visible.length === 0) return null;

  return (
    <section id="catalogo" className="section">
      <div className="section-head" data-reveal data-fx="left">
        <h2 className="section-title">
          {destacados.title} <em>{destacados.subtitle}</em>
        </h2>
        <Link className="pill-link" to="/catalogo">
          {destacados.ctaCatalogo}
        </Link>
      </div>
      <div className="chips-row">
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
      <div className="products-grid products-grid-featured" data-stagger>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
