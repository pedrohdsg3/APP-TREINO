// Plano alimentar (ex.: o do nutricionista) + alimentos próprios (produtos de marca, receitas).
// Tudo fica na tabela "ajustes" do perfil, então sincroniza pela conta como o resto.
import { db, type RegistroAlimento } from '../db';
import type { Medida } from '../data/medidas';
import { novoId } from './historico';
import { carregarBase, plural, porcao, somar, type Alimento, type RefeicaoId, type Totais } from './dieta';
import type { EspItem } from '../data/planoPedro';

type Por100 = RegistroAlimento['por100'];

// ---------------------------------------------------------------- alimentos próprios
export interface AlimentoProprio {
  id: string; // "meu:..."
  nome: string;
  /** porção do rótulo (ex.: 1 medidor = 30 g) */
  porcaoNome: string;
  porcaoG: number;
  por100: Por100;
}

export async function lerProprios(): Promise<AlimentoProprio[]> {
  return ((await db.ajustes.get('alimentosProprios'))?.valor as AlimentoProprio[] | undefined) ?? [];
}
export async function salvarProprio(a: AlimentoProprio) {
  const l = await lerProprios();
  await db.ajustes.put({ chave: 'alimentosProprios', valor: [...l.filter((x) => x.id !== a.id), a] });
}
export async function apagarProprio(id: string) {
  await db.ajustes.put({ chave: 'alimentosProprios', valor: (await lerProprios()).filter((x) => x.id !== id) });
}

/** Valores do rótulo (por porção) → por 100 g. */
export function porcaoParaPor100(porcaoG: number, v: { kcal: number; p: number; c: number; g: number; fibra?: number }): Por100 {
  const f = 100 / Math.max(1, porcaoG);
  const r = (x: number) => Math.round(x * f * 10) / 10;
  return { kcal: Math.round(v.kcal * f), p: r(v.p), c: r(v.c), g: r(v.g), fibra: r(v.fibra ?? 0) };
}

export const proprioParaAlimento = (a: AlimentoProprio): Alimento => ({
  id: a.id, nome: a.nome, grupo: 'Meus alimentos', ...a.por100, sodio: 0, fonte: 'Meu',
  medidas: [{ nome: a.porcaoNome, g: a.porcaoG }],
});

/** Base completa: TACO + IBGE + alimentos próprios do perfil. */
export async function todosAlimentos(): Promise<Alimento[]> {
  const [base, meus] = await Promise.all([carregarBase(), lerProprios()]);
  return [...meus.map(proprioParaAlimento), ...base];
}

// ---------------------------------------------------------------- plano
/** Um alimento numa quantidade (no plano ou como substituto). */
export interface Porcao {
  alimentoId: string;
  nome: string;
  gramas: number;
  /** medida caseira para exibir (ex.: "fatia") e quantas; "gramas" = só gramas */
  medida: string;
  qtd: number;
  por100: Por100;
  obs?: string;
}
export interface ItemPlano extends Porcao {
  /** opções de substituição deste alimento */
  subs?: Porcao[];
}
export interface OpcaoRefeicao { id: string; nome: string; itens: ItemPlano[]; obs?: string }
export interface RefeicaoPlano { refeicao: RefeicaoId; opcoes: OpcaoRefeicao[] }
export interface PlanoAlimentar { nome: string; atualizadoEm: string; refeicoes: RefeicaoPlano[] }

export async function lerPlano(): Promise<PlanoAlimentar | undefined> {
  return (await db.ajustes.get('planoAlimentar'))?.valor as PlanoAlimentar | undefined;
}
export async function salvarPlano(p: PlanoAlimentar) {
  await db.ajustes.put({ chave: 'planoAlimentar', valor: { ...p, atualizadoEm: new Date().toISOString() } });
}

export const totaisPorcao = (x: Pick<Porcao, 'gramas' | 'por100'>): Totais => porcao(x.por100, x.gramas);
export const totaisOpcao = (o: OpcaoRefeicao, trocas: Record<number, number> = {}): Totais =>
  somar(o.itens.map((it, k) => totaisPorcao(escolhido(it, trocas[k]))));
/** O alimento efetivo de um item (o original ou o substituto escolhido). */
export const escolhido = (it: ItemPlano, sub?: number): Porcao => (sub !== undefined && it.subs?.[sub] ? it.subs[sub] : it);

