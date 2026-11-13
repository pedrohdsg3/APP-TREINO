import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { criarBanco } from '../db';
import { COLECOES, Sincronizador, type Backend, type Colecao, type Dados, type Armazem } from './sync';

/** "Nuvem" em memória que avisa os ouvintes como o Firestore faz. */
function nuvemMemoria() {
  const dados = Object.fromEntries(COLECOES.map((c) => [c, new Map()])) as Record<Colecao, Map<string, Dados>>;
  const ouvintes = Object.fromEntries(COLECOES.map((c) => [c, new Set()])) as Record<Colecao, Set<(d: { id: string; dados: Dados }[]) => void>>;
  let offline = false;
  const backend = (): Backend => ({
    async enviar(col, id, d) {
      if (offline) throw new Error('sem internet');
      dados[col].set(id, d);
      ouvintes[col].forEach((f) => f([{ id, dados: d }]));
    },
    ouvir(col, f) {
      ouvintes[col].add(f);
      f([...dados[col].entries()].map(([id, d]) => ({ id, dados: d })));
      return () => ouvintes[col].delete(f);
    },
  });
  return { backend, dados, setOffline: (v: boolean) => { offline = v; } };
}
const armazem = (): Armazem => { const m = new Map<string, string>(); return { ler: (k) => m.get(k) ?? null, gravar: (k, v) => { m.set(k, v); } }; };
const esperar = (ms = 30) => new Promise((r) => setTimeout(r, ms));

