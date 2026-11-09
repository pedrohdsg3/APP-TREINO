// ============================================================
// PLANOS — cada perfil usa um. Edite aqui para mudar dias, fases e treinos.
// ============================================================
import { TREINOS_MUSCULACAO, type ItemTreino, type TreinoMusculacao } from './musculacao';

export type TipoCorrida = 'base' | 'intervalada' | 'leve';
export type NomeFase = string;

export interface DiaModelo {
  musculacao?: string;
  corrida?: TipoCorrida;
  /** cardio leve opcional de 10–20 min (caminhada inclinada, escada, bike, elíptico) */
  cardio?: boolean;
  /** dia de descanso: só cardio leve opcional, não conta na meta da semana */
  descanso?: boolean;
}

export interface DefinicaoPlano {
  id: 'pedro' | 'feminino';
  nome: string;
  descricao: string;
  /** 0 = segunda ... 6 = domingo */
  semana: DiaModelo[];
  treinos: Record<string, TreinoMusculacao>;
  fase: (semana: number) => NomeFase;
  /** fases na ordem, com o estilo visual usado no app */
  fases: { nome: NomeFase; estilo: 'base' | 'progressao' | 'intensificacao' | 'recuperacao' }[];
  orientacao: Record<NomeFase, string>;
  orientacaoCorrida: Record<NomeFase, string>;
  /** Pedro: a recuperação tira 1 série de cada exercício automaticamente. No plano feminino as séries já vêm prontas por semana. */
  menosUmaSerieNaRecuperacao: boolean;
}

export const ehSemanaRecuperacao = (s: number) => s === 4 || s === 8 || s === 12;

/** Minutos de cardio leve por semana (10 → 20, menos nas semanas de recuperação). */
export function minutosCardio(semana: number): number {
  if (ehSemanaRecuperacao(semana)) return 10;
  if (semana <= 3) return 10;
  if (semana <= 7) return 15;
  return 20;
}

// ------------------------------------------------------------ PEDRO
export const PLANO_PEDRO: DefinicaoPlano = {
  id: 'pedro',
  nome: 'Musculação 5× + corrida 3×',
  descricao: 'Peito, costas, ombros/braços, pernas e abdômen, com corrida progressiva cuidando do joelho.',
  semana: [
    { musculacao: 'peito-triceps', cardio: true },
    { corrida: 'base' },
    { musculacao: 'costas-biceps', cardio: true },
    { corrida: 'intervalada' },
    { musculacao: 'ombro-bracos', cardio: true },
    { musculacao: 'pernas', cardio: true },
    { corrida: 'leve', musculacao: 'abdomen' },
  ],
  treinos: TREINOS_MUSCULACAO,
  fase: (s) => (ehSemanaRecuperacao(s) ? 'Recuperação' : s <= 3 ? 'Base' : s <= 7 ? 'Progressão' : 'Intensificação'),
  fases: [
    { nome: 'Base', estilo: 'base' }, { nome: 'Progressão', estilo: 'progressao' },
    { nome: 'Intensificação', estilo: 'intensificacao' }, { nome: 'Recuperação', estilo: 'recuperacao' },
  ],
  orientacao: {
    Base: 'Esforço 7–8/10, deixando 1–2 repetições na reserva. Aprenda os movimentos e ajuste as cargas.',
    Progressão: 'Esforço 8–9/10. Hora de subir as cargas.',
    Intensificação: 'Cargas mais pesadas mantendo a técnica. Busque seus PRs 🏆',
    Recuperação: 'Semana leve: −1 série por exercício e carga ~10% menor. Deixe o corpo assimilar.',
  },
  orientacaoCorrida: {
    Base: 'Progressão por tempo e esforço, não por pace. Trote no ritmo em que você consegue falar frases.',
    Progressão: 'Blocos de trote mais longos, mesmo esforço confortável. Nunca aumente tempo e intensidade juntos.',
    Intensificação: 'Rumo aos 30 minutos contínuos. Ritmo confortável; se o joelho reclamar, volte a caminhar.',
    Recuperação: 'Semana de recuperação: menos volume para o corpo (e o joelho) assimilarem.',
  },
  menosUmaSerieNaRecuperacao: true,
};

