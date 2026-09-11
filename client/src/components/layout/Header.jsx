import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import Logo from './Logo.jsx';
import TrackingSearch from '../tracking/TrackingSearch.jsx';

export default function Header() {
  const { count, openCart } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [trackOpen, setTrackOpen] = useState(false);
  const wrapRef = useRef(null);
  const home = (hash) => (pathname === '/' ? hash : `/${hash}`);
  const onTracking = pathname.startsWith('/envios');

  // El panel de la guía se cierra al navegar, con Escape o tocando afuera
  useEffect(() => setTrackOpen(false), [pathname]);
  useEffect(() => {
    if (!trackOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setTrackOpen(false);
    const onClick = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setTrackOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [trackOpen]);

  const search = (reference) => {
    setTrackOpen(false);
    navigate(`/envios/${reference}`);
  };

  return (
    <nav className={`nav-wrap ${trackOpen ? 'is-tracking' : ''}`} ref={wrapRef}>
      <div className="nav-bar">
        <Link to="/" className="nav-logo">
          <Logo />
        </Link>
        <div className="nav-links">
          <Link to="/catalogo">Catálogo</Link>
          <button
            type="button"
            className={`nav-link-btn ${trackOpen || onTracking ? 'active' : ''}`}
            onClick={() => setTrackOpen((open) => !open)}
            aria-expanded={trackOpen}
            aria-controls="nav-tracking"
          >
            Envíos
            <span className="nav-link-dot" aria-hidden="true" />
          </button>
          <a href={home('#quienes')}>Quiénes somos</a>
          <a href={home('#encargos')}>Encargos</a>
          <a href={home('#contacto')}>Contacto</a>
        </div>
        <div className="nav-actions">
          <button
            type="button"
            className={`nav-icon-btn ${trackOpen || onTracking ? 'active' : ''}`}
            onClick={() => setTrackOpen((open) => !open)}
            aria-label="Rastrear un envío"
            aria-expanded={trackOpen}
            aria-controls="nav-tracking"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" strokeLinejoin="round" />
              <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="cart-button" onClick={openCart} aria-label="Abrir carrito">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2A2A35" strokeWidth="1.5">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span style={{ fontWeight: 500 }}>{count}</span>
          </button>
        </div>
      </div>

      {/* Se despliega debajo de la barra sin mover el contenido de la página */}
      <div id="nav-tracking" className={`nav-tracking ${trackOpen ? 'open' : ''}`} aria-hidden={!trackOpen}>
        <div className="nav-tracking-inner">
          <div className="nav-tracking-text">
            <span className="eyebrow">Sigue tu pedido</span>
            <span className="nav-tracking-hint">Ingresa el número de guía que te enviamos y presiona Enter.</span>
          </div>
          <TrackingSearch compact autoFocus={trackOpen} onSubmit={search} />
        </div>
      </div>
    </nav>
  );
}
