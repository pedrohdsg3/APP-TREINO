// Duelo online (Firebase): conta logada (ou anônima) + Firestore. O SDK é carregado só quando usado.
// O que vai para a nuvem: nome, avatar, plano, data de início e as DATAS em que treinou.
// Cargas, peso, corridas e notas continuam só no aparelho.
import type { Participante } from '../engine/duelo';
import { FIREBASE_CONFIG } from './firebaseConfig';
import { firebase, usuarioAtual } from './firebase';
import { chaveLocal, type Perfil } from './perfis';

export const nuvemConfigurada = () => !!FIREBASE_CONFIG?.apiKey;

type Sdk = { uid: string; fs: typeof import('firebase/firestore'); db: import('firebase/firestore').Firestore };

/** Usa a conta logada (Google); sem conta, entra anonimamente só para o duelo. */
async function iniciar(): Promise<Sdk> {
  const { fs, db, a, auth } = await firebase();
  const user = (await usuarioAtual()) ?? (await auth.signInAnonymously(a)).user;
  return { uid: user.uid, fs, db };
}

// ---------------------------------------------------------------- sala do perfil
const CHAVE = 'treino.duelo.sala';
export function salaDoPerfil(p?: Perfil): string | null {
  try { return localStorage.getItem(chaveLocal(CHAVE, p)); } catch { return null; }
}
function definirSala(codigo: string | null) {
  try { if (codigo) localStorage.setItem(chaveLocal(CHAVE), codigo); else localStorage.removeItem(chaveLocal(CHAVE)); } catch { /* ignora */ }
}

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function gerarCodigo(): string {
  const r = new Uint32Array(8);
  crypto.getRandomValues(r);
  return Array.from(r, (x) => ALFABETO[x % ALFABETO.length]).join('');
}
export const formatarCodigo = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;

export async function criarSala(): Promise<string> {
  const { fs, db, uid } = await iniciar();
  const codigo = gerarCodigo();
  await fs.setDoc(fs.doc(db, 'duelos', codigo), { criadoEm: fs.serverTimestamp(), criadoPor: uid });
  definirSala(codigo);
  return codigo;
}

export async function entrarSala(entrada: string): Promise<string> {
  const codigo = entrada.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z2-9]{8}$/.test(codigo)) throw new Error('O código tem 8 letras/números (ex.: ABCD-2345).');
  const { fs, db } = await iniciar();
  const s = await fs.getDoc(fs.doc(db, 'duelos', codigo));
  if (!s.exists()) throw new Error('Não encontrei um duelo com esse código.');
  definirSala(codigo);
  return codigo;
}

export async function sairSala() {
  const codigo = salaDoPerfil();
  definirSala(null);
  if (!codigo) return;
  try { const { fs, db, uid } = await iniciar(); await fs.deleteDoc(fs.doc(db, 'duelos', codigo, 'jogadores', uid)); } catch { /* offline: ok */ }
}

/** Publica o placar do perfil ativo (se estiver numa sala). Falhas são silenciosas (offline). */
export async function publicar(p: Participante): Promise<boolean> {
  const codigo = salaDoPerfil();
  if (!codigo || !nuvemConfigurada()) return false;
  try {
    const { fs, db, uid } = await iniciar();
    await fs.setDoc(fs.doc(db, 'duelos', codigo, 'jogadores', uid), {
      nome: p.nome.slice(0, 30), emoji: p.emoji, personagem: p.personagem ?? null, plano: p.plano, inicio: p.inicio,
      feitos: p.feitos.slice(-500), cardios: p.cardios.slice(-500), atualizadoEm: fs.serverTimestamp(),
    });
    return true;
  } catch { return false; }
}

/** Escuta os placares da sala em tempo real. Devolve a função para parar. */
export function ouvirSala(aoMudar: (outros: Participante[], meuUid: string) => void, aoErro?: (e: Error) => void): () => void {
  const codigo = salaDoPerfil();
  if (!codigo || !nuvemConfigurada()) return () => {};
  let parar = () => {};
  let cancelado = false;
  iniciar().then(({ fs, db, uid }) => {
    if (cancelado) return;
    parar = fs.onSnapshot(fs.collection(db, 'duelos', codigo, 'jogadores'), (snap) => {
      const lista: Participante[] = snap.docs.map((d) => {
        const x = d.data() as { nome: string; emoji: string; personagem: 'pedro' | 'yana' | null; plano: 'pedro' | 'feminino'; inicio: string; feitos: string[]; cardios: string[]; atualizadoEm?: { toDate(): Date } };
        return {
          id: `nuvem-${d.id}`, nome: x.nome, emoji: x.emoji, personagem: x.personagem ?? undefined, plano: x.plano, inicio: x.inicio,
          feitos: x.feitos ?? [], cardios: x.cardios ?? [], externo: true, online: true, uid: d.id,
          atualizadoEm: x.atualizadoEm?.toDate().toISOString(),
        };
      });
      aoMudar(lista, uid);
    }, (e) => aoErro?.(e));
  }).catch((e) => aoErro?.(e));
  return () => { cancelado = true; parar(); };
}

/** Entra na sala; se ainda não existir, cria (usado na sala do casal, com código fixo). */
export async function entrarOuCriarSala(codigo: string): Promise<string> {
  const { fs, db, uid } = await iniciar();
  const ref = fs.doc(db, 'duelos', codigo);
  const s = await fs.getDoc(ref);
  if (!s.exists()) await fs.setDoc(ref, { criadoEm: fs.serverTimestamp(), criadoPor: uid });
  definirSala(codigo);
  return codigo;
}

/** Sala do duelo do Pedro e da Yana (entram nela automaticamente ao logar). */
export const SALA_CASAL = 'VWVZMJ9S';
