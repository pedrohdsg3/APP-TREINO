// Monta o treino planejado de qualquer dia do programa.
import { EXERCICIOS, DESCANSO_PADRAO, type ItemTreino, type TreinoMusculacaoId, type Grupo } from '../data/musculacao';
import { CORRIDA_BASE, CORRIDA_INTERVALADA, CORRIDA_LEVE, AQUECIMENTO_SEG, DESAQUECIMENTO_SEG, type Fase } from '../data/corrida';
import { PLANO_PEDRO, minutosCardio, type DefinicaoPlano, type DiaModelo, type NomeFase, type TipoCorrida } from '../data/planos';
import { diasEntre, somarDias } from '../lib/datas';
import { lerPrefs } from '../lib/prefs';

export type { DiaModelo, NomeFase, TipoCorrida, DefinicaoPlano };

// ---------- Plano do perfil ativo ----------
let ativo: DefinicaoPlano = PLANO_PEDRO;
/** Define o plano usado por todas as funções abaixo (troca de perfil). */
export function usarPlano(p: DefinicaoPlano) { ativo = p; }
export const planoAtual = () => ativo;

export const SEMANAS_PROGRAMA = 12;
export const INICIO_PADRAO = '2026-11-09'; // segunda-feira

export const faseDaSemana = (semana: number): NomeFase => ativo.fase(semana);
export const ehRecuperacao = (semana: number) => faseDaSemana(semana) === 'Recuperação';
export const orientacaoFase = (fase: NomeFase) => ativo.orientacao[fase] ?? '';
export const orientacaoCorrida = (fase: NomeFase) => ativo.orientacaoCorrida[fase] ?? '';
/** Estilo visual da fase (classe CSS). */
export const estiloFase = (fase: NomeFase) => ativo.fases.find((f) => f.nome === fase)?.estilo ?? 'base';

/** Dias da semana (0 = segunda) que contam na meta: têm musculação ou corrida e não são descanso. */
export const diasComTreino = () => ativo.semana.map((d) => !d.descanso && !!(d.musculacao || d.corrida));
export const treinosPorSemana = () => diasComTreino().filter(Boolean).length;

// ---------- Calendário (com semanas repetidas) ----------
export interface ConfigPrograma {
  inicio: string;
  /** índices (0-based) de semanas do CALENDÁRIO que repetem a semana de programa anterior */
  repetidas: number[];
  /** quantas semanas a corrida está "atrás" do programa (dor no joelho / semana perdida) */
  recuoCorrida?: number;
  /** datas em que a corrida foi trocada por cardio sem impacto */
  cardioAlternativo?: string[];
  /** ajustes de dias específicos (treino perdido feito depois / reagendado / corrida adiada) */
  trocas?: Record<string, TrocaDia>;
  /** treinos perdidos já resolvidos (data → como) */
  resolvidos?: Record<string, 'reagendado' | 'retorno' | 'ignorado'>;
  /** semana de retorno após 3+ dias parado: carga/volume da semana anterior, −1 série nos compostos */
  retorno?: { de: string; ate: string };
  /** personalização dos treinos (trocar, remover, adicionar exercícios) */
  personalizacao?: Record<string, PersonalizacaoTreino>;
  /** carga inicial por exercício (usada quando ainda não há histórico) */
  cargasIniciais?: Record<string, number>;
}

export interface TrocaDia {
  /** treino de musculação feito neste dia no lugar do planejado (ou além de uma corrida) */
  musculacao?: { treinoId: string; semana: number; origem: string };
  /** a corrida planejada deste dia foi adiada/pulada */
  semCorrida?: boolean;
  /** corrida adiada de outro dia */
  corridaExtra?: { tipo: TipoCorrida; semana: number; origem: string };
}

export interface PersonalizacaoTreino {
  remover?: string[];
  /** exercícioId original → substituto */
  trocar?: Record<string, string>;
  adicionar?: { exercicioId: string; series: number; reps: number }[];
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
  tipo: TipoCorrida | 'cardio';
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
  /** cardio leve opcional depois do treino (ou o próprio dia, se for descanso) */
  cardio?: CorridaPlanejada;
  /** dia de descanso (só cardio leve opcional) */
  descanso: boolean;
  minutos: number;
  grupos: string[];
}

