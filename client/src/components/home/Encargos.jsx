import { useState } from 'react';
import { useSiteContent } from '../../context/SiteContentContext.jsx';
import { storeApi } from '../../api/store.api.js';
import { compressImage } from '../../utils/image.js';
import Honeypot from '../Honeypot.jsx';

const EMPTY = { producto: '', marca: '', color: '', talla: '', nombre: '', contacto: '', website: '' };

export default function Encargos() {
  const { encargos } = useSiteContent();
  const [form, setForm] = useState(EMPTY);
  const [foto, setFoto] = useState(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.producto.trim() || !form.nombre.trim() || !form.contacto.trim()) {
      setError('Completa el producto, tu nombre y tu WhatsApp.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('producto', form.producto.trim());
      ['marca', 'color', 'talla'].forEach((key) => {
        if (form[key].trim()) formData.append(key, form[key].trim());
      });
      formData.append('nombre', form.nombre.trim());
      formData.append('contacto', form.contacto.trim());
      formData.append('website', form.website);
      if (foto) formData.append('image', await compressImage(foto));
      await storeApi.createEncargo(formData);
      setSent(true);
    } catch (err) {
      setError(err.message ?? 'No pudimos enviar tu encargo. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="encargos" className="section" data-reveal data-fx="right">
      <div
        className="glass-card editorial-grid flip"
        style={{ background: 'rgba(150,138,190,.22)' }}
      >
        <div className="editorial-body" style={{ gap: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 0 }}>
            {encargos.eyebrow}
          </div>
          <h2 className="serif-title" style={{ fontSize: 36, margin: 0 }}>
            {encargos.titleLine1}
            <br />
            <em style={{ fontStyle: 'italic' }}>{encargos.titleLine2}</em>
          </h2>
          <p className="body-text" style={{ margin: 0 }}>
            {encargos.body}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {encargos.pasos.map((paso, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span className="step-dot">{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-75)' }}>{paso}</span>
              </div>
            ))}
          </div>
          <span className="mono-note">{encargos.footnote}</span>
        </div>

        <div
          className="editorial-body"
          style={{ gap: 12, background: 'rgba(255,255,255,.35)' }}
        >
          {sent ? (
            <div className="success-box">{encargos.success}</div>
          ) : (
            <>
              <input
                className="input"
                placeholder="Referencia del producto o link"
                value={form.producto}
                onChange={set('producto')}
              />
              <div className="form-grid-2">
                <input className="input" placeholder="Marca" value={form.marca} onChange={set('marca')} />
                <input className="input" placeholder="Color" value={form.color} onChange={set('color')} />
              </div>
              <input
                className="input"
                placeholder="Talla o medidas (según el producto)"
                value={form.talla}
                onChange={set('talla')}
              />
              <label className="upload-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A35" strokeWidth="1.5">
                  <path d="M4 7h3l2-2h6l2 2h3v12H4V7z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                />
                {foto ? foto.name : 'Foto de referencia (opcional)'}
              </label>
              <div className="form-grid-2">
                <input className="input" placeholder="Tu nombre" value={form.nombre} onChange={set('nombre')} />
                <input
                  className="input"
                  type="tel"
                  placeholder="WhatsApp"
                  value={form.contacto}
                  onChange={set('contacto')}
                />
              </div>
              <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
              {error && <p className="error-text">{error}</p>}
              <button className="btn-dark" style={{ marginTop: 6, width: '100%' }} onClick={submit} disabled={busy}>
                {busy ? 'Enviando…' : 'Pedir cotización'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
