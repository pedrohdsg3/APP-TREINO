// Sincronização local ⇄ nuvem.
// O banco local (IndexedDB) continua sendo a fonte do app: tudo funciona offline.
// Cada gravação local entra numa fila e sobe para a nuvem quando houver conexão;
// o que outros aparelhos da mesma conta enviam chega em tempo real e é aplicado localmente.
// Conflito: vale a versão mais recente (por registro).
import Dexie from 'dexie';
import type { Banco, RegistroCorrida, RegistroSerie, Sessao } from '../db';

/** Coleções simples: um registro da tabela = um documento na nuvem. */
export const SIMPLES = ['corpo', 'ajustes', 'diario', 'agua'] as const;
type Simples = (typeof SIMPLES)[number];
export type Colecao = 'sessoes' | Simples;
export const COLECOES: Colecao[] = ['sessoes', ...SIMPLES];
export type Dados = Record<string, unknown> & { versao: number; dispositivo: string; apagado?: boolean };

/** Onde os dados ficam na nuvem (Firestore na vida real; memória nos testes). */
export interface Backend {
  enviar(col: Colecao, id: string, dados: Dados): Promise<void>;
  ouvir(col: Colecao, aoMudar: (docs: { id: string; dados: Dados }[]) => void, aoErro?: (e: Error) => void): () => void;
}

/** Armazenamento pequeno para fila e versões (localStorage na vida real). */
export interface Armazem { ler(chave: string): string | null; gravar(chave: string, valor: string): void }

const limpar = <T,>(x: T): T => JSON.parse(JSON.stringify(x)); // Firestore não aceita undefined

type Chave = `${Colecao}|${string}`;
const separar = (k: Chave) => { const i = k.indexOf('|'); return [k.slice(0, i) as Colecao, k.slice(i + 1)] as const; };
const MARCA = '__remoto';
const remoto = (tx: unknown) => !!(tx && (tx as Record<string, unknown>)[MARCA]);

export interface EstadoSync { pendentes: number; enviando: boolean; erro?: string; ultimoEnvio?: number }

