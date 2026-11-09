// Corrida em andamento. Tudo derivado de timestamps: tempo ativo = agora − início − pausas.
// As fases são sequenciais; "pular" adiciona um deslocamento ao tempo do plano.
import type { Fase } from '../data/corrida';
import type { CorridaPlanejada } from './plano';

export interface CorridaAtiva {
  versao: 1;
  sessaoId: string;
  data: string;
  semana?: number;
  /** 'livre' = cronômetro simples, sem fases */
  modo: 'guiada' | 'livre';
  treinoId: string;
  titulo: string;
  resumo: string;
  fases: Fase[];
  inicio: number;
  pausas: { inicio: number; fim?: number }[];
  /** segundos somados ao tempo do plano por "pular fase" */
  deslocamento: number;
  /** trechos do plano pulados (s) — não contam como trote feito */
  pulos?: { de: number; ate: number }[];
  fim?: number;
  etapa: 'correndo' | 'registro';
  /** dor informada durante a corrida (≥ 4 encerra o trote do dia) */
  dorDurante?: number;
}

/** contagemSeg: segundos de "prepare-se" antes de o cronômetro começar (início fica no futuro). */
export function montarCorrida(c: CorridaPlanejada | null, o: { sessaoId: string; data: string; semana?: number; agora: number; treinoId: string; contagemSeg?: number }): CorridaAtiva {
  return {
    versao: 1, sessaoId: o.sessaoId, data: o.data, semana: o.semana, treinoId: o.treinoId,
    modo: c ? 'guiada' : 'livre', titulo: c?.titulo ?? 'Corrida livre', resumo: c?.resumo ?? 'Cronômetro livre',
    fases: c?.fases ?? [], inicio: o.agora + (o.contagemSeg ?? 0) * 1000, pausas: [], deslocamento: 0, etapa: 'correndo',
  };
}

/** Ainda na contagem regressiva inicial? */
export const naContagem = (t: CorridaAtiva, agora: number) => agora < t.inicio && t.etapa === 'correndo';
export const comecarAgora = (t: CorridaAtiva, agora: number): CorridaAtiva => (agora < t.inicio ? { ...t, inicio: agora } : t);

export const pausada = (t: CorridaAtiva) => !!t.pausas.at(-1) && t.pausas.at(-1)!.fim === undefined;

/** Segundos de corrida efetiva (sem pausas). */
export function tempoAtivo(t: CorridaAtiva, agora: number): number {
  const ate = t.fim ?? agora;
  const pausado = t.pausas.reduce((s, p) => s + ((p.fim ?? ate) - p.inicio), 0);
  return Math.max(0, (ate - t.inicio - pausado) / 1000);
}

export const totalPlano = (t: CorridaAtiva) => t.fases.reduce((s, f) => s + f.seg, 0);

export interface EstadoFase {
  indice: number; // = fases.length quando acabou
  fase?: Fase;
  proxima?: Fase;
  restante: number;
  decorridoFase: number;
  /** posição no plano (s) */
  noPlano: number;
  concluida: boolean;
  totalBlocos: number;
}

export function estadoFase(t: CorridaAtiva, agora: number): EstadoFase {
  const noPlano = tempoAtivo(t, agora) + t.deslocamento;
  const totalBlocos = Math.max(0, ...t.fases.map((f) => f.bloco ?? 0));
  let acc = 0;
  for (let i = 0; i < t.fases.length; i++) {
    const f = t.fases[i];
    if (noPlano < acc + f.seg) {
      return { indice: i, fase: f, proxima: t.fases[i + 1], restante: acc + f.seg - noPlano, decorridoFase: noPlano - acc, noPlano, concluida: false, totalBlocos };
    }
    acc += f.seg;
  }
  return { indice: t.fases.length, restante: 0, decorridoFase: 0, noPlano, concluida: t.modo === 'guiada', totalBlocos };
}

export function pausar(t: CorridaAtiva, agora: number): CorridaAtiva {
  return pausada(t) ? t : { ...t, pausas: [...t.pausas, { inicio: agora }] };
}
export function retomar(t: CorridaAtiva, agora: number): CorridaAtiva {
  if (!pausada(t)) return t;
  return { ...t, pausas: t.pausas.map((p, i) => (i === t.pausas.length - 1 ? { ...p, fim: agora } : p)) };
}