// ------------------------------------------------------------ FEMININO (volta aos treinos, foco em inferiores)
// Base: ACSM (iniciantes/destreinados: 8–12 RM, 2–3×/semana por grupo, progressão gradual),
// glúteos 2+×/semana combinando elevação pélvica e agachamentos (Plotkin et al., 2023),
// sem falha nem drop-set nas primeiras semanas; drop só na última série das máquinas no fim.

type Papel = 'principal' | 'acessorio' | 'core';
interface Prescr { series: number; reps: number; repsMin: number }

/** Séries × reps por semana: começa com 2×15 leve e chega a 4×8–10. */
const TABELA: Record<number, { principal: Prescr; acessorio: Prescr }> = {
  1: { principal: { series: 2, reps: 15, repsMin: 12 }, acessorio: { series: 2, reps: 15, repsMin: 12 } },
  2: { principal: { series: 3, reps: 15, repsMin: 12 }, acessorio: { series: 2, reps: 15, repsMin: 12 } },
  3: { principal: { series: 3, reps: 12, repsMin: 10 }, acessorio: { series: 3, reps: 15, repsMin: 12 } },
  4: { principal: { series: 2, reps: 12, repsMin: 10 }, acessorio: { series: 2, reps: 12, repsMin: 10 } },
  5: { principal: { series: 4, reps: 12, repsMin: 10 }, acessorio: { series: 3, reps: 12, repsMin: 10 } },
  6: { principal: { series: 4, reps: 12, repsMin: 10 }, acessorio: { series: 3, reps: 12, repsMin: 10 } },
  7: { principal: { series: 4, reps: 10, repsMin: 8 }, acessorio: { series: 3, reps: 12, repsMin: 10 } },
  8: { principal: { series: 2, reps: 12, repsMin: 10 }, acessorio: { series: 2, reps: 12, repsMin: 10 } },
  9: { principal: { series: 4, reps: 10, repsMin: 8 }, acessorio: { series: 3, reps: 12, repsMin: 10 } },
  10: { principal: { series: 4, reps: 10, repsMin: 8 }, acessorio: { series: 3, reps: 12, repsMin: 10 } },
  11: { principal: { series: 4, reps: 8, repsMin: 6 }, acessorio: { series: 3, reps: 10, repsMin: 8 } },
  12: { principal: { series: 2, reps: 10, repsMin: 8 }, acessorio: { series: 2, reps: 12, repsMin: 10 } },
};

const coreReps = (s: number) => (s <= 3 ? 10 : s <= 7 ? 12 : 15);
const pranchaSeg = (s: number) => (s <= 2 ? 20 : s <= 7 ? 30 : 40);

function f(exercicioId: string, papel: Papel, s: number, extra: { maquina?: boolean; obs?: string } = {}): ItemTreino {
  if (papel === 'core') {
    const seg = exercicioId === 'prancha' || exercicioId === 'prancha-lateral';
    return { exercicioId, series: s <= 2 || ehSemanaRecuperacao(s) ? 2 : 3, reps: seg ? pranchaSeg(s) : coreReps(s), descanso: 45, obs: extra.obs };
  }
  const p = TABELA[Math.min(Math.max(s, 1), 12)][papel];
  const drop = extra.maquina && papel === 'acessorio' && (s === 10 || s === 11);
  const obs = [extra.obs, drop ? '· drop-set na última série' : ''].filter(Boolean).join(' ') || undefined;
  return { exercicioId, ...p, descanso: papel === 'principal' ? 90 : 60, obs };
}

