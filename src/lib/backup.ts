// Backup em JSON: exporta e importa um ou todos os perfis (dados ficam só no aparelho).
import { comBanco } from '../db';
import { listarPerfis, salvarPerfis, type Perfil } from './perfis';

export const FORMATO = 'treino-12-semanas';
const TABELAS = ['sessoes', 'series', 'corridas', 'corpo', 'ajustes', 'diario', 'agua'] as const;
type Tabela = (typeof TABELAS)[number];

export interface BackupPerfil { perfil: Perfil; tabelas: Record<Tabela, unknown[]> }
export interface Backup { formato: typeof FORMATO; versao: 1; exportadoEm: string; perfis: BackupPerfil[] }

export async function exportar(perfis: Perfil[]): Promise<Backup> {
  const out: BackupPerfil[] = [];
  for (const perfil of perfis) {
    const tabelas = await comBanco(perfil.banco, async (b) => {
      const t = {} as Record<Tabela, unknown[]>;
      for (const nome of TABELAS) t[nome] = await b.table(nome).toArray();
      return t;
    });
    out.push({ perfil, tabelas });
  }
  return { formato: FORMATO, versao: 1, exportadoEm: new Date().toISOString(), perfis: out };
}

export function validar(dado: unknown): Backup {
  const b = dado as Backup;
  if (!b || b.formato !== FORMATO || !Array.isArray(b.perfis)) throw new Error('Este arquivo não é um backup do app de treino.');
  for (const p of b.perfis) {
    if (!p.perfil?.id || !p.perfil?.banco || !p.tabelas) throw new Error('Backup incompleto ou corrompido.');
    for (const t of TABELAS) if (p.tabelas[t] && !Array.isArray(p.tabelas[t])) throw new Error(`Tabela "${t}" inválida no backup.`);
  }
  return b;
}

export interface ResumoBackup { nome: string; sessoes: number; pesos: number }
export const resumir = (b: Backup): ResumoBackup[] =>
  b.perfis.map((p) => ({ nome: p.perfil.nome, sessoes: p.tabelas.sessoes?.length ?? 0, pesos: p.tabelas.corpo?.length ?? 0 }));

/** Substitui os dados de cada perfil do backup (cria o perfil se não existir neste aparelho). */
export async function importar(b: Backup): Promise<void> {
  let perfis = listarPerfis();
  for (const { perfil, tabelas } of b.perfis) {
    const existente = perfis.find((p) => p.id === perfil.id);
    const alvo = existente ? { ...existente, ...perfil, banco: existente.banco } : perfil;
    perfis = existente ? perfis.map((p) => (p.id === alvo.id ? alvo : p)) : [...perfis, alvo];
    await comBanco(alvo.banco, (banco) => banco.transaction('rw', TABELAS.map((t) => banco.table(t)), async () => {
      for (const t of TABELAS) {
        if (!tabelas[t]) continue; // backup antigo sem a tabela (ex.: dieta): mantém o que existe
        await banco.table(t).clear();
        const linhas = tabelas[t] ?? [];
        if (linhas.length) await banco.table(t).bulkPut(linhas);
      }
    }));
  }
  salvarPerfis(perfis);
}

const ULTIMO = 'treino.ultimoBackup';
export function marcarBackup() { try { localStorage.setItem(ULTIMO, new Date().toISOString()); } catch { /* ignora */ } }
export function ultimoBackup(): Date | null {
  try { const v = localStorage.getItem(ULTIMO); return v ? new Date(v) : null; } catch { return null; }
}

/** Salva o arquivo: compartilhar (iPhone/Android) quando possível, senão download. */
export async function salvarArquivo(b: Backup, nomeArquivo: string) {
  const texto = JSON.stringify(b, null, 1);
  const arquivo = new File([texto], nomeArquivo, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [arquivo] })) {
    try { await nav.share({ files: [arquivo], title: 'Backup do treino' }); marcarBackup(); return; }
    catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url; a.download = nomeArquivo;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  marcarBackup();
}
