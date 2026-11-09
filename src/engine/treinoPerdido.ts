// Treino perdido: detecta faltas e recomenda o que fazer (regras do prompt, seção 4.7).
// 1. Nunca acumular dois treinos de musculação no mesmo dia.
// 2. Faltou musculação e hoje é corrida/descanso → fazer a musculação hoje e empurrar a corrida para amanhã
//    se couber; senão, pular a corrida.
// 3. Faltou corrida → não compensar; seguir para a próxima. 2 corridas seguidas perdidas → repetir a semana anterior de corrida.
// 4. 3+ dias seguidos parado → semana de retorno (volume da semana anterior, −1 série nos compostos; corrida no nível anterior).
// 5. Perdeu pernas e o próximo dia é intervalado → priorizar a recuperação, intervalado mais leve.
// 6. Pulados contam como "pulados", sem punição pesada; o programa segue.
import type { Sessao } from '../db';
import { EXERCICIOS } from '../data/musculacao';
import { dataPorExtenso, somarDias } from '../lib/datas';
import { planoDaData, posicao, type ConfigPrograma, type DiaPlanejado } from './plano';

export interface Perdido { data: string; plano: DiaPlanejado; tipo: 'musculacao' | 'corrida' }

/** Musculação "de verdade" (o abdômen do domingo não conta para a regra 1). */
const temMusculacao = (p: DiaPlanejado | null) => !!p?.musculacao && p.musculacao.id !== 'abdomen';
const ehPernas = (p: DiaPlanejado) => !!p.musculacao?.itens.some((i) => ['Quadríceps', 'Posterior', 'Glúteos'].includes(EXERCICIOS[i.exercicioId]?.grupo));

/** Dias planejados (sem descanso) dos últimos `janela` dias, antes de hoje, sem nenhum registro e não resolvidos. */
export function treinosPerdidos(cfg: ConfigPrograma, sessoes: Sessao[], hoje: string, janela = 7): Perdido[] {
  const comRegistro = new Set(sessoes.filter((s) => s.tipo !== 'cardio').map((s) => s.data));
  const out: Perdido[] = [];
  for (let i = janela; i >= 1; i--) {
    const data = somarDias(hoje, -i);
    if (posicao(cfg, data).estado !== 'durante') continue;
    const plano = planoDaData(cfg, data);
    if (!plano || plano.descanso || comRegistro.has(data) || cfg.resolvidos?.[data]) continue;
    if (!plano.musculacao && !plano.corrida) continue;
    out.push({ data, plano, tipo: plano.corrida ? 'corrida' : 'musculacao' });
  }
  return out;
}

/** Dias seguidos sem treinar até ontem (dias de descanso não contam nem quebram). */
export function diasParado(cfg: ConfigPrograma, sessoes: Sessao[], hoje: string): number {
  const feitos = new Set(sessoes.filter((s) => s.tipo !== 'cardio' && s.status !== 'pulado').map((s) => s.data));
  let n = 0;
  for (let i = 1; i <= 21; i++) {
    const d = somarDias(hoje, -i);
    if (posicao(cfg, d).estado !== 'durante') break;
    if (feitos.has(d)) break;
    if (planoDaData(cfg, d)?.descanso) continue;
    n++;
  }
  return n;
}

export type AcaoPerdido =
  | { tipo: 'fazer-hoje'; rotulo: string }
  | { tipo: 'reagendar'; rotulo: string; para: string }
  | { tipo: 'pular'; rotulo: string }
  | { tipo: 'retorno'; rotulo: string }
  | { tipo: 'recuar-corrida'; rotulo: string }
  | { tipo: 'ok'; rotulo: string };

export interface Recomendacao {
  perdidos: Perdido[];
  alvo: Perdido;
  titulo: string;
  texto: string;
  avisos: string[];
  acoes: AcaoPerdido[];
}

/** Próximo dia (até 6 à frente) sem musculação, para reagendar. */
function diaLivre(cfg: ConfigPrograma, hoje: string): string | undefined {
  for (let i = 1; i <= 6; i++) {
    const d = somarDias(hoje, i);
    const p = planoDaData(cfg, d);
    if (p && !temMusculacao(p) && !cfg.trocas?.[d]?.musculacao) return d;
  }
  return undefined;
}

const dia = (d: string) => dataPorExtenso(d).split(',')[0];

