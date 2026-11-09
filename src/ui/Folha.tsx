// Bottom sheet: desliza de baixo, fecha no fundo escuro, no X ou com Esc.
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Folha({ aberta, aoFechar, titulo, children }: { aberta: boolean; aoFechar: () => void; titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', tecla);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', tecla);
  }, [aberta, aoFechar]);
  if (!aberta) return null;
  return createPortal(
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="folha__alca" aria-hidden="true" />
        <button className="folha__fechar" onClick={aoFechar} aria-label="Fechar">✕</button>
        <div className="folha__conteudo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
