import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { NavInferior, ORDEM_ABAS, type Aba } from './ui/NavInferior';
import { Hoje } from './screens/Hoje';
import { Programa } from './screens/Programa';
import { Evolucao } from './screens/Evolucao';
import { Perfil } from './screens/Perfil';
import { Botao } from './ui/Componentes';
import { TreinoMusculacao } from './screens/TreinoMusculacao';
import { lerTreinoAtivo, montarTreino, type TreinoAtivo } from './engine/treinoAtivo';
import { historicoDe, novoId } from './lib/historico';
import { isoLocal } from './lib/datas';
import type { MusculacaoPlanejada, DiaPlanejado } from './engine/plano';
import { TreinoCorrida } from './screens/TreinoCorrida';
import { lerCorridaAtiva, montarCorrida, type CorridaAtiva } from './engine/corridaAtiva';

export function App() {
  const [aba, setAba] = useState<Aba>('hoje');
  const [direcao, setDirecao] = useState<'esq' | 'dir'>('esq');
  const [aviso, setAviso] = useState<string | null>(null);
  const principal = useRef<HTMLElement>(null);
  const { needRefresh: [temAtualizacao], updateServiceWorker } = useRegisterSW();
  const [treino, setTreino] = useState<TreinoAtivo | null>(lerTreinoAtivo);
  const [corrida, setCorrida] = useState<CorridaAtiva | null>(lerCorridaAtiva);

  async function iniciarMusculacao(m: MusculacaoPlanejada, semana: number) {
    const historico = await historicoDe(m.itens.map((i) => i.exercicioId));
    setTreino(montarTreino(m, { sessaoId: novoId(), data: isoLocal(), semana, agora: Date.now(), historico }));
  }

  function iniciar(p: DiaPlanejado, modo: 'principal' | 'musculacao') {
    if (modo === 'musculacao' || p.tipoPrincipal === 'musculacao') return void iniciarMusculacao(p.musculacao!, p.semana);
    const c = p.corrida!;
    setCorrida(montarCorrida(c, { sessaoId: novoId(), data: isoLocal(), semana: p.semana, agora: Date.now(), contagemSeg: 5, treinoId: c.titulo === 'Cardio sem impacto' ? 'cardio' : c.tipo }));
  }

  function corridaLivre() {
    setCorrida(montarCorrida(null, { sessaoId: novoId(), data: isoLocal(), agora: Date.now(), contagemSeg: 5, treinoId: 'livre' }));
  }

  const sair = (salvo: boolean, msg: string) => {
    setAba('hoje');
    if (salvo) setAviso(msg);
  };

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

  if (treino) {
    return <TreinoMusculacao inicial={treino} aoSair={(salvo) => { setTreino(null); sair(salvo, 'Treino salvo! Bom trabalho 💪'); }} />;
  }
  if (corrida) {
    return <TreinoCorrida inicial={corrida} aoSair={(salvo) => { setCorrida(null); sair(salvo, 'Corrida salva! 🏃'); }} />;
  }

  return (
    <div className="app">
      <main ref={principal} className="principal">
        <div key={aba} className={`transicao transicao--${direcao}`}>
          {aba === 'hoje' && <Hoje aoIniciar={iniciar} aoCorridaLivre={corridaLivre} />}
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
