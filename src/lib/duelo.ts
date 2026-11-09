// Carrega os participantes do duelo: perfis deste aparelho + placares colados de outros celulares.
import { comBanco } from '../db';
import type { Participante } from '../engine/duelo';
import { listarPerfis, type Perfil } from './perfis';

const EXTERNOS = 'treino.duelo.externos';

export async function participanteDoPerfil(p: Perfil): Promise<Participante> {
  return comBanco(p.banco, async (b) => {
    const sessoes = await b.sessoes.toArray();
    const cfg = (await b.ajustes.get('programa'))?.valor as { inicio?: string } | undefined;
    const ok = sessoes.filter((s) => s.status === 'feito' || s.status === 'parcial');
    return {
      id: p.id, nome: p.nome, emoji: p.emoji, personagem: p.personagem, plano: p.plano,
      inicio: cfg?.inicio ?? p.inicio ?? '2026-11-09',
      feitos: [...new Set(ok.filter((s) => s.tipo !== 'cardio').map((s) => s.data))].sort(),
      cardios: [...new Set(ok.filter((s) => s.tipo === 'cardio').map((s) => s.data))].sort(),
    };
  });
}

export function lerExternos(): Participante[] {
  try { return JSON.parse(localStorage.getItem(EXTERNOS) ?? '[]'); } catch { return []; }
}
export function salvarExterno(p: Participante) {
  const l = lerExternos().filter((x) => x.id !== p.id);
  try { localStorage.setItem(EXTERNOS, JSON.stringify([...l, p])); } catch { /* ignora */ }
}
export function removerExterno(id: string) {
  try { localStorage.setItem(EXTERNOS, JSON.stringify(lerExternos().filter((x) => x.id !== id))); } catch { /* ignora */ }
}

/**
 * Todos os participantes. Se um placar externo tiver o mesmo nome de um perfil local SEM treinos
 * (ex.: o perfil "Yana" vazio no celular do Pedro), o externo substitui o local.
 */
export async function carregarParticipantes(): Promise<Participante[]> {
  const locais = await Promise.all(listarPerfis().map(participanteDoPerfil));
  const externos = lerExternos();
  const out = locais.map((l) => {
    const ext = externos.find((e) => e.nome.toLowerCase() === l.nome.toLowerCase());
    return ext && l.feitos.length === 0 ? ext : l;
  });
  for (const e of externos) if (!out.some((o) => o.id === e.id || o.nome.toLowerCase() === e.nome.toLowerCase())) out.push(e);
  return out;
}
