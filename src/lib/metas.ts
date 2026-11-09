// Metas definidas pelo usuário (tabela "ajustes" do IndexedDB).
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { MetaPessoal } from '../engine/evolucao';

export interface Metas { pesoAlvo?: number; pessoais: MetaPessoal[] }

export async function lerMetas(): Promise<Metas> {
  const r = await db.ajustes.get('metas');
  return { pessoais: [], ...(r?.valor as Partial<Metas> | undefined) };
}
export async function salvarMetas(f: (m: Metas) => Metas) {
  const atual = await lerMetas();
  await db.ajustes.put({ chave: 'metas', valor: f(atual) });
}
export function useMetas(): Metas | undefined {
  return useLiveQuery(lerMetas, []);
}
