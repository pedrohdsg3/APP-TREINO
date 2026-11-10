// Carrega os participantes do duelo: perfis deste aparelho + placares colados de outros celulares.
import { comBanco } from '../db';
import { mesclar, type Participante } from '../engine/duelo';
import { listarPerfis, perfilAtual, type Perfil } from './perfis';
import { publicar } from './nuvem';

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

/** Participantes locais + placares colados (os online chegam pela escuta da sala). */
export async function carregarParticipantes(online: Participante[] = [], meuUid?: string): Promise<Participante[]> {
  // com conta, só o próprio perfil entra daqui (os outros chegam pela sala online)
  const locais = await Promise.all((perfilAtual().uid ? [perfilAtual()] : listarPerfis()).map(participanteDoPerfil));
  return mesclar(locais, [...online, ...lerExternos()], meuUid, perfilAtual().id);
}

/** Publica o placar do perfil ativo no duelo online (se houver sala). */
export async function publicarAtual(): Promise<boolean> {
  return publicar(await participanteDoPerfil(perfilAtual()));
}
