// Cálculos da aba Evolução: séries temporais, recordes, volumes, metas e conquistas.
import { EXERCICIOS, type Grupo } from '../data/musculacao';
import type { RegistroCorpo, RegistroCorrida, RegistroSerie, Sessao } from '../db';
import { diasEntre, somarDias } from '../lib/datas';
import { epley } from './progressao';

export interface Ponto { data: string; valor: number }

/** Média móvel por janela de dias (inclui registros dos últimos `dias` dias até cada ponto). */
export function mediaMovel(pontos: Ponto[], dias = 7): Ponto[] {
  const ord = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  return ord.map((p) => {
    const janela = ord.filter((q) => q.data <= p.data && diasEntre(q.data, p.data) < dias);
    return { data: p.data, valor: janela.reduce((s, q) => s + q.valor, 0) / janela.length };
  });
}

/** Inclinação (por semana) da regressão linear dos pontos dos últimos `janelaDias`. */
export function tendenciaSemanal(pontos: Ponto[], janelaDias = 28): number | undefined {
  if (pontos.length < 2) return undefined;
  const ord = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  const ult = ord.at(-1)!.data;
  const j = ord.filter((p) => diasEntre(p.data, ult) <= janelaDias);
  if (j.length < 2) return undefined;
  const xs = j.map((p) => diasEntre(j[0].data, p.data)), ys = j.map((p) => p.valor);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (den === 0) return undefined;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / den;
  return slope * 7;
}

export const pesos = (corpo: RegistroCorpo[]): Ponto[] =>
  corpo.filter((c) => c.peso != null).map((c) => ({ data: c.data, valor: c.peso! })).sort((a, b) => a.data.localeCompare(b.data));

// ---------------------------------------------------------------- força
export interface SerieComData extends RegistroSerie { data: string }

export function juntarDatas(series: RegistroSerie[], sessoes: Sessao[]): SerieComData[] {
  const datas = new Map(sessoes.map((s) => [s.id, s.data]));
  return series.filter((s) => s.feita && datas.has(s.sessaoId)).map((s) => ({ ...s, data: datas.get(s.sessaoId)! }));
}

export interface SessaoExercicio { data: string; cargaMax: number; e1rm: number; volume: number; melhor: { carga: number; reps: number } }

export function historicoExercicio(series: SerieComData[], exercicioId: string): SessaoExercicio[] {
  const por = new Map<string, SerieComData[]>();
  for (const s of series.filter((x) => x.exercicioId === exercicioId)) por.set(s.sessaoId, [...(por.get(s.sessaoId) ?? []), s]);
  return [...por.values()].map((ss) => {
    const melhor = ss.reduce((a, b) => (epley(b.carga, b.reps) > epley(a.carga, a.reps) ? b : a));
    return {
      data: ss[0].data,
      cargaMax: Math.max(...ss.map((s) => s.carga)),
      e1rm: Math.max(...ss.map((s) => epley(s.carga, s.reps))),
      volume: ss.reduce((v, s) => v + s.carga * s.reps, 0),
      melhor: { carga: melhor.carga, reps: melhor.reps },
    };
  }).sort((a, b) => a.data.localeCompare(b.data));
}

