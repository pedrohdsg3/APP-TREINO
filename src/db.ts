// Banco local (IndexedDB via Dexie). As tabelas serão preenchidas nas próximas etapas;
// o esquema já fica definido para o backup JSON cobrir tudo desde o início.
import Dexie, { type EntityTable } from 'dexie';

export interface Sessao {
  id: string;
  data: string; // aaaa-mm-dd
  tipo: 'musculacao' | 'corrida' | 'cardio';
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
  /** segundos trotando e maior trecho contínuo de trote */
  troteSeg?: number;
  maiorTroteSeg?: number;
  dorDurante?: number;
  modo?: 'guiada' | 'livre';
}
export interface RegistroCorpo {
  data: string;
  peso?: number;
  cintura?: number;
  braco?: number;
  coxa?: number;
}
export interface Ajuste { chave: string; valor: unknown }

export type Banco = Dexie & {
  sessoes: EntityTable<Sessao, 'id'>;
  series: EntityTable<RegistroSerie, 'id'>;
  corridas: EntityTable<RegistroCorrida, 'sessaoId'>;
  corpo: EntityTable<RegistroCorpo, 'data'>;
  ajustes: EntityTable<Ajuste, 'chave'>;
};

export function criarBanco(nome: string): Banco {
  const b = new Dexie(nome) as Banco;
  b.version(1).stores({
    sessoes: 'id, data, tipo, status',
    series: '++id, sessaoId, exercicioId, timestamp',
    corridas: 'sessaoId',
    corpo: 'data',
    ajustes: 'chave',
  });
  b.version(2).stores({
    sessoes: 'id, data, tipo, status, treinoId',
    series: '++id, sessaoId, exercicioId, timestamp, [sessaoId+exercicioId]',
  });
  return b;
}

/**
 * Banco do perfil ativo. Cada perfil tem o seu (o do Pedro continua sendo "app-treino").
 * É um binding "vivo": quem importa `db` passa a ver o novo banco após abrirBanco().
 */
export let db: Banco = criarBanco('app-treino');

export function abrirBanco(nome: string) {
  if (db.name === nome) return;
  db.close();
  db = criarBanco(nome);
}

/**
 * Reabre a conexão do banco ativo. O navegador pode fechar a conexão do IndexedDB
 * quando o app fica muito tempo em segundo plano (ex.: treino de 1 h ouvindo música).
 */
export async function reabrirBanco() {
  const nome = db.name;
  try { db.close(); } catch { /* já fechado */ }
  db = criarBanco(nome);
  await db.open();
}

function comPrazo<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((ok, erro) => {
    const id = setTimeout(() => erro(Object.assign(new Error(`a gravação não respondeu em ${ms / 1000} s`), { name: 'TempoEsgotado' })), ms);
    p.then((v) => { clearTimeout(id); ok(v); }, (e) => { clearTimeout(id); erro(e); });
  });
}

/** Executa uma gravação; se falhar ou travar, reabre o banco e tenta mais uma vez. */
export async function comRetentativa<T>(f: () => Promise<T>): Promise<T> {
  try {
    if (!db.isOpen()) await comPrazo(db.open(), 8000);
    return await comPrazo(f(), 8000);
  } catch (e1) {
    console.warn('Gravação falhou, reabrindo o banco e tentando de novo:', e1);
    await comPrazo(reabrirBanco(), 10000);
    return await comPrazo(f(), 15000);
  }
}

/** Usa o banco ativo se for o mesmo; senão abre uma instância temporária (outro perfil). */
export async function comBanco<T>(nome: string, f: (b: Banco) => Promise<T>): Promise<T> {
  if (db.name === nome) return f(db);
  const b = criarBanco(nome);
  try { return await f(b); } finally { b.close(); }
}

export async function apagarBanco(nome: string) {
  await Dexie.delete(nome);
}
