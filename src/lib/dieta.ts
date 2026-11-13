// Dieta: alimentos (TACO + próprios), diário por refeição, água e metas.
import { db, type RegistroAlimento } from '../db';
import { novoId } from './historico';
import { medidasDe, type Medida } from '../data/medidas';

export const REFEICOES = [
  { id: 'cafe', nome: 'Café da manhã', emoji: '☕' },
  { id: 'lanche-manha', nome: 'Lanche da manhã', emoji: '🍎' },
  { id: 'almoco', nome: 'Almoço', emoji: '🍛' },
  { id: 'lanche-tarde', nome: 'Lanche da tarde', emoji: '🥪' },
  { id: 'jantar', nome: 'Jantar', emoji: '🍽️' },
  { id: 'ceia', nome: 'Ceia', emoji: '🌙' },
] as const;
export type RefeicaoId = (typeof REFEICOES)[number]['id'];

/** Valores por 100 g. */
export interface Alimento {
  id: string; nome: string; grupo: string; kcal: number; p: number; g: number; c: number; fibra: number; sodio: number;
  /** de onde vêm os valores */
  fonte: 'TACO' | 'IBGE' | 'Meu';
  /** medidas caseiras próprias do alimento (IBGE); senão usa as regras gerais */
  medidas?: Medida[];
}

export interface Totais { kcal: number; p: number; c: number; g: number; fibra: number }
export const ZERO: Totais = { kcal: 0, p: 0, c: 0, g: 0, fibra: 0 };

// ---------------------------------------------------------------- bases (carregadas sob demanda)
type Linha = [number, string, number, number, number, number, number, number, unknown];
let base: Promise<Alimento[]> | null = null;

/** TACO 4ª ed. (NEPA/UNICAMP) + IBGE POF 2008-2009 (com preparos e medidas caseiras oficiais). */
export function carregarBase(): Promise<Alimento[]> {
  base ??= Promise.all([import('../data/taco.json'), import('../data/ibge.json')]).then(([t, i]) => {
    const taco = (t.default ?? t) as unknown as { grupos: string[]; alimentos: Linha[] };
    const ibge = (i.default ?? i) as unknown as { grupos: string[]; alimentos: Linha[] };
    return [
      ...taco.alimentos.map(([id, nome, gi, kcal, p, g, c, fibra, sodio]): Alimento => ({ id: `taco:${id}`, nome, grupo: taco.grupos[gi], kcal, p, g, c, fibra, sodio: sodio as number, fonte: 'TACO' })),
      ...ibge.alimentos.map(([id, nome, gi, kcal, p, g, c, fibra, med]): Alimento => ({
        id: `ibge:${id}`, nome, grupo: ibge.grupos[gi], kcal, p, g, c, fibra, sodio: 0, fonte: 'IBGE',
        medidas: (med as [string, number][]).map(([n, gr]) => ({ nome: n, g: gr })),
      })),
    ];
  }).catch((e) => { base = null; throw e; });
  return base;
}
/** @deprecated use carregarBase */
export const carregarTaco = carregarBase;

/** Medidas do alimento: gramas + as próprias (IBGE) ou as regras gerais. */
export function medidasPara(a: Pick<Alimento, 'nome' | 'medidas'>): Medida[] {
  return a.medidas?.length ? [{ nome: 'gramas', g: 1 }, ...a.medidas] : medidasDe(a.nome);
}

export const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');

/** Busca por palavras (todas precisam aparecer, sem acento, em qualquer ordem). */
export function buscar(lista: Alimento[], termo: string, limite = 40): Alimento[] {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];
  const pontos = (a: Alimento) => {
    const n = normalizar(a.nome);
    if (!palavras.every((w) => n.includes(w))) return -1;
    let s = 0;
    if (n.startsWith(palavras[0])) s += 10;
    if (palavras.length > 1 && n.includes(palavras.join(' '))) s += 4;
    const primeira = n.split(' ')[0];
    if (primeira === palavras[0]) s += 5;
    s -= n.length / 20; // nomes mais curtos (mais genéricos) primeiro
    return s;
  };
  return lista.map((a) => [a, pontos(a)] as const).filter(([, s]) => s >= 0).sort((x, y) => y[1] - x[1]).slice(0, limite).map(([a]) => a);
}

/** Nutrientes de uma porção (em gramas). */
export function porcao(a: Pick<Alimento, 'kcal' | 'p' | 'c' | 'g' | 'fibra'>, gramas: number): Totais {
  const f = gramas / 100;
  const r = (x: number) => Math.round(x * f * 10) / 10;
  return { kcal: Math.round(a.kcal * f), p: r(a.p), c: r(a.c), g: r(a.g), fibra: r(a.fibra) };
}

export function somar(itens: Totais[]): Totais {
  const t = itens.reduce((s, i) => ({ kcal: s.kcal + i.kcal, p: s.p + i.p, c: s.c + i.c, g: s.g + i.g, fibra: s.fibra + i.fibra }), { ...ZERO });
  const r = (x: number) => Math.round(x * 10) / 10;
  return { kcal: Math.round(t.kcal), p: r(t.p), c: r(t.c), g: r(t.g), fibra: r(t.fibra) };
}

