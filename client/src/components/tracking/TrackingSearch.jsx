import { useEffect, useRef, useState } from 'react';
import { normalizeReference } from '../../config/tracking.js';

// El campo del número de guía. Se usa en el header (compacto) y en la página
// de envíos (grande). Normaliza lo que la gente escribe antes de buscar.
export default function TrackingSearch({ onSubmit, autoFocus = false, compact = false, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!autoFocus) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const submit = (e) => {
    e?.preventDefault();
    const reference = normalizeReference(value);
    if (!reference) {
      setError('El código tiene el formato SSA-123456. Está en el mensaje que te enviamos al registrar tu pedido.');
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onSubmit(reference);
  };

  return (
    <form className={`track-search ${compact ? 'is-compact' : ''} ${error ? 'has-error' : ''}`} onSubmit={submit} noValidate>
      <div className="track-search-box">
        <span className="track-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" strokeLinejoin="round" />
            <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" strokeLinejoin="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder={compact ? 'SSA-123456' : 'Escribe tu número de guía · SSA-123456'}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label="Número de guía"
          aria-invalid={Boolean(error)}
        />
        <button type="submit" className="track-search-btn">
          Rastrear
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {error && <p className="error-text track-search-error">{error}</p>}
    </form>
  );
}
