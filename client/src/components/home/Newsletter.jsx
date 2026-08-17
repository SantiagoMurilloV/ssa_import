import { useState } from 'react';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import { storeApi } from '../../api/store.api.js';
import Honeypot from '../Honeypot.jsx';

export default function Newsletter() {
  const { newsletter } = useSiteContent();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const subscribe = async () => {
    if (!email.includes('@')) {
      setError('Escribe un correo válido.');
      return;
    }
    setError(null);
    try {
      await storeApi.subscribe(email.trim(), website);
      setSent(true);
    } catch {
      setError('No pudimos registrarte. Intenta de nuevo.');
    }
  };

  return (
    <section className="section-narrow" data-reveal data-fx="scale">
      <h2 className="serif-title" style={{ fontSize: 36, margin: '0 0 10px' }}>
        {newsletter.title}
      </h2>
      <p style={{ fontSize: 15, color: 'var(--ink-60)', margin: '0 0 26px' }}>{newsletter.body}</p>
      {sent ? (
        <div className="success-box" style={{ display: 'inline-block', padding: '16px 24px' }}>
          {newsletter.success}
        </div>
      ) : (
        <>
          <div className="newsletter-box">
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && subscribe()}
            />
            <button onClick={subscribe}>Avísenme</button>
          </div>
          <Honeypot value={website} onChange={setWebsite} />
          {error && (
            <p className="error-text" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
