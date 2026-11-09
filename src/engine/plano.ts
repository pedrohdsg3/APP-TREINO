// Monta o treino planejado de qualquer dia do programa.
import { EXERCICIOS, TREINOS_MUSCULACAO, DESCANSO_PADRAO, type ItemTreino, type TreinoMusculacaoId, type Grupo } from '../data/musculacao';
import { CORRIDA_BASE, CORRIDA_INTERVALADA, CORRIDA_LEVE, AQUECIMENTO_SEG, DESAQUECIMENTO_SEG, type Fase } from '../data/corrida';
import { diasEntre, somarDias } from '../lib/datas';

export const SEMANAS_PROGRAMA = 12;
export const INICIO_PADRAO = '2026-11-09'; // segunda-feira

export type NomeFase = 'Base' | 'Recuperação' | 'Progressão' | 'Intensificação';

export function faseDaSemana(semana: number): NomeFase {
  if (semana === 4 || semana === 8 || semana === 12) return 'Recuperação';
  if (semana <= 3) return 'Base';
  if (semana <= 7) return 'Progressão';
  return 'Intensificação';
}
export const ehRecuperacao = (semana: number) => faseDaSemana(semana) === 'Recuperação';

export const ORIENTACAO_CORRIDA: Record<NomeFase, string> = {
  Base: 'Progressão por tempo e esforço, não por pace. Trote no ritmo em que você consegue falar frases.',
  Progressão: 'Blocos de trote mais longos, mesmo esforço confortável. Nunca aumente tempo e intensidade juntos.',
  Intensificação: 'Rumo aos 30 minutos contínuos. Ritmo confortável; se o joelho reclamar, volte a caminhar.',
  Recuperação: 'Semana de recuperação: menos volume para o corpo (e o joelho) assimilarem.',
};

export const ORIENTACAO_FASE: Record<NomeFase, string> = {
  Base: 'Esforço 7–8/10, deixando 1–2 repetições na reserva. Aprenda os movimentos e ajuste as cargas.',
  Progressão: 'Esforço 8–9/10. Hora de subir as cargas.',
  Intensificação: 'Cargas mais pesadas mantendo a técnica. Busque seus PRs 🏆',
  Recuperação: 'Semana leve: −1 série por exercício e carga ~10% menor. Deixe o corpo assimilar.',
};

// ---------- Semana-padrão ----------
export type TipoCorrida = 'base' | 'intervalada' | 'leve';
export interface DiaModelo {
  musculacao?: TreinoMusculacaoId;
  corrida?: TipoCorrida;
}
/** 0 = segunda ... 6 = domingo */
export const SEMANA_PADRAO: DiaModelo[] = [
  { musculacao: 'peito-triceps' },
  { corrida: 'base' },
  { musculacao: 'costas-biceps' },
  { corrida: 'intervalada' },
  { musculacao: 'ombro-bracos' },
  { musculacao: 'pernas' },
  { corrida: 'leve', musculacao: 'abdomen' },
];

// ---------- Calendário (com semanas repetidas) ----------
export interface ConfigPrograma {
  inicio: string;
  /** índices (0-based) de semanas do CALENDÁRIO que repetem a semana de programa anterior */
  repetidas: number[];
}

export const totalSemanasCalendario = (c: ConfigPrograma) => SEMANAS_PROGRAMA + c.repetidas.length;

/** semana do programa (1..12) correspondente a uma semana do calendário (0-based) */
export function semanaDoPrograma(c: ConfigPrograma, semanaCal: number): number {
  const antes = c.repetidas.filter((r) => r <= semanaCal).length;
  return Math.max(1, semanaCal + 1 - antes);
}

export type Posicao =
  | { estado: 'antes'; diasParaComecar: number }
  | { estado: 'durante'; semanaCal: number; semana: number; dia: number; fase: NomeFase; repetida: boolean }
  | { estado: 'depois' };

export function posicao(c: ConfigPrograma, data: string): Posicao {
  const d = diasEntre(c.inicio, data);
  if (d < 0) return { estado: 'antes', diasParaComecar: -d };
  const semanaCal = Math.floor(d / 7);
  if (semanaCal >= totalSemanasCalendario(c)) return { estado: 'depois' };
  const semana = semanaDoPrograma(c, semanaCal);
  return { estado: 'durante', semanaCal, semana, dia: d % 7, fase: faseDaSemana(semana), repetida: c.repetidas.includes(semanaCal) };
}

export const dataDoDia = (c: ConfigPrograma, semanaCal: number, dia: number) => somarDias(c.inicio, semanaCal * 7 + dia);

/** Repetir a semana atual: a próxima semana do calendário refaz a mesma semana do programa. */
export function repetirSemana(c: ConfigPrograma, semanaCalAtual: number): ConfigPrograma {
  const alvo = semanaCalAtual + 1;
  if (c.repetidas.includes(alvo)) return c;
  return { ...c, repetidas: [...c.repetidas.map((r) => (r >= alvo ? r + 1 : r)), alvo].sort((a, b) => a - b) };
}

