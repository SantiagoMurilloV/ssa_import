import { useMemo, useState } from 'react';
import { COLOMBIA_CITIES } from '../../data/colombia-cities.js';
import { normalizeCityName } from '../../utils/shipping.js';

// Combobox: sugiere ciudades conocidas y autocompleta el departamento,
// pero permite escribir municipios no listados (pagan la tarifa por defecto).
export default function CityField({ city, department, onChange }) {
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const query = normalizeCityName(city);
    if (query.length < 2) return [];
    return COLOMBIA_CITIES.filter((entry) => normalizeCityName(entry.city).includes(query)).slice(0, 6);
  }, [city]);

  return (
    <div className="form-grid-2">
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          placeholder="Ciudad"
          value={city}
          autoComplete="address-level2"
          onChange={(e) => {
            onChange({ city: e.target.value, department });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 20,
              listStyle: 'none',
              margin: 0,
              padding: 6,
              borderRadius: 14,
              background: 'rgba(250,247,244,.97)',
              border: '1px solid rgba(255,255,255,.8)',
              boxShadow: '0 14px 40px rgba(42,42,53,.16)'
            }}
          >
            {suggestions.map((entry) => (
              <li key={`${entry.city}-${entry.department}`}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    padding: '9px 11px',
                    borderRadius: 10,
                    fontSize: 14,
                    color: 'var(--ink)'
                  }}
                  onMouseDown={() => onChange({ city: entry.city, department: entry.department })}
                >
                  {entry.city}
                  <span style={{ color: 'var(--ink-45)', fontSize: 12.5 }}> · {entry.department}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        className="input"
        placeholder="Departamento"
        value={department}
        autoComplete="address-level1"
        onChange={(e) => onChange({ city, department: e.target.value })}
      />
    </div>
  );
}
