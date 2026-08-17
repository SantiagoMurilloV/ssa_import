import { Link } from 'react-router-dom';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import Logo from './Logo.jsx';

export default function Footer() {
  const { footer } = useSiteContent();
  const social = [
    ['Instagram', footer.instagram],
    ['TikTok', footer.tiktok],
    ['WhatsApp', footer.whatsapp ? `https://wa.me/${footer.whatsapp.replace(/\D/g, '')}` : '']
  ];

  return (
    <footer id="contacto" className="footer-wrap">
      <div className="footer-card">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <Logo width={40} height={21} size="sm" />
            </div>
            <p className="footer-desc">{footer.description}</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <span className="footer-col-title">Tienda</span>
              <a href="/#tanda">Novedades</a>
              <Link to="/catalogo">Catálogo</Link>
              <a href="/#quienes">Quiénes somos</a>
              <a href="/#encargos">Encargos</a>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Síguenos</span>
              {social.map(([label, href]) =>
                href ? (
                  <a key={label} href={href} target="_blank" rel="noreferrer">
                    {label}
                  </a>
                ) : (
                  <span key={label} className="footer-social-off">
                    {label}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{footer.legalLine}</span>
          <span>{footer.paymentsNote}</span>
        </div>
      </div>
    </footer>
  );
}