const TITULO_CORRIDA: Record<TipoCorrida, string> = { base: 'Corrida base', intervalada: 'Intervalado leve', leve: 'Corrida leve' };
const ESFORCO_CORRIDA: Record<TipoCorrida, string> = {
  base: 'Consigo falar frases · esforço 4–6/10',
  intervalada: 'Trote um pouco mais firme · 6–7/10, sem sprint',
  leve: 'Bem tranquilo · recuperação ativa',
};

/** Cardio sem impacto que substitui uma corrida (joelho). */
export function cardioAlternativo(): CorridaPlanejada {
  const fases: Fase[] = [
    { tipo: 'aquecimento', seg: AQUECIMENTO_SEG, rotulo: 'AQUECIMENTO' },
    { tipo: 'caminhada', seg: 25 * 60, rotulo: 'BIKE · ELÍPTICO · CAMINHADA' },
    { tipo: 'desaquecimento', seg: DESAQUECIMENTO_SEG, rotulo: 'DESAQUECIMENTO' },
  ];
  return {
    tipo: 'leve', titulo: 'Cardio sem impacto', resumo: "25' bike, elíptico ou caminhada", esforco: 'Leve a moderado · poupando o joelho',
    fases, utilSeg: 25 * 60, totalSeg: 35 * 60,
  };
}

/** Cardio leve de 10–20 min (caminhada inclinada, escada, bike ou elíptico). */
export function cardioLeve(semana: number): CorridaPlanejada {
  const seg = minutosCardio(semana) * 60;
  return {
    tipo: 'cardio', titulo: 'Cardio leve', resumo: `${seg / 60}' caminhada inclinada, escada, bike ou elíptico`,
    esforco: 'Leve · 5–6/10, dá para conversar', fases: [{ tipo: 'caminhada', seg, rotulo: 'CARDIO LEVE' }], utilSeg: seg, totalSeg: seg,
  };
}

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

export interface OpcoesMusculacao { personalizacao?: PersonalizacaoTreino; retorno?: boolean }

/** Aplica remoções, trocas e adições do usuário à lista do plano. */
export function personalizar(itens: ItemTreino[], p?: PersonalizacaoTreino): ItemTreino[] {
  if (!p) return itens;
  const out = itens
    .filter((it) => !p.remover?.includes(it.exercicioId))
    .map((it) => {
      const novo = p.trocar?.[it.exercicioId];
      return novo && EXERCICIOS[novo] ? { ...it, exercicioId: novo } : it;
    });
  for (const a of p.adicionar ?? []) {
    if (!EXERCICIOS[a.exercicioId] || out.some((x) => x.exercicioId === a.exercicioId)) continue;
    out.push({ exercicioId: a.exercicioId, series: a.series, reps: a.reps, repsMin: EXERCICIOS[a.exercicioId].medida === 'reps' ? Math.max(1, a.reps - 2) : undefined });
  }
  return out;
}

export function musculacaoPlanejada(id: TreinoMusculacaoId, semana: number, op: OpcoesMusculacao = {}): MusculacaoPlanejada {
  const t = ativo.treinos[id];
  // semana de retorno: usa a semana anterior do plano e tira 1 série dos compostos
  const semanaBase = op.retorno ? Math.max(1, semana - 1) : semana;
  const rec = ehRecuperacao(semanaBase);
  const tirar = rec && ativo.menosUmaSerieNaRecuperacao;
  const prefs = lerPrefs();
  const itens: ItemPlanejado[] = personalizar(t.itens(semanaBase), op.personalizacao).map((it) => {
    const ex = EXERCICIOS[it.exercicioId];
    let series = tirar ? Math.max(1, it.series - 1) : it.series;
    if (op.retorno && ex.tipo === 'composto') series = Math.max(1, series - 1);
    const base = it.descanso ?? DESCANSO_PADRAO[ex.tipo];
    const preferido = prefs.descansoPadrao?.[ex.tipo];
    return {
      ...it,
      series,
      descanso: preferido && base === DESCANSO_PADRAO[ex.tipo] ? preferido : base,
      cargaPct: rec || op.retorno ? 90 : 100,
    };
  });
  const grupos = [...new Set(itens.map((it) => EXERCICIOS[it.exercicioId].grupo))];
  // estimativa: 45 s por série + descanso, ~2' de troca/ajuste por exercício, + 5' de aquecimento
  const seg = itens.reduce((s, it) => s + it.series * (45 + it.descanso) + 120, 0) + (id === 'abdomen' ? 0 : 300);
  return { id, titulo: t.titulo, itens, grupos, minutos: Math.round(seg / 60) };
}

