// Ilustrações em linha fina para estados vazios e destaques. Usam currentColor + variáveis de tema.

export function IlustraCalendario() {
  return (
    <svg viewBox="0 0 200 140" className="ilustra" aria-hidden="true">
      <circle cx="100" cy="72" r="58" className="il-halo" />
      <rect x="50" y="34" width="100" height="78" rx="14" className="il-traco" />
      <path d="M50 54h100M74 26v16M126 26v16" className="il-traco" />
      {[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => (
        <rect key={`${c}${r}`} x={62 + c * 16} y={64 + r * 14} width="9" height="7" rx="2.5"
          className={r === 1 && c === 2 ? 'il-musc' : r === 0 && c < 2 ? 'il-feito' : 'il-vazio'} />
      )))}
    </svg>
  );
}

export function IlustraGrafico() {
  return (
    <svg viewBox="0 0 200 140" className="ilustra" aria-hidden="true">
      <circle cx="100" cy="72" r="58" className="il-halo" />
      <path d="M46 108h108" className="il-traco" />
      <path d="M52 96c14-2 20-18 34-20s18 10 30-4 18-30 32-34" className="il-linha-musc" />
      <path d="M52 102c16 0 26-8 40-10s22 2 34-6 18-18 28-20" className="il-linha-corr" />
      <circle cx="148" cy="38" r="5" className="il-ponto" />
      <path d="M140 22l3 5 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1z" className="il-estrela" />
    </svg>
  );
}

export function IlustraHalterCorrida() {
  return (
    <svg viewBox="0 0 200 140" className="ilustra" aria-hidden="true">
      <circle cx="100" cy="70" r="58" className="il-halo" />
      <g className="il-traco-musc">
        <rect x="46" y="52" width="12" height="36" rx="5" />
        <rect x="90" y="52" width="12" height="36" rx="5" />
        <rect x="36" y="60" width="8" height="20" rx="3.5" />
        <rect x="104" y="60" width="8" height="20" rx="3.5" />
        <path d="M58 70h32" />
      </g>
      <g className="il-traco-corr">
        <path d="M118 96V82c0-1.5 1.4-2.5 2.8-2.1l7.8 2.1 4.6-5.5 3.4 3 13.4 7.6c3.8 2.1 5.8 4.4 5.8 7.3V96h-37.8Z" />
        <path d="M114 103h46M128 89l3-2.5M134 90.5l3-2.5" />
      </g>
    </svg>
  );
}
