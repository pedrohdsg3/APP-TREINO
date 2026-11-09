// Estado do treino de musculação em andamento. Funções puras + persistência no localStorage
import { chaveLocal } from '../lib/perfis';
// (gravado a cada ação, para retomar se o app fechar no meio).
import { EXERCICIOS } from '../data/musculacao';
import type { ItemPlanejado, MusculacaoPlanejada } from './plano';
import { detectarPR, sugerir, volume, type PR, type SerieFeita, type Sugestao } from './progressao';

export interface SerieAtiva { carga: number; reps: number; feita: boolean; ts?: number; pr?: PR['tipo'] }

export interface ExAtivo {
  item: ItemPlanejado;
  /** exercício originalmente planejado (antes de uma troca) */
  planejado: string;
  series: SerieAtiva[];
  /** séries da última vez que fez este exercício */
  anterior?: SerieFeita[];
  anteriorData?: string;
  /** todas as séries já feitas deste exercício (para PR) */
  historico: SerieFeita[];
  sugestao?: Sugestao;
  nota?: string;
  dores: string[];
}

export interface TreinoAtivo {
  versao: 1;
  sessaoId: string;
  data: string;
  semana: number;
  treinoId: string;
  titulo: string;
  inicio: number;
  fim?: number;
  etapa: 'aquecimento' | 'exercicio' | 'resumo';
  aquecimento: boolean[];
  exercicios: ExAtivo[];
  atual: number;
  descanso?: { fim: number; total: number };
  prs: PR[];
}

export interface HistoricoEx { ultima?: { data: string; series: SerieFeita[] }; todas: SerieFeita[] }

export const AQUECIMENTO = [
  '5 min de cardio leve (esteira, bike ou elíptico)',
  'Mobilidade de ombros: 10 círculos para cada lado',
  'Mobilidade de quadril e tornozelos',
  'Ativação: 15 polichinelos ou corda',
  '1–2 séries leves do 1º exercício (~50% da carga)',
];

function montarEx(item: ItemPlanejado, planejado: string, h: HistoricoEx | undefined, cargaInicial?: number): ExAtivo {
  const ex = EXERCICIOS[item.exercicioId];
  const sug = sugerir(item, h?.ultima?.series, item.cargaPct);
  const series: SerieAtiva[] = Array.from({ length: item.series }, (_, i) => {
    const ant = h?.ultima?.series[i] ?? h?.ultima?.series.at(-1);
    const inicial = cargaInicial ? Math.round(cargaInicial * (item.cargaPct ?? 100) / 100 * 2) / 2 : 0;
    const carga = ex.semCarga ? (ant?.carga ?? 0) : (sug?.carga ?? ant?.carga ?? inicial);
    const reps = ex.medida === 'falha' ? (ant?.reps ?? 10) : (sug?.reps ?? item.reps);
    return { carga, reps, feita: false };
  });
  return { item, planejado, series, anterior: h?.ultima?.series, anteriorData: h?.ultima?.data, historico: h?.todas ?? [], sugestao: sug, dores: [] };
}

export function montarTreino(p: MusculacaoPlanejada, o: { sessaoId: string; data: string; semana: number; agora: number; historico: Record<string, HistoricoEx>; cargasIniciais?: Record<string, number> }): TreinoAtivo {
  return {
    versao: 1, sessaoId: o.sessaoId, data: o.data, semana: o.semana, treinoId: p.id, titulo: p.titulo,
    inicio: o.agora, etapa: p.id === 'abdomen' ? 'exercicio' : 'aquecimento', aquecimento: AQUECIMENTO.map(() => false),
    exercicios: p.itens.map((it) => montarEx(it, it.exercicioId, o.historico[it.exercicioId], o.cargasIniciais?.[it.exercicioId])),
    atual: 0, prs: [],
  };
}

const copiaEx = (t: TreinoAtivo, i: number, f: (e: ExAtivo) => ExAtivo): TreinoAtivo => ({ ...t, exercicios: t.exercicios.map((e, j) => (j === i ? f(e) : e)) });

/** Altera carga/reps; a carga propaga para as séries seguintes ainda não feitas que tinham o mesmo valor. */
export function ajustarSerie(t: TreinoAtivo, ei: number, si: number, campo: 'carga' | 'reps', valor: number): TreinoAtivo {
  return copiaEx(t, ei, (e) => {
    const antigo = e.series[si][campo];
    const v = Math.max(0, Math.round(valor * 100) / 100);
    return {
      ...e,
      series: e.series.map((s, k) => {
        if (k === si) return { ...s, [campo]: v };
        if (campo === 'carga' && k > si && !s.feita && s.carga === antigo) return { ...s, carga: v };
        return s;
      }),
    };
  });
}

export const seriesFeitas = (e: ExAtivo) => e.series.filter((s) => s.feita).length;
export const exConcluido = (e: ExAtivo) => e.series.every((s) => s.feita);
export const treinoConcluido = (t: TreinoAtivo) => t.exercicios.every(exConcluido);

/** Conclui a série, detecta PR e inicia o descanso (exceto quando o treino terminou). */
export function concluirSerie(t: TreinoAtivo, ei: number, si: number, agora: number, descansoSeg: number): { treino: TreinoAtivo; pr?: PR } {
  const e = t.exercicios[ei];
  const s = e.series[si];
  const ex = EXERCICIOS[e.item.exercicioId];
  const feitasAntes = e.series.filter((x, k) => x.feita && k !== si);
  const pr = ex.medida === 'reps' && !ex.semCarga ? detectarPR(e.item.exercicioId, s, [...e.historico, ...feitasAntes]) : undefined;
  let novo = copiaEx(t, ei, (x) => ({ ...x, series: x.series.map((y, k) => (k === si ? { ...y, feita: true, ts: agora, pr: pr?.tipo } : y)) }));
  // mantém só o melhor PR por exercício
  if (pr) novo = { ...novo, prs: [...novo.prs.filter((p) => p.exercicioId !== pr.exercicioId), pr] };
  const acabou = treinoConcluido(novo);
  novo = { ...novo, descanso: acabou ? undefined : { fim: agora + descansoSeg * 1000, total: descansoSeg } };
  return { treino: novo, pr };
}

