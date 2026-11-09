import { describe, expect, it } from 'vitest';
import { codificar, decodificar, estatisticas, lider, placarSemanas, sequenciaAtual, type Participante } from './duelo';

const pedro: Participante = { id: 'pedro', nome: 'Pedro', emoji: '💪', personagem: 'pedro', plano: 'pedro', inicio: '2026-11-09', feitos: [], cardios: [] };
const yana: Participante = { id: 'yana', nome: 'Yana', emoji: '🌸', personagem: 'yana', plano: 'feminino', inicio: '2026-11-16', feitos: [], cardios: [] };
const dias = (de: string, n: number, pular: number[] = []) => Array.from({ length: n }, (_, i) => i).filter((i) => !pular.includes(i)).map((i) => { const d = new Date(2026, 10, Number(de.slice(8)) + i, 12); return d.toISOString().slice(0, 10); });

describe('duelo', () => {
  it('presença é justa entre planos de 7 e 6 treinos por semana', () => {
    const p = { ...pedro, feitos: dias('2026-11-16', 7, [3]) }; // 6 de 7
    const y = { ...yana, feitos: dias('2026-11-16', 6) };        // 6 de 6 (domingo é descanso)
    const sp = estatisticas(p, '2026-11-16', '2026-11-22'), sy = estatisticas(y, '2026-11-16', '2026-11-22');
    expect(sp).toMatchObject({ planejados: 7, feitos: 6 });
    expect(sy).toMatchObject({ planejados: 6, feitos: 6, presenca: 1 });
    expect(lider(sp, sy)).toBe('b');
  });
  it('só conta a partir do início de cada um', () => {
    expect(estatisticas(yana, '2026-11-09', '2026-11-15')).toMatchObject({ planejados: 0, presenca: null });
  });
  it('semanas vencidas: só semanas fechadas, desde que os dois começaram', () => {
    const p = { ...pedro, feitos: [...dias('2026-11-09', 7), ...dias('2026-11-16', 7), ...dias('2026-11-23', 3)] };
    const y = { ...yana, feitos: [...dias('2026-11-16', 5), ...dias('2026-11-23', 3)] };
    const r = placarSemanas(p, y, '2026-11-25');
    expect(r.semanas.map((s) => s.inicio)).toEqual(['2026-11-16', '2026-11-23']);
    expect(r).toMatchObject({ a: 1, b: 0, empates: 0 });
    expect(r.semanas[1].emAndamento).toBe(true);
  });
  it('sequência pula o domingo de descanso dela', () => {
    const y = { ...yana, feitos: ['2026-11-20', '2026-11-21', '2026-11-23'] };
    expect(sequenciaAtual(y, '2026-11-23')).toBe(3);
  });
  it('código de placar vai e volta (com acentos e emoji)', () => {
    const y = { ...yana, nome: 'Yanã', feitos: ['2026-11-16'] };
    const d = decodificar(`Meu placar 💪 ${codificar(y)}`);
    expect(d).toMatchObject({ nome: 'Yanã', plano: 'feminino', feitos: ['2026-11-16'], personagem: 'yana', externo: true });
    expect(() => decodificar('oi')).toThrow();
  });
});
