// Progressão dupla, 1RM estimado (Epley), PRs e volume.
import { EXERCICIOS, type Exercicio, type ItemTreino } from '../data/musculacao';

export interface SerieFeita { carga: number; reps: number }

/** 1RM estimado pela fórmula de Epley. */
export function epley(carga: number, reps: number): number {
  if (carga <= 0 || reps <= 0) return 0;
  return reps === 1 ? carga : carga * (1 + reps / 30);
}

export const arred = (kg: number, passo = 0.5) => Math.round(kg / passo) * passo;

/** Incremento sugerido ao bater o topo das repetições. */
export function incremento(ex: Exercicio): number {
  if (ex.tipo === 'isolador') return ex.regiao === 'inferior' ? 2.5 : 2;
  return ex.regiao === 'inferior' ? 5 : 2.5;
}

/** Passo dos botões +/− de carga. */
export function passoCarga(ex: Exercicio): number {
  return /halter/i.test(ex.nome) ? 1 : 2.5;
}

export interface Sugestao {
  /** carga sugerida por série */
  carga: number;
  /** repetições-alvo sugeridas */
  reps: number;
  /** subiu a carga por ter batido o topo em todas as séries */
  subir: boolean;
  texto: string;
}

/**
 * Progressão dupla: se na última vez todas as séries atingiram o topo da faixa,
 * sobe a carga e volta para as repetições mínimas. Em semana de recuperação, carga × pct.
 */
export function sugerir(item: ItemTreino, anterior: SerieFeita[] | undefined, cargaPct = 100): Sugestao | undefined {
  const ex = EXERCICIOS[item.exercicioId];
  if (!anterior?.length) return undefined;
  const base = Math.max(...anterior.map((s) => s.carga));
  const ajusta = (kg: number) => (cargaPct < 100 ? arred((kg * cargaPct) / 100, passoCarga(ex)) : kg);
  if (ex.medida !== 'reps' || ex.semCarga) {
    return { carga: base, reps: item.reps, subir: false, texto: 'Mesma carga; tente superar as repetições da última vez.' };
  }
  const bateuTopo = anterior.length >= item.series && anterior.every((s) => s.reps >= item.reps);
  if (bateuTopo && cargaPct === 100) {
    const nova = base + incremento(ex);
    return { carga: nova, reps: item.repsMin ?? item.reps, subir: true, texto: `Você bateu ${item.reps} reps em todas as séries: suba para ${fmtKg(nova)} e volte a ${item.repsMin ?? item.reps} reps.` };
  }
  if (cargaPct < 100) {
    const c = ajusta(base);
    return { carga: c, reps: item.reps, subir: false, texto: `Semana de recuperação: ${fmtKg(c)} (~${cargaPct}% de ${fmtKg(base)}).` };
  }
  return { carga: base, reps: item.reps, subir: false, texto: `Mantenha ${fmtKg(base)} e busque ${item.reps} reps em todas as séries.` };
}

export function fmtKg(kg: number): string {
  return `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

export const volume = (series: SerieFeita[]) => series.reduce((s, x) => s + x.carga * x.reps, 0);

export interface PR {
  exercicioId: string;
  tipo: 'carga' | '1rm';
  carga: number;
  reps: number;
  /** valor anterior (carga ou 1RM) */
  anterior: number;
  e1rm: number;
}

/**
 * Detecta PR de uma série comparando com o histórico (sem a sessão atual).
 * Sem histórico não há PR (a primeira vez é a referência).
 * - 1RM: maior 1RM estimado de todos.
 * - carga: maior carga já usada com pelo menos essa quantidade de repetições.
 */
export function detectarPR(exercicioId: string, serie: SerieFeita, historico: SerieFeita[]): PR | undefined {
  const validos = historico.filter((h) => h.carga > 0 && h.reps > 0);
  if (!validos.length || serie.carga <= 0 || serie.reps <= 0) return undefined;
  const e1 = epley(serie.carga, serie.reps);
  const melhor1rm = Math.max(...validos.map((h) => epley(h.carga, h.reps)));
  if (e1 > melhor1rm + 1e-9) return { exercicioId, tipo: '1rm', carga: serie.carga, reps: serie.reps, anterior: melhor1rm, e1rm: e1 };
  const mesmaFaixa = validos.filter((h) => h.reps >= serie.reps);
  const melhorCarga = mesmaFaixa.length ? Math.max(...mesmaFaixa.map((h) => h.carga)) : 0;
  if (mesmaFaixa.length && serie.carga > melhorCarga) return { exercicioId, tipo: 'carga', carga: serie.carga, reps: serie.reps, anterior: melhorCarga, e1rm: e1 };
  return undefined;
}