export function desfazerSerie(t: TreinoAtivo, ei: number, si: number): TreinoAtivo {
  return copiaEx(t, ei, (x) => ({ ...x, series: x.series.map((y, k) => (k === si ? { ...y, feita: false, ts: undefined, pr: undefined } : y)) }));
}

export function ajustarDescanso(t: TreinoAtivo, deltaSeg: number, agora: number): TreinoAtivo {
  if (!t.descanso) return t;
  const fim = Math.max(agora, t.descanso.fim + deltaSeg * 1000);
  return { ...t, descanso: { fim, total: Math.max(t.descanso.total + deltaSeg, 1) } };
}

/** Próximo exercício com séries pendentes (a partir do atual, dando a volta). */
export function proximoPendente(t: TreinoAtivo, aPartirDe = t.atual): number | undefined {
  const n = t.exercicios.length;
  for (let k = 1; k <= n; k++) {
    const i = (aPartirDe + k) % n;
    if (!exConcluido(t.exercicios[i])) return i;
  }
  return undefined;
}

/** Leva o exercício `de` para a posição atual (trocar a ordem / "fazer agora"). */
export function fazerAgora(t: TreinoAtivo, de: number): TreinoAtivo {
  if (de === t.atual) return t;
  const lista = [...t.exercicios];
  const [e] = lista.splice(de, 1);
  const alvo = de < t.atual ? t.atual - 1 : t.atual;
  // se o atual já foi iniciado, o escolhido entra logo depois dele
  const atualIniciado = seriesFeitas(t.exercicios[t.atual]) > 0 && !exConcluido(t.exercicios[t.atual]);
  const pos = atualIniciado ? alvo + 1 : alvo;
  lista.splice(pos, 0, e);
  return { ...t, exercicios: lista, atual: pos };
}

/** Pular: manda o exercício para o fim da fila. */
export function pularExercicio(t: TreinoAtivo): TreinoAtivo {
  const lista = [...t.exercicios];
  const [e] = lista.splice(t.atual, 1);
  lista.push(e);
  const prox = t.atual >= lista.length - 1 ? 0 : t.atual;
  return { ...t, exercicios: lista, atual: prox, descanso: undefined };
}

export function trocarExercicio(t: TreinoAtivo, ei: number, novoId: string, h: HistoricoEx | undefined): TreinoAtivo {
  return copiaEx(t, ei, (e) => {
    const item: ItemPlanejado = { ...e.item, exercicioId: novoId };
    const novo = montarEx(item, e.planejado, h);
    return { ...novo, nota: e.nota, dores: e.dores };
  });
}

export function adicionarSerie(t: TreinoAtivo, ei: number): TreinoAtivo {
  return copiaEx(t, ei, (e) => {
    const ult = e.series.at(-1)!;
    return { ...e, series: [...e.series, { carga: ult.carga, reps: ult.reps, feita: false }] };
  });
}

export function removerSerie(t: TreinoAtivo, ei: number): TreinoAtivo {
  return copiaEx(t, ei, (e) => {
    if (e.series.length <= 1 || e.series.at(-1)!.feita) return e;
    return { ...e, series: e.series.slice(0, -1) };
  });
}

/** Alternativas: as definidas no exercício + outros do mesmo grupo. */
export function alternativas(exercicioId: string, planejado: string): string[] {
  const ex = EXERCICIOS[exercicioId];
  const base = EXERCICIOS[planejado];
  const ids = new Set([planejado, ...(base.alternativas ?? []), ...(ex.alternativas ?? []),
    ...Object.values(EXERCICIOS).filter((x) => x.grupo === base.grupo).map((x) => x.id)]);
  ids.delete(exercicioId);
  return [...ids];
}

export interface Resumo {
  duracaoSeg: number;
  volumeKg: number;
  seriesFeitas: number;
  seriesTotal: number;
  prs: PR[];
}
export function resumir(t: TreinoAtivo, agora: number): Resumo {
  const feitas = t.exercicios.flatMap((e) => e.series.filter((s) => s.feita));
  return {
    duracaoSeg: Math.round(((t.fim ?? agora) - t.inicio) / 1000),
    volumeKg: volume(feitas),
    seriesFeitas: feitas.length,
    seriesTotal: t.exercicios.reduce((s, e) => s + e.series.length, 0),
    prs: t.prs,
  };
}

// ---------- persistência ----------
const CHAVE_BASE = 'treino.ativo';
export function lerTreinoAtivo(): TreinoAtivo | null {
  try {
    const t = JSON.parse(localStorage.getItem(chaveLocal(CHAVE_BASE)) ?? 'null');
    return t?.versao === 1 ? t : null;
  } catch { return null; }
}
export function gravarTreinoAtivo(t: TreinoAtivo | null) {
  try {
    if (t) localStorage.setItem(chaveLocal(CHAVE_BASE), JSON.stringify(t));
    else localStorage.removeItem(chaveLocal(CHAVE_BASE));
  } catch { /* storage cheio/bloqueado */ }
}
