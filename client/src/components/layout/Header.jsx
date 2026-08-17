import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import Logo from './Logo.jsx';

export default function Header() {
  const { count, openCart } = useCart();
  const { pathname } = useLocation();
  const home = (hash) => (pathname === '/' ? hash : `/${hash}`);

  return (
    <nav className="nav-wrap">
      <div className="nav-bar">
        <Link to="/" className="nav-logo">
          <Logo />
        </Link>
        <div className="nav-links">
          <a href={home('#tanda')}>Novedades</a>
          <Link to="/catalogo">Catálogo</Link>
          <a href={home('#como')}>Cómo funciona</a>
          <a href={home('#encargos')}>Encargos</a>
          <a href={home('#contacto')}>Contacto</a>
        </div>
        <button className="cart-button" onClick={openCart} aria-label="Abrir carrito">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2A2A35" strokeWidth="1.5">
            <path d="M6 7h12l-1 13H7L6 7z" />
            <path d="M9 7a3 3 0 0 1 6 0" />
          </svg>
          <span style={{ fontWeight: 500 }}>{count}</span>
        </button>
      </div>
    </nav>
  );
}