describe('sincronização', () => {
  it('treino feito no celular aparece no computador (sessão + séries + corrida), e apagar também sincroniza', async () => {
    const nuvem = nuvemMemoria();
    const celular = criarBanco('sync-celular-1'), pc = criarBanco('sync-pc-1');
    const sA = new Sincronizador(celular, nuvem.backend(), 'cel', armazem(), 't', 0);
    const sB = new Sincronizador(pc, nuvem.backend(), 'pc', armazem(), 't', 0);
    sA.iniciar(); sB.iniciar();

    await celular.transaction('rw', celular.sessoes, celular.series, async () => {
      await celular.sessoes.put({ id: 's1', data: '2026-11-09', tipo: 'musculacao', status: 'feito', volumeKg: 6085 });
      await celular.series.bulkAdd([
        { sessaoId: 's1', exercicioId: 'supino-reto', serie: 1, carga: 70, reps: 7, feita: true, timestamp: 1 },
        { sessaoId: 's1', exercicioId: 'supino-reto', serie: 2, carga: 70, reps: 6, feita: true, timestamp: 2 },
      ]);
    });
    await celular.corpo.put({ data: '2026-11-09', peso: 104.2 });
    await celular.ajustes.put({ chave: 'metas', valor: { pesoAlvo: 90, pessoais: [] } });
    await esperar(); await sA.enviar(); await esperar();

    expect(await pc.sessoes.get('s1')).toMatchObject({ volumeKg: 6085 });
    expect((await pc.series.where('sessaoId').equals('s1').toArray()).map((s) => s.reps)).toEqual([7, 6]);
    expect(await pc.corpo.get('2026-11-09')).toMatchObject({ peso: 104.2 });
    expect(await pc.ajustes.get('metas')).toMatchObject({ valor: { pesoAlvo: 90 } });
    expect(sB.estado().pendentes).toBe(0); // receber não gera reenvio

    await pc.sessoes.delete('s1'); await pc.series.where('sessaoId').equals('s1').delete();
    await esperar(); await sB.enviar(); await esperar();
    expect(await celular.sessoes.get('s1')).toBeUndefined();
    expect(await celular.series.where('sessaoId').equals('s1').count()).toBe(0);
    sA.parar(); sB.parar();
  });

  it('dieta: diário e água chegam ao outro aparelho', async () => {
    const nuvem = nuvemMemoria();
    const cel = criarBanco('sync-dieta-cel'), pc = criarBanco('sync-dieta-pc');
    const sA = new Sincronizador(cel, nuvem.backend(), 'cel', armazem(), 'd', 0);
    const sB = new Sincronizador(pc, nuvem.backend(), 'pc', armazem(), 'd', 0);
    sA.iniciar(); sB.iniciar();
    const por100 = { kcal: 128, p: 2.5, c: 28.1, g: 0.2, fibra: 1.6 };
    await cel.diario.put({ id: 'a1', data: '2026-11-13', refeicao: 'almoco', alimentoId: 'taco:3', nome: 'Arroz', gramas: 150, medida: 'gramas', qtd: 150, kcal: 192, p: 3.8, c: 42.2, g: 0.3, fibra: 2.4, por100, ts: 1 });
    await cel.agua.put({ data: '2026-11-13', ml: 750 });
    await esperar(); await sA.enviar(); await esperar();
    expect(await pc.diario.get('a1')).toMatchObject({ kcal: 192, refeicao: 'almoco' });
    expect(await pc.agua.get('2026-11-13')).toMatchObject({ ml: 750 });
    await pc.diario.delete('a1');
    await esperar(); await sB.enviar(); await esperar();
    expect(await cel.diario.get('a1')).toBeUndefined();
    sA.parar(); sB.parar();
  });

  it('sem internet: fica na fila e sobe quando a conexão volta', async () => {
    const nuvem = nuvemMemoria();
    const cel = criarBanco('sync-celular-2');
    const s = new Sincronizador(cel, nuvem.backend(), 'cel', armazem(), 't', 0);
    s.iniciar();
    nuvem.setOffline(true);
    await cel.corpo.put({ data: '2026-11-10', peso: 103.9 });
    await esperar(); await s.enviar();
    expect(s.estado()).toMatchObject({ pendentes: 1, erro: 'sem internet' });
    nuvem.setOffline(false);
    await s.enviar();
    expect(s.estado().pendentes).toBe(0);
    expect(nuvem.dados.corpo.get('2026-11-10')).toMatchObject({ registro: { peso: 103.9 } });
    s.parar();
  });

  it('primeira vinculação sobe tudo o que já existe no aparelho', async () => {
    const nuvem = nuvemMemoria();
    const cel = criarBanco('sync-celular-3');
    await cel.sessoes.bulkPut([{ id: 'a', data: '2026-11-09', tipo: 'musculacao', status: 'feito' }, { id: 'b', data: '2026-11-10', tipo: 'atividade', status: 'feito' }]);
    await cel.corpo.put({ data: '2026-11-09', peso: 104 });
    const s = new Sincronizador(cel, nuvem.backend(), 'cel', armazem(), 't', 0);
    await s.subirTudo();
    await s.enviar();
    expect([...nuvem.dados.sessoes.keys()].sort()).toEqual(['a', 'b']);
    expect(nuvem.dados.corpo.size).toBe(1);
  });

  it('mudança local ainda não enviada não é sobrescrita por versão antiga da nuvem', async () => {
    const nuvem = nuvemMemoria();
    const cel = criarBanco('sync-celular-4');
    nuvem.setOffline(true);
    const s = new Sincronizador(cel, nuvem.backend(), 'cel', armazem(), 't', 0);
    s.iniciar();
    await cel.corpo.put({ data: '2026-11-11', peso: 103 }); // registrado offline na academia
    await esperar(); await s.enviar();
    nuvem.setOffline(false);
    // chega uma versão antiga vinda de outro aparelho
    await nuvem.backend().enviar('corpo', '2026-11-11', { versao: 1, dispositivo: 'outro', registro: { data: '2026-11-11', peso: 110 } });
    await esperar();
    expect((await cel.corpo.get('2026-11-11'))!.peso).toBe(103);
    await s.enviar();
    expect(nuvem.dados.corpo.get('2026-11-11')).toMatchObject({ registro: { peso: 103 }, dispositivo: 'cel' });
    s.parar();
  });
});
