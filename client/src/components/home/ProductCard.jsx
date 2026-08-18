import { Link } from 'react-router-dom';
import { formatCOP } from '../../utils/format.js';
import { useCart } from '../../context/CartContext.jsx';

// Tintes del diseño: se asignan de forma estable por id cuando no hay foto
const TINTES = ['rgba(217,212,231,.6)', 'rgba(242,217,206,.6)', 'rgba(207,219,211,.6)'];
export const tinteFor = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % TINTES.length;
  return TINTES[hash];
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  // Con opciones no se puede agregar desde la tarjeta: hay que elegir talla o
  // aroma primero, así que el botón lleva al detalle.
  const needsChoice = (product.options ?? []).length > 0;
  const photo = product.photos?.[0];
  const hasDiscount = product.basePrice > product.price;

  const href = `/producto/${encodeURIComponent(product.id)}`;

  return (
    <article className="product-card">
      {/* La tarjeta entera abre el detalle; el botón "Agregar" queda fuera del
          link para que no se dispare la navegación al agregar al carrito. */}
      <Link className="product-link" to={href}>
        <div
          className="product-photo"
          style={
            photo
              ? undefined
              : {
                  background: `repeating-linear-gradient(-45deg, ${tinteFor(product.id)} 0 14px, rgba(255,255,255,.5) 14px 28px)`
                }
          }
        >
          {photo ? (
            photo.mediaType === 'video' ? (
              <video src={photo.url} muted loop playsInline autoPlay preload="metadata" />
            ) : (
              <img src={photo.url} alt={product.name} loading="lazy" />
            )
          ) : (
            <span className="photo-tag">foto: {product.name.toLowerCase()} 4:5</span>
          )}
        </div>
        <div className="product-body">
          <span className={`product-badge ${product.inStock ? 'stock' : 'preventa'}`}>
            {product.inStock ? 'En stock' : 'Preventa'}
            {/* el detalle largo se oculta en móvil, donde la tarjeta es angosta */}
            <span className="product-badge-more">
              {product.inStock ? ' · envío inmediato' : ' · 15 días hábiles'}
            </span>
          </span>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-detail">{product.detail}</p>
        </div>
      </Link>
      <div className="product-body product-body-foot">
        <div className="product-foot">
          <span className="product-price">
            {hasDiscount && <s>{formatCOP(product.basePrice)}</s>}
            {formatCOP(product.price)}
          </span>
          {needsChoice ? (
            <Link className="btn-dark btn-sm" to={href}>
              Elegir
            </Link>
          ) : (
            <button className="btn-dark btn-sm" onClick={() => addItem(product.id)}>
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