export function recomendar(cfg: ConfigPrograma, sessoes: Sessao[], hoje: string): Recomendacao | null {
  const perdidos = treinosPerdidos(cfg, sessoes, hoje);
  if (!perdidos.length) return null;
  const alvo = perdidos[perdidos.length - 1];
  const nomeAlvo = alvo.plano.titulo;
  const titulo = perdidos.length > 1
    ? `Você faltou a ${perdidos.length} treinos (o último foi ${dia(alvo.data)}). O que fazer?`
    : `Você faltou ao treino de ${dia(alvo.data)}. O que fazer?`;
  const pular: AcaoPerdido = { tipo: 'pular', rotulo: perdidos.length > 1 ? 'Marcar como pulados' : 'Pular' };

  // Regra 4: 3+ dias seguidos parado → semana de retorno
  const parado = diasParado(cfg, sessoes, hoje);
  if (parado >= 3 && !(cfg.retorno && hoje >= cfg.retorno.de && hoje <= cfg.retorno.ate)) {
    return {
      perdidos, alvo, titulo: `Você ficou ${parado} dias sem treinar. Bora voltar com calma?`,
      texto: 'Recomendado: semana de retorno. Nos próximos 7 dias a musculação usa a carga e o volume da semana anterior, com 1 série a menos nos compostos, e a corrida repete o nível anterior.',
      avisos: [], acoes: [{ tipo: 'retorno', rotulo: 'Aplicar semana de retorno' }, pular],
    };
  }

  const hojePlano = planoDaData(cfg, hoje);
  const amanha = somarDias(hoje, 1);
  const amanhaPlano = planoDaData(cfg, amanha);
  const avisos: string[] = [];

  if (alvo.tipo === 'musculacao') {
    // Regra 5
    if (ehPernas(alvo.plano) && amanhaPlano?.corrida?.tipo === 'intervalada') {
      avisos.push('Treino de pernas perto do intervalado: priorize a recuperação e faça o intervalado mais leve amanhã.');
    }
    // Regra 1: hoje já tem musculação → não acumula
    if (temMusculacao(hojePlano)) {
      const livre = diaLivre(cfg, hoje);
      return {
        perdidos, alvo, titulo,
        texto: `Hoje já tem ${hojePlano!.musculacao!.titulo}. Para não fazer dois treinos de musculação no mesmo dia, ${livre ? `reagende o ${nomeAlvo} para ${dia(livre)} ou pule.` : 'pule este e siga o plano.'}`,
        avisos,
        acoes: [...(livre ? [{ tipo: 'reagendar' as const, rotulo: `Reagendar para ${dia(livre)}`, para: livre }] : []), pular],
      };
    }
    // Regra 2: hoje é corrida/descanso → fazer hoje e empurrar a corrida
    const corridaHoje = hojePlano?.corrida && hojePlano.corrida.tipo !== 'cardio';
    const cabeAmanha = corridaHoje && !amanhaPlano?.corrida;
    const texto = !corridaHoje
      ? `Recomendado: fazer o ${nomeAlvo} hoje.`
      : cabeAmanha
        ? `Recomendado: fazer o ${nomeAlvo} hoje e passar a corrida de hoje para amanhã (${dia(amanha)}).`
        : `Recomendado: fazer o ${nomeAlvo} hoje e pular a corrida de hoje (amanhã já tem corrida).`;
    if (ehPernas(alvo.plano) && cabeAmanha && hojePlano?.corrida?.tipo === 'intervalada') {
      avisos.push('O intervalado vai para amanhã, logo depois das pernas: faça-o mais leve e priorize a recuperação.');
    }
    const livre = diaLivre(cfg, hoje);
    return {
      perdidos, alvo, titulo, texto, avisos: avisos.filter(Boolean),
      acoes: [{ tipo: 'fazer-hoje', rotulo: 'Fazer hoje' }, ...(livre ? [{ tipo: 'reagendar' as const, rotulo: `Reagendar para ${dia(livre)}`, para: livre }] : []), pular],
    };
  }

  // Regra 3: corrida perdida
  // corridas perdidas em sequência: voltando no tempo pelos dias de corrida, até achar uma feita
  const registrados = new Set(sessoes.filter((s) => s.tipo !== 'cardio').map((s) => s.data));
  let seguidas = 0;
  for (let i = 1; i <= 14; i++) {
    const d = somarDias(hoje, -i);
    if (posicao(cfg, d).estado !== 'durante') break;
    const pl = planoDaData(cfg, d);
    if (!pl?.corrida || pl.descanso || pl.corrida.tipo === 'cardio') continue;
    const perdida = perdidos.some((x) => x.data === d);
    if (!perdida) { if (registrados.has(d) || cfg.resolvidos?.[d] || i > 7) break; continue; }
    seguidas++;
  }
  if (seguidas >= 2) {
    return {
      perdidos, alvo, titulo,
      texto: 'Você perdeu 2 corridas seguidas. Sem compensar volume: o recomendado é repetir a semana anterior de corrida.',
      avisos, acoes: [{ tipo: 'recuar-corrida', rotulo: 'Repetir semana de corrida' }, pular],
    };
  }
  return {
    perdidos, alvo, titulo,
    texto: 'Sem compensar volume: siga direto para o próximo treino de corrida do plano. Ela fica marcada como pulada.',
    avisos, acoes: [{ tipo: 'ok', rotulo: 'Ok, seguir o plano' }],
  };
}