export interface OpcoesDia {
  recuoCorrida?: number;
  cardioAlternativo?: boolean;
  troca?: TrocaDia;
  retorno?: boolean;
  personalizacao?: Record<string, PersonalizacaoTreino>;
}

export function diaPlanejado(semana: number, dia: number, op: OpcoesDia = {}): DiaPlanejado {
  const modelo = ativo.semana[dia];
  const opM = (id: string): OpcoesMusculacao => ({ personalizacao: op.personalizacao?.[id], retorno: op.retorno });
  const tr = op.troca;
  // treino perdido feito/reagendado para este dia substitui a musculação do dia
  const musculacao = tr?.musculacao ? musculacaoPlanejada(tr.musculacao.treinoId, tr.musculacao.semana, opM(tr.musculacao.treinoId))
    : modelo.musculacao ? musculacaoPlanejada(modelo.musculacao, semana, opM(modelo.musculacao)) : undefined;
  const semCorr = Math.max(1, semana - (op.recuoCorrida ?? 0) - (op.retorno ? 1 : 0));
  let corrida = tr?.corridaExtra ? corridaPlanejada(tr.corridaExtra.tipo, Math.max(1, tr.corridaExtra.semana - (op.recuoCorrida ?? 0)))
    : !modelo.corrida || tr?.semCorrida ? undefined
    : op.cardioAlternativo ? cardioAlternativo() : corridaPlanejada(modelo.corrida, semCorr);
  const fase = faseDaSemana(semana);
  const descanso = !!modelo.descanso && !tr?.musculacao && !tr?.corridaExtra;
  // dia de descanso: o "treino" é o cardio leve opcional
  let cardio = modelo.cardio ? cardioLeve(semana) : undefined;
  if (descanso && cardio) { corrida = cardio; cardio = undefined; }
  const titulo = descanso ? 'Descanso ativo' : corrida && musculacao ? `${corrida.titulo} + ${musculacao.titulo}` : (corrida?.titulo ?? musculacao!.titulo);
  const minutos = Math.round((corrida ? corrida.totalSeg / 60 : 0) + (musculacao?.minutos ?? 0));
  const grupos = descanso ? ['Recuperação', 'Cardio leve opcional']
    : corrida ? [corrida.resumo, ...(musculacao ? musculacao.grupos : [])]
    : musculacao!.grupos;
  return { semana, dia, fase, recuperacao: fase === 'Recuperação', titulo, tipoPrincipal: corrida ? 'corrida' : 'musculacao', musculacao, corrida, cardio, descanso, minutos, grupos };
}

/** Plano de uma data, com os ajustes de corrida aplicados. null fora do programa. */
export function planoDaData(c: ConfigPrograma, data: string): DiaPlanejado | null {
  const p = posicao(c, data);
  if (p.estado !== 'durante') return null;
  return diaPlanejado(p.semana, p.dia, {
    recuoCorrida: c.recuoCorrida, cardioAlternativo: c.cardioAlternativo?.includes(data), troca: c.trocas?.[data],
    retorno: !!c.retorno && data >= c.retorno.de && data <= c.retorno.ate, personalizacao: c.personalizacao,
  });
}

/** Próxima data (a partir de `apos`, exclusive) com corrida planejada. */
export function proximaCorrida(c: ConfigPrograma, apos: string): string | undefined {
  for (let i = 1; i <= 7; i++) {
    const d = somarDias(apos, i);
    const p = posicao(c, d);
    if (p.estado === 'durante' && ativo.semana[p.dia].corrida) return d;
  }
  return undefined;
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
