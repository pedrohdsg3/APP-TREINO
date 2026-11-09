// Campo numérico com botões +/− grandes (uso com a mão suada). Toque no número para digitar.
import { useEffect, useState } from 'react';

export function Stepper({ valor, onChange, passo, rotulo, sufixo, min = 0, compacto }: {
  valor: number; onChange: (v: number) => void; passo: number; rotulo: string; sufixo?: string; min?: number; compacto?: boolean;
}) {
  const [texto, setTexto] = useState(fmt(valor));
  const [editando, setEditando] = useState(false);
  useEffect(() => { if (!editando) setTexto(fmt(valor)); }, [valor, editando]);
  const mudar = (d: number) => onChange(Math.max(min, Math.round((valor + d) * 100) / 100));
  return (
    <div className={`stepper ${compacto ? 'stepper--compacto' : ''}`}>
      <span className="stepper__rotulo">{rotulo}</span>
      <div className="stepper__linha">
        <button type="button" className="stepper__btn" onClick={() => mudar(-passo)} aria-label={`Diminuir ${rotulo}`}>−</button>
        <label className="stepper__valor">
          <input inputMode="decimal" aria-label={rotulo} value={texto}
            onFocus={(e) => { setEditando(true); e.target.select(); }}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
              setEditando(false);
              const n = parseFloat(texto.replace(',', '.'));
              if (!Number.isNaN(n)) onChange(Math.max(min, n)); else setTexto(fmt(valor));
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
          {sufixo && <small>{sufixo}</small>}
        </label>
        <button type="button" className="stepper__btn" onClick={() => mudar(passo)} aria-label={`Aumentar ${rotulo}`}>+</button>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