/** Aplica a ação escolhida: devolve a nova config e as sessões "puladas" a gravar. */
export function aplicarAcao(cfg: ConfigPrograma, rec: Recomendacao, acao: AcaoPerdido, hoje: string): { cfg: ConfigPrograma; pulados: Sessao[] } {
  const marcarPulados = (lista: Perdido[]): Sessao[] => lista.map((p) => ({
    id: `pulado-${p.data}`, data: p.data, tipo: p.tipo, status: 'pulado' as const, semana: p.plano.semana,
    treinoId: p.tipo === 'musculacao' ? p.plano.musculacao?.id : p.plano.corrida?.tipo,
  }));
  const resolver = (lista: Perdido[], como: 'reagendado' | 'retorno' | 'ignorado', c: ConfigPrograma): ConfigPrograma =>
    ({ ...c, resolvidos: { ...c.resolvidos, ...Object.fromEntries(lista.map((p) => [p.data, como])) } });
  const outros = rec.perdidos.filter((p) => p !== rec.alvo);
  const m = rec.alvo.plano.musculacao;

  switch (acao.tipo) {
    case 'pular':
    case 'ok':
      return { cfg, pulados: marcarPulados(rec.perdidos) };
    case 'retorno':
      return {
        cfg: resolver(rec.perdidos, 'retorno', { ...cfg, retorno: { de: hoje, ate: somarDias(hoje, 6) }, recuoCorrida: (cfg.recuoCorrida ?? 0) + 1 }),
        pulados: [],
      };
    case 'recuar-corrida':
      return { cfg: { ...cfg, recuoCorrida: (cfg.recuoCorrida ?? 0) + 1 }, pulados: marcarPulados(rec.perdidos) };
    case 'reagendar': {
      const trocas = { ...cfg.trocas, [acao.para]: { ...cfg.trocas?.[acao.para], musculacao: { treinoId: m!.id, semana: rec.alvo.plano.semana, origem: rec.alvo.data } } };
      return { cfg: resolver([rec.alvo], 'reagendado', { ...cfg, trocas }), pulados: marcarPulados(outros) };
    }
    case 'fazer-hoje': {
      const hojePlano = planoDaData(cfg, hoje);
      const amanha = somarDias(hoje, 1);
      const corridaHoje = hojePlano?.corrida && hojePlano.corrida.tipo !== 'cardio' && !hojePlano.descanso ? hojePlano : undefined;
      const cabeAmanha = !!corridaHoje && !planoDaData(cfg, amanha)?.corrida;
      const modeloCorrida = corridaHoje?.corrida?.tipo;
      const trocas = {
        ...cfg.trocas,
        [hoje]: { ...cfg.trocas?.[hoje], musculacao: { treinoId: m!.id, semana: rec.alvo.plano.semana, origem: rec.alvo.data }, semCorrida: !!corridaHoje },
        ...(cabeAmanha && modeloCorrida && modeloCorrida !== 'cardio'
          ? { [amanha]: { ...cfg.trocas?.[amanha], corridaExtra: { tipo: modeloCorrida, semana: corridaHoje!.semana, origem: hoje } } }
          : {}),
      };
      return { cfg: resolver([rec.alvo], 'reagendado', { ...cfg, trocas }), pulados: marcarPulados(outros) };
    }
  }
}
