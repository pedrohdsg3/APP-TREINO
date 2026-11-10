// Duelo: quem comparece mais aos treinos. Compara a PRESENÇA (treinos feitos ÷ planejados),
// que é justa mesmo com planos diferentes (Pedro 7/semana, Yana 6/semana) e datas de início diferentes.
import { PLANOS, type DefinicaoPlano } from '../data/planos';
import { deIso, somarDias } from '../lib/datas';

export interface Participante {
  id: string;
  nome: string;
  emoji: string;
  personagem?: 'pedro' | 'yana';
  plano: DefinicaoPlano['id'];
  inicio: string;
  /** dias com treino feito (sem contar cardio leve) */
  feitos: string[];
  /** dias com cardio leve */
  cardios: string[];
  /** veio de outro celular (código de placar ou nuvem) */
  externo?: boolean;
  /** sincronizado pelo duelo online */
  online?: boolean;
  uid?: string;
  atualizadoEm?: string;
}

/**
 * Junta os participantes: locais deste aparelho + placares de fora (online ou colados).
 * - O meu próprio placar online (meuUid) é ignorado: o local já é a fonte.
 * - Um placar de fora com o mesmo nome de um perfil local SEM treinos substitui o local
 *   (ex.: o perfil "Yana" vazio no celular do Pedro). Online tem prioridade sobre colado.
 */
/**
 * meuPerfilId: perfil ativo neste aparelho (o "dono"). Para os OUTROS perfis locais, um placar
 * ONLINE com o mesmo nome sempre vence (é a fonte real do celular da outra pessoa).
 */
export function mesclar(locais: Participante[], deFora: Participante[], meuUid?: string, meuPerfilId?: string): Participante[] {
  const fora = deFora
    .filter((p) => !(p.online && p.uid === meuUid))
    .sort((a, b) => Number(!!b.online) - Number(!!a.online)); // online primeiro
  const mesmo = (a: Participante, b: Participante) => a.nome.trim().toLowerCase() === b.nome.trim().toLowerCase();
  const usados = new Set<Participante>();
  const out = locais.map((l) => {
    const f = fora.find((x) => !usados.has(x) && mesmo(x, l));
    if (!f) return l;
    usados.add(f);
    if (l.id === meuPerfilId) return l; // eu mesmo: o local é a verdade
    if (f.online) return f; // outra pessoa: o placar online é a verdade
    return l.feitos.length === 0 && l.cardios.length === 0 ? f : l;
  });
  for (const f of fora) if (!usados.has(f) && !out.some((o) => mesmo(o, f))) { out.push(f); usados.add(f); }
  return out;
}

const diaIdx = (iso: string) => (deIso(iso).getDay() + 6) % 7; // 0 = segunda
export const segundaDa = (iso: string) => somarDias(iso, -diaIdx(iso));

function planejado(p: Participante, data: string): boolean {
  const d = (PLANOS[p.plano] ?? PLANOS.pedro).semana[diaIdx(data)];
  return !d.descanso && !!(d.musculacao || d.corrida);
}

export interface Stats { planejados: number; feitos: number; presenca: number | null; cardios: number }

export function estatisticas(p: Participante, de: string, ate: string): Stats {
  const ini = de > p.inicio ? de : p.inicio;
  let planejados = 0;
  for (let d = ini; d <= ate; d = somarDias(d, 1)) if (planejado(p, d)) planejados++;
  const feitos = new Set(p.feitos.filter((d) => d >= ini && d <= ate)).size;
  const cardios = new Set(p.cardios.filter((d) => d >= ini && d <= ate)).size;
  return { planejados, feitos, cardios, presenca: planejados ? Math.min(1, feitos / planejados) : null };
}

/** Sequência atual de treinos planejados cumpridos (descanso não quebra; hoje ainda não feito não quebra). */
export function sequenciaAtual(p: Participante, hoje: string): number {
  const feitos = new Set(p.feitos);
  let n = 0;
  let d = feitos.has(hoje) ? hoje : somarDias(hoje, -1);
  for (let i = 0; i < 200 && d >= p.inicio; i++, d = somarDias(d, -1)) {
    if (feitos.has(d)) n++;
    else if (planejado(p, d)) break;
  }
  return n;
}

export interface SemanaDuelo { inicio: string; a: number | null; b: number | null; vencedor: 'a' | 'b' | 'empate' | null; emAndamento: boolean }

/** Semana a semana (segunda a domingo), desde que os dois começaram. */
export function placarSemanas(a: Participante, b: Participante, hoje: string) {
  const comeco = segundaDa(a.inicio > b.inicio ? a.inicio : b.inicio);
  const semanas: SemanaDuelo[] = [];
  for (let s = comeco; s <= hoje; s = somarDias(s, 7)) {
    const fim = somarDias(s, 6);
    const ate = fim < hoje ? fim : hoje;
    const pa = estatisticas(a, s, ate).presenca, pb = estatisticas(b, s, ate).presenca;
    const emAndamento = fim >= hoje;
    const vencedor = pa === null || pb === null ? null : Math.abs(pa - pb) < 1e-9 ? 'empate' : pa > pb ? 'a' : 'b';
    semanas.push({ inicio: s, a: pa, b: pb, vencedor, emAndamento });
  }
  const fechadas = semanas.filter((s) => !s.emAndamento);
  return {
    semanas,
    a: fechadas.filter((s) => s.vencedor === 'a').length,
    b: fechadas.filter((s) => s.vencedor === 'b').length,
    empates: fechadas.filter((s) => s.vencedor === 'empate').length,
  };
}

/** Quem lidera no período: maior presença; empate decide por mais treinos feitos. */
export function lider(sa: Stats, sb: Stats): 'a' | 'b' | 'empate' | null {
  if (sa.presenca === null && sb.presenca === null) return null;
  const pa = sa.presenca ?? -1, pb = sb.presenca ?? -1;
  if (Math.abs(pa - pb) > 1e-9) return pa > pb ? 'a' : 'b';
  if (sa.feitos !== sb.feitos) return sa.feitos > sb.feitos ? 'a' : 'b';
  return 'empate';
}

// ---------------------------------------------------------------- placar entre celulares
const PREFIXO = 'TREINO-PLACAR:';

export function codificar(p: Participante): string {
  const dados = { v: 1, n: p.nome, e: p.emoji, c: p.personagem, p: p.plano, i: p.inicio, f: p.feitos, k: p.cardios, t: new Date().toISOString() };
  const bin = new TextEncoder().encode(JSON.stringify(dados));
  let s = '';
  bin.forEach((x) => { s += String.fromCharCode(x); });
  return PREFIXO + btoa(s);
}

export function decodificar(texto: string): Participante {
  const i = texto.indexOf(PREFIXO);
  if (i < 0) throw new Error('Código de placar não encontrado no texto colado.');
  const b64 = texto.slice(i + PREFIXO.length).trim().split(/\s/)[0];
  let d: { v: number; n: string; e: string; c?: 'pedro' | 'yana'; p: DefinicaoPlano['id']; i: string; f: string[]; k: string[]; t: string };
  try {
    const bin = atob(b64);
    d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
  } catch { throw new Error('Código de placar inválido ou incompleto.'); }
  if (d.v !== 1 || !d.n || !Array.isArray(d.f)) throw new Error('Código de placar inválido.');
  return { id: `ext-${d.n.toLowerCase()}`, nome: d.n, emoji: d.e || '🏃', personagem: d.c, plano: d.p in PLANOS ? d.p : 'pedro', inicio: d.i, feitos: d.f, cardios: d.k ?? [], externo: true, atualizadoEm: d.t };
}
