import { describe, expect, it } from 'vitest';
import { detectarPR, epley, sugerir, volume } from './progressao';

describe('progressão', () => {
  it('Epley', () => {
    expect(epley(100, 1)).toBe(100);
    expect(epley(60, 10)).toBeCloseTo(80);
  });
  it('progressão dupla: bateu o topo em todas as séries → sobe carga e volta ao mínimo', () => {
    const it = { exercicioId: 'supino-reto', series: 4, reps: 8, repsMin: 6 };
    const s = sugerir(it, [{ carga: 60, reps: 8 }, { carga: 60, reps: 8 }, { carga: 60, reps: 8 }, { carga: 60, reps: 8 }])!;
    expect(s).toMatchObject({ carga: 62.5, reps: 6, subir: true });
  });
  it('não bateu o topo → mantém', () => {
    const it = { exercicioId: 'supino-reto', series: 4, reps: 8, repsMin: 6 };
    expect(sugerir(it, [{ carga: 60, reps: 8 }, { carga: 60, reps: 7 }, { carga: 60, reps: 8 }, { carga: 60, reps: 8 }])).toMatchObject({ carga: 60, subir: false });
  });
  it('incrementos: isolador superior +2, composto inferior +5', () => {
    const top = (id: string, n: number, reps: number, carga: number) => sugerir({ exercicioId: id, series: n, reps, repsMin: reps - 2 }, Array(n).fill({ carga, reps }))!.carga;
    expect(top('elevacao-lateral', 4, 12, 8)).toBe(10);
    expect(top('agachamento', 4, 8, 80)).toBe(85);
  });
  it('semana de recuperação reduz para ~90%', () => {
    const s = sugerir({ exercicioId: 'supino-reto', series: 3, reps: 8, repsMin: 6 }, [{ carga: 60, reps: 8 }], 90)!;
    expect(s.carga).toBe(55); // 54 arredondado ao passo de 2,5
    expect(s.subir).toBe(false);
  });
  it('sem histórico não sugere', () => {
    expect(sugerir({ exercicioId: 'supino-reto', series: 4, reps: 8 }, [])).toBeUndefined();
  });
  it('PR por 1RM e por carga na mesma faixa', () => {
    const hist = [{ carga: 60, reps: 8 }, { carga: 70, reps: 3 }];
    expect(detectarPR('x', { carga: 62.5, reps: 8 }, hist)?.tipo).toBe('1rm');
    expect(detectarPR('x', { carga: 60, reps: 8 }, hist)).toBeUndefined();
    expect(detectarPR('x', { carga: 50, reps: 8 }, [])).toBeUndefined();
    // carga maior para ≥ reps sem superar 1RM global
    expect(detectarPR('x', { carga: 50, reps: 12 }, [{ carga: 45, reps: 12 }, { carga: 100, reps: 5 }])?.tipo).toBe('carga');
  });
  it('volume', () => {
    expect(volume([{ carga: 60, reps: 8 }, { carga: 0, reps: 10 }])).toBe(480);
  });
});
