// Configurações persistidas no IndexedDB (tabela "ajustes").
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { INICIO_PADRAO, type ConfigPrograma } from '../engine/plano';

export const CONFIG_PADRAO: ConfigPrograma = { inicio: INICIO_PADRAO, repetidas: [] };

export async function lerConfigPrograma(): Promise<ConfigPrograma> {
  const r = await db.ajustes.get('programa');
  return { ...CONFIG_PADRAO, ...(r?.valor as Partial<ConfigPrograma> | undefined) };
}

export async function salvarConfigPrograma(c: ConfigPrograma) {
  await db.ajustes.put({ chave: 'programa', valor: c });
}

/** undefined enquanto carrega */
export function useConfigPrograma(): ConfigPrograma | undefined {
  return useLiveQuery(lerConfigPrograma, []);
}
