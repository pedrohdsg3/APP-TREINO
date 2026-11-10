// Metodologia de cada série, sempre explícita na tela durante o treino:
// aquecimento (mais reps, menos carga) → séries de trabalho na faixa → última série buscando o topo.
import { EXERCICIOS } from '../data/musculacao';
import type { ExAtivo } from './treinoAtivo';

/** Esforço e repetições na reserva por fase. */
export const ESFORCO_FASE: Record<string, { reserva: string; esforco: string }> = {
  'Adaptação': { reserva: '3–4', esforco: '6/10' },
  Base: { reserva: '1–2', esforco: '7–8/10' },
  'Construção': { reserva: '2', esforco: '7–8/10' },
  'Progressão': { reserva: '1', esforco: '8–9/10' },
  'Intensificação': { reserva: '1', esforco: '8–9/10' },
  'Recuperação': { reserva: '3', esforco: '6/10' },
};

export interface Orientacao { emoji: string; titulo: string; texto: string }

/** `etapa`: 'aquecimento' ou o índice da série de trabalho (0-based). */
export function orientacaoSerie(e: ExAtivo, etapa: 'aquecimento' | number, fase: string): Orientacao {
  const ex = EXERCICIOS[e.item.exercicioId];
  const a = e.aquecimento;
  if (etapa === 'aquecimento' && a) {
    return a.primeiro
      ? { emoji: '🔥', titulo: 'Aquecimento · bem leve', texto: `Carga bem leve (~${a.pct}% da de trabalho) e ${a.repsMin}–${a.repsMax} repetições. Prepare as articulações e a cabeça para o treino: movimento controlado, sem pressa.` }
      : { emoji: '🔥', titulo: 'Aquecimento', texto: `Carga leve (~${a.pct}% da de trabalho) e ${a.repsMin}–${a.repsMax} repetições. Ensaie o movimento antes das séries de trabalho.` };
  }
  const i = typeof etapa === 'number' ? etapa : 0;
  const ultima = i === e.series.length - 1;
  const { reserva, esforco } = ESFORCO_FASE[fase] ?? ESFORCO_FASE.Base;
  if (ex.medida === 'segundos') {
    return { emoji: '⏱️', titulo: ultima ? 'Última série' : 'Série de trabalho', texto: `Segure ${e.item.reps} s com o corpo alinhado. Se perder a postura, pare e anote o tempo que fez.` };
  }
  if (ex.medida === 'falha') {
    return { emoji: '💪', titulo: ultima ? 'Última série' : 'Série de trabalho', texto: 'Vá até perto da falha (sobrando 1 repetição), sem chegar à falha total. Anote quantas fez.' };
  }
  const faixa = e.item.repsMin && e.item.repsMin !== e.item.reps ? `${e.item.repsMin}–${e.item.reps}` : `${e.item.reps}`;
  const anotar = 'Anote a carga e as reps que você realmente fez.';
  if (ultima) {
    const drop = e.item.obs?.includes('drop') ? ' Nesta semana: ao terminar, reduza a carga ~30% e faça mais repetições até perto da falha (drop-set).' : '';
    return {
      emoji: '🏁', titulo: 'Última série',
      texto: `Busque ${e.item.reps} reps com boa técnica (esforço ${esforco}). Fazendo ${e.item.reps} em todas as séries, o app sobe a carga na próxima vez.${drop} ${anotar}`,
    };
  }
  return {
    emoji: '💪', titulo: 'Série de trabalho',
    texto: `${faixa} repetições com a carga de trabalho. Termine sentindo que faria mais ${reserva} (esforço ${esforco}). ${anotar}`,
  };
}
