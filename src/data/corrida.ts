// ============================================================
// PLANO DE CORRIDA — edite aqui. Tempos em segundos.
// Todo treino ganha 5' de caminhada no início e 5' no fim (ver engine/plano.ts).
// Esforço: "consigo falar frases" (4–6/10). Intervalado: 6–7/10, sem sprint.
// ============================================================

export type TipoFase = 'aquecimento' | 'trote' | 'caminhada' | 'desaquecimento';

export interface Fase {
  tipo: TipoFase;
  seg: number;
  /** rótulo mostrado em letras grandes durante a corrida */
  rotulo: string;
  /** número do bloco (1..n) nos treinos intervalados */
  bloco?: number;
}

export interface TreinoCorrida {
  titulo: string;
  /** como aparece no plano, ex.: "6 × (2' trote + 2' caminhada)" */
  resumo: string;
  esforco: string;
  fases: Fase[];
}

const min = (m: number) => Math.round(m * 60);

function fmtMin(seg: number) {
  const m = Math.floor(seg / 60), s = seg % 60;
  return s ? `${m}:${String(s).padStart(2, '0')}` : `${m}'`;
}

/** n × (trote + caminhada) */
function intervalos(n: number, trote: number, caminhada: number, rotuloTrote = 'TROTE'): { resumo: string; fases: Fase[] } {
  const nomeTrote = rotuloTrote.toLowerCase();
  const fases: Fase[] = [];
  for (let b = 1; b <= n; b++) {
    fases.push({ tipo: 'trote', seg: trote, rotulo: rotuloTrote, bloco: b });
    fases.push({ tipo: 'caminhada', seg: caminhada, rotulo: 'CAMINHADA', bloco: b });
  }
  return { resumo: `${n} × (${fmtMin(trote)} ${nomeTrote} + ${fmtMin(caminhada)} caminhada)`, fases };
}

function sequencia(partes: [TipoFase, number][], resumo: string, rotuloTrote = 'TROTE'): { resumo: string; fases: Fase[] } {
  return {
    resumo,
    fases: partes.map(([tipo, seg]) => ({ tipo, seg, rotulo: tipo === 'trote' ? rotuloTrote : 'CAMINHADA RÁPIDA' })),
  };
}

const caminhadaRapida = (m: number) => ({ resumo: `${m}' caminhada rápida`, fases: [{ tipo: 'caminhada' as const, seg: min(m), rotulo: 'CAMINHADA RÁPIDA' }] });
const continuo = (m: number, rotulo = 'TROTE', extra = '') => ({ resumo: `${m}' trote contínuo${extra}`, fases: [{ tipo: 'trote' as const, seg: min(m), rotulo }] });

// ---------- Terça: corrida base (trote/caminhada) ----------
export const CORRIDA_BASE = [
  intervalos(6, min(2), min(2)),
  intervalos(6, min(3), min(2)),
  intervalos(5, min(4), min(2)),
  intervalos(5, min(3), min(2)), // 4 recuperação
  intervalos(4, min(6), min(2)),
  intervalos(4, min(8), min(2)),
  intervalos(3, min(10), min(2)),
  intervalos(3, min(8), min(2)), // 8 recuperação
  sequencia([['trote', min(15)], ['caminhada', min(2)], ['trote', min(15)]], "15' trote + 2' caminhada + 15' trote"),
  sequencia([['trote', min(20)], ['caminhada', min(2)], ['trote', min(10)]], "20' trote + 2' caminhada + 10' trote"),
  continuo(25),
  continuo(30, 'TROTE', ', ritmo bem confortável'), // 12 marco
];

// ---------- Quinta: intervalado leve (trote firme, sem sprint) ----------
const firme = (n: number, t: number, c: number) => intervalos(n, t, c, 'TROTE FIRME');
export const CORRIDA_INTERVALADA = [
  firme(6, min(1), min(2)),
  firme(7, min(1), min(2)),
  firme(8, min(1), min(2)),
  firme(6, min(1), min(2)), // 4
  firme(6, min(1.5), min(2)),
  firme(7, min(1.5), min(2)),
  firme(8, min(1.5), min(2)),
  firme(6, min(1.5), min(2)), // 8
  firme(6, min(2), min(2)),
  firme(7, min(2), min(2)),
  firme(8, min(2), min(1.5)),
  firme(6, min(2), min(2)), // 12
];

// ---------- Domingo: corrida leve (recuperação ativa) ----------
const leve = (n: number, t: number, c: number) => intervalos(n, t, c, 'TROTE LEVE');
export const CORRIDA_LEVE = [
  caminhadaRapida(30),
  leve(5, min(1), min(4)),
  leve(5, min(2), min(3)),
  caminhadaRapida(30), // 4
  leve(5, min(3), min(3)),
  leve(4, min(5), min(2)),
  leve(3, min(7), min(2)),
  caminhadaRapida(30), // 8
  leve(3, min(8), min(2)),
  leve(2, min(12), min(2)),
  continuo(20, 'TROTE LEVE', ' leve'),
  continuo(25, 'TROTE LEVE', ' leve'),
];

export const AQUECIMENTO_SEG = min(5);
export const DESAQUECIMENTO_SEG = min(5);

export const REGRAS_JOELHO = [
  'Dor no joelho ≥ 4/10 durante o treino: volte para caminhada e encerre o trote do dia.',
  'Dor que persiste ou piora no dia seguinte: repita a semana anterior. Se continuar, troque por bike/elíptico/caminhada e procure avaliação profissional.',
  'Use tênis adequado e prefira superfícies mais macias (pista, terra, grama).',
  'Nunca aumente tempo e intensidade na mesma semana.',
  'Perdeu uma semana inteira de corrida? Volte uma semana no plano.',
];
