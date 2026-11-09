// Avisos sonoros (Web Audio), vibração e voz. O áudio é liberado no primeiro toque.
import { lerPrefs } from './prefs';

let ctx: AudioContext | null = null;

export function liberarAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    // toca um silêncio para destravar no iOS
    const o = ctx.createOscillator(), g = ctx.createGain();
    g.gain.value = 0; o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.01);
  } catch { /* sem áudio */ }
}

if (typeof window !== 'undefined') {
  const f = () => liberarAudio();
  window.addEventListener('pointerdown', f, { passive: true });
  window.addEventListener('keydown', f);
}

function tom(freq: number, inicio: number, dur: number, vol = 0.25) {
  if (!ctx) return;
  const t = ctx.currentTime + inicio;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

export type Aviso = 'fim' | 'tique' | 'sucesso' | 'fase';

export function avisar(tipo: Aviso) {
  const p = lerPrefs();
  if (p.som && ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    if (tipo === 'tique') tom(880, 0, 0.12, 0.18);
    if (tipo === 'fim') { tom(880, 0, 0.18); tom(880, 0.25, 0.18); tom(1320, 0.5, 0.4); }
    if (tipo === 'fase') { tom(660, 0, 0.2); tom(990, 0.22, 0.35); }
    if (tipo === 'sucesso') { tom(784, 0, 0.15); tom(988, 0.13, 0.15); tom(1319, 0.26, 0.35); }
  }
  if (p.vibracao && 'vibrate' in navigator) {
    try {
      navigator.vibrate(tipo === 'tique' ? 60 : tipo === 'sucesso' ? [80, 60, 80] : [250, 120, 250, 120, 400]);
    } catch { /* iOS não suporta */ }
  }
}

export function falar(texto: string) {
  if (!lerPrefs().voz || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('pt'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* sem voz */ }
}
