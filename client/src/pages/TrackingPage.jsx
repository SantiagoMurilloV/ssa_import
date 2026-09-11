import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { storeApi } from '../api/store.api.js';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { trackPageView } from '../api/track.api.js';
import { normalizeReference, stageInfo, FINAL_TRACKING_STAGE } from '../config/tracking.js';
import { relativeTime } from '../utils/format.js';
import { tinteFor } from '../components/home/ProductCard.jsx';
import TrackingSearch from '../components/tracking/TrackingSearch.jsx';
import JourneyMap from '../components/tracking/JourneyMap.jsx';
import StageTimeline from '../components/tracking/StageTimeline.jsx';
import NotifyCard from '../components/tracking/NotifyCard.jsx';

const REFRESH_MS = 45000;

function Landing({ onSearch, message, reference }) {
  return (
    <section className="section track-landing">
      <div className="track-landing-head" data-reveal>
        <span className="eyebrow">Envíos</span>
        <h1 className="track-landing-title">
          Sigue tu pedido <em>de EE. UU. a tu puerta</em>
        </h1>
        <p className="track-landing-lead">
          Ingresa el número de guía que te enviamos al registrar tu pedido y mira en qué punto del viaje va:
          en Estados Unidos, en vuelo, en nuestra bodega de Armenia o ya en camino a ti.
        </p>
        <TrackingSearch autoFocus onSubmit={onSearch} initialValue={reference ?? ''} />
        {message && (
          <div className="track-notfound" role="status">
            <strong>{message.title}</strong>
            <span>{message.body}</span>
          </div>
        )}
      </div>
      <div className="glass-card track-demo" data-reveal data-fx="scale">
        <JourneyMap demo />
        <p className="hint-text track-demo-note">
          Así se ve el recorrido. Los pedidos de la tienda usan la misma referencia <strong>SSA-######</strong> que aparece en tu confirmación.
        </p>
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <section className="section track-page" aria-busy="true" aria-label="Cargando la guía">
      <div className="track-head">
        <div className="skel skel-eyebrow" />
        <div className="skel skel-title" />
        <div className="skel skel-line" />
      </div>
      <div className="track-grid">
        <div className="glass-card track-product skel-card">
          <div className="skel skel-photo" />
        </div>
        <div className="track-main">
          <div className="glass-card track-map-card skel-card">
            <div className="skel skel-map" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCardSide({ tracking }) {
  const { product, items, customerFirstName, city, reference } = tracking;
  const tinte = tinteFor(reference);
  return (
    <aside className="glass-card track-product" data-reveal data-fx="left">
      <div
        className={`track-photo ${product.photoUrl ? '' : 'is-empty'}`}
        style={product.photoUrl ? undefined : { background: `repeating-linear-gradient(-45deg, ${tinte} 0 14px, rgba(255,255,255,.5) 14px 28px)` }}
      >
        {product.photoUrl ? (
          <img src={product.photoUrl} alt={product.name} />
        ) : (
          <span className="track-photo-letter">{(product.brand || product.name).slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="track-product-body">
        <span className="eyebrow">Tu pedido</span>
        {product.brand && <span className="track-brand">{product.brand}</span>}
        <h2 className="track-product-name">{product.name}</h2>
        {items.length > 1 && (
          <ul className="track-items">
            {items.map((item, i) => (
              <li key={i}>
                {item.quantity}× {item.name}
              </li>
            ))}
          </ul>
        )}
        <p className="track-for">
          {customerFirstName ? `Para ${customerFirstName}` : 'Para ti'}
          {city ? ` · ${city}` : ''}
        </p>
      </div>
    </aside>
  );
}

export default function TrackingPage() {
  const { reference: rawReference } = useParams();
  const navigate = useNavigate();
  const { footer } = useSiteContent();
  const reference = rawReference ? normalizeReference(rawReference) : null;
  const [state, setState] = useState({ status: rawReference ? 'loading' : 'idle', tracking: null, error: null });

  useEffect(() => {
    trackPageView();
  }, []);

  // /envios/ssa482913 → /envios/SSA-482913, para que el enlace compartido sea siempre el mismo
  useEffect(() => {
    if (rawReference && reference && rawReference !== reference) {
      navigate(`/envios/${reference}`, { replace: true });
    }
  }, [rawReference, reference, navigate]);

  useEffect(() => {
    if (!rawReference) {
      setState({ status: 'idle', tracking: null, error: null });
      return undefined;
    }
    if (!reference) {
      setState({ status: 'invalid', tracking: null, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    const load = (silent) =>
      storeApi
        .getTracking(reference)
        .then(({ tracking }) => !cancelled && setState({ status: 'ready', tracking, error: null }))
        .catch((err) => {
          if (cancelled || silent) return;
          setState({ status: err.status === 404 ? 'notfound' : 'error', tracking: null, error: err.message });
        });
    load(false);
    // Mientras la página esté abierta, la etapa se refresca sola
    const interval = setInterval(() => load(true), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [rawReference, reference]);

  const search = (next) => navigate(`/envios/${next}`);

  if (state.status === 'idle') return <Landing onSearch={search} />;
  if (state.status === 'invalid') {
    return (
      <Landing
        onSearch={search}
        reference={rawReference}
        message={{ title: 'Ese código no tiene forma de guía.', body: 'Revisa el mensaje que te enviamos: el formato es SSA-123456.' }}
      />
    );
  }
  if (state.status === 'notfound') {
    return (
      <Landing
        onSearch={search}
        reference={reference}
        message={{
          title: `No encontramos ningún pedido con el código ${reference}.`,
          body: 'Revisa que esté bien escrito o escríbenos por WhatsApp y lo buscamos contigo.'
        }}
      />
    );
  }
  if (state.status === 'error') {
    return (
      <Landing
        onSearch={search}
        reference={reference}
        message={{ title: 'No pudimos consultar la guía en este momento.', body: state.error ?? 'Intenta de nuevo en unos segundos.' }}
      />
    );
  }
  if (state.status === 'loading') return <Skeleton />;

  const { tracking } = state;
  const stage = stageInfo(tracking.stage);
  const delivered = tracking.stage === FINAL_TRACKING_STAGE;
  const whatsappHref = footer.whatsapp
    ? `https://wa.me/${footer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre mi pedido ${tracking.reference}.`)}`
    : null;

  return (
    <section className={`section track-page ${tracking.cancelled ? 'is-cancelled' : ''}`}>
      <div className="track-head" data-reveal>
        <span className="eyebrow">Seguimiento de envío</span>
        <h1 className="track-ref">{tracking.reference}</h1>
        <p className="track-status">
          {tracking.cancelled ? (
            <>Este pedido fue <strong>cancelado</strong>. Si crees que es un error, escríbenos.</>
          ) : delivered ? (
            <>
              <strong>Entregado.</strong> Esperamos que lo disfrutes{tracking.customerFirstName ? `, ${tracking.customerFirstName}` : ''}.
            </>
          ) : (
            <>
              Tu pedido está <strong>{stage?.phrase ?? stage?.label}</strong>
              {tracking.updatedAt ? <span className="track-updated"> · actualizado {relativeTime(tracking.updatedAt)}</span> : null}
            </>
          )}
        </p>
      </div>

      <div className="track-grid">
        <ProductCardSide tracking={tracking} />
        <div className="track-main">
          <div className="glass-card track-map-card" data-reveal>
            <JourneyMap stage={tracking.stage} cancelled={tracking.cancelled} />
          </div>
          {!tracking.cancelled && <NotifyCard reference={tracking.reference} push={tracking.push} delivered={delivered} />}
          <div className="glass-card track-timeline-card" data-reveal>
            <h2 className="track-section-title">Recorrido</h2>
            <StageTimeline tracking={tracking} />
          </div>
          <div className="track-help" data-reveal>
            <span>¿Dudas con tu pedido?</span>
            <div className="track-help-actions">
              {whatsappHref && (
                <a className="btn-light" href={whatsappHref} target="_blank" rel="noreferrer">
                  Escríbenos por WhatsApp
                </a>
              )}
              <Link className="pill-link" to="/envios">
                Buscar otro código
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
