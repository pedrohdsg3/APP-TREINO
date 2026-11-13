// Ícones de traço fino (24×24, stroke 1.75), desenhados para o app.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { tamanho?: number };
const base = ({ tamanho = 24, ...p }: P) => ({
  width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p,
});

export const IcHoje = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>
);
export const IcPrograma = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><circle cx="8.5" cy="14.5" r=".6" fill="currentColor" /><circle cx="12" cy="14.5" r=".6" fill="currentColor" /><circle cx="15.5" cy="14.5" r=".6" fill="currentColor" /></svg>
);
export const IcEvolucao = (p: P) => (
  <svg {...base(p)}><path d="M3.5 19.5h17" /><path d="m4.5 15 4.5-4.5 3.5 3 7-7.5" /><path d="M15 6h4.5v4.5" /></svg>
);
export const IcPerfil = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8.5" r="3.75" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></svg>
);
export const IcHalter = (p: P) => (
  <svg {...base(p)}><rect x="5" y="7" width="3" height="10" rx="1.2" /><rect x="16" y="7" width="3" height="10" rx="1.2" /><path d="M2.5 10v4M21.5 10v4M8 12h8" /></svg>
);
export const IcTenis = (p: P) => (
  <svg {...base(p)}><path d="M3 16.5V9.8c0-.7.6-1.2 1.3-1L8 9.8l2.2-2.6 1.6 1.4 6.4 3.6c1.8 1 2.8 2.1 2.8 3.5v.8H3Z" /><path d="M3 19.5h18M8 13l1.5-1.2M11 13.6l1.5-1.2" /></svg>
);
export const IcRelogio = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.8M10 2.5h4M12 2.5V6" /></svg>
);
export const IcChama = (p: P) => (
  <svg {...base(p)}><path d="M12 21c3.6 0 6.5-2.6 6.5-6.3 0-4.6-4.3-6.5-4.9-11.2-2.4 1.6-3.8 4-3.8 6.6-1-.6-1.6-1.6-1.8-2.7-1.6 1.6-2.5 3.5-2.5 5.8C5.5 18.4 8.4 21 12 21Z" /><path d="M12 21c-1.5 0-2.6-1.1-2.6-2.6 0-1.8 1.6-2.5 2.6-4.2 1 1.7 2.6 2.4 2.6 4.2 0 1.5-1.1 2.6-2.6 2.6Z" /></svg>
);
export const IcTrofeu = (p: P) => (
  <svg {...base(p)}><path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4Z" /><path d="M7.5 6H4.5c0 2.6 1.2 4 3.2 4.3M16.5 6h3c0 2.6-1.2 4-3.2 4.3M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z" /></svg>
);
export const IcBalanca = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8.5 9.5a5 5 0 0 1 7 0M12 9.5l1.3-1.8" /></svg>
);
export const IcSeta = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IcPlay = (p: P) => (
  <svg {...base(p)}><path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" /></svg>
);
export const IcSol = (p: P) => <IcHoje {...p} />;
export const IcLua = (p: P) => (
  <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
);
export const IcAuto = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" /></svg>
);
export const IcEscudo = (p: P) => (
  <svg {...base(p)}><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IcDuelo = (p: P) => (
  <svg {...base(p)}><path d="M4 4l7 7M4 4h4M4 4v4M20 4l-7 7M20 4h-4M20 4v4" /><path d="M9.5 13.5 5 18m0 0-1.5 1.5M5 18l1.5 1.5M14.5 13.5 19 18m0 0 1.5 1.5M19 18l-1.5 1.5" /></svg>
);
export const IcDieta = (p: P) => (
  <svg {...base(p)}><path d="M12 7c-1.5-1.8-4.5-2-6-.2C4.2 9 4.6 13.4 6.5 16.6 7.8 18.8 9.6 20.6 12 19.4c2.4 1.2 4.2-.6 5.5-2.8 1.9-3.2 2.3-7.6.5-9.8-1.5-1.8-4.5-1.6-6 .2Z" /><path d="M12 7c0-1.8.8-3.2 2.4-4" /></svg>
);