/** Exercícios com histórico, mais frequentes primeiro. */
export function exerciciosComHistorico(series: SerieComData[]): string[] {
  const n = new Map<string, number>();
  for (const s of series) n.set(s.exercicioId, (n.get(s.exercicioId) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).filter((id) => EXERCICIOS[id]);
}

/** Índice da semana do programa (0-based) de uma data. */
export const semanaIdx = (inicio: string, data: string) => Math.floor(diasEntre(inicio, data) / 7);

export function volumeSemanal(series: SerieComData[], inicio: string, semanas: number, exercicioId?: string): number[] {
  const v = Array(semanas).fill(0);
  for (const s of series) {
    if (exercicioId && s.exercicioId !== exercicioId) continue;
    const i = semanaIdx(inicio, s.data);
    if (i >= 0 && i < semanas) v[i] += s.carga * s.reps;
  }
  return v;
}

export function volumePorGrupo(series: SerieComData[], de: string, ate: string): { grupo: Grupo; volume: number; series: number }[] {
  const m = new Map<Grupo, { volume: number; series: number }>();
  for (const s of series) {
    if (s.data < de || s.data > ate) continue;
    const g = EXERCICIOS[s.exercicioId]?.grupo;
    if (!g) continue;
    const x = m.get(g) ?? { volume: 0, series: 0 };
    m.set(g, { volume: x.volume + s.carga * s.reps, series: x.series + 1 });
  }
  return [...m.entries()].map(([grupo, x]) => ({ grupo, ...x })).sort((a, b) => b.series - a.series);
}

export interface Recorde { exercicioId: string; carga: number; reps: number; e1rm: number; data: string }
export function recordes(series: SerieComData[]): Recorde[] {
  const m = new Map<string, Recorde>();
  for (const s of series) {
    if (s.carga <= 0 || EXERCICIOS[s.exercicioId]?.medida !== 'reps') continue;
    const e = epley(s.carga, s.reps);
    const at = m.get(s.exercicioId);
    if (!at || e > at.e1rm) m.set(s.exercicioId, { exercicioId: s.exercicioId, carga: s.carga, reps: s.reps, e1rm: e, data: s.data });
  }
  return [...m.values()].sort((a, b) => b.data.localeCompare(a.data));
}

/** Exercícios em que a carga máxima da última sessão supera a da primeira. */
export function exerciciosQueProgrediram(series: SerieComData[]): number {
  return exerciciosComHistorico(series).filter((id) => {
    const h = historicoExercicio(series, id);
    return h.length >= 2 && h.at(-1)!.cargaMax > h[0].cargaMax;
  }).length;
}

// ---------------------------------------------------------------- corrida
export interface CorridaComData extends RegistroCorrida { data: string }
export function corridasComData(corridas: RegistroCorrida[], sessoes: Sessao[]): CorridaComData[] {
  const datas = new Map(sessoes.map((s) => [s.id, s.data]));
  return corridas.filter((c) => datas.has(c.sessaoId)).map((c) => ({ ...c, data: datas.get(c.sessaoId)! })).sort((a, b) => a.data.localeCompare(b.data));
}

export function porSemana<T extends { data: string }>(itens: T[], inicio: string, semanas: number, valor: (x: T) => number): number[] {
  const v = Array(semanas).fill(0);
  for (const x of itens) { const i = semanaIdx(inicio, x.data); if (i >= 0 && i < semanas) v[i] += valor(x); }
  return v;
}

export const maiorTroteContinuo = (c: CorridaComData[]) => Math.max(0, ...c.map((x) => x.maiorTroteSeg ?? 0));

// ---------------------------------------------------------------- consistência
export type EstadoCelula = 'feito' | 'parcial' | 'pulado' | 'vazio' | 'futuro';
export function mapaConsistencia(sessoes: Sessao[], inicio: string, semanas: number, hoje: string): EstadoCelula[][] {
  const por = new Map<string, Sessao[]>();
  for (const s of sessoes) por.set(s.data, [...(por.get(s.data) ?? []), s]);
  return Array.from({ length: semanas }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const data = somarDias(inicio, w * 7 + d);
    const ss = por.get(data) ?? [];
    if (ss.some((s) => s.status === 'feito')) return 'feito';
    if (ss.some((s) => s.status === 'parcial')) return 'parcial';
    if (ss.some((s) => s.status === 'pulado')) return 'pulado';
    return data > hoje ? 'futuro' : 'vazio';
  }));
}

// ---------------------------------------------------------------- conquistas
export interface Conquista { id: string; emoji: string; titulo: string; descricao: string; obtida: boolean; progresso?: number }