export function pularFase(t: CorridaAtiva, agora: number): CorridaAtiva {
  const e = estadoFase(t, agora);
  if (e.concluida || !e.fase) return t;
  const salto = e.restante + 0.001;
  return { ...t, deslocamento: t.deslocamento + salto, pulos: [...(t.pulos ?? []), { de: e.noPlano, ate: e.noPlano + salto }] };
}

/**
 * Dor no joelho durante a corrida. Com dor ≥ 4, todo trote restante (inclusive o atual)
 * vira caminhada: encerra o trote do dia.
 */
export function informarDor(t: CorridaAtiva, dor: number, agora: number): CorridaAtiva {
  const novo = { ...t, dorDurante: Math.max(dor, t.dorDurante ?? 0) };
  if (dor < 4 || t.modo === 'livre') return novo;
  const { indice } = estadoFase(t, agora);
  return {
    ...novo,
    fases: t.fases.map((f, i) => (i >= indice && f.tipo === 'trote' ? { ...f, tipo: 'caminhada', rotulo: 'CAMINHADA' } : f)),
  };
}

export function encerrar(t: CorridaAtiva, agora: number): CorridaAtiva {
  const r = retomar(t, agora);
  return { ...r, fim: agora, etapa: 'registro' };
}

export interface ResumoCorrida {
  duracaoSeg: number;
  /** segundos de trote efetivamente feitos */
  troteSeg: number;
  /** maior trecho contínuo de trote (s) */
  maiorTroteSeg: number;
}

export function resumirCorrida(t: CorridaAtiva, agora: number): ResumoCorrida {
  const dur = tempoAtivo(t, agora);
  if (t.modo === 'livre') return { duracaoSeg: Math.round(dur), troteSeg: Math.round(dur), maiorTroteSeg: Math.round(dur) };
  // tempo de plano realmente vivido por fase (pular não conta)
  const noPlano = dur + t.deslocamento;
  let acc = 0, trote = 0, maior = 0, seq = 0;
  for (const f of t.fases) {
    const ini = acc, fimF = acc + f.seg;
    acc = fimF;
    const sobre = (a: number, b: number) => Math.max(0, Math.min(b, fimF) - Math.max(a, ini));
    const vivido = Math.max(0, sobre(0, noPlano) - (t.pulos ?? []).reduce((x, p) => x + sobre(p.de, p.ate), 0));
    if (f.tipo === 'trote') { trote += vivido; seq += vivido; maior = Math.max(maior, seq); if (vivido < f.seg) seq = 0; }
    else seq = 0;
  }
  trote = Math.min(trote, dur);
  maior = Math.min(maior, dur);
  return { duracaoSeg: Math.round(dur), troteSeg: Math.round(trote), maiorTroteSeg: Math.round(maior) };
}

/** pace (s/km) */
export function pace(duracaoSeg: number, km?: number): number | undefined {
  if (!km || km <= 0 || duracaoSeg <= 0) return undefined;
  return duracaoSeg / km;
}
export function fmtPace(segKm?: number): string {
  if (!segKm) return '—';
  const m = Math.floor(segKm / 60), s = Math.round(segKm % 60);
  return s === 60 ? `${m + 1}:00 /km` : `${m}:${String(s).padStart(2, '0')} /km`;
}

/** Frase falada na troca de fase. */
export function fraseDaFase(f: Fase | undefined): string {
  if (!f) return 'Treino concluído. Muito bem!';
  if (f.tipo === 'desaquecimento') return 'Desaquecimento. Caminhe leve.';
  if (f.tipo === 'aquecimento') return 'Aquecimento. Caminhe leve.';
  if (f.tipo === 'caminhada') return f.rotulo.includes('BIKE') ? 'Cardio leve.' : 'Hora de caminhar.';
  if (f.rotulo.includes('FIRME')) return 'Trote firme, sem sprint.';
  if (f.rotulo.includes('LEVE')) return 'Trote leve.';
  return 'Hora de trotar.';
}

// ---------- persistência ----------
const CHAVE = 'treino.corrida';
export function lerCorridaAtiva(): CorridaAtiva | null {
  try { const t = JSON.parse(localStorage.getItem(CHAVE) ?? 'null'); return t?.versao === 1 ? t : null; } catch { return null; }
}
export function gravarCorridaAtiva(t: CorridaAtiva | null) {
  try { if (t) localStorage.setItem(CHAVE, JSON.stringify(t)); else localStorage.removeItem(CHAVE); } catch { /* ignora */ }
}