// ---------- Treino planejado do dia ----------
export interface ItemPlanejado extends ItemTreino {
  descanso: number;
  /** % da carga habitual (recuperação: 90) */
  cargaPct: number;
}
export interface MusculacaoPlanejada {
  id: TreinoMusculacaoId;
  titulo: string;
  itens: ItemPlanejado[];
  grupos: Grupo[];
  minutos: number;
}
export interface CorridaPlanejada {
  tipo: TipoCorrida;
  titulo: string;
  resumo: string;
  esforco: string;
  fases: Fase[];
  /** tempo útil (sem aquecimento/desaquecimento), em segundos */
  utilSeg: number;
  totalSeg: number;
}
export interface DiaPlanejado {
  semana: number;
  dia: number;
  fase: NomeFase;
  recuperacao: boolean;
  titulo: string;
  tipoPrincipal: 'musculacao' | 'corrida';
  musculacao?: MusculacaoPlanejada;
  corrida?: CorridaPlanejada;
  minutos: number;
  grupos: string[];
}

const TITULO_CORRIDA: Record<TipoCorrida, string> = { base: 'Corrida base', intervalada: 'Intervalado leve', leve: 'Corrida leve' };
const ESFORCO_CORRIDA: Record<TipoCorrida, string> = {
  base: 'Consigo falar frases · esforço 4–6/10',
  intervalada: 'Trote um pouco mais firme · 6–7/10, sem sprint',
  leve: 'Bem tranquilo · recuperação ativa',
};

export function corridaPlanejada(tipo: TipoCorrida, semana: number): CorridaPlanejada {
  const tabela = tipo === 'base' ? CORRIDA_BASE : tipo === 'intervalada' ? CORRIDA_INTERVALADA : CORRIDA_LEVE;
  const t = tabela[Math.min(Math.max(semana, 1), SEMANAS_PROGRAMA) - 1];
  const fases: Fase[] = [
    { tipo: 'aquecimento', seg: AQUECIMENTO_SEG, rotulo: 'AQUECIMENTO' },
    ...t.fases,
    { tipo: 'desaquecimento', seg: DESAQUECIMENTO_SEG, rotulo: 'DESAQUECIMENTO' },
  ];
  const utilSeg = t.fases.reduce((s, f) => s + f.seg, 0);
  return { tipo, titulo: TITULO_CORRIDA[tipo], resumo: t.resumo, esforco: ESFORCO_CORRIDA[tipo], fases, utilSeg, totalSeg: utilSeg + AQUECIMENTO_SEG + DESAQUECIMENTO_SEG };
}

export function musculacaoPlanejada(id: TreinoMusculacaoId, semana: number): MusculacaoPlanejada {
  const t = TREINOS_MUSCULACAO[id];
  const rec = ehRecuperacao(semana);
  const itens: ItemPlanejado[] = t.itens(semana).map((it) => {
    const ex = EXERCICIOS[it.exercicioId];
    return {
      ...it,
      series: rec ? Math.max(1, it.series - 1) : it.series,
      descanso: it.descanso ?? DESCANSO_PADRAO[ex.tipo],
      cargaPct: rec ? 90 : 100,
    };
  });
  const grupos = [...new Set(itens.map((it) => EXERCICIOS[it.exercicioId].grupo))];
  // estimativa: 45 s por série + descanso, ~2' de troca/ajuste por exercício, + 5' de aquecimento
  const seg = itens.reduce((s, it) => s + it.series * (45 + it.descanso) + 120, 0) + (id === 'abdomen' ? 0 : 300);
  return { id, titulo: t.titulo, itens, grupos, minutos: Math.round(seg / 60) };
}

export function diaPlanejado(semana: number, dia: number): DiaPlanejado {
  const modelo = SEMANA_PADRAO[dia];
  const musculacao = modelo.musculacao ? musculacaoPlanejada(modelo.musculacao, semana) : undefined;
  const corrida = modelo.corrida ? corridaPlanejada(modelo.corrida, semana) : undefined;
  const fase = faseDaSemana(semana);
  const titulo = corrida && musculacao ? `${corrida.titulo} + ${musculacao.titulo}` : (corrida?.titulo ?? musculacao!.titulo);
  const minutos = Math.round((corrida ? corrida.totalSeg / 60 : 0) + (musculacao?.minutos ?? 0));
  const grupos = corrida
    ? [corrida.resumo, ...(musculacao ? musculacao.grupos : [])]
    : musculacao!.grupos;
  return { semana, dia, fase, recuperacao: fase === 'Recuperação', titulo, tipoPrincipal: corrida ? 'corrida' : 'musculacao', musculacao, corrida, minutos, grupos };
}

export function formatarDuracao(seg: number): string {
  const m = Math.floor(seg / 60), s = Math.round(seg % 60);
  if (m >= 60) return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
  return s ? `${m}:${String(s).padStart(2, '0')}` : `${m} min`;
}

/** "4 × 8", "3 × 45 s", "3 × até perto da falha" */
export function prescricao(it: ItemTreino): string {
  const ex = EXERCICIOS[it.exercicioId];
  const alvo = ex.medida === 'falha' ? (it.obs ?? 'até perto da falha') : ex.medida === 'segundos' ? `${it.reps} s` : `${it.reps}`;
  const extra = ex.medida !== 'falha' && it.obs ? ` ${it.obs}` : '';
  return `${it.series} × ${alvo}${extra}`;
}
