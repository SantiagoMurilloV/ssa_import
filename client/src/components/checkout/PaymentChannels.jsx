import { useState } from 'react';

export default function PaymentChannels({ channels, selectedId, onSelect, showCopy = false }) {
  const [copied, setCopied] = useState(null);

  if (channels.length === 0) {
    return (
      <p className="hint-text">
        Estamos configurando los canales de pago. Escríbenos por WhatsApp y te pasamos los datos
        para la transferencia.
      </p>
    );
  }

  const copy = async (account) => {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(account);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* sin portapapeles: el número está visible igual */
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {channels.map((channel) => (
        <div
          key={channel.id}
          className={`channel-card ${selectedId === channel.id ? 'selected' : ''}`}
          onClick={() => onSelect?.(channel.id)}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={(e) => onSelect && e.key === 'Enter' && onSelect(channel.id)}
        >
          {onSelect && (
            <input
              type="radio"
              checked={selectedId === channel.id}
              onChange={() => onSelect(channel.id)}
              style={{ width: 'auto', marginTop: 4 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="channel-type">{channel.type}</div>
            <div className="channel-account">{channel.account}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>
              {channel.label}
              {channel.holder ? ` · ${channel.holder}` : ''}
            </div>
            {channel.instructions && (
              <div className="hint-text" style={{ marginTop: 4 }}>
                {channel.instructions}
              </div>
            )}
          </div>
          {showCopy && (
            <button
              type="button"
              className="pill-link"
              style={{ padding: '7px 14px', fontSize: 12.5, flexShrink: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                copy(channel.account);
              }}
            >
              {copied === channel.account ? 'Copiado ✓' : 'Copiar'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
