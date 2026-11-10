// Conta Google: login, perfil guardado na nuvem e sincronização dos dados do perfil.
import { useEffect, useState } from 'react';
import { db, aoTrocarBanco, comBanco } from '../db';
import { firebase, usuarioAtual } from './firebase';
import { Sincronizador, type Backend, type Colecao, type EstadoSync } from './sync';
import { listarPerfis, salvarPerfis, type Perfil } from './perfis';
import { FIREBASE_CONFIG } from './firebaseConfig';

export interface Conta { uid: string; email: string | null; nome: string | null; foto: string | null }
/** Dados do perfil guardados na nuvem (usuarios/{uid}). */
export type PerfilNuvem = Pick<Perfil, 'id' | 'nome' | 'emoji' | 'plano' | 'inicio' | 'personagem'>;

const CONTA = 'treino.conta';
const SEM_CONTA = 'treino.semConta';
export const loginDisponivel = !!FIREBASE_CONFIG;

const armazem = {
  ler: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  gravar: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignora */ } },
};

/** Conta da última vez (permite abrir o app offline sem esperar o Firebase). */
export function contaSalva(): Conta | null {
  try { return JSON.parse(localStorage.getItem(CONTA) ?? 'null'); } catch { return null; }
}
function guardarConta(c: Conta | null) {
  try { if (c) localStorage.setItem(CONTA, JSON.stringify(c)); else localStorage.removeItem(CONTA); } catch { /* ignora */ }
}
export const usaSemConta = () => armazem.ler(SEM_CONTA) === '1';
export function definirSemConta(v: boolean) { try { if (v) localStorage.setItem(SEM_CONTA, '1'); else localStorage.removeItem(SEM_CONTA); } catch { /* ignora */ } }

const deUsuario = (u: import('firebase/auth').User): Conta => ({ uid: u.uid, email: u.email, nome: u.displayName, foto: u.photoURL });

/** Confere a sessão salva do Firebase (null = não logado com Google). */
export async function verificarConta(): Promise<Conta | null> {
  const u = await usuarioAtual();
  const c = u && !u.isAnonymous ? deUsuario(u) : null;
  guardarConta(c);
  return c;
}

export async function entrarComGoogle(): Promise<Conta | null> {
  const { auth, a } = await firebase();
  const prov = new auth.GoogleAuthProvider();
  prov.setCustomParameters({ prompt: 'select_account' });
  try {
    const r = await auth.signInWithPopup(a, prov);
    const c = deUsuario(r.user); guardarConta(c); definirSemConta(false); return c;
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await auth.signInWithRedirect(a, prov); // volta ao app já logado
      return null;
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null;
    throw e;
  }
}

export async function sairDaConta() {
  pararSync();
  const { auth, a } = await firebase();
  await auth.signOut(a);
  guardarConta(null);
}

// ---------------------------------------------------------------- perfil na nuvem
export async function lerPerfilNuvem(uid: string): Promise<PerfilNuvem | null> {
  const { fs, db: f } = await firebase();
  const s = await fs.getDoc(fs.doc(f, 'usuarios', uid));
  return (s.data()?.perfil as PerfilNuvem | undefined) ?? null;
}

export async function salvarPerfilNuvem(uid: string, p: Perfil) {
  const { fs, db: f } = await firebase();
  const perfil: PerfilNuvem = JSON.parse(JSON.stringify({ id: p.id, nome: p.nome, emoji: p.emoji, plano: p.plano, inicio: p.inicio, personagem: p.personagem }));
  await fs.setDoc(fs.doc(f, 'usuarios', uid), { perfil, atualizadoEm: fs.serverTimestamp() }, { merge: true });
}

/** Perfil deste aparelho ligado à conta. */
export const perfilDaConta = (uid: string) => listarPerfis().find((p) => p.uid === uid);

/** Perfis deste aparelho ainda sem conta e com algum treino registrado. */
export async function perfisSemConta(): Promise<(Perfil & { treinos: number })[]> {
  const l = listarPerfis().filter((p) => !p.uid);
  const com = await Promise.all(l.map(async (p) => ({ ...p, treinos: await comBanco(p.banco, (b) => b.sessoes.count()).catch(() => 0) })));
  return com.filter((p) => p.treinos > 0);
}

