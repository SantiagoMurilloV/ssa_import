import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { useCartTotals } from '../hooks/useCartTotals.js';
import { useCheckoutForm } from '../hooks/useCheckoutForm.js';
import { formatCOP } from '../utils/format.js';
import { saveOrderSnapshot } from '../utils/order-snapshot.js';
import CityField from '../components/checkout/CityField.jsx';
import PaymentChannels from '../components/checkout/PaymentChannels.jsx';
import Honeypot from '../components/Honeypot.jsx';

function Summary({ lines, subtotal, shippingFee, city }) {
  return (
    <div className="glass-card checkout-panel" style={{ background: 'rgba(150,138,190,.18)' }}>
      <h2>Tu pedido</h2>
      {lines.map(({ product, quantity, lineTotal }) => (
        <div className="summary-row" key={product.id}>
          <span style={{ color: 'var(--ink-68)' }}>
            {quantity}× {product.name}
          </span>
          <span>{formatCOP(lineTotal)}</span>
        </div>
      ))}
      <div className="summary-row" style={{ borderTop: '1px solid rgba(42,42,53,.08)', marginTop: 8, paddingTop: 12 }}>
        <span style={{ color: 'var(--ink-60)' }}>Subtotal</span>
        <span>{formatCOP(subtotal)}</span>
      </div>
      <div className="summary-row">
        <span style={{ color: 'var(--ink-60)' }}>Envío</span>
        <span>{city.trim() ? formatCOP(shippingFee ?? 0) : 'Escribe tu ciudad'}</span>
      </div>
      <div className="summary-row total">
        <span>Total</span>
        <span>{city.trim() ? formatCOP(subtotal + (shippingFee ?? 0)) : formatCOP(subtotal)}</span>
      </div>
      <p className="hint-text" style={{ marginTop: 14 }}>
        El total definitivo lo confirma SSA Import al recibir el pedido.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const { paymentChannels } = useCatalog();
  const { checkout } = useSiteContent();
  const { form, setField, errors, submitError, busy, submitOrder } = useCheckoutForm();
  const { lines, subtotal, shippingFee, isEmpty } = useCartTotals(form.city);
  const [channelId, setChannelId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!channelId && paymentChannels.length > 0) setChannelId(paymentChannels[0].id);
  }, [paymentChannels, channelId]);

  const confirm = async () => {
    const snapshotLines = lines.map(({ product, quantity }) => ({
      name: product.name,
      quantity,
      price: product.price
    }));
    const result = await submitOrder(channelId);
    if (!result) return;
    // El carrito ya se limpió: guardamos el resumen para la página de gracias
    saveOrderSnapshot({
      reference: result.order.reference,
      // Credencial para subir el comprobante de este pedido; vive solo en
      // sessionStorage, nunca en la URL.
      receiptToken: result.order.receiptToken,
      subtotal: result.order.subtotal,
      shippingFee: result.order.shippingFee,
      total: result.order.total,
      channels: result.paymentChannels ?? paymentChannels,
      selectedChannelId: channelId,
      lines: snapshotLines
    });
    navigate(`/gracias?ref=${encodeURIComponent(result.order.reference)}`);
  };

  if (isEmpty) {
    return (
      <section className="section" style={{ paddingTop: 72 }}>
        <h1 className="serif-title" style={{ fontSize: 44 }}>Tu carrito está vacío</h1>
        <p style={{ color: 'var(--ink-60)', margin: '10px 0 26px' }}>
          Agrega productos del catálogo para continuar con tu pedido.
        </p>
        <Link className="btn-dark" to="/catalogo">Ver catálogo</Link>
      </section>
    );
  }

  const field = (key, label, props = {}) => (
    <div>
      <input
        className="input"
        placeholder={label}
        value={form[key]}
        onChange={(e) => setField(key, e.target.value)}
        {...props}
      />
      {errors[key] && <p className="error-text" style={{ marginTop: 5 }}>{errors[key]}</p>}
    </div>
  );

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <h1 className="serif-title" style={{ fontSize: 46, marginBottom: 8 }}>Confirmar pedido</h1>
      <p style={{ color: 'var(--ink-60)', margin: '0 0 30px', maxWidth: 520 }}>
        Déjanos tus datos de envío y elige por dónde vas a transferir. En el siguiente paso te
        mostramos los datos de la cuenta y subes tu comprobante.
      </p>

      <div className="checkout-grid">
        <div className="glass-card checkout-panel">
          <h2>Datos de envío</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {field('fullName', 'Nombre completo', { autoComplete: 'name' })}
            <div className="form-grid-2">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 15,
                      color: 'var(--ink-60)',
                      padding: '14px 0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    +57
                  </span>
                  <input
                    className="input"
                    placeholder="WhatsApp"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <p className="error-text" style={{ marginTop: 5 }}>{errors.phone}</p>}
              </div>
              {field('email', 'Correo', { type: 'email', autoComplete: 'email' })}
            </div>
            <CityField
              city={form.city}
              department={form.department}
              onChange={({ city, department }) => {
                setField('city', city);
                setField('department', department);
              }}
            />
            {(errors.city || errors.department) && (
              <p className="error-text">{errors.city ?? errors.department}</p>
            )}
            {field('address', 'Dirección completa', { autoComplete: 'street-address' })}
            <textarea
              className="input"
              placeholder="Notas para la entrega (opcional)"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
            <Honeypot value={form.website} onChange={(v) => setField('website', v)} />
          </div>

          <div style={{ height: 26 }} />
          <h2>{checkout.transferTitle}</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-68)', margin: '0 0 16px' }}>
            {checkout.transferInstructions}
          </p>
          <PaymentChannels
            channels={paymentChannels}
            selectedId={channelId}
            onSelect={setChannelId}
          />

          {submitError && <p className="error-text" style={{ marginTop: 16 }}>{submitError}</p>}
          <button className="btn-dark" style={{ width: '100%', marginTop: 22 }} onClick={confirm} disabled={busy}>
            {busy ? 'Creando tu pedido…' : 'Confirmar pedido y ver datos de pago'}
          </button>
        </div>

        <Summary lines={lines} subtotal={subtotal} shippingFee={shippingFee} city={form.city} />
      </div>
    </section>
  );
}
