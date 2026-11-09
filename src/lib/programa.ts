// Posição no programa de 12 semanas (detalhes completos dos treinos chegam na etapa 2).
import { diasEntre } from './datas';

export const TOTAL_SEMANAS = 12;
export const INICIO_PADRAO = '2026-11-09'; // segunda-feira

export type Fase = 'Base' | 'Recuperação' | 'Progressão' | 'Intensificação';

export function faseDaSemana(semana: number): Fase {
  if (semana === 4 || semana === 8 || semana === 12) return 'Recuperação';
  if (semana <= 3) return 'Base';
  if (semana <= 7) return 'Progressão';
  return 'Intensificação';
}

export type Posicao =
  | { estado: 'antes'; diasParaComecar: number }
  | { estado: 'durante'; semana: number; diaDaSemana: number; fase: Fase }
  | { estado: 'depois' };

/** diaDaSemana: 0 = segunda ... 6 = domingo */
export function posicaoNoPrograma(inicio: string, hoje: string): Posicao {
  const d = diasEntre(inicio, hoje);
  if (d < 0) return { estado: 'antes', diasParaComecar: -d };
  const semana = Math.floor(d / 7) + 1;
  if (semana > TOTAL_SEMANAS) return { estado: 'depois' };
  return { estado: 'durante', semana, diaDaSemana: d % 7, fase: faseDaSemana(semana) };
}

/** Semana-padrão (0 = segunda). Os exercícios e a corrida completos chegam na etapa 2. */
export interface DiaPadrao {
  tipo: 'musculacao' | 'corrida';
  titulo: string;
  detalhe: string;
  minutos: number;
}
export const SEMANA_PADRAO: DiaPadrao[] = [
  { tipo: 'musculacao', titulo: 'Peito + Tríceps', detalhe: 'Peito · Tríceps', minutos: 55 },
  { tipo: 'corrida', titulo: 'Corrida base', detalhe: 'Trote + caminhada', minutos: 34 },
  { tipo: 'musculacao', titulo: 'Costas + Bíceps', detalhe: 'Costas · Bíceps', minutos: 55 },
  { tipo: 'corrida', titulo: 'Intervalado leve', detalhe: 'Trote firme + caminhada', minutos: 28 },
  { tipo: 'musculacao', titulo: 'Ombro + Braços', detalhe: 'Ombro · Bíceps · Tríceps', minutos: 55 },
  { tipo: 'musculacao', titulo: 'Pernas', detalhe: 'Quadríceps · Posterior · Panturrilha', minutos: 55 },
  { tipo: 'corrida', titulo: 'Corrida leve + Abdômen', detalhe: 'Recuperação ativa · Core', minutos: 55 },
];
