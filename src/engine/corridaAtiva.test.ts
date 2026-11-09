import { describe, expect, it } from 'vitest';
import { corridaPlanejada, planoDaData, proximaCorrida, type ConfigPrograma } from './plano';
import { encerrar, estadoFase, fmtPace, informarDor, montarCorrida, pace, pausar, pularFase, resumirCorrida, retomar, tempoAtivo } from './corridaAtiva';

const s = (n: number) => n * 1000;
const base = () => montarCorrida(corridaPlanejada('base', 1), { sessaoId: 'c', data: '2026-11-10', semana: 1, agora: 0, treinoId: 'base' });

describe('corrida guiada', () => {
  it('fases seguem o tempo: aquecimento 5\' → trote 2\' → caminhada 2\'', () => {
    const t = base();
    expect(estadoFase(t, s(10))).toMatchObject({ indice: 0, fase: { tipo: 'aquecimento' } });
    expect(estadoFase(t, s(300))).toMatchObject({ indice: 1, fase: { tipo: 'trote', bloco: 1 }, restante: 120, totalBlocos: 6 });
    expect(estadoFase(t, s(430))).toMatchObject({ indice: 2, fase: { tipo: 'caminhada' } });
    expect(estadoFase(t, s(34 * 60))).toMatchObject({ concluida: true });
  });
  it('pausa congela o tempo (mesmo com a tela apagada)', () => {
    let t = pausar(base(), s(100));
    expect(tempoAtivo(t, s(500))).toBe(100);
    t = retomar(t, s(500));
    expect(tempoAtivo(t, s(510))).toBe(110);
  });
  it('pular fase (trote pulado não conta como feito)', () => {
    const t = pularFase(base(), s(10));
    expect(estadoFase(t, s(10))).toMatchObject({ indice: 1 });
    const t2 = pularFase(base(), s(330)); // 30 s no 1º trote, pula o resto
    expect(resumirCorrida(encerrar(t2, s(340)), 0).troteSeg).toBe(30);
  });
  it('dor ≥ 4 transforma todo o trote restante em caminhada', () => {
    const t = informarDor(base(), 5, s(400)); // no 1º trote
    expect(t.fases.filter((f) => f.tipo === 'trote')).toHaveLength(0);
    expect(estadoFase(t, s(400)).fase?.tipo).toBe('caminhada');
    expect(informarDor(base(), 2, s(400)).fases.filter((f) => f.tipo === 'trote')).toHaveLength(6);
  });
  it('resumo: trote feito e maior trecho contínuo', () => {
    const t = encerrar(base(), s(300 + 120 + 120 + 60)); // aquec + trote + cam + 1' do 2º trote
    const r = resumirCorrida(t, 0);
    expect(r.duracaoSeg).toBe(600);
    expect(r.troteSeg).toBe(180);
    expect(r.maiorTroteSeg).toBe(120);
  });
  it('corrida contínua (semana 11) registra trecho contínuo inteiro', () => {
    const t = montarCorrida(corridaPlanejada('base', 11), { sessaoId: 'x', data: 'd', agora: 0, treinoId: 'base' });
    expect(resumirCorrida(encerrar(t, s(35 * 60)), 0).maiorTroteSeg).toBe(25 * 60);
  });
  it('corrida livre', () => {
    const t = montarCorrida(null, { sessaoId: 'l', data: 'd', agora: 0, treinoId: 'livre' });
    expect(estadoFase(t, s(9999)).concluida).toBe(false);
    expect(resumirCorrida(encerrar(t, s(1800)), 0).duracaoSeg).toBe(1800);
  });
  it('pace', () => {
    expect(fmtPace(pace(1800, 4))).toBe('7:30 /km');
    expect(pace(1800, 0)).toBeUndefined();
  });
});

describe('ajustes de joelho no plano', () => {
  const cfg: ConfigPrograma = { inicio: '2026-11-09', repetidas: [] };
  it('recuo da corrida usa a semana anterior só para a corrida', () => {
    const d = planoDaData({ ...cfg, recuoCorrida: 1 }, '2026-11-17')!; // terça da semana 2
    expect(d.semana).toBe(2);
    expect(d.corrida!.resumo).toBe("6 × (2' trote + 2' caminhada)");
  });
  it('troca por cardio sem impacto numa data', () => {
    const d = planoDaData({ ...cfg, cardioAlternativo: ['2026-11-12'] }, '2026-11-12')!;
    expect(d.corrida!.titulo).toBe('Cardio sem impacto');
  });
  it('próxima corrida', () => {
    expect(proximaCorrida(cfg, '2026-11-10')).toBe('2026-11-12');
    expect(proximaCorrida(cfg, '2026-11-12')).toBe('2026-11-15');
  });
});