export function textoPorcao(x: Pick<Porcao, 'medida' | 'qtd' | 'gramas'>) {
  const g = `${Math.round(x.gramas).toLocaleString('pt-BR')} g`;
  if (x.medida === 'gramas') return g;
  const q = x.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${q} ${plural(x.medida, x.qtd)} · ${g}`;
}

// ---------------------------------------------------------------- o que foi seguido em cada dia
export type StatusRefeicao = 'segui' | 'parcial' | 'nao';
export interface DiaPlano { [refeicao: string]: { status: StatusRefeicao; opcaoId?: string } }

const chaveDia = (data: string) => `planoDia:${data}`;
export async function lerDiaPlano(data: string): Promise<DiaPlano> {
  return ((await db.ajustes.get(chaveDia(data)))?.valor as DiaPlano | undefined) ?? {};
}
async function marcarDia(data: string, refeicao: RefeicaoId, v: DiaPlano[string] | null) {
  const d = { ...(await lerDiaPlano(data)) };
  if (v) d[refeicao] = v; else delete d[refeicao];
  await db.ajustes.put({ chave: chaveDia(data), valor: d });
}

/** Lança no diário os alimentos (do plano, com as trocas, ou ajustados) e marca a refeição. */
export async function lancarPorcoes(data: string, refeicao: RefeicaoId, porcoes: Porcao[], marca: { status: StatusRefeicao; opcaoId?: string }) {
  const ts = Date.now();
  await db.transaction('rw', db.diario, db.ajustes, async () => {
    for (const [k, x] of porcoes.entries()) {
      const reg: RegistroAlimento = {
        id: novoId(), data, refeicao, alimentoId: x.alimentoId, nome: x.nome, gramas: x.gramas, medida: x.medida, qtd: x.qtd,
        ...totaisPorcao(x), por100: x.por100, ts: ts + k, plano: `${refeicao}:${marca.opcaoId ?? ''}`,
      };
      await db.diario.put(reg);
    }
    await marcarDia(data, refeicao, marca);
  });
}

export async function marcarNaoSegui(data: string, refeicao: RefeicaoId) {
  await marcarDia(data, refeicao, { status: 'nao' });
}

/** Desfaz: tira do diário o que foi lançado pelo plano nessa refeição e limpa a marca. */
export async function desfazerRefeicao(data: string, refeicao: RefeicaoId) {
  await db.transaction('rw', db.diario, db.ajustes, async () => {
    const ids = (await db.diario.where('data').equals(data).toArray()).filter((r) => r.refeicao === refeicao && r.plano?.startsWith(`${refeicao}:`)).map((r) => r.id);
    await db.diario.bulkDelete(ids);
    await marcarDia(data, refeicao, null);
  });
}

/** Porção a partir de um alimento da base e de uma medida. */
export function porcaoDe(a: Alimento, medida: Medida, qtd: number, obs?: string): Porcao {
  return {
    alimentoId: a.id, nome: a.nome, gramas: Math.round(medida.g * qtd), medida: medida.g === 1 ? 'gramas' : medida.nome, qtd: medida.g === 1 ? Math.round(medida.g * qtd) : qtd,
    por100: { kcal: a.kcal, p: a.p, c: a.c, g: a.g, fibra: a.fibra }, obs,
  };
}

// ---------------------------------------------------------------- plano pronto do Pedro

/** Monta o plano a partir da especificação (ids + gramas), buscando os valores nas bases. */
export async function montarPlanoDeEsp(nome: string, esp: { refeicao: string; opcoes: { id: string; nome: string; itens: EspItem[]; obs?: string }[] }[], extras: AlimentoProprio[] = []): Promise<PlanoAlimentar> {
  const todos = [...extras.map(proprioParaAlimento), ...(await todosAlimentos())];
  const mapa = new Map(todos.map((a) => [a.id, a]));
  const porc = ([id, gramas, medida, qtd, obs]: [string, number, string, number, string?]): Porcao => {
    const a = mapa.get(id);
    if (!a) throw new Error(`Alimento não encontrado: ${id}`);
    return { alimentoId: id, nome: a.nome, gramas, medida, qtd, por100: { kcal: a.kcal, p: a.p, c: a.c, g: a.g, fibra: a.fibra }, obs };
  };
  return {
    nome, atualizadoEm: new Date().toISOString(),
    refeicoes: esp.map((r) => ({
      refeicao: r.refeicao as RefeicaoId,
      opcoes: r.opcoes.map((o) => ({ id: o.id, nome: o.nome, obs: o.obs, itens: o.itens.map((it) => ({ ...porc(it.a), subs: it.subs?.map(porc) })) })),
    })),
  };
}

/**
 * Pedro (16/11/2026): cadastra uma vez a dieta de ~2.250 kcal com as trocas, os alimentos de marca
 * e as metas (2.250 kcal · P 185 · C 225 · G 65 · água 3,5 L). Não mexe se já existir um plano.
 */
export async function semearPlanoPedro(): Promise<boolean> {
  if ((await lerPlano()) || (await db.ajustes.get('semeado:planoPedro'))) return false;
  const { PLANO_PEDRO, PROPRIOS_PEDRO } = await import('../data/planoPedro');
  const meus = await lerProprios();
  const novos = PROPRIOS_PEDRO.filter((p) => !meus.some((m) => m.id === p.id));
  const plano = await montarPlanoDeEsp('Déficit · ~2.250 kcal (base: dieta do nutricionista)', PLANO_PEDRO, novos);
  await db.transaction('rw', db.ajustes, async () => {
    if (novos.length) await db.ajustes.put({ chave: 'alimentosProprios', valor: [...meus, ...novos] });
    await db.ajustes.put({ chave: 'planoAlimentar', valor: plano });
    await db.ajustes.put({
      chave: 'metasDieta',
      valor: { kcal: 2250, p: 185, c: 225, g: 65, aguaMl: 3500, manual: true, corpo: { sexo: 'm', idade: 21, alturaCm: 177, pesoKg: 100, atividade: 'moderado', objetivo: 'perder' } },
    });
    await db.ajustes.put({ chave: 'semeado:planoPedro', valor: new Date().toISOString() });
  });
  return true;
}
