// Confete discreto em canvas (desligado com prefers-reduced-motion).
import { useEffect, useRef } from 'react';

const CORES = ['#6366F1', '#34D399', '#F5C451', '#F48A73', '#A5B4FC'];

export function Confete({ disparo }: { disparo: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!disparo || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current; if (!cv) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const c = cv.getContext('2d')!; c.scale(dpr, dpr);
    const ps = Array.from({ length: 90 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 10 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, cor: CORES[Math.floor(Math.random() * CORES.length)],
    }));
    const t0 = performance.now();
    let raf = 0;
    const passo = (t: number) => {
      const dt = t - t0;
      c.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of ps) {
        p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        c.save(); c.globalAlpha = Math.max(0, 1 - dt / 1900); c.translate(p.x, p.y); c.rotate(p.r);
        c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      }
      if (dt < 1900) raf = requestAnimationFrame(passo); else c.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [disparo]);
  return <canvas ref={ref} className="confete" aria-hidden="true" />;
}
