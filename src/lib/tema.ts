// Tema (auto/claro/escuro). Guardado no localStorage por ser preferência de aparelho;
// os dados de treino vão para o IndexedDB (src/db.ts).
import { useEffect, useState } from 'react';

export type Tema = 'auto' | 'claro' | 'escuro';
const CHAVE = 'treino.tema';

function ler(): Tema {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === 'claro' || v === 'escuro') return v;
  } catch { /* sem storage: segue no automático */ }
  return 'auto';
}

function aplicar(t: Tema) {
  const root = document.documentElement;
  if (t === 'auto') delete root.dataset.theme;
  else root.dataset.theme = t === 'claro' ? 'light' : 'dark';
  const escuro = t === 'escuro' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute('content', escuro ? '#111317' : '#F7F6F3');
    if (t !== 'auto') m.removeAttribute('media');
  });
  root.style.colorScheme = escuro ? 'dark' : 'light';
}

export function iniciarTema() { aplicar(ler()); }

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(ler);
  useEffect(() => {
    aplicar(tema);
    try { localStorage.setItem(CHAVE, tema); } catch { /* ignora */ }
    if (tema !== 'auto') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const f = () => aplicar('auto');
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [tema]);
  return [tema, setTema];
}
