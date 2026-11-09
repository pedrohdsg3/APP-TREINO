// Perfis ("players"): cada um com nome, emoji, plano e banco de dados próprios.
// A lista fica no localStorage (é pequena e precisa estar disponível antes de abrir o banco).
import { abrirBanco } from '../db';
import { PLANOS, type DefinicaoPlano } from '../data/planos';
import { usarPlano } from '../engine/plano';

export interface Perfil {
  id: string;
  nome: string;
  emoji: string;
  plano: DefinicaoPlano['id'];
  banco: string;
  criado: string;
}

const CHAVE = 'treino.perfis';
const PEDRO: Perfil = { id: 'pedro', nome: 'Pedro', emoji: '💪', plano: 'pedro', banco: 'app-treino', criado: '2026-11-09' };

export function listarPerfis(): Perfil[] {
  try {
    const l = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Perfil[] | null;
    if (Array.isArray(l) && l.length) return l;
  } catch { /* sem storage */ }
  return [PEDRO];
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

export function novoPerfil(dados: { nome: string; emoji: string; plano: Perfil['plano'] }): Perfil {
  const id = `${dados.nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 12) || 'perfil'}-${Date.now().toString(36)}`;
  const p: Perfil = { ...dados, id, banco: `app-treino-${id}`, criado: new Date().toISOString().slice(0, 10) };
  salvarPerfis([...listarPerfis(), p]);
  return p;
}

export function atualizarPerfil(p: Perfil) {
  salvarPerfis(listarPerfis().map((x) => (x.id === p.id ? p : x)));
  if (atual.id === p.id) atual = p;
}

export const EMOJIS_PERFIL = ['💪', '🏋️‍♀️', '🏃‍♀️', '🌸', '🦋', '⚡', '🔥', '🌟', '🍑', '🧘‍♀️', '🏃', '🦁'];