export class Sincronizador {
  private pend: Set<Chave>;
  private versoes: Record<string, number>;
  private paradas: (() => void)[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private enviando = false;
  private erro?: string;
  private ultimoEnvio?: number;
  private ouvintes = new Set<(e: EstadoSync) => void>();
  private ativo = false;
  private ganchos: (() => void)[] = [];
  private obterDb: () => Banco;
  private get db() { return this.obterDb(); }

  constructor(
    banco: Banco | (() => Banco),
    private backend: Backend,
    private dispositivo: string,
    private armazem: Armazem,
    private prefixo: string,
    private atraso = 1200,
  ) {
    this.obterDb = typeof banco === 'function' ? banco : () => banco;
    this.pend = new Set(JSON.parse(armazem.ler(`${prefixo}.pend`) ?? '[]'));
    this.versoes = JSON.parse(armazem.ler(`${prefixo}.versoes`) ?? '{}');
  }

  // ---------------------------------------------------------------- estado
  estado(): EstadoSync { return { pendentes: this.pend.size, enviando: this.enviando, erro: this.erro, ultimoEnvio: this.ultimoEnvio }; }
  aoMudarEstado(f: (e: EstadoSync) => void) { this.ouvintes.add(f); f(this.estado()); return () => this.ouvintes.delete(f); }
  private avisar() { const e = this.estado(); this.ouvintes.forEach((f) => f(e)); }
  private salvar() {
    this.armazem.gravar(`${this.prefixo}.pend`, JSON.stringify([...this.pend]));
    this.armazem.gravar(`${this.prefixo}.versoes`, JSON.stringify(this.versoes));
  }

  // ---------------------------------------------------------------- fila
  marcar(k: Chave) {
    this.pend.add(k);
    this.versoes[k] = Math.max(Date.now(), (this.versoes[k] ?? 0) + 1);
    this.salvar();
    this.avisar();
    this.agendar();
  }

  private agendar() {
    if (!this.ativo) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.enviar(); }, this.atraso);
  }

  /** Coloca na fila tudo o que existe no aparelho (primeira vinculação da conta). */
  async subirTudo(opcoes: { ajustes?: boolean } = {}) {
    for (const col of COLECOES) {
      if (col === 'ajustes' && opcoes.ajustes === false) continue;
      for (const id of await this.db.table(col).toCollection().primaryKeys()) this.marcar(`${col}|${String(id)}`);
    }
  }

  /** Envia a fila. Itens que falharem continuam na fila para a próxima tentativa. */
  async enviar(): Promise<void> {
    if (this.enviando || !this.pend.size) return;
    this.enviando = true; this.erro = undefined; this.avisar();
    let falhou: Error | null = null;
    try {
      // um item com erro não trava os outros: segue a fila e tenta de novo depois
      for (const k of [...this.pend]) {
        try {
          const [col, id] = separar(k);
          const dados = { ...(await this.montar(col, id)), versao: this.versoes[k] ?? Date.now(), dispositivo: this.dispositivo };
          await this.backend.enviar(col, id, limpar(dados));
          this.pend.delete(k);
          this.salvar();
        } catch (e) { falhou ??= e as Error; }
      }
      if (falhou) throw falhou;
      this.ultimoEnvio = Date.now();
    } catch (e) {
      this.erro = (e as Error).message;
      if (this.ativo) { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => { void this.enviar(); }, 15000); }
    } finally {
      this.enviando = false; this.avisar();
    }
  }

  private async montar(col: Colecao, id: string): Promise<Record<string, unknown>> {
    if (col === 'sessoes') {
      const sessao = await this.db.sessoes.get(id);
      if (!sessao) return { apagado: true };
      const series = (await this.db.series.where('sessaoId').equals(id).toArray()).map(({ id: _id, ...s }) => s);
      const corrida = (await this.db.corridas.get(id)) ?? null;
      return { sessao, series, corrida };
    }
    const r = await this.db.table(col).get(id);
    return r ? { registro: r } : { apagado: true };
  }

  // ---------------------------------------------------------------- receber
  private async aplicar(col: Colecao, docs: { id: string; dados: Dados }[]) {
    const novos = docs.filter(({ id, dados }) => {
      const k = `${col}|${id}` as Chave;
      if (dados.dispositivo === this.dispositivo) return false; // eco do próprio envio
      if (this.pend.has(k)) return false; // mudança local mais nova ainda vai subir
      return (dados.versao ?? 0) > (this.versoes[k] ?? 0);
    });
    if (!novos.length) return;
    const tabelas = col === 'sessoes' ? [this.db.sessoes, this.db.series, this.db.corridas] : [this.db.table(col)];
    await this.db.transaction('rw', tabelas, async () => {
      (Dexie.currentTransaction as unknown as Record<string, unknown>)[MARCA] = true;
      for (const { id, dados } of novos) {
        if (col === 'sessoes') {
          await this.db.series.where('sessaoId').equals(id).delete();
          if (dados.apagado) { await this.db.sessoes.delete(id); await this.db.corridas.delete(id); continue; }
          await this.db.sessoes.put(dados.sessao as Sessao);
          const series = (dados.series as Omit<RegistroSerie, 'id'>[]) ?? [];
          if (series.length) await this.db.series.bulkAdd(series as RegistroSerie[]);
          if (dados.corrida) await this.db.corridas.put(dados.corrida as RegistroCorrida); else await this.db.corridas.delete(id);
        } else {
          if (dados.apagado) await this.db.table(col).delete(id); else await this.db.table(col).put(dados.registro);
        }
      }
    });
    for (const { id, dados } of novos) this.versoes[`${col}|${id}`] = dados.versao;
    this.salvar();
  }

  // ---------------------------------------------------------------- ligar/desligar
  iniciar() {
    if (this.ativo) return;
    this.ativo = true;
    this.religar();
    for (const col of COLECOES) {
      this.paradas.push(this.backend.ouvir(col, (docs) => { void this.aplicar(col, docs).catch((e) => { this.erro = (e as Error).message; this.avisar(); }); }, (e) => { this.erro = e.message; this.avisar(); }));
    }
    if (this.pend.size) this.agendar();
  }

  /** (Re)instala os ganchos no banco atual — chamar quando a conexão do banco for recriada. */
  religar() {
    this.ganchos.forEach((f) => f());
    this.ganchos = [];
    if (!this.ativo) return;
    const db = this.db;
    const k = (col: Colecao, id: unknown) => `${col}|${String(id)}` as Chave;
    const lista: [Dexie.Table, (obj: Record<string, unknown>, chave: unknown) => Chave | null][] = [
      [db.sessoes, (_o, chave) => k('sessoes', chave)],
      [db.series, (o) => (o?.sessaoId ? k('sessoes', o.sessaoId) : null)],
      [db.corridas, (_o, chave) => k('sessoes', chave)],
      ...SIMPLES.map((col) => [db.table(col), (_o: unknown, chave: unknown) => k(col, chave)] as [Dexie.Table, (obj: Record<string, unknown>, chave: unknown) => Chave | null]),
    ];
    for (const [tabela, chaveDe] of lista) {
      const avisa = (chave: unknown, obj: Record<string, unknown>, tx: unknown) => { if (!remoto(tx)) { const c = chaveDe(obj, chave); if (c) queueMicrotask(() => this.marcar(c)); } };
      const criar = (chave: unknown, obj: Record<string, unknown>, tx: unknown) => avisa(chave, obj, tx);
      const atualizar = (_mods: unknown, chave: unknown, obj: Record<string, unknown>, tx: unknown) => avisa(chave, obj, tx);
      const apagar = (chave: unknown, obj: Record<string, unknown>, tx: unknown) => avisa(chave, obj, tx);
      tabela.hook('creating', criar as never);
      tabela.hook('updating', atualizar as never);
      tabela.hook('deleting', apagar as never);
      this.ganchos.push(() => { tabela.hook('creating').unsubscribe(criar as never); tabela.hook('updating').unsubscribe(atualizar as never); tabela.hook('deleting').unsubscribe(apagar as never); });
    }
  }

  parar() {
    this.ativo = false;
    if (this.timer) clearTimeout(this.timer);
    this.paradas.forEach((f) => f());
    this.paradas = [];
    this.religar(); // inativo: só remove os ganchos
  }
}