/** Liga um perfil deste aparelho à conta e manda tudo dele para a nuvem. */
export async function vincular(conta: Conta, p: Perfil, opcoes: { nuvemJaExiste?: boolean } = {}): Promise<Perfil> {
  const ligado = { ...p, uid: conta.uid };
  salvarPerfis(listarPerfis().map((x) => (x.id === p.id ? ligado : x)));
  if (!opcoes.nuvemJaExiste) await salvarPerfilNuvem(conta.uid, ligado);
  pendenteSubir.set(conta.uid, { ajustes: !opcoes.nuvemJaExiste });
  return ligado;
}

/** Cria neste aparelho o perfil que já existe na nuvem (os dados descem pela sincronização). */
export function perfilDaNuvem(conta: Conta, n: PerfilNuvem): Perfil {
  const existentes = listarPerfis();
  const livre = !existentes.some((p) => p.id === n.id);
  const id = livre ? n.id : `u-${conta.uid.slice(0, 10)}`;
  const banco = id === 'pedro' ? 'app-treino' : `app-treino-${id}`;
  const p: Perfil = { ...n, id, banco, criado: new Date().toISOString().slice(0, 10), uid: conta.uid };
  salvarPerfis([...existentes.filter((x) => x.id !== id), p]);
  return p;
}

// ---------------------------------------------------------------- sincronização
const pendenteSubir = new Map<string, { ajustes: boolean }>();
let sync: Sincronizador | null = null;
let soltarTroca: (() => void) | null = null;
const ouvintes = new Set<(e: EstadoSync | null) => void>();
let estado: EstadoSync | null = null;

function dispositivo(): string {
  let d = armazem.ler('treino.dispositivo');
  if (!d) { d = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; armazem.gravar('treino.dispositivo', d); }
  return d;
}

function backendFirestore(uid: string): Backend {
  const col = (c: Colecao) => firebase().then(({ fs, db: f }) => ({ fs, ref: fs.collection(f, 'usuarios', uid, c) }));
  return {
    async enviar(c, id, dados) { const { fs, ref } = await col(c); await fs.setDoc(fs.doc(ref, id), dados); },
    ouvir(c, aoMudar, aoErro) {
      let parar: (() => void) | null = null; let cancelado = false;
      void col(c).then(({ fs, ref }) => {
        if (cancelado) return;
        parar = fs.onSnapshot(ref, (snap) => aoMudar(snap.docChanges().filter((d) => d.type !== 'removed').map((d) => ({ id: d.doc.id, dados: d.doc.data() as never }))), (e) => aoErro?.(e));
      }).catch((e) => aoErro?.(e));
      return () => { cancelado = true; parar?.(); };
    },
  };
}

/** Liga a sincronização do perfil ativo (chamar depois de ativarPerfil). */
export function iniciarSync(uid: string) {
  pararSync();
  const s = new Sincronizador(() => db, backendFirestore(uid), dispositivo(), armazem, `treino.sync.${uid}`);
  sync = s;
  s.aoMudarEstado((e) => { estado = e; ouvintes.forEach((f) => f(e)); });
  soltarTroca = aoTrocarBanco(() => s.religar());
  s.iniciar();
  const subir = pendenteSubir.get(uid);
  if (subir) { pendenteSubir.delete(uid); void s.subirTudo(subir); }
  addEventListener('online', reenviar);
}

const reenviar = () => { void sync?.enviar(); };

export function pararSync() {
  sync?.parar(); sync = null;
  soltarTroca?.(); soltarTroca = null;
  removeEventListener('online', reenviar);
  estado = null; ouvintes.forEach((f) => f(null));
}

/** Envia já o que estiver pendente (ex.: ao terminar um treino). */
export const enviarAgora = () => sync?.enviar() ?? Promise.resolve();

export function useEstadoSync(): EstadoSync | null {
  const [e, setE] = useState(estado);
  useEffect(() => { ouvintes.add(setE); setE(estado); return () => { ouvintes.delete(setE); }; }, []);
  return e;
}
