import { describe, expect, it } from 'vitest';
import { diaPlanejado } from './plano';
import { ajustarAquecimento, montarTreino, montarAquecimento, aquecimentoPendente, concluirAquecimento, pularAquecimento, resumir, concluirSerie } from './treinoAtivo';
import { orientacaoSerie } from './metodologia';

const plano = diaPlanejado(1, 0).musculacao!;
const hist = { 'supino-reto': { ultima: { data: '2026-11-02', series: Array(4).fill({ carga: 60, reps: 7 }) }, todas: Array(4).fill({ carga: 60, reps: 7 }) } };

describe('série de aquecimento', () => {
  const t = montarTreino(plano, { sessaoId: 's', data: 'd', semana: 1, agora: 0, historico: hist });
  it('série leve é a 1ª das N (não uma a mais): ~15–20 reps; 1º exercício ~50%, demais ~60%', () => {
    expect(t.exercicios[0].aquecimento).toMatchObject({ carga: 30, reps: 15, repsMin: 15, repsMax: 20, primeiro: true, feita: false, pct: 50 });
    expect(t.exercicios[1].aquecimento).toMatchObject({ repsMin: 15, repsMax: 20, primeiro: false, pct: 60 });
    expect(t.exercicios[0].series).toHaveLength(plano.itens[0].series - 1);
    expect(resumir(t, 0).seriesTotal).toBe(plano.itens.reduce((n, it) => n + it.series, 0));
  });
  it('sem aquecimento em exercícios sem carga, por tempo ou de core', () => {
    expect(montarAquecimento({ exercicioId: 'prancha', series: 3, reps: 45, descanso: 60, cargaPct: 100 }, 0, false)).toBeUndefined();
    expect(montarAquecimento({ exercicioId: 'mergulho', series: 3, reps: 0, descanso: 90, cargaPct: 100 }, 0, false)).toBeUndefined();
    expect(montarAquecimento({ exercicioId: 'abd-remador', series: 3, reps: 15, descanso: 45, cargaPct: 100 }, 20, false)).toBeUndefined();
  });
  it('série leve dá descanso curto, conta no volume, mas não em PR', () => {
    let x = concluirAquecimento(t, 0, 0, 90);
    expect(x.descanso).toEqual({ fim: 60_000, total: 60 });
    expect(aquecimentoPendente(x.exercicios[0])).toBe(false);
    expect(resumir(x, 1).volumeKg).toBe(30 * 15);
    expect(x.prs).toHaveLength(0);
    x = concluirSerie(x, 0, 0, 1, 90).treino;
    expect(resumir(x, 1).volumeKg).toBe(30 * 15 + 60 * 8);
  });
  it('primeira vez no exercício: séries de trabalho partem da carga do aquecimento', () => {
    let x = montarTreino(plano, { sessaoId: 's', data: 'd', semana: 1, agora: 0, historico: {} });
    x = ajustarAquecimento(x, 0, 'carga', 20);
    x = concluirAquecimento(x, 0, 0, 90);
    expect(x.exercicios[0].series.map((s) => s.carga)).toEqual([20, 20, 20]);
  });
  it('pular aquecimento', () => {
    expect(aquecimentoPendente(pularAquecimento(t, 1).exercicios[1])).toBe(false);
  });
});

describe('metodologia explícita', () => {
  const t = montarTreino(plano, { sessaoId: 's', data: 'd', semana: 1, agora: 0, historico: hist });
  const e = t.exercicios[0];
  it('aquecimento, trabalho e última série têm orientações diferentes', () => {
    expect(orientacaoSerie(e, 'aquecimento', 'Base').texto).toContain('~15 repetições (até 20)');
    expect(orientacaoSerie(e, 0, 'Base')).toMatchObject({ titulo: 'Série de trabalho' });
    expect(orientacaoSerie(e, 0, 'Base').texto).toContain('6–8 repetições');
    expect(orientacaoSerie(e, 0, 'Base').texto).toContain('Anote a carga');
    expect(orientacaoSerie(e, 2, 'Base')).toMatchObject({ titulo: 'Última série' });
    expect(orientacaoSerie(e, 0, 'Adaptação').texto).toContain('mais 3–4');
  });
});