export function conquistas(o: {
  sessoes: Sessao[]; series: SerieComData[]; corridas: CorridaComData[]; corpo: RegistroCorpo[];
  inicio: string; hoje: string; pesoAlvo?: number; sequenciaMax: number;
}): Conquista[] {
  const feitos = o.sessoes.filter((s) => s.status === 'feito' || s.status === 'parcial');
  const mapa = mapaConsistencia(o.sessoes, o.inicio, 16, o.hoje);
  const completas = mapa.map((w) => w.every((c) => c === 'feito'));
  let seguidas = 0, maxSeguidas = 0;
  for (const c of completas) { seguidas = c ? seguidas + 1 : 0; maxSeguidas = Math.max(maxSeguidas, seguidas); }
  const prs = o.sessoes.reduce((s, x) => s + (x.prs ?? 0), 0);
  const trote = maiorTroteContinuo(o.corridas);
  const ps = pesos(o.corpo);
  const atingiuPeso = o.pesoAlvo != null && ps.length > 0 && ps.at(-1)!.valor <= o.pesoAlvo;
  const c = (id: string, emoji: string, titulo: string, descricao: string, atual: number, meta: number): Conquista =>
    ({ id, emoji, titulo, descricao, obtida: atual >= meta, progresso: Math.min(1, atual / meta) });
  return [
    c('primeiro', '🌱', 'Primeiro passo', 'Concluir o primeiro treino', feitos.length, 1),
    c('corrida1', '👟', 'Primeira corrida', 'Registrar a primeira corrida', o.corridas.length, 1),
    c('semana', '✅', 'Semana completa', 'Fazer os 7 treinos de uma semana', completas.filter(Boolean).length, 1),
    c('seq7', '🔥', 'Sequência de 7', '7 dias seguidos treinando', o.sequenciaMax, 7),
    c('pr1', '🏆', 'Primeiro PR', 'Bater um recorde pessoal', prs, 1),
    c('treinos20', '💪', '20 treinos', 'Concluir 20 treinos', feitos.length, 20),
    c('trote20', '⏱️', '20 min contínuos', 'Trotar 20 minutos sem parar', trote, 20 * 60),
    c('4semanas', '🗓️', '4 semanas seguidas', '4 semanas completas em sequência', maxSeguidas, 4),
    c('pr10', '🥇', '10 PRs', 'Somar 10 recordes pessoais', prs, 10),
    c('trote30', '🏅', '30 min contínuos', 'A grande meta da corrida', trote, 30 * 60),
    c('treinos50', '⚡', '50 treinos', 'Concluir 50 treinos', feitos.length, 50),
    { id: 'peso', emoji: '🎯', titulo: 'Peso-alvo', descricao: o.pesoAlvo ? `Chegar a ${o.pesoAlvo.toLocaleString('pt-BR')} kg` : 'Defina seu peso-alvo', obtida: atingiuPeso },
  ];
}

/** Maior sequência de dias seguidos com treino. */
export function sequenciaMaxima(sessoes: Sessao[]): number {
  const dias = [...new Set(sessoes.filter((s) => s.status !== 'pulado').map((s) => s.data))].sort();
  let max = 0, atual = 0;
  for (let i = 0; i < dias.length; i++) {
    atual = i > 0 && diasEntre(dias[i - 1], dias[i]) === 1 ? atual + 1 : 1;
    max = Math.max(max, atual);
  }
  return max;
}

// ---------------------------------------------------------------- metas
export interface MetaPessoal {
  id: string;
  titulo: string;
  unidade: string;
  inicial: number;
  alvo: number;
  registros: Ponto[];
  criada: string;
}
export function progressoMeta(inicial: number, alvo: number, atual: number): number {
  if (alvo === inicial) return atual === alvo ? 1 : 0;
  return Math.max(0, Math.min(1, (atual - inicial) / (alvo - inicial)));
}
export const valorAtual = (m: MetaPessoal) => [...m.registros].sort((a, b) => a.data.localeCompare(b.data)).at(-1)?.valor ?? m.inicial;
