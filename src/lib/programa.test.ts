import { describe, expect, it } from 'vitest';
import { faseDaSemana, posicaoNoPrograma } from './programa';
import { formatarData, somarDias } from './datas';

describe('posição no programa', () => {
  it('primeiro dia é semana 1, segunda-feira, fase Base', () => {
    expect(posicaoNoPrograma('2026-11-09', '2026-11-09')).toEqual({ estado: 'durante', semana: 1, diaDaSemana: 0, fase: 'Base' });
  });
  it('domingo da semana 1 e segunda da semana 2', () => {
    expect(posicaoNoPrograma('2026-11-09', '2026-11-15')).toMatchObject({ semana: 1, diaDaSemana: 6 });
    expect(posicaoNoPrograma('2026-11-09', '2026-11-16')).toMatchObject({ semana: 2, diaDaSemana: 0 });
  });
  it('antes e depois do programa', () => {
    expect(posicaoNoPrograma('2026-11-09', '2026-11-07')).toEqual({ estado: 'antes', diasParaComecar: 2 });
    expect(posicaoNoPrograma('2026-11-09', somarDias('2026-11-09', 84))).toEqual({ estado: 'depois' });
  });
  it('fases e recuperações', () => {
    expect([1, 3, 4, 5, 7, 8, 9, 11, 12].map(faseDaSemana)).toEqual([
      'Base', 'Base', 'Recuperação', 'Progressão', 'Progressão', 'Recuperação', 'Intensificação', 'Intensificação', 'Recuperação',
    ]);
  });
  it('formata datas em dd/mm/aaaa e atravessa o horário de verão', () => {
    expect(formatarData('2026-11-09')).toBe('09/11/2026');
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01');
  });
});
