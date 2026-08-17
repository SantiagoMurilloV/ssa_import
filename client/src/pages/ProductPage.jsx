import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { useCart, MAX_PER_ITEM } from '../context/CartContext.jsx';
import { trackPageView, trackProductView } from '../api/track.api.js';
import ProductCard, { tinteFor } from '../components/home/ProductCard.jsx';
import { formatCOP } from '../utils/format.js';

// Desde cuántas unidades se avisa que quedan pocas
const LOW_STOCK = 3;

function Media({ media, name, tinte }) {
  if (!media) {
    return (
      <div
        className="pdp-media"
        style={{
          background: `repeating-linear-gradient(-45deg, ${tinte} 0 14px, rgba(255,255,255,.5) 14px 28px)`
        }}
      >
        <span className="photo-tag">foto: {name.toLowerCase()} 4:5</span>
      </div>
    );
  }
  return (
    <div className="pdp-media">
      {media.mediaType === 'video' ? (
        <video src={media.url} muted loop playsInline autoPlay preload="metadata" />
      ) : (
        <img src={media.url} alt={media.label || name} />
      )}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { products, status, shipping } = useCatalog();
  const { checkout } = useSiteContent();
  const { items, addItem, setQuantity: setCartQuantity } = useCart();
  const [index, setIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    trackPageView();
  }, []);

  // Al cambiar de producto se reinicia la galería y la cantidad
  useEffect(() => {
    setIndex(0);
    setQuantity(1);
  }, [id]);

  useEffect(() => {
    if (product) trackProductView();
  }, [product?.id]);

  // Envío más barato configurado en el admin, para no prometer una tarifa que no existe
  const cheapestShipping = useMemo(() => {
    const fees = [shipping?.defaultFee, ...(shipping?.cities ?? []).map((c) => c.fee)].filter(
      (fee) => Number.isFinite(fee)
    );
    return fees.length > 0 ? Math.min(...fees) : null;
  }, [shipping]);

  // Mientras el catálogo carga no sabemos si el producto existe o no
  if (!product) {
    if (status === 'loading') {
      return (
        <section className="section" style={{ paddingTop: 96 }}>
          <p style={{ color: 'var(--ink-55)' }}>Cargando producto…</p>
        </section>
      );
    }
    return (
      <section className="section" style={{ paddingTop: 96, maxWidth: 560 }}>
        <h1 className="serif-title">Este producto ya no está disponible</h1>
        <p className="body-text">
          Puede que lo hayamos vendido o que el enlace esté mal. Mira lo que tenemos ahora o
          encárganoslo y te lo traemos.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
          <Link className="btn-dark" to="/catalogo">
            Ver catálogo
          </Link>
          <Link className="btn-light" to="/#encargos">
            Hacer un encargo
          </Link>
        </div>
      </section>
    );
  }

  const photos = product.photos ?? [];
  const media = photos[index] ?? photos[0];
  const hasDiscount = product.basePrice > product.price;
  const inCart = items[product.id] ?? 0;
  // stock null = sin límite; el catálogo público ya no trae los agotados
  const isScarce = product.stock !== null && product.stock <= LOW_STOCK;
  // Nadie puede pedir más unidades de las que hay
  const maxQuantity = Math.min(MAX_PER_ITEM, product.stock ?? MAX_PER_ITEM);
  const paragraphs = (product.description ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const add = () => {
    // addItem suma una unidad, abre el carrito y registra el evento;
    // con cantidad > 1 fijamos el total (el reducer ya topa en MAX_PER_ITEM)
    addItem(product.id);
    if (quantity > 1) setCartQuantity(product.id, inCart + quantity);
  };

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <nav className="pdp-crumbs">
        <Link to="/catalogo">Catálogo</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/catalogo?cat=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </nav>

      <div className="pdp-grid">
        <div className="pdp-gallery">
          <Media media={media} name={product.name} tinte={tinteFor(product.id)} />
          {photos.length > 1 && (
            <div className="pdp-thumbs">
              {photos.map((photo, i) => (
                <button
                  key={photo.id ?? i}
                  className={`pdp-thumb ${i === index ? 'active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Ver imagen ${i + 1} de ${photos.length}`}
                >
                  {photo.mediaType === 'video' ? (
                    <video src={photo.url} muted playsInline preload="metadata" />
                  ) : (
                    <img src={photo.url} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <span className={`product-badge ${product.inStock ? 'stock' : 'preventa'}`}>
            {product.inStock ? 'En stock · envío inmediato' : 'Preventa · 15 días hábiles'}
          </span>
          <h1 className="pdp-title">{product.name}</h1>
          {product.detail && <p className="pdp-detail">{product.detail}</p>}

          <div className="pdp-price">
            {hasDiscount && <s>{formatCOP(product.basePrice)}</s>}
            <strong>{formatCOP(product.price)}</strong>
          </div>

          <div className="pdp-actions">
            <span className="cart-qty pdp-qty">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Menos"
              >
                −
              </button>
              {quantity}
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Más"
              >
                +
              </button>
            </span>
            <button className="btn-dark" onClick={add}>
              Agregar al carrito
            </button>
          </div>

          {inCart > 0 && (
            <p className="pdp-note">
              Ya tienes {inCart} {inCart === 1 ? 'unidad' : 'unidades'} en el carrito.
            </p>
          )}

          {paragraphs.length > 0 && (
            <div className="pdp-description">
              {paragraphs.map((text, i) => (
                <p className="body-text" key={i}>
                  {text}
                </p>
              ))}
            </div>
          )}

          <ul className="pdp-facts">
            {isScarce && (
              <li className="pdp-scarce">
                {product.stock === 1 ? 'Queda 1 unidad' : `Quedan ${product.stock} unidades`}
              </li>
            )}
            <li>Original, comprado en tiendas oficiales de EE. UU.</li>
            {!product.inStock && <li>{checkout.preventaNote}</li>}
            {cheapestShipping !== null && <li>Envío desde {formatCOP(cheapestShipping)}</li>}
            <li>Pago por transferencia: subes el comprobante y lo verificamos.</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 72 }}>
          <div className="section-head">
            <h2 className="section-title" style={{ fontSize: 34 }}>
              Más de <em>{product.category}</em>
            </h2>
            <Link className="pill-link" to={`/catalogo?cat=${encodeURIComponent(product.category)}`}>
              Ver la categoría →
            </Link>
          </div>
          <div className="products-grid" data-stagger>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
