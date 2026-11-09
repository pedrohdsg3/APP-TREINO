import { describe, expect, it } from 'vitest';
import { conquistas, historicoExercicio, mapaConsistencia, mediaMovel, progressoMeta, recordes, sequenciaMaxima, tendenciaSemanal, volumePorGrupo, volumeSemanal, type SerieComData } from './evolucao';
import type { Sessao } from '../db';

const serie = (sessaoId: string, data: string, exercicioId: string, carga: number, reps: number): SerieComData =>
  ({ sessaoId, data, exercicioId, carga, reps, serie: 1, feita: true, timestamp: 0 });

describe('evolução', () => {
  it('média móvel de 7 dias e tendência semanal', () => {
    const p = [{ data: '2026-11-01', valor: 100 }, { data: '2026-11-04', valor: 99 }, { data: '2026-11-08', valor: 98.4 }, { data: '2026-11-15', valor: 97.6 }];
    expect(mediaMovel(p).map((x) => x.valor)).toEqual([100, 99.5, 98.7, 97.6]);
    expect(tendenciaSemanal(p)).toBeCloseTo(-1.1, 1);
    expect(tendenciaSemanal([p[0]])).toBeUndefined();
  });
  it('histórico de exercício: carga máx, 1RM e volume por sessão', () => {
    const s = [serie('a', '2026-11-09', 'supino-reto', 60, 8), serie('a', '2026-11-09', 'supino-reto', 60, 7), serie('b', '2026-11-16', 'supino-reto', 62.5, 8)];
    const h = historicoExercicio(s, 'supino-reto');
    expect(h.map((x) => x.cargaMax)).toEqual([60, 62.5]);
    expect(h[0].volume).toBe(900);
    expect(h[1].e1rm).toBeCloseTo(79.17, 1);
    expect(volumeSemanal(s, '2026-11-09', 3)).toEqual([900, 500, 0]);
    expect(recordes(s)[0]).toMatchObject({ exercicioId: 'supino-reto', carga: 62.5 });
    expect(volumePorGrupo(s, '2026-11-09', '2026-11-15')).toEqual([{ grupo: 'Peito', volume: 900, series: 2 }]);
  });
  it('mapa de consistência e sequência', () => {
    const ss: Sessao[] = [
      { id: '1', data: '2026-11-09', tipo: 'musculacao', status: 'feito' },
      { id: '2', data: '2026-11-10', tipo: 'corrida', status: 'feito' },
      { id: '3', data: '2026-11-11', tipo: 'musculacao', status: 'parcial' },
      { id: '4', data: '2026-11-13', tipo: 'musculacao', status: 'pulado' },
    ];
    const m = mapaConsistencia(ss, '2026-11-09', 2, '2026-11-14');
    expect(m[0]).toEqual(['feito', 'feito', 'parcial', 'vazio', 'pulado', 'vazio', 'futuro']);
    expect(sequenciaMaxima(ss)).toBe(3);
  });
  it('conquistas', () => {
    const ss: Sessao[] = Array.from({ length: 7 }, (_, i) => ({ id: `${i}`, data: `2026-11-${String(9 + i).padStart(2, '0')}`, tipo: 'musculacao', status: 'feito', prs: i === 2 ? 1 : 0 }));
    const c = conquistas({ sessoes: ss, series: [], corridas: [{ sessaoId: 'x', data: '2026-11-10', estrutura: '', duracaoSeg: 0, maiorTroteSeg: 1300 }], corpo: [{ data: '2026-11-10', peso: 89.8 }], inicio: '2026-11-09', hoje: '2026-11-16', pesoAlvo: 90, sequenciaMax: 7 });
    const ok = c.filter((x) => x.obtida).map((x) => x.id);
    expect(ok).toEqual(expect.arrayContaining(['primeiro', 'corrida1', 'semana', 'seq7', 'pr1', 'trote20', 'peso']));
    expect(ok).not.toContain('trote30');
  });
  it('progresso de meta (subir ou descer)', () => {
    expect(progressoMeta(100, 90, 95)).toBe(0.5);
    expect(progressoMeta(10, 30, 20)).toBe(0.5);
    expect(progressoMeta(100, 90, 101)).toBe(0);
    expect(progressoMeta(100, 90, 88)).toBe(1);
  });
});