const TREINOS_FEMININO: Record<string, TreinoMusculacao> = {
  'inferior-a': {
    id: 'inferior-a',
    titulo: 'Inferior A · Quadríceps e glúteos',
    itens: (s) => [
      f(s <= 4 ? 'agachamento-goblet' : 'agachamento', 'principal', s),
      f('leg-press', 'principal', s),
      f('elevacao-pelvica', 'principal', s),
      f(s <= 4 ? 'afundo' : 'agachamento-bulgaro', 'acessorio', s, { obs: 'cada perna' }),
      f('extensora', 'acessorio', s, { maquina: true }),
      f('abdutora', 'acessorio', s, { maquina: true }),
      f('panturrilha', 'acessorio', s),
    ],
  },
  'superior-a': {
    id: 'superior-a',
    titulo: 'Superior A · Costas, ombros e bíceps',
    itens: (s) => [
      f('pulldown', 'principal', s),
      f('remada-baixa', 'principal', s),
      f('desenvolvimento-maquina', 'principal', s),
      f('elevacao-lateral', 'acessorio', s),
      f('crucifixo-inverso', 'acessorio', s, { maquina: true }),
      f(s <= 7 ? 'rosca-alternada' : 'rosca-scott', 'acessorio', s),
      f('extensao-quadril-polia', 'acessorio', s, { obs: 'cada perna' }),
      f('prancha', 'core', s),
    ],
  },
  'inferior-b': {
    id: 'inferior-b',
    titulo: 'Inferior B · Posterior e glúteos',
    itens: (s) => [
      f('elevacao-pelvica', 'principal', s),
      f('stiff', 'principal', s),
      f('agachamento-sumo', 'principal', s),
      f('cadeira-flexora', 'acessorio', s, { maquina: true }),
      f('extensao-quadril-polia', 'acessorio', s, { obs: 'cada perna' }),
      f('abdutora', 'acessorio', s, { maquina: true }),
      f('panturrilha-sentado', 'acessorio', s),
    ],
  },
  'superior-b': {
    id: 'superior-b',
    titulo: 'Superior B · Peito, ombros, tríceps e abdômen',
    itens: (s) => [
      f('supino-inclinado-halter', 'principal', s),
      f('desenvolvimento-halter', 'principal', s),
      f('peck-deck', 'acessorio', s, { maquina: true }),
      f('elevacao-lateral', 'acessorio', s),
      f('triceps-corda', 'acessorio', s, { maquina: true }),
      f('triceps-testa-polia', 'acessorio', s),
      f('abd-crunch', 'core', s),
      f(s <= 3 ? 'dead-bug' : 'abd-infra', 'core', s, { obs: s <= 3 ? 'cada lado' : undefined }),
      f('prancha-lateral', 'core', s, { obs: 'cada lado' }),
    ],
  },
};

export const PLANO_FEMININO: DefinicaoPlano = {
  id: 'feminino',
  nome: 'Inferiores em foco · 4× + 2 corridas',
  descricao: 'Volta aos treinos começando leve: 2 dias de pernas/glúteos, 2 de superiores com glúteo e abdômen, e corrida progressiva.',
  semana: [
    { musculacao: 'inferior-a', cardio: true },
    { corrida: 'base' },
    { musculacao: 'superior-a', cardio: true },
    { corrida: 'intervalada' },
    { musculacao: 'inferior-b', cardio: true },
    { musculacao: 'superior-b', cardio: true },
    { descanso: true, cardio: true },
  ],
  treinos: TREINOS_FEMININO,
  fase: (s) => (ehSemanaRecuperacao(s) ? 'Recuperação' : s <= 3 ? 'Adaptação' : s <= 7 ? 'Construção' : 'Intensificação'),
  fases: [
    { nome: 'Adaptação', estilo: 'base' }, { nome: 'Construção', estilo: 'progressao' },
    { nome: 'Intensificação', estilo: 'intensificacao' }, { nome: 'Recuperação', estilo: 'recuperacao' },
  ],
  orientacao: {
    'Adaptação': 'Volta aos treinos: cargas leves e foco na técnica. Termine cada série sentindo que faria mais 3–4 repetições (esforço 6/10). Nada de falha.',
    'Construção': 'Mais séries e cargas subindo aos poucos. Esforço 7–8/10, deixando ~2 repetições na reserva.',
    'Intensificação': 'Cargas mais desafiadoras com técnica perfeita. Esforço 8–9/10; drop-set só na última série das máquinas (semanas 10 e 11).',
    'Recuperação': 'Semana leve: menos séries e carga ~10% menor. O corpo assimila o que foi treinado.',
  },
  orientacaoCorrida: {
    'Adaptação': 'Volta gradual: trote leve alternado com caminhada, sempre conseguindo conversar.',
    'Construção': 'Blocos de trote um pouco mais longos, no mesmo esforço confortável.',
    'Intensificação': 'Rumo aos 30 minutos contínuos, sem pressa e sem dor.',
    'Recuperação': 'Semana de recuperação: menos volume para o corpo assimilar.',
  },
  menosUmaSerieNaRecuperacao: false,
};

export const PLANOS: Record<DefinicaoPlano['id'], DefinicaoPlano> = { pedro: PLANO_PEDRO, feminino: PLANO_FEMININO };
