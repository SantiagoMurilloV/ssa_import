export default function Logo({ width = 46, height = 24, size = 'md' }) {
  const isSmall = size === 'sm';
  return (
    <>
      <svg width={width} height={height} viewBox="0 0 92 42" aria-hidden="true" style={{ display: 'block' }}>
        <path
          d="M10 30 Q46 4 78 26"
          fill="none"
          stroke="#968ABE"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="0.5 7"
        />
        <circle cx="10" cy="30" r="4.5" fill="#968ABE" />
        <circle cx="78" cy="26" r="4" fill="#7E9A88" />
        <circle cx="78" cy="26" r="8" fill="none" stroke="#7E9A88" strokeWidth="1.4" opacity=".55" />
      </svg>
      <span className="nav-logo-divider" style={{ height: isSmall ? 18 : 26 }} />
      <span className="nav-logo-text">
        <span className="nav-logo-ssa" style={isSmall ? { fontSize: 19 } : undefined}>
          SSA
        </span>
        <span className="nav-logo-import" style={isSmall ? { fontSize: 8 } : undefined}>
          IMPORT
        </span>
      </span>
    </>
  );
}
