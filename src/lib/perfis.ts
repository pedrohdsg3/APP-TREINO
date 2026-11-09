// Perfis ("players"): cada um com nome, emoji, plano e banco de dados próprios.
// A lista fica no localStorage (é pequena e precisa estar disponível antes de abrir o banco).
import { abrirBanco, apagarBanco } from '../db';
import { PLANOS, type DefinicaoPlano } from '../data/planos';
import { usarPlano } from '../engine/plano';

export interface Perfil {
  id: string;
  nome: string;
  emoji: string;
  plano: DefinicaoPlano['id'];
  banco: string;
  criado: string;
  /** data de início padrão do programa (segunda-feira) */
  inicio?: string;
  /** personagem ilustrado (senão usa o emoji) */
  personagem?: 'pedro' | 'yana';
}

const CHAVE = 'treino.perfis';
const PEDRO: Perfil = { id: 'pedro', nome: 'Pedro', emoji: '💪', plano: 'pedro', banco: 'app-treino', criado: '2026-11-09', inicio: '2026-11-09', personagem: 'pedro' };
const YANA: Perfil = { id: 'yana', nome: 'Yana', emoji: '🌸', plano: 'feminino', banco: 'app-treino-yana', criado: '2026-11-09', inicio: '2026-11-09', personagem: 'yana' };
/** Marca que o perfil da Yana já foi adicionado uma vez (se for excluído, não volta). */
const SEMEADO = 'treino.perfis.yana';

export function listarPerfis(): Perfil[] {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Perfil[] | null;
    let l = Array.isArray(salvos) && salvos.length ? salvos : [PEDRO];
    if (!localStorage.getItem(SEMEADO)) {
      if (!l.some((p) => p.id === YANA.id)) l = [...l, YANA];
      localStorage.setItem(SEMEADO, '1');
      salvarPerfis(l);
    }
    // perfis antigos ganham o personagem ilustrado
    l = l.map((p) => (p.personagem || !['pedro', 'yana'].includes(p.id) ? p : { ...p, personagem: p.id as 'pedro' | 'yana' }));
    // a Yana passou a começar junto com o Pedro (09/11/2026), não mais em 16/11
    if (l.some((p) => p.id === 'yana' && p.inicio === '2026-11-16')) {
      l = l.map((p) => (p.id === 'yana' && p.inicio === '2026-11-16' ? { ...p, inicio: '2026-11-09' } : p));
      salvarPerfis(l);
    }
    return l;
  } catch { /* sem storage */ }
  return [PEDRO, YANA];
}

export function salvarPerfis(l: Perfil[]) {
  try { localStorage.setItem(CHAVE, JSON.stringify(l)); } catch { /* ignora */ }
}

let atual: Perfil = listarPerfis()[0];
export const perfilAtual = () => atual;

/** Abre o banco e o plano do perfil. Chamar antes de renderizar as telas dele. */
export function ativarPerfil(p: Perfil) {
  atual = p;
  abrirBanco(p.banco);
  usarPlano(PLANOS[p.plano] ?? PLANOS.pedro);
}

/** Chave do localStorage específica do perfil (o Pedro mantém as chaves antigas). */
export function chaveLocal(base: string, p: Perfil = atual): string {
  return p.id === 'pedro' ? base : `${base}.${p.id}`;
}

/** Perfil que tem um treino/corrida em andamento (para retomar direto ao abrir). */
export function perfilComTreinoEmAndamento(): Perfil | undefined {
  try {
    return listarPerfis().find((p) => localStorage.getItem(chaveLocal('treino.ativo', p)) || localStorage.getItem(chaveLocal('treino.corrida', p)));
  } catch { return undefined; }
}

export function novoPerfil(dados: { nome: string; emoji: string; plano: Perfil['plano']; inicio?: string }): Perfil {
  const id = `${dados.nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 12) || 'perfil'}-${Date.now().toString(36)}`;
  const p: Perfil = { ...dados, id, banco: `app-treino-${id}`, criado: new Date().toISOString().slice(0, 10) };
  salvarPerfis([...listarPerfis(), p]);
  return p;
}

export function atualizarPerfil(p: Perfil) {
  salvarPerfis(listarPerfis().map((x) => (x.id === p.id ? p : x)));
  if (atual.id === p.id) atual = p;
}

/** Exclui o perfil e todos os dados dele neste aparelho. */
export async function excluirPerfil(p: Perfil) {
  const resto = listarPerfis().filter((x) => x.id !== p.id);
  if (!resto.length) throw new Error('É preciso manter ao menos um perfil.');
  salvarPerfis(resto);
  try {
    localStorage.removeItem(chaveLocal('treino.ativo', p));
    localStorage.removeItem(chaveLocal('treino.corrida', p));
  } catch { /* ignora */ }
  if (atual.id === p.id) ativarPerfil(resto[0]);
  await apagarBanco(p.banco);
}

export const EMOJIS_PERFIL = ['💪', '🏋️‍♀️', '🏃‍♀️', '🌸', '🦋', '⚡', '🔥', '🌟', '🍑', '🧘‍♀️', '🏃', '🦁'];
