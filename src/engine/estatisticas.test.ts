import { describe, expect, it } from 'vitest';
import { feitosNaSemana, sequencia, ultimaSessao } from './estatisticas';
import type { Sessao } from '../db';

const s = (data: string, status: Sessao['status'] = 'feito', tipo: Sessao['tipo'] = 'musculacao'): Sessao => ({ id: data + tipo, data, tipo, status });

describe('estatísticas', () => {
  const sessoes = [s('2026-11-09'), s('2026-11-10', 'feito', 'corrida'), s('2026-11-11', 'pulado'), s('2026-11-12'), s('2026-11-13')];
  it('treinos feitos na semana (pulados não contam)', () => {
    expect(feitosNaSemana(sessoes, '2026-11-09')).toBe(4);
  });
  it('sequência conta dias seguidos e não quebra se hoje ainda não treinou', () => {
    expect(sequencia(sessoes, '2026-11-13')).toBe(2);
    expect(sequencia(sessoes, '2026-11-14')).toBe(2);
    expect(sequencia(sessoes, '2026-11-15')).toBe(0);
  });
  it('último treino ignora pulados', () => {
    expect(ultimaSessao([...sessoes, s('2026-11-14', 'pulado')], '2026-11-14')?.data).toBe('2026-11-13');
  });
});
