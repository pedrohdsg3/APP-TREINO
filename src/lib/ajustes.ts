// Configurações persistidas no IndexedDB (tabela "ajustes").
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { INICIO_PADRAO, type ConfigPrograma } from '../engine/plano';
import { perfilAtual } from './perfis';

/** Configuração padrão do perfil ativo (cada perfil pode ter a sua data de início). */
export const configPadrao = (): ConfigPrograma => ({ inicio: perfilAtual().inicio ?? INICIO_PADRAO, repetidas: [] });

export async function lerConfigPrograma(): Promise<ConfigPrograma> {
  const r = await db.ajustes.get('programa');
  const c = { ...configPadrao(), ...(r?.valor as Partial<ConfigPrograma> | undefined) };
  // migração: a data padrão antiga da Yana (16/11) passa para 09/11, junto com o Pedro
  if (perfilAtual().id === 'yana' && c.inicio === '2026-11-16' && !c.repetidas.length) {
    c.inicio = '2026-11-09';
    // gravação fora da consulta "ao vivo" (que é só leitura)
    const valor = { ...c };
    setTimeout(() => { void db.ajustes.put({ chave: 'programa', valor }); }, 0);
  }
  return c;
}

export async function salvarConfigPrograma(c: ConfigPrograma) {
  await db.ajustes.put({ chave: 'programa', valor: c });
}

/** undefined enquanto carrega */
export function useConfigPrograma(): ConfigPrograma | undefined {
  return useLiveQuery(lerConfigPrograma, []);
}
