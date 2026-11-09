// Leitura e gravação dos treinos de musculação no IndexedDB.
import { db, type Sessao } from '../db';
import type { HistoricoEx, TreinoAtivo } from '../engine/treinoAtivo';
import { resumir, treinoConcluido } from '../engine/treinoAtivo';
import type { CorridaAtiva } from '../engine/corridaAtiva';
import { pace, resumirCorrida } from '../engine/corridaAtiva';

export function novoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function historicoDe(exercicioIds: string[]): Promise<Record<string, HistoricoEx>> {
  const out: Record<string, HistoricoEx> = {};
  const sessoes = new Map((await db.sessoes.toArray()).map((s) => [s.id, s]));
  for (const id of new Set(exercicioIds)) {
    const series = (await db.series.where('exercicioId').equals(id).toArray()).filter((s) => s.feita);
    const porSessao = new Map<string, typeof series>();
    for (const s of series) porSessao.set(s.sessaoId, [...(porSessao.get(s.sessaoId) ?? []), s]);
    const ordem = [...porSessao.keys()].sort((a, b) => {
      const da = sessoes.get(a)?.data ?? '', dbb = sessoes.get(b)?.data ?? '';
      return da === dbb ? Math.max(...porSessao.get(a)!.map((x) => x.timestamp)) - Math.max(...porSessao.get(b)!.map((x) => x.timestamp)) : da.localeCompare(dbb);
    });
    const ult = ordem.at(-1);
    out[id] = {
      todas: series.map((s) => ({ carga: s.carga, reps: s.reps })),
      ultima: ult ? { data: sessoes.get(ult)?.data ?? '', series: porSessao.get(ult)!.sort((a, b) => a.serie - b.serie).map((s) => ({ carga: s.carga, reps: s.reps })) } : undefined,
    };
  }
  return out;
}

/** Sessão anterior do mesmo treino (para comparar no resumo). */
export async function sessaoAnteriorDoTreino(treinoId: string, antesDe: string, excluirId: string): Promise<Sessao | undefined> {
  const lista = await db.sessoes.where('treinoId').equals(treinoId).toArray();
  return lista.filter((s) => s.id !== excluirId && s.data <= antesDe && s.status !== 'pulado').sort((a, b) => (b.inicioTs ?? 0) - (a.inicioTs ?? 0))[0];
}

export async function salvarTreino(t: TreinoAtivo, extra: { esforco?: number; notas?: string }, agora: number) {
  const r = resumir(t, agora);
  const sessao: Sessao = {
    id: t.sessaoId, data: t.data, tipo: 'musculacao', status: treinoConcluido(t) ? 'feito' : 'parcial',
    duracaoSeg: r.duracaoSeg, esforco: extra.esforco, notas: extra.notas?.trim() || undefined,
    semana: t.semana, treinoId: t.treinoId, volumeKg: r.volumeKg, prs: r.prs.length,
    dores: Object.fromEntries(t.exercicios.filter((e) => e.dores.length).map((e) => [e.item.exercicioId, e.dores])),
    notasExercicio: Object.fromEntries(t.exercicios.filter((e) => e.nota?.trim()).map((e) => [e.item.exercicioId, e.nota!.trim()])),
    inicioTs: t.inicio, fimTs: t.fim ?? agora,
  };
  await db.transaction('rw', db.sessoes, db.series, async () => {
    await db.series.where('sessaoId').equals(t.sessaoId).delete();
    await db.sessoes.put(sessao);
    await db.series.bulkAdd(t.exercicios.flatMap((e) => e.series.map((s, k) => ({
      sessaoId: t.sessaoId, exercicioId: e.item.exercicioId, serie: k + 1, carga: s.carga, reps: s.reps, feita: s.feita, timestamp: s.ts ?? agora,
    }))));
  });
  return sessao;
}

// ---------------------------------------------------------------- corrida

export async function salvarCorrida(t: CorridaAtiva, r: { distanciaKm?: number; esforco?: number; dorJoelho?: number; notas?: string }, agora: number) {
  const res = resumirCorrida(t, agora);
  const sessao: Sessao = {
    id: t.sessaoId, data: t.data, tipo: t.treinoId === 'cardio-leve' ? 'cardio' : 'corrida', status: 'feito', duracaoSeg: res.duracaoSeg,
    esforco: r.esforco, notas: r.notas?.trim() || undefined, semana: t.semana, treinoId: t.treinoId,
    inicioTs: t.inicio, fimTs: t.fim ?? agora,
  };
  await db.transaction('rw', db.sessoes, db.corridas, async () => {
    await db.sessoes.put(sessao);
    await db.corridas.put({
      sessaoId: t.sessaoId, estrutura: t.resumo, duracaoSeg: res.duracaoSeg, distanciaKm: r.distanciaKm,
      paceSegKm: pace(res.duracaoSeg, r.distanciaKm), esforco: r.esforco, dorJoelho: r.dorJoelho,
      troteSeg: res.troteSeg, maiorTroteSeg: res.maiorTroteSeg, dorDurante: t.dorDurante, modo: t.modo,
    });
  });
  return sessao;
}

/** Dor no joelho registrada na corrida anterior (antes desta sessão). */
export async function dorCorridaAnterior(antesDe: number, excluirId: string): Promise<number | undefined> {
  const sessoes = (await db.sessoes.where('tipo').equals('corrida').toArray())
    .filter((s) => s.id !== excluirId && (s.inicioTs ?? 0) < antesDe)
    .sort((a, b) => (b.inicioTs ?? 0) - (a.inicioTs ?? 0));
  if (!sessoes[0]) return undefined;
  return (await db.corridas.get(sessoes[0].id))?.dorJoelho;
}
