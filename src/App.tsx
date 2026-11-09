import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { NavInferior, ORDEM_ABAS, type Aba } from './ui/NavInferior';
import { Hoje } from './screens/Hoje';
import { Programa } from './screens/Programa';
import { Evolucao } from './screens/Evolucao';
import { Perfil } from './screens/Perfil';
import { Botao } from './ui/Componentes';

export function App() {
  const [aba, setAba] = useState<Aba>('hoje');
  const [direcao, setDirecao] = useState<'esq' | 'dir'>('esq');
  const [aviso, setAviso] = useState<string | null>(null);
  const principal = useRef<HTMLElement>(null);
  const { needRefresh: [temAtualizacao], updateServiceWorker } = useRegisterSW();

  function trocar(nova: Aba) {
    if (nova === aba) { principal.current?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setDirecao(ORDEM_ABAS.indexOf(nova) > ORDEM_ABAS.indexOf(aba) ? 'esq' : 'dir');
    setAba(nova);
  }

  useEffect(() => { principal.current?.scrollTo({ top: 0 }); }, [aba]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <div className="app">
      <main ref={principal} className="principal">
        <div key={aba} className={`transicao transicao--${direcao}`}>
          {aba === 'hoje' && <Hoje aoIniciar={() => setAviso('O treino guiado chega nas etapas 3 e 4 💪')} />}
          {aba === 'programa' && <Programa />}
          {aba === 'evolucao' && <Evolucao />}
          {aba === 'perfil' && <Perfil />}
        </div>
      </main>
      {temAtualizacao && (
        <div className="atualizacao" role="status">
          <span>Nova versão disponível</span>
          <Botao variante="secundario" onClick={() => updateServiceWorker(true)}>Atualizar</Botao>
        </div>
      )}
      {aviso && <div className="toast" role="status">{aviso}</div>}
      <NavInferior ativa={aba} onChange={trocar} />
    </div>
  );
}
