import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from '../db';
import { salvarTreino } from './historico';
import { montarTreino, concluirSerie } from '../engine/treinoAtivo';
import { diaPlanejado } from '../engine/plano';

describe('salvar treino', () => {
  it('salva mesmo se o navegador fechou a conexão do banco durante o treino', async () => {
    await db.open();
    let t = montarTreino(diaPlanejado(1, 0).musculacao!, { sessaoId: 'sessao-teste', data: '2026-11-09', semana: 1, agora: 0, historico: {} });
    t = concluirSerie(t, 0, 0, 1000, 90).treino;
    // simula o Android fechando a conexão do IndexedDB "por baixo" (app 1 h em segundo plano)
    db.backendDB().close();
    await salvarTreino({ ...t, etapa: 'resumo', fim: 3_600_000 }, { esforco: 8 }, 3_600_000);
    // `db` é um binding vivo: após reabrir, aponta para a conexão nova
    const { db: atual } = await import('../db');
    expect(await atual.sessoes.get('sessao-teste')).toMatchObject({ tipo: 'musculacao', esforco: 8, status: 'parcial' });
    expect(await atual.series.where('sessaoId').equals('sessao-teste').count()).toBe(t.exercicios.reduce((n, e) => n + e.series.length, 0));
  });
  it('números inválidos viram 0 em vez de quebrar a gravação', async () => {
    let t = montarTreino(diaPlanejado(1, 0).musculacao!, { sessaoId: 'sessao-nan', data: '2026-11-09', semana: 1, agora: 0, historico: {} });
    t = { ...t, exercicios: t.exercicios.map((e, i) => (i === 0 ? { ...e, series: e.series.map((s) => ({ ...s, carga: NaN })) } : e)) };
    await salvarTreino(t, {}, 1);
    const { db: atual } = await import('../db');
    expect((await atual.series.where('sessaoId').equals('sessao-nan').first())!.carga).toBe(0);
  });
});
