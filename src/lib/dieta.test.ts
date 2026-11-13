import { describe, expect, it } from 'vitest';
import { buscar, calcularMetas, carregarBase, medidasPara, porcao, somar } from './dieta';
import { medidasDe } from '../data/medidas';

describe('dieta', () => {
  it('carrega a TACO e encontra alimentos comuns sem acento e fora de ordem', async () => {
    const t = await carregarBase();
    expect(t.length).toBeGreaterThan(2500);
    expect(buscar(t, 'arroz cozido')[0].nome).toMatch(/^Arroz/);
    expect(buscar(t, 'feijao carioca').some((a) => a.nome === 'Feijão, carioca, cozido')).toBe(true);
    expect(buscar(t, 'pao frances')[0].nome).toBe('Pão, trigo, francês');
    expect(buscar(t, 'frango peito grelhado').some((a) => a.kcal === 159 && a.p === 32)).toBe(true);
    expect(buscar(t, 'xyzw')).toEqual([]);
  });

  it('IBGE: preparos e medidas caseiras oficiais (ovo frito, tapioca, açaí)', async () => {
    const t = await carregarBase();
    const ovo = buscar(t, 'ovo galinha frito').find((a) => a.fonte === 'IBGE')!;
    expect(ovo).toMatchObject({ nome: 'Ovo de galinha, frito(a)', kcal: 223 });
    expect(medidasPara(ovo)).toContainEqual({ nome: 'unidade', g: 50 });
    expect(buscar(t, 'tapioca').length).toBeGreaterThan(0);
    expect(buscar(t, 'acai').some((a) => a.fonte === 'IBGE')).toBe(true);
    expect(buscar(t, 'coxinha')[0].fonte).toBe('IBGE');
  });

  it('calcula porções e soma o dia', () => {
    const arroz = { kcal: 128, p: 2.5, c: 28.1, g: 0.2, fibra: 1.6 };
    expect(porcao(arroz, 150)).toEqual({ kcal: 192, p: 3.8, c: 42.2, g: 0.3, fibra: 2.4 });
    expect(somar([porcao(arroz, 100), porcao(arroz, 50)]).kcal).toBe(192);
  });

  it('metas: perder gordura dá déficit moderado e proteína alta', () => {
    const m = calcularMetas({ sexo: 'm', idade: 30, alturaCm: 180, pesoKg: 100, atividade: 'moderado', objetivo: 'perder' });
    // basal 10*100+6.25*180-5*30+5 = 1980; gasto ×1,55 = 3069; −20% limitado a 500 → 2569 → 2570
    expect(m.kcal).toBe(2570);
    expect(m.p).toBe(200);
    expect(m.g).toBe(Math.round((2570 * 0.25) / 9));
    expect(m.p * 4 + m.c * 4 + m.g * 9).toBeGreaterThan(2550);
    expect(m.aguaMl).toBe(3500);
  });

  it('metas nunca ficam abaixo do gasto basal', () => {
    const d = { sexo: 'f' as const, idade: 28, alturaCm: 160, pesoKg: 55, atividade: 'sedentario' as const, objetivo: 'perder' as const };
    const m = calcularMetas(d);
    expect(m.kcal).toBeGreaterThanOrEqual(Math.round((10 * 55 + 6.25 * 160 - 5 * 28 - 161) / 10) * 10 - 10);
  });

  it('medidas caseiras para alimentos comuns', () => {
    expect(medidasDe('Arroz, tipo 1, cozido').map((m) => m.nome)).toContain('escumadeira');
    expect(medidasDe('Pão, trigo, francês')).toContainEqual({ nome: 'unidade', g: 50 });
    expect(medidasDe('Ovo, de galinha, inteiro, cozido/10minutos')).toContainEqual({ nome: 'unidade', g: 50 });
    expect(medidasDe('Leite, de vaca, integral, pó')[1].nome).toBe('colher de sopa');
    expect(medidasDe('Jiló, cru')).toEqual([{ nome: 'gramas', g: 1 }]);
  });
});

import { plural } from '../screens/Dieta';
describe('plural das medidas', () => {
  it('flexiona só a primeira palavra', () => {
    expect(plural('unidade', 2)).toBe('unidades');
    expect(plural('colher de sopa', 3)).toBe('colheres de sopa');
    expect(plural('filé médio', 2)).toBe('filés médio');
    expect(plural('pedaço médio', 1)).toBe('pedaço médio');
    expect(plural('pegador', 1.5)).toBe('pegadores');
  });
});
