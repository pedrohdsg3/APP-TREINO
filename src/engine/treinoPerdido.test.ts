import { describe, expect, it } from 'vitest';
import { aplicarAcao, diasParado, recomendar, treinosPerdidos } from './treinoPerdido';
import { planoDaData, type ConfigPrograma } from './plano';
import type { Sessao } from '../db';

// Pedro: seg peito, ter corrida base, qua costas, qui intervalado, sex ombro, sáb pernas, dom corrida leve + abdômen
const cfg: ConfigPrograma = { inicio: '2026-11-09', repetidas: [] };
const feito = (data: string, tipo: Sessao['tipo'] = 'musculacao'): Sessao => ({ id: data + tipo, data, tipo, status: 'feito' });

describe('treino perdido', () => {
  it('detecta faltas recentes, ignora dias com registro e antes do início', () => {
    const p = treinosPerdidos(cfg, [feito('2026-11-09')], '2026-11-11');
    expect(p.map((x) => x.data)).toEqual(['2026-11-10']);
    expect(p[0].tipo).toBe('corrida');
  });

  it('regra 2: faltou musculação, hoje é corrida → fazer hoje e corrida vai para amanhã', () => {
    // faltou segunda (peito); terça é corrida base; quarta é musculação (sem corrida) → cabe
    const r = recomendar(cfg, [], '2026-11-10')!;
    expect(r.alvo.tipo).toBe('musculacao');
    expect(r.acoes[0].tipo).toBe('fazer-hoje');
    expect(r.texto).toContain('passar a corrida de hoje para amanhã');
    const { cfg: novo } = aplicarAcao(cfg, r, r.acoes[0], '2026-11-10');
    const hoje = planoDaData(novo, '2026-11-10')!;
    expect(hoje.musculacao?.id).toBe('peito-triceps');
    expect(hoje.corrida).toBeUndefined();
    const amanha = planoDaData(novo, '2026-11-11')!;
    expect(amanha.musculacao?.id).toBe('costas-biceps');
    expect(amanha.corrida?.tipo).toBe('base');
    expect(treinosPerdidos(novo, [], '2026-11-10')).toHaveLength(0);
  });

  it('regra 1: faltou musculação e hoje já é musculação → nunca dois no mesmo dia (reagendar ou pular)', () => {
    // faltou quarta (costas) com terça feita; hoje é sexta? usamos quinta feita e hoje sexta (ombro)
    const ses = [feito('2026-11-09'), feito('2026-11-10', 'corrida'), feito('2026-11-12', 'corrida')];
    const r = recomendar(cfg, ses, '2026-11-13')!;
    expect(r.alvo.data).toBe('2026-11-11');
    expect(r.acoes.map((a) => a.tipo)).not.toContain('fazer-hoje');
    const reag = r.acoes.find((a) => a.tipo === 'reagendar')!;
    expect(reag).toMatchObject({ para: '2026-11-15' }); // domingo (corrida + abdômen) é o próximo dia sem musculação "de verdade"
    const { cfg: novo } = aplicarAcao(cfg, r, reag, '2026-11-13');
    expect(planoDaData(novo, '2026-11-15')!.musculacao?.id).toBe('costas-biceps');
  });

  it('regra 3: corrida perdida não compensa; 2 seguidas → repetir semana anterior de corrida', () => {
    const r1 = recomendar(cfg, [feito('2026-11-09'), feito('2026-11-11')], '2026-11-12')!;
    expect(r1.alvo.tipo).toBe('corrida');
    expect(r1.acoes[0].tipo).toBe('ok');
    expect(aplicarAcao(cfg, r1, r1.acoes[0], '2026-11-12').pulados[0]).toMatchObject({ data: '2026-11-10', status: 'pulado', tipo: 'corrida' });

    const ses = [feito('2026-11-16'), feito('2026-11-18'), feito('2026-11-20'), feito('2026-11-21')];
    const r2 = recomendar({ ...cfg, resolvidos: { '2026-11-15': 'ignorado' } }, ses, '2026-11-22')!;
    // perdeu terça e quinta (corridas) da semana 2
    expect(r2.acoes[0].tipo).toBe('recuar-corrida');
    expect(aplicarAcao(cfg, r2, r2.acoes[0], '2026-11-22').cfg.recuoCorrida).toBe(1);
  });

  it('regra 3: corridas perdidas com uma corrida feita no meio não contam como seguidas', () => {
    const ses = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'].map((d) => feito(d));
    const r = recomendar(cfg, ses, '2026-11-25')!; // perdeu quinta 19 e terça 24, mas domingo 22 foi feito
    expect(r.acoes[0].tipo).toBe('ok');
  });

  it('regra 4: 3+ dias parado → semana de retorno (−1 série nos compostos, corrida um nível abaixo)', () => {
    const ses = [feito('2026-11-16'), feito('2026-11-17', 'corrida')];
    expect(diasParado(cfg, ses, '2026-11-21')).toBe(3);
    const r = recomendar(cfg, ses, '2026-11-21')!;
    expect(r.acoes[0].tipo).toBe('retorno');
    const { cfg: novo } = aplicarAcao(cfg, r, r.acoes[0], '2026-11-21');
    expect(novo.retorno).toEqual({ de: '2026-11-21', ate: '2026-11-27' });
    const sabado = planoDaData(novo, '2026-11-21')!; // semana 2 → usa semana 1, −1 série no agachamento
    expect(sabado.musculacao!.itens[0]).toMatchObject({ exercicioId: 'agachamento', series: 3, cargaPct: 90 });
    expect(planoDaData(novo, '2026-11-24')!.corrida!.resumo).toBe("6 × (2' trote + 2' caminhada)"); // semana 3 → nível 1
    expect(recomendar(novo, ses, '2026-11-21')).toBeNull();
  });

  it('regra 5: perdeu pernas e o próximo dia é intervalado → aviso de recuperação', () => {
    // Plano do Pedro: pernas no sábado; usamos uma troca para simular pernas antes de uma quinta
    const c: ConfigPrograma = { ...cfg, trocas: { '2026-11-17': { musculacao: { treinoId: 'pernas', semana: 2, origem: 'x' }, semCorrida: true } } };
    const ses = [feito('2026-11-16')];
    const r = recomendar(c, ses, '2026-11-18')!; // perdeu as pernas da terça; hoje quarta (costas)
    expect(r.alvo.plano.musculacao?.id).toBe('pernas');
    expect(r.avisos.join(' ')).toContain('intervalado');
  });

  it('basquete no lugar da corrida cumpre o dia; como extra, a corrida continua pendente', () => {
    const base = [feito('2026-11-09')];
    const troca: Sessao = { id: 'b', data: '2026-11-10', tipo: 'atividade', status: 'feito', atividade: { modalidade: 'Basquete', intensidade: 'alta', substituiuCorrida: true } };
    expect(recomendar(cfg, [...base, troca], '2026-11-11')).toBeNull();
    const extra: Sessao = { ...troca, atividade: { ...troca.atividade!, substituiuCorrida: false } };
    expect(recomendar(cfg, [...base, extra], '2026-11-11')?.alvo.data).toBe('2026-11-10');
  });

  it('regra 6: pular marca como pulado e o aviso some', () => {
    const r = recomendar(cfg, [], '2026-11-10')!;
    const { pulados } = aplicarAcao(cfg, r, { tipo: 'pular', rotulo: '' }, '2026-11-10');
    expect(pulados).toHaveLength(1);
    expect(recomendar(cfg, pulados, '2026-11-10')).toBeNull();
  });
});
