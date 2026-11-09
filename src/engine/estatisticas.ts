// Contas sobre as sessões registradas (meta da semana, sequência, último treino).
import type { Sessao } from '../db';
import { somarDias } from '../lib/datas';

/** Datas (aaaa-mm-dd) com ao menos um treino feito */
export function diasFeitos(sessoes: Sessao[]): Set<string> {
  return new Set(sessoes.filter((s) => s.status === 'feito' || s.status === 'parcial').map((s) => s.data));
}

/** Dias da semana do programa (segunda..domingo começando em inicioSemana) com treino feito */
export function feitosNaSemana(sessoes: Sessao[], inicioSemana: string): number {
  const feitos = diasFeitos(sessoes);
  let n = 0;
  for (let i = 0; i < 7; i++) if (feitos.has(somarDias(inicioSemana, i))) n++;
  return n;
}

/**
 * Sequência de dias seguidos cumprindo o plano. Todo dia tem treino planejado,
 * então conta dias consecutivos com treino feito. Hoje ainda não feito não quebra a sequência.
 */
export function sequencia(sessoes: Sessao[], hoje: string): number {
  const feitos = diasFeitos(sessoes);
  let d = feitos.has(hoje) ? hoje : somarDias(hoje, -1);
  let n = 0;
  while (feitos.has(d)) { n++; d = somarDias(d, -1); }
  return n;
}

export function ultimaSessao(sessoes: Sessao[], hoje: string): Sessao | undefined {
  return sessoes
    .filter((s) => s.status !== 'pulado' && s.data <= hoje)
    .sort((a, b) => (a.data === b.data ? (b.duracaoSeg ?? 0) - (a.duracaoSeg ?? 0) : b.data.localeCompare(a.data)))[0];
}