// ---------------------------------------------------------------- diário
export async function lancar(data: string, refeicao: RefeicaoId, a: Alimento, gramas: number, medida: { nome: string; qtd: number }) {
  const reg: RegistroAlimento = {
    id: novoId(), data, refeicao, alimentoId: a.id, nome: a.nome, gramas, medida: medida.nome, qtd: medida.qtd,
    ...porcao(a, gramas), por100: { kcal: a.kcal, p: a.p, c: a.c, g: a.g, fibra: a.fibra }, ts: Date.now(),
  };
  await db.diario.put(reg);
  return reg;
}

export async function alterarQuantidade(r: RegistroAlimento, gramas: number, medida: { nome: string; qtd: number }) {
  await db.diario.put({ ...r, gramas, medida: medida.nome, qtd: medida.qtd, ...porcao(r.por100, gramas) });
}

export async function moverRefeicao(r: RegistroAlimento, refeicao: RefeicaoId) {
  await db.diario.put({ ...r, refeicao });
}

export const apagarLancamento = (id: string) => db.diario.delete(id);

/** Alimentos lançados recentemente (sem repetir), para atalho na busca. */
export async function recentes(limite = 12): Promise<RegistroAlimento[]> {
  const todos = await db.diario.orderBy('ts').reverse().limit(200).toArray();
  const vistos = new Set<string>();
  return todos.filter((r) => (vistos.has(r.alimentoId) ? false : (vistos.add(r.alimentoId), true))).slice(0, limite);
}

// ---------------------------------------------------------------- água
export async function somarAgua(data: string, ml: number) {
  const atual = (await db.agua.get(data))?.ml ?? 0;
  await db.agua.put({ data, ml: Math.max(0, atual + ml) });
}

// ---------------------------------------------------------------- metas
export interface DadosCorpo { sexo: 'm' | 'f'; idade: number; alturaCm: number; pesoKg: number; atividade: Atividade; objetivo: Objetivo }
export type Atividade = 'sedentario' | 'leve' | 'moderado' | 'intenso';
export type Objetivo = 'perder' | 'manter' | 'ganhar';
export interface MetasDieta { kcal: number; p: number; c: number; g: number; aguaMl: number; corpo?: DadosCorpo; manual?: boolean }

export const ATIVIDADES: { id: Atividade; nome: string; desc: string; fator: number }[] = [
  { id: 'sedentario', nome: 'Pouca', desc: 'trabalho sentado, sem treino', fator: 1.2 },
  { id: 'leve', nome: 'Leve', desc: 'treina 1–3× por semana', fator: 1.375 },
  { id: 'moderado', nome: 'Moderada', desc: 'treina 4–5× por semana', fator: 1.55 },
  { id: 'intenso', nome: 'Alta', desc: 'treina 6–7× ou trabalho físico', fator: 1.725 },
];
export const OBJETIVOS: { id: Objetivo; nome: string; desc: string }[] = [
  { id: 'perder', nome: 'Perder gordura', desc: 'déficit moderado' },
  { id: 'manter', nome: 'Manter', desc: 'manutenção do peso' },
  { id: 'ganhar', nome: 'Ganhar massa', desc: 'superávit leve' },
];

/** Gasto basal (Mifflin-St Jeor). */
export const basal = (d: DadosCorpo) => 10 * d.pesoKg + 6.25 * d.alturaCm - 5 * d.idade + (d.sexo === 'm' ? 5 : -161);

/**
 * Metas sugeridas: gasto total × objetivo (−20% até −500 kcal / +10%),
 * proteína por kg (perder 2,0 · manter 1,6 · ganhar 1,8), gordura 25% das calorias, carboidrato o restante,
 * água 35 ml/kg. Nunca abaixo do gasto basal.
 */
export function calcularMetas(d: DadosCorpo): MetasDieta {
  const gasto = basal(d) * (ATIVIDADES.find((a) => a.id === d.atividade)?.fator ?? 1.2);
  let kcal = d.objetivo === 'perder' ? gasto - Math.min(500, gasto * 0.2) : d.objetivo === 'ganhar' ? gasto * 1.1 : gasto;
  kcal = Math.max(kcal, basal(d));
  kcal = Math.round(kcal / 10) * 10;
  const p = Math.round(d.pesoKg * (d.objetivo === 'perder' ? 2 : d.objetivo === 'ganhar' ? 1.8 : 1.6));
  const g = Math.round((kcal * 0.25) / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4));
  return { kcal, p, c, g, aguaMl: Math.round((d.pesoKg * 35) / 50) * 50, corpo: d };
}

export async function lerMetas(): Promise<MetasDieta | undefined> {
  return (await db.ajustes.get('metasDieta'))?.valor as MetasDieta | undefined;
}
export async function salvarMetas(m: MetasDieta) {
  await db.ajustes.put({ chave: 'metasDieta', valor: m });
}
