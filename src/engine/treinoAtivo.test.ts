import { describe, expect, it } from 'vitest';
import { diaPlanejado } from './plano';
import { ajustarDescanso, ajustarSerie, alternativas, concluirSerie, fazerAgora, montarTreino, proximoPendente, pularExercicio, resumir, treinoConcluido, trocarExercicio } from './treinoAtivo';

const plano = diaPlanejado(1, 0).musculacao!;
const base = () => montarTreino(plano, {
  sessaoId: 's1', data: '2026-11-09', semana: 1, agora: 0,
  historico: { 'supino-reto': { ultima: { data: '2026-11-02', series: Array(4).fill({ carga: 60, reps: 8 }) }, todas: Array(4).fill({ carga: 60, reps: 8 }) } },
});

describe('treino ativo', () => {
  it('pré-preenche com a sugestão da progressão dupla', () => {
    const t = base();
    expect(t.etapa).toBe('aquecimento');
    expect(t.exercicios[0].series).toHaveLength(4);
    expect(t.exercicios[0].series[0]).toMatchObject({ carga: 62.5, reps: 6 });
    expect(t.exercicios[1].series[0]).toMatchObject({ carga: 0, reps: 10 }); // sem histórico
  });
  it('carga propaga para as séries seguintes não feitas', () => {
    let t = base();
    t = ajustarSerie(t, 0, 0, 'carga', 65);
    expect(t.exercicios[0].series.map((s) => s.carga)).toEqual([65, 65, 65, 65]);
    t = ajustarSerie(t, 0, 2, 'carga', 60);
    expect(t.exercicios[0].series.map((s) => s.carga)).toEqual([65, 65, 60, 60]);
  });
  it('concluir série inicia descanso e detecta PR', () => {
    const { treino, pr } = concluirSerie(base(), 0, 0, 1000, 90);
    expect(treino.descanso).toEqual({ fim: 91_000, total: 90 });
    expect(pr?.tipo).toBe('carga'); // 62,5×6: 1RM 75 < 76 (60×8), mas maior carga com ≥6 reps
  });
  it('descanso +15/−15 nunca fica negativo', () => {
    const { treino } = concluirSerie(base(), 0, 0, 0, 60);
    expect(ajustarDescanso(treino, 15, 0).descanso?.fim).toBe(75_000);
    expect(ajustarDescanso(treino, -120, 10_000).descanso?.fim).toBe(10_000);
  });
  it('fazer agora, pular e próximo pendente', () => {
    let t = base();
    t = fazerAgora(t, 3);
    expect(t.exercicios[0].item.exercicioId).toBe('cross-over');
    t = pularExercicio(t);
    expect(t.exercicios.at(-1)!.item.exercicioId).toBe('cross-over');
    expect(proximoPendente(t)).toBe(1);
  });
  it('trocar agachamento por leg press mantém séries planejadas', () => {
    const pernas = diaPlanejado(1, 5).musculacao!;
    let t = montarTreino(pernas, { sessaoId: 'p', data: '2026-11-14', semana: 1, agora: 0, historico: {} });
    expect(alternativas('agachamento', 'agachamento')).toEqual(expect.arrayContaining(['leg-press', 'agachamento-smith']));
    t = trocarExercicio(t, 0, 'agachamento-smith', undefined);
    expect(t.exercicios[0]).toMatchObject({ planejado: 'agachamento', item: { exercicioId: 'agachamento-smith', series: 4 } });
  });
  it('resumo: volume e conclusão', () => {
    let t = base();
    t.exercicios.forEach((e, i) => e.series.forEach((_, k) => { t = concluirSerie(t, i, k, 1000, 60).treino; }));
    expect(treinoConcluido(t)).toBe(true);
    expect(t.descanso).toBeUndefined();
    const r = resumir({ ...t, fim: 3_601_000 }, 0);
    expect(r.duracaoSeg).toBe(3601);
    expect(r.volumeKg).toBe(4 * 62.5 * 6);
    expect(r.seriesFeitas).toBe(r.seriesTotal);
  });
});

describe('cargas iniciais', () => {
  it('sem histórico usa a carga inicial cadastrada (com % da semana)', () => {
    const t = montarTreino(plano, { sessaoId: 'x', data: 'd', semana: 1, agora: 0, historico: {}, cargasIniciais: { 'supino-reto': 50 } });
    expect(t.exercicios[0].series[0].carga).toBe(50);
    const rec = montarTreino(diaPlanejado(4, 0).musculacao!, { sessaoId: 'x', data: 'd', semana: 4, agora: 0, historico: {}, cargasIniciais: { 'supino-reto': 50 } });
    expect(rec.exercicios[0].series[0].carga).toBe(45);
  });
});
