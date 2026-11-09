import { describe, expect, it } from 'vitest';
import { diaPlanejado, faseDaSemana, posicao, repetirSemana, semanaDoPrograma, corridaPlanejada, prescricao, type ConfigPrograma } from './plano';
import { formatarData, somarDias } from '../lib/datas';

const cfg: ConfigPrograma = { inicio: '2026-11-09', repetidas: [] };

describe('posição no programa', () => {
  it('primeiro dia é semana 1, segunda, fase Base', () => {
    expect(posicao(cfg, '2026-11-09')).toMatchObject({ estado: 'durante', semana: 1, dia: 0, fase: 'Base' });
  });
  it('domingo da semana 1 e segunda da semana 2', () => {
    expect(posicao(cfg, '2026-11-15')).toMatchObject({ semana: 1, dia: 6 });
    expect(posicao(cfg, '2026-11-16')).toMatchObject({ semana: 2, dia: 0 });
  });
  it('antes e depois do programa', () => {
    expect(posicao(cfg, '2026-11-07')).toEqual({ estado: 'antes', diasParaComecar: 2 });
    expect(posicao(cfg, somarDias('2026-11-09', 84))).toEqual({ estado: 'depois' });
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

describe('repetir semana', () => {
  it('a semana seguinte refaz a mesma semana do programa e o fim é adiado', () => {
    const c = repetirSemana(cfg, 2); // semana 3 foi ruim
    expect(c.repetidas).toEqual([3]);
    expect([0, 1, 2, 3, 4].map((s) => semanaDoPrograma(c, s))).toEqual([1, 2, 3, 3, 4]);
    expect(posicao(c, somarDias('2026-11-09', 84))).toMatchObject({ estado: 'durante', semana: 12 });
    expect(posicao(c, somarDias('2026-11-09', 21))).toMatchObject({ semana: 3, repetida: true });
  });
  it('repetir duas vezes seguidas', () => {
    const c = repetirSemana(repetirSemana(cfg, 2), 3);
    expect([2, 3, 4, 5].map((s) => semanaDoPrograma(c, s))).toEqual([3, 3, 3, 4]);
  });
});

describe('treinos planejados', () => {
  const nomes = (s: number) => diaPlanejado(s, 0).musculacao!.itens.map((i) => i.exercicioId);
  it('crucifixo alterna: ímpar inclinado, par peck deck', () => {
    for (const s of [1, 3, 5, 7, 9, 11]) expect(nomes(s)).toContain('crucifixo-inclinado');
    for (const s of [2, 4, 6, 8, 10, 12]) expect(nomes(s)).toContain('peck-deck');
    expect(nomes(1)).not.toContain('peck-deck');
    expect(nomes(2)).not.toContain('crucifixo-inclinado');
  });
  it('recuperação tira 1 série e reduz carga para 90%', () => {
    const normal = diaPlanejado(3, 0).musculacao!.itens[0];
    const rec = diaPlanejado(4, 0).musculacao!.itens[0];
    expect(normal).toMatchObject({ series: 4, cargaPct: 100 });
    expect(rec).toMatchObject({ series: 3, cargaPct: 90 });
  });
  it('descanso 90 s compostos e 60 s isoladores', () => {
    const itens = diaPlanejado(1, 0).musculacao!.itens;
    expect(itens.find((i) => i.exercicioId === 'supino-reto')!.descanso).toBe(90);
    expect(itens.find((i) => i.exercicioId === 'cross-over')!.descanso).toBe(60);
  });
  it('tempo útil das corridas confere com a tabela', () => {
    const util = (t: 'base' | 'intervalada' | 'leve', s: number) => corridaPlanejada(t, s).utilSeg / 60;
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => util('base', s))).toEqual([24, 30, 30, 25, 32, 40, 36, 30, 32, 32, 25, 30]);
    expect(util('intervalada', 11)).toBe(8 * 3.5);
    expect(util('leve', 1)).toBe(30);
    expect(corridaPlanejada('base', 1).totalSeg / 60).toBe(34);
    expect(corridaPlanejada('intervalada', 5).resumo).toBe("6 × (1:30 trote firme + 2' caminhada)");
    expect(corridaPlanejada('base', 1).resumo).toBe("6 × (2' trote + 2' caminhada)");
  });
  it('domingo é corrida leve + abdômen', () => {
    const d = diaPlanejado(1, 6);
    expect(d.corrida?.tipo).toBe('leve');
    expect(d.musculacao?.id).toBe('abdomen');
    expect(d.tipoPrincipal).toBe('corrida');
  });
  it('musculação estimada entre ~50 e 65 min', () => {
    for (const d of [0, 2, 4, 5]) expect(diaPlanejado(1, d).musculacao!.minutos).toBeGreaterThanOrEqual(48);
    for (const d of [0, 2, 4, 5]) expect(diaPlanejado(1, d).musculacao!.minutos).toBeLessThanOrEqual(65);
  });
  it('prescrições legíveis', () => {
    const itens = diaPlanejado(1, 4).musculacao!.itens;
    expect(itens.map(prescricao)).toContain('3 × 45 s');
    expect(itens.map(prescricao)).toContain('3 × até perto da falha');
    expect(diaPlanejado(1, 6).musculacao!.itens.map(prescricao)).toContain('3 × 20 cada lado');
  });
});
