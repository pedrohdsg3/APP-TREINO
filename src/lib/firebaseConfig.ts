// Configuração do app Web do Firebase (Console → Configurações do projeto → Seus apps → Web).
// Esses valores NÃO são segredos: identificam o projeto. A proteção dos dados vem das
// regras do Firestore (arquivo firestore.rules) e do login anônimo.
export const FIREBASE_CONFIG: {
  apiKey: string; authDomain: string; projectId: string; storageBucket?: string; messagingSenderId?: string; appId: string;
} | null = null;
