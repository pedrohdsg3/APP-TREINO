import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { criarBanco } from '../db';
import { exportar, importar, validar, resumir } from './backup';
import type { Perfil } from './perfis';

const perfil: Perfil = { id: 'teste', nome: 'Teste', emoji: '💪', plano: 'pedro', banco: 'app-treino-teste-bkp', criado: '2026-11-10' };

describe('backup', () => {
  it('exporta e importa sem perda de dados', async () => {
    const b = criarBanco(perfil.banco);
    await b.sessoes.put({ id: 's1', data: '2026-11-09', tipo: 'musculacao', status: 'feito', volumeKg: 1920 });
    await b.series.bulkAdd([{ sessaoId: 's1', exercicioId: 'supino-reto', serie: 1, carga: 60, reps: 8, feita: true, timestamp: 1 }]);
    await b.corridas.put({ sessaoId: 'c1', estrutura: 'x', duracaoSeg: 1800, distanciaKm: 4.2, dorJoelho: 2 });
    await b.corpo.put({ data: '2026-11-09', peso: 104.2, cintura: 112 });
    await b.ajustes.put({ chave: 'programa', valor: { inicio: '2026-11-09', repetidas: [3] } });
    const antes = await exportar([perfil]);
    const json = JSON.parse(JSON.stringify(antes));

    // apaga tudo e importa
    for (const t of ['sessoes', 'series', 'corridas', 'corpo', 'ajustes']) await b.table(t).clear();
    expect(await b.sessoes.count()).toBe(0);
    await importar(validar(json));
    const depois = await exportar([perfil]);
    expect(depois.perfis[0].tabelas).toEqual(antes.perfis[0].tabelas);
    expect(resumir(depois)).toEqual([{ nome: 'Teste', sessoes: 1, pesos: 1 }]);
    b.close();
  });
  it('rejeita arquivos que não são backup', () => {
    expect(() => validar({ foo: 1 })).toThrow('não é um backup');
  });
});
