import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import { useCartTotals } from '../../hooks/useCartTotals.js';
import { formatCOP } from '../../utils/format.js';
import { tinteFor } from '../home/ProductCard.jsx';

export default function CartDrawer() {
  const { isOpen, closeCart, setQuantity, removeItem } = useCart();
  const { lines, subtotal, isEmpty } = useCartTotals();
  const { checkout } = useSiteContent();
  const navigate = useNavigate();

  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {isOpen && <div className="cart-backdrop" onClick={closeCart} />}
      <aside
        className="cart-drawer"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(110%)' }}
        aria-hidden={!isOpen}
      >
        <div className="cart-panel">
          <div className="cart-head">
            <h3>Tu carrito</h3>
            <button className="cart-close" onClick={closeCart} aria-label="Cerrar carrito">
              ×
            </button>
          </div>
          <div className="cart-items">
            {isEmpty && (
              <p style={{ fontSize: 14, color: 'var(--ink-55)', textAlign: 'center', marginTop: 40 }}>
                Aún no has agregado piezas.
              </p>
            )}
            {lines.map(({ key, product, variant, quantity, unitPrice }) => {
              const photo = product.photos?.[0];
              return (
                <div className="cart-item" key={key}>
                  <div
                    className="cart-item-thumb"
                    style={
                      photo?.mediaType === 'image'
                        ? undefined
                        : {
                            background: `repeating-linear-gradient(-45deg, ${tinteFor(product.id)} 0 8px, rgba(255,255,255,.5) 8px 16px)`
                          }
                    }
                  >
                    {photo?.mediaType === 'image' && <img src={photo.url} alt="" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{product.name}</div>
                    {variant?.label && (
                      <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>{variant.label}</div>
                    )}
                    <div style={{ fontSize: 12.5, color: 'var(--ink-55)', marginTop: 3 }}>
                      <span className="cart-qty">
                        <button onClick={() => setQuantity(key, quantity - 1)} aria-label="Menos">
                          −
                        </button>
                        {quantity}
                        <button onClick={() => setQuantity(key, quantity + 1)} aria-label="Más">
                          +
                        </button>
                      </span>{' '}
                      × {formatCOP(unitPrice)}
                    </div>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(key)}>
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
          <div className="cart-foot">
            <div className="cart-total-row">
              <span style={{ color: 'var(--ink-60)' }}>Subtotal</span>
              <span style={{ fontWeight: 500 }}>{formatCOP(subtotal)}</span>
            </div>
            <button className="cart-cta" onClick={goToCheckout} disabled={isEmpty}>
              Confirmar pedido
            </button>
            <p style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'center', margin: '12px 0 0' }}>
              {checkout.preventaNote}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
