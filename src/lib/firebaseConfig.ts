// Configuração do app Web do Firebase (Console → Configurações do projeto → Seus apps → Web).
// Esses valores NÃO são segredos: identificam o projeto. A proteção dos dados vem das
// regras do Firestore (arquivo firestore.rules) e do login anônimo.
export const FIREBASE_CONFIG: {
  apiKey: string; authDomain: string; projectId: string; storageBucket?: string; messagingSenderId?: string; appId: string;
} | null = {
  apiKey: 'AIzaSyA4-rItLJi3gouA6MLyYZ7PMl3KmqOReds',
  authDomain: 'app-treino-8a536.firebaseapp.com',
  projectId: 'app-treino-8a536',
  storageBucket: 'app-treino-8a536.firebasestorage.app',
  messagingSenderId: '1060746383461',
  appId: '1:1060746383461:web:e5948f90b2fa1f787cb68c',
};
