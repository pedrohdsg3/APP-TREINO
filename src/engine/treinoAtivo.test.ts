import { describe, expect, it } from 'vitest';
import { diaPlanejado } from './plano';
import { ajustarDescanso, ajustarSerie, alternativas, concluirSerie, fazerAgora, montarTreino, proximoPendente, pularExercicio, resumir, treinoConcluido, trocarExercicio } from './treinoAtivo';
import { usarPlano as __usarPlano } from './plano';
import { PLANO_PEDRO, PLANO_PEDRO_ANTERIOR } from '../data/planos';
import { beforeEach as __antes, afterEach as __depois } from 'vitest';
// Estes testes foram escritos sobre a semana anterior do Pedro (4× musculação + 3 corridas).
__antes(() => __usarPlano(PLANO_PEDRO_ANTERIOR));
__depois(() => __usarPlano(PLANO_PEDRO));

__usarPlano(PLANO_PEDRO_ANTERIOR);
const plano = diaPlanejado(1, 0).musculacao!;
__usarPlano(PLANO_PEDRO);
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
  it('trocar não oferece exercícios que já estão no treino do dia', () => {
    const alt = alternativas('agachamento-goblet', 'agachamento-goblet', ['leg-press', 'elevacao-pelvica', 'extensora', 'abdutora', 'panturrilha']);
    expect(alt).not.toContain('leg-press');
    expect(alt).not.toContain('extensora');
    expect(alt).toEqual(expect.arrayContaining(['agachamento-smith', 'agachamento']));
    // o original do plano sempre pode voltar, mesmo que esteja em outro lugar
    expect(alternativas('leg-press', 'agachamento', ['agachamento'])).toContain('agachamento');
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

import { concluirSerie as __concluir, parceiroBiset } from './treinoAtivo';
import { PLANO_PEDRO as __PEDRO } from '../data/planos';
describe('biset', () => {
  it('rosca → tríceps sem descanso; descansa ao fechar a rodada; tríceps faz a 5ª série sozinho', () => {
    __usarPlano(__PEDRO);
    const p = diaPlanejado(1, 0).musculacao!; // Superior A
    let t = montarTreino(p, { sessaoId: 'b', data: '2026-11-16', semana: 1, agora: 0, historico: {} });
    const r = t.exercicios.findIndex((e) => e.item.exercicioId === 'rosca-direta');
    const c = t.exercicios.findIndex((e) => e.item.exercicioId === 'triceps-corda');
    expect(parceiroBiset(t, r)).toBe(c);
    t = { ...t, atual: r };
    for (let rodada = 0; rodada < 4; rodada++) {
      t = __concluir(t, r, rodada, 1000, 60).treino;
      expect(t.atual).toBe(c); expect(t.descanso).toBeUndefined();
      t = __concluir(t, c, rodada, 2000, 60).treino;
      expect(t.descanso).toBeDefined();
      expect(t.atual).toBe(rodada < 3 ? r : c);
    }
    t = __concluir(t, c, 4, 3000, 60).treino;
    expect(t.exercicios[c].series.every((s) => s.feita)).toBe(true);
  });
});
