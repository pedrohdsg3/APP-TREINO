// Banco local (IndexedDB via Dexie). As tabelas serão preenchidas nas próximas etapas;
// o esquema já fica definido para o backup JSON cobrir tudo desde o início.
import Dexie, { type EntityTable } from 'dexie';

export interface Sessao {
  id: string;
  data: string; // aaaa-mm-dd
  tipo: 'musculacao' | 'corrida';
  diaPlanejado?: string;
  status: 'feito' | 'pulado' | 'parcial';
  duracaoSeg?: number;
  esforco?: number;
  notas?: string;
  /** semana do programa (1..12) e id do treino planejado */
  semana?: number;
  treinoId?: string;
  volumeKg?: number;
  prs?: number;
  /** desconfortos anotados: exercicioId -> partes do corpo */
  dores?: Record<string, string[]>;
  /** notas por exercício */
  notasExercicio?: Record<string, string>;
  /** início/fim (timestamps) */
  inicioTs?: number;
  fimTs?: number;
}
export interface RegistroSerie {
  id?: number;
  sessaoId: string;
  exercicioId: string;
  serie: number;
  carga: number;
  reps: number;
  feita: boolean;
  timestamp: number;
}
export interface RegistroCorrida {
  sessaoId: string;
  estrutura: string;
  duracaoSeg: number;
  distanciaKm?: number;
  paceSegKm?: number;
  esforco?: number;
  dorJoelho?: number;
}
export interface RegistroCorpo {
  data: string;
  peso?: number;
  cintura?: number;
  braco?: number;
  coxa?: number;
}
export interface Ajuste { chave: string; valor: unknown }

export const db = new Dexie('app-treino') as Dexie & {
  sessoes: EntityTable<Sessao, 'id'>;
  series: EntityTable<RegistroSerie, 'id'>;
  corridas: EntityTable<RegistroCorrida, 'sessaoId'>;
  corpo: EntityTable<RegistroCorpo, 'data'>;
  ajustes: EntityTable<Ajuste, 'chave'>;
};

db.version(1).stores({
  sessoes: 'id, data, tipo, status',
  series: '++id, sessaoId, exercicioId, timestamp',
  corridas: 'sessaoId',
  corpo: 'data',
  ajustes: 'chave',
});
db.version(2).stores({
  sessoes: 'id, data, tipo, status, treinoId',
  series: '++id, sessaoId, exercicioId, timestamp, [sessaoId+exercicioId]',
});
