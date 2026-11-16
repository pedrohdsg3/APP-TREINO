import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { abrirBanco, db } from '../db';
import { PLANO_PEDRO, PROPRIOS_PEDRO } from '../data/planoPedro';
import { desfazerRefeicao, escolhido, lancarPorcoes, lerDiaPlano, lerPlano, lerProprios, montarPlanoDeEsp, porcaoParaPor100, semearPlanoPedro, totaisOpcao, todosAlimentos } from './planoAlimentar';
import { somar } from './dieta';

describe('plano alimentar do Pedro', () => {
  it('todos os alimentos do plano existem e o dia principal fica em ~2.200–2.250 kcal com ~185 g de proteína', async () => {
    const p = await montarPlanoDeEsp('t', PLANO_PEDRO, PROPRIOS_PEDRO);
    const op = (r: string, i = 0) => p.refeicoes.find((x) => x.refeicao === r)!.opcoes[i];
    const dia = somar(['cafe', 'almoco', 'lanche-tarde', 'jantar'].map((r) => totaisOpcao(op(r))));
    expect(dia.kcal).toBeGreaterThanOrEqual(2150); expect(dia.kcal).toBeLessThanOrEqual(2300);
    expect(dia.p).toBeGreaterThanOrEqual(175);
    expect(dia.g).toBeGreaterThanOrEqual(45);
    // todas as opções de jantar ficam numa faixa parecida
    for (const o of p.refeicoes.find((x) => x.refeicao === 'jantar')!.opcoes) {
      const t = totaisOpcao(o);
      expect(t.kcal, o.nome).toBeGreaterThan(380); expect(t.kcal, o.nome).toBeLessThan(640);
      expect(t.p, o.nome).toBeGreaterThan(30);
    }
    // trocas do arroz ficam perto de 130 kcal
    const arroz = op('almoco').itens[0];
    for (const s of arroz.subs!) expect(Math.abs((s.gramas * s.por100.kcal) / 100 - 130), s.nome).toBeLessThan(35);
  });

  it('rótulo por porção → por 100 g', () => {
    expect(porcaoParaPor100(30, { kcal: 120, p: 24, c: 3, g: 2 })).toEqual({ kcal: 400, p: 80, c: 10, g: 6.7, fibra: 0 });
  });

  it('semear (uma vez), seguir com troca e desfazer', async () => {
    abrirBanco('plano-teste');
    expect(await semearPlanoPedro()).toBe(true);
    expect(await semearPlanoPedro()).toBe(false);
    expect((await lerProprios()).map((x) => x.id)).toContain('meu:whey');
    expect((await todosAlimentos()).some((a) => a.id === 'meu:boldbar')).toBe(true);
    expect(await db.ajustes.get('metasDieta')).toMatchObject({ valor: { kcal: 2250, p: 185 } });
    const plano = (await lerPlano())!;
    const almoco = plano.refeicoes.find((r) => r.refeicao === 'almoco')!.opcoes[0];
    const porcoes = almoco.itens.map((it, k) => escolhido(it, k === 0 ? 0 : undefined)); // arroz → batata
    await lancarPorcoes('2026-11-16', 'almoco', porcoes, { status: 'segui', opcaoId: almoco.id });
    const lancados = await db.diario.where('data').equals('2026-11-16').toArray();
    expect(lancados).toHaveLength(6);
    expect(lancados.some((r) => r.nome === 'Batata, inglesa, cozida' && r.gramas === 240)).toBe(true);
    expect(await lerDiaPlano('2026-11-16')).toEqual({ almoco: { status: 'segui', opcaoId: 'almoco' } });
    await desfazerRefeicao('2026-11-16', 'almoco');
    expect(await db.diario.where('data').equals('2026-11-16').count()).toBe(0);
    expect(await lerDiaPlano('2026-11-16')).toEqual({});
  });
});
