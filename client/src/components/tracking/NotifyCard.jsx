import { useTrackingNotifications } from '../../hooks/useTrackingNotifications.js';

// Pide permiso para avisar cuando ESTE código cambie de etapa. El navegador
// solo muestra el diálogo de permisos desde un clic, por eso hay un botón.
export default function NotifyCard({ reference, push, delivered }) {
  const { state, error, busy, enable, disable, hint } = useTrackingNotifications(reference, push);

  if (state === 'unavailable') return null;
  if (delivered && state !== 'on') return null;

  const copy = {
    on: {
      title: 'Avisos activos',
      body: (
        <>
          Te llega una notificación cada vez que <strong>{reference}</strong> cambie de etapa. Solo de este pedido, nada más.
        </>
      )
    },
    denied: {
      title: 'Avisos bloqueados',
      body: 'Tu navegador tiene bloqueadas las notificaciones de esta tienda. Actívalas en la configuración del sitio y vuelve a intentarlo.'
    },
    unsupported: { title: 'Avisos no disponibles aquí', body: hint },
    off: {
      title: '¿Te avisamos cuando avance?',
      body: (
        <>
          Activa los avisos y te llega una notificación en cada etapa de <strong>{reference}</strong>: cuando despegue, cuando llegue a Colombia, cuando salga de la bodega. Solo de este pedido.
        </>
      )
    },
    loading: { title: '¿Te avisamos cuando avance?', body: 'Revisando si este navegador admite notificaciones…' }
  }[state];

  return (
    <div className={`glass-card notify-card is-${state}`} data-reveal data-fx="scale">
      <div className="notify-bell" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.3 19a2 2 0 0 0 3.4 0" strokeLinecap="round" />
        </svg>
        {state === 'on' && <span className="notify-check">✓</span>}
      </div>
      <div className="notify-body">
        <h3>{copy.title}</h3>
        <p>{copy.body}</p>
        {error && <p className="error-text">{error}</p>}
      </div>
      {(state === 'off' || state === 'loading') && (
        <button type="button" className="btn-dark notify-btn" onClick={enable} disabled={busy || state === 'loading'}>
          {busy ? 'Activando…' : 'Sí, avísenme'}
        </button>
      )}
      {state === 'on' && (
        <button type="button" className="pill-link notify-btn" onClick={disable} disabled={busy}>
          {busy ? 'Un momento…' : 'Desactivar'}
        </button>
      )}
    </div>
  );
}
