import { afterEach, describe, expect, it } from 'vitest';
import { PLANO_FEMININO, PLANO_PEDRO, minutosCardio } from './planos';
import { diaPlanejado, planoDaData, treinosPorSemana, usarPlano, diasComTreino, orientacaoFase } from '../engine/plano';
import { EXERCICIOS } from './musculacao';
import { sequencia } from '../engine/estatisticas';
import { mapaConsistencia } from '../engine/evolucao';
import type { Sessao } from '../db';

afterEach(() => usarPlano(PLANO_PEDRO));

describe('plano feminino', () => {
  it('4 musculações + 2 corridas, nos mesmos dias que o Pedro; domingo descanso', () => {
    usarPlano(PLANO_FEMININO);
    const tipos = Array.from({ length: 7 }, (_, d) => { const p = diaPlanejado(1, d); return p.descanso ? 'descanso' : p.tipoPrincipal; });
    expect(tipos).toEqual(['musculacao', 'corrida', 'musculacao', 'corrida', 'musculacao', 'musculacao', 'descanso']);
    expect(treinosPorSemana()).toBe(6);
    // mesmas corridas de terça e quinta que o Pedro
    expect(diaPlanejado(3, 1).corrida!.resumo).toBe((usarPlano(PLANO_PEDRO), diaPlanejado(3, 1).corrida!.resumo));
  });
  it('todos os exercícios existem no catálogo', () => {
    usarPlano(PLANO_FEMININO);
    for (let s = 1; s <= 12; s++) for (const d of [0, 2, 4, 5]) {
      for (const it of diaPlanejado(s, d).musculacao!.itens) expect(EXERCICIOS[it.exercicioId], it.exercicioId).toBeDefined();
    }
  });
  it('começa em 3×10 (8–10) em todos os exercícios e progride: 4×10 → 4×8; recuperação com menos séries', () => {
    usarPlano(PLANO_FEMININO);
    const pr = (s: number) => diaPlanejado(s, 0).musculacao!.itens.find((i) => i.exercicioId === 'leg-press')!;
    expect(pr(1)).toMatchObject({ series: 3, reps: 10, repsMin: 8, cargaPct: 100 });
    for (const d of [0, 2, 4, 5]) {
      for (const it of diaPlanejado(1, d).musculacao!.itens.filter((i) => i.descanso !== 45)) expect(it, it.exercicioId).toMatchObject({ series: 3, reps: 10, repsMin: 8 });
    }
    expect(pr(5)).toMatchObject({ series: 4, reps: 10 });
    expect(pr(11)).toMatchObject({ series: 4, reps: 8 });
    expect(pr(4)).toMatchObject({ series: 2, cargaPct: 90 });
  });
  it('prioriza inferiores: glúteos em 3 dos 4 treinos; goblet vira agachamento livre na semana 5', () => {
    usarPlano(PLANO_FEMININO);
    const comGluteo = [0, 2, 4, 5].filter((d) => diaPlanejado(5, d).musculacao!.grupos.includes('Glúteos'));
    expect(comGluteo.length).toBeGreaterThanOrEqual(3);
    expect(diaPlanejado(1, 0).musculacao!.itens[0].exercicioId).toBe('agachamento-goblet');
    expect(diaPlanejado(5, 0).musculacao!.itens[0].exercicioId).toBe('agachamento');
  });
  it('sem drop-set no começo; drop só nas máquinas nas semanas 10–11', () => {
    usarPlano(PLANO_FEMININO);
    const drops = (s: number) => [0, 2, 4, 5].flatMap((d) => diaPlanejado(s, d).musculacao!.itens).filter((i) => i.obs?.includes('drop')).length;
    expect(drops(1)).toBe(0);
    expect(drops(7)).toBe(0);
    expect(drops(10)).toBeGreaterThan(0);
    expect(drops(12)).toBe(0);
  });
  it('fases e orientações próprias', () => {
    usarPlano(PLANO_FEMININO);
    expect(diaPlanejado(1, 0).fase).toBe('Adaptação');
    expect(diaPlanejado(6, 0).fase).toBe('Construção');
    expect(orientacaoFase('Adaptação')).toContain('Nada de falha');
  });
  it('domingo é descanso ativo com cardio leve opcional', () => {
    usarPlano(PLANO_FEMININO);
    const d = planoDaData({ inicio: '2026-11-16', repetidas: [] }, '2026-11-22')!;
    expect(d).toMatchObject({ descanso: true, titulo: 'Descanso ativo' });
    expect(d.corrida?.tipo).toBe('cardio');
  });
});

describe('cardio leve', () => {
  it('10 → 15 → 20 min, 10 nas recuperações', () => {
    expect([1, 3, 4, 5, 7, 8, 9, 11, 12].map(minutosCardio)).toEqual([10, 10, 10, 15, 15, 10, 20, 20, 10]);
  });
  it('opcional nos dias de musculação dos dois planos, não nos de corrida', () => {
    for (const p of [PLANO_PEDRO, PLANO_FEMININO]) {
      usarPlano(p);
      expect(diaPlanejado(5, 0).cardio?.totalSeg).toBe(15 * 60);
      expect(diaPlanejado(5, 1).cardio).toBeUndefined();
    }
  });
  it('Pedro continua com 7 treinos por semana', () => {
    expect(treinosPorSemana()).toBe(7);
    expect(diasComTreino().every(Boolean)).toBe(true);
  });
});

describe('descanso e cardio nas estatísticas', () => {
  const s = (data: string, tipo: Sessao['tipo'] = 'musculacao'): Sessao => ({ id: data + tipo, data, tipo, status: 'feito' });
  it('domingo de descanso não quebra a sequência; cardio sozinho não conta', () => {
    const ses = [s('2026-11-20'), s('2026-11-21'), s('2026-11-23')];
    const descanso = (d: string) => d === '2026-11-22';
    expect(sequencia(ses, '2026-11-23', descanso)).toBe(3);
    expect(sequencia([s('2026-11-23', 'cardio')], '2026-11-23')).toBe(0);
  });
  it('mapa marca dias de descanso', () => {
    usarPlano(PLANO_FEMININO);
    const m = mapaConsistencia([], '2026-11-16', 1, '2026-11-30', diasComTreino());
    expect(m[0][6]).toBe('descanso');
    expect(m[0][0]).toBe('vazio');
  });
});
