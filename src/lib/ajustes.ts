// Configurações persistidas no IndexedDB (tabela "ajustes").
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { INICIO_PADRAO, type ConfigPrograma } from '../engine/plano';
import { INICIO_CASAL, perfilAtual } from './perfis';

/** Configuração padrão do perfil ativo (cada perfil pode ter a sua data de início). */
export const configPadrao = (): ConfigPrograma => ({ inicio: perfilAtual().inicio ?? INICIO_PADRAO, repetidas: [] });

export async function lerConfigPrograma(): Promise<ConfigPrograma> {
  const r = await db.ajustes.get('programa');
  const c = { ...configPadrao(), ...(r?.valor as Partial<ConfigPrograma> | undefined) };
  // 16/11/2026: Pedro e Yana recomeçam juntos hoje. O calendário antigo (09/11) é zerado
  // (semanas repetidas, trocas, treinos perdidos resolvidos); exercícios personalizados e cargas ficam.
  if (perfilAtual().personagem && c.inicio < INICIO_CASAL) {
    const valor: ConfigPrograma = { inicio: INICIO_CASAL, repetidas: [], personalizacao: c.personalizacao, cargasIniciais: c.cargasIniciais };
    // gravação fora da consulta "ao vivo" (que é só leitura)
    setTimeout(() => { void db.ajustes.put({ chave: 'programa', valor }); }, 0);
    return valor;
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
