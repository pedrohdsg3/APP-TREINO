// Inicialização única do Firebase (carregado sob demanda).
import { FIREBASE_CONFIG } from './firebaseConfig';

export type Fb = {
  auth: typeof import('firebase/auth');
  fs: typeof import('firebase/firestore');
  a: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
};
let fb: Promise<Fb> | null = null;

export function firebase(): Promise<Fb> {
  if (!FIREBASE_CONFIG) return Promise.reject(new Error('Firebase não configurado.'));
  fb ??= (async () => {
    const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
    const app = initializeApp(FIREBASE_CONFIG!);
    const a = auth.getAuth(app);
    return { auth, fs, a, db: fs.getFirestore(app) };
  })().catch((e) => { fb = null; throw e; });
  return fb;
}

/** Usuário atual (espera o Firebase restaurar a sessão salva). */
export async function usuarioAtual(): Promise<import('firebase/auth').User | null> {
  const { a, auth } = await firebase();
  await a.authStateReady?.();
  return a.currentUser ?? new Promise((res) => { const off = auth.onAuthStateChanged(a, (u) => { off(); res(u); }); });
}
