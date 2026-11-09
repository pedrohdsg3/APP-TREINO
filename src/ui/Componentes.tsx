// Componentes base do design system.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '', destaque }: { children: ReactNode; className?: string; destaque?: 'musc' | 'corr' }) {
  return <section className={`card ${destaque ? `card--${destaque}` : ''} ${className}`}>{children}</section>;
}

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'fantasma';
  cor?: 'musc' | 'corr';
  grande?: boolean;
  icone?: ReactNode;
};
export function Botao({ variante = 'primario', cor = 'musc', grande, icone, className = '', children, ...p }: BotaoProps) {
  return (
    <button className={`btn btn--${variante} btn--${cor} ${grande ? 'btn--grande' : ''} ${className}`} {...p}>
      {icone}<span>{children}</span>
    </button>
  );
}

export function Chip({ children, cor }: { children: ReactNode; cor?: 'musc' | 'corr' | 'alerta' | 'neutro' }) {
  return <span className={`chip chip--${cor ?? 'neutro'}`}>{children}</span>;
}

/** Anel de progresso (0..1). Animado via CSS (stroke-dashoffset). */
export function Anel({ progresso, tamanho = 64, espessura = 6, cor = 'musc', children }: {
  progresso: number; tamanho?: number; espessura?: number; cor?: 'musc' | 'corr'; children?: ReactNode;
}) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progresso));
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} className="anel__trilho" strokeWidth={espessura} />
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} className={`anel__barra anel__barra--${cor}`} strokeWidth={espessura}
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`} />
      </svg>
      {children && <div className="anel__centro">{children}</div>}
    </div>
  );
}

export function Segmentado<T extends string>({ opcoes, valor, onChange, rotulo }: {
  opcoes: { valor: T; rotulo: string; icone?: ReactNode }[]; valor: T; onChange: (v: T) => void; rotulo: string;
}) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button key={o.valor} role="radio" aria-checked={valor === o.valor}
          className={valor === o.valor ? 'ativo' : ''} onClick={() => onChange(o.valor)}>
          {o.icone}{o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function EstadoVazio({ ilustracao, titulo, texto }: { ilustracao: ReactNode; titulo: string; texto: string }) {
  return (
    <div className="vazio">
      {ilustracao}
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </div>
  );
}
