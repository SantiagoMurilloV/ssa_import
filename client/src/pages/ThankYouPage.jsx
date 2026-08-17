import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { storeApi } from '../api/store.api.js';
import { formatCOP } from '../utils/format.js';
import { readOrderSnapshot } from '../utils/order-snapshot.js';
import { compressImage } from '../utils/image.js';
import PaymentChannels from '../components/checkout/PaymentChannels.jsx';

function ReceiptUploader({ reference, receiptToken }) {
  const { checkout } = useSiteContent();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [error, setError] = useState(null);

  const upload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    try {
      const compressed = await compressImage(file);
      await storeApi.uploadReceipt(reference, compressed, receiptToken);
      setStatus('done');
    } catch (err) {
      setError(err.message ?? 'No pudimos subir tu comprobante. Intenta de nuevo.');
      setStatus('error');
    }
  };

  // Sin el token (por ejemplo, abriendo el enlace en otro navegador) no podemos
  // adjuntar nada: el comprobante se recibe por WhatsApp.
  if (!receiptToken) {
    return (
      <p className="hint-text">
        Para subir el comprobante abre esta página en el mismo navegador donde hiciste el pedido, o
        envíanoslo por WhatsApp con tu referencia <strong>{reference}</strong>.
      </p>
    );
  }

  if (status === 'done') {
    return (
      <div className="success-box">
        Recibimos tu comprobante. Verificamos el pago y te confirmamos por WhatsApp.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="upload-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A35" strokeWidth="1.5">
          <path d="M4 7h3l2-2h6l2 2h3v12H4V7z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setStatus('idle');
          }}
        />
        {file ? file.name : 'Seleccionar foto del comprobante'}
      </label>
      {error && <p className="error-text">{error}</p>}
      <button className="btn-dark" onClick={upload} disabled={!file || status === 'uploading'}>
        {status === 'uploading' ? 'Subiendo…' : 'Subir comprobante'}
      </button>
      <p className="hint-text">{checkout.receiptNote}</p>
    </div>
  );
}

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('ref') ?? '';
  const { paymentChannels } = useCatalog();
  const { checkout, footer } = useSiteContent();
  const snapshot = useMemo(() => readOrderSnapshot(reference), [reference]);

  // Muestra solo el canal elegido si lo conocemos; si no, todos los activos
  const channels = snapshot?.channels ?? paymentChannels;
  const selected = channels.filter((ch) => ch.id === snapshot?.selectedChannelId);
  const visibleChannels = selected.length > 0 ? selected : channels;

  const whatsappHref = footer.whatsapp
    ? `https://wa.me/${footer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola, acabo de hacer el pedido ${reference} y te envío el comprobante.`
      )}`
    : null;

  if (!reference) {
    return (
      <section className="section" style={{ paddingTop: 72 }}>
        <h1 className="serif-title" style={{ fontSize: 44 }}>No encontramos tu pedido</h1>
        <p style={{ color: 'var(--ink-60)', margin: '10px 0 26px' }}>
          Si acabas de comprar, revisa el enlace que te dimos o escríbenos por WhatsApp.
        </p>
        <Link className="btn-dark" to="/">Volver al inicio</Link>
      </section>
    );
  }

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="glass-card checkout-panel" style={{ marginBottom: 22, background: 'rgba(111,146,124,.2)' }}>
        <h2 style={{ fontSize: 34 }}>{checkout.thanksTitle}</h2>
        <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-68)', margin: '0 0 14px' }}>
          {checkout.thanksBody}
        </p>
        <div className="mono-note">TU REFERENCIA</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, letterSpacing: '0.06em' }}>
          {reference}
        </div>
      </div>

      <div className="checkout-grid">
        <div className="glass-card checkout-panel">
          <h2>Transfiere y sube tu comprobante</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-68)', margin: '0 0 16px' }}>
            {checkout.transferInstructions}
          </p>
          <PaymentChannels channels={visibleChannels} showCopy />
          <div style={{ height: 22 }} />
          <ReceiptUploader reference={reference} receiptToken={snapshot?.receiptToken} />
          {whatsappHref && (
            <>
              <div style={{ height: 14 }} />
              <a className="btn-light" href={whatsappHref} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center' }}>
                Enviarlo por WhatsApp
              </a>
            </>
          )}
        </div>

        <div className="glass-card checkout-panel" style={{ background: 'rgba(150,138,190,.18)' }}>
          <h2>Resumen</h2>
          {snapshot ? (
            <>
              {snapshot.lines.map((line, i) => (
                <div className="summary-row" key={i}>
                  <span style={{ color: 'var(--ink-68)' }}>
                    {line.quantity}× {line.name}
                  </span>
                  <span>{formatCOP(line.price * line.quantity)}</span>
                </div>
              ))}
              <div className="summary-row" style={{ borderTop: '1px solid rgba(42,42,53,.08)', marginTop: 8, paddingTop: 12 }}>
                <span style={{ color: 'var(--ink-60)' }}>Subtotal</span>
                <span>{formatCOP(snapshot.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: 'var(--ink-60)' }}>Envío</span>
                <span>{formatCOP(snapshot.shippingFee)}</span>
              </div>
              <div className="summary-row total">
                <span>Total a transferir</span>
                <span>{formatCOP(snapshot.total)}</span>
              </div>
            </>
          ) : (
            <p className="hint-text">
              Guarda tu referencia <strong>{reference}</strong> y escríbenos si necesitas el detalle
              del pedido.
            </p>
          )}
          <div style={{ height: 18 }} />
          <Link className="pill-link" to="/catalogo">Seguir comprando</Link>
        </div>
      </div>
    </section>
  );
}
