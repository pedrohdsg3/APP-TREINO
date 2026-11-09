import { useEffect, useState } from 'react';

/** Date.now() atualizado periodicamente (os cronômetros sempre derivam do timestamp). */
export function useAgora(intervalo = 250): number {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervalo);
    const vis = () => setAgora(Date.now());
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [intervalo]);
  return agora;
}

/** Mantém a tela acesa enquanto `ativo` (Screen Wake Lock), com fallback silencioso. */
export function useWakeLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelado = false;
    const pedir = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        lock = await navigator.wakeLock.request('screen');
        if (cancelado) void lock.release();
      } catch { /* sem suporte ou negado */ }
    };
    void pedir();
    const vis = () => { if (document.visibilityState === 'visible') void pedir(); };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelado = true; document.removeEventListener('visibilitychange', vis); void lock?.release().catch(() => {}); };
  }, [ativo]);
}

export function fmtRelogio(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(r).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
