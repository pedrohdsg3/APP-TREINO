import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { NavInferior, ORDEM_ABAS, type Aba } from './ui/NavInferior';
import { Hoje, type ModoInicio } from './screens/Hoje';
import { Programa } from './screens/Programa';
import { Duelo } from './screens/Duelo';
import { Evolucao } from './screens/Evolucao';
import { Perfil } from './screens/Perfil';
import { Botao } from './ui/Componentes';
import { TreinoMusculacao } from './screens/TreinoMusculacao';
import { lerTreinoAtivo, montarTreino, type TreinoAtivo } from './engine/treinoAtivo';
import { historicoDe, novoId } from './lib/historico';
import { isoLocal } from './lib/datas';
import { lerConfigPrograma } from './lib/ajustes';
import type { MusculacaoPlanejada, DiaPlanejado } from './engine/plano';
import { TreinoCorrida } from './screens/TreinoCorrida';
import { lerCorridaAtiva, montarCorrida, type CorridaAtiva } from './engine/corridaAtiva';
import { ativarPerfil, listarPerfis, perfilComTreinoEmAndamento, type Perfil as TPerfil } from './lib/perfis';
import { EscolherPerfil } from './screens/EscolherPerfil';
import { publicarAtual } from './lib/duelo';
import { aplicarCorrecoes } from './lib/correcoes';

/** Perfil inicial: quem tem treino em andamento; senão, se só existe um, ele; senão, a tela de escolha. */
function perfilInicial(): TPerfil | null {
  const p = perfilComTreinoEmAndamento() ?? (listarPerfis().length === 1 ? listarPerfis()[0] : null);
  if (p) ativarPerfil(p);
  return p;
}

export function App() {
  const [perfil, setPerfil] = useState<TPerfil | null>(perfilInicial);
  if (!perfil) {
    return <EscolherPerfil aoEscolher={(p) => { ativarPerfil(p); setPerfil(p); }} />;
  }
  return <AppDoPerfil key={perfil.id} aoTrocarPerfil={() => setPerfil(null)} />;
}

function AppDoPerfil({ aoTrocarPerfil }: { aoTrocarPerfil: () => void }) {
  const [aba, setAba] = useState<Aba>('hoje');
  const [direcao, setDirecao] = useState<'esq' | 'dir'>('esq');
  const [aviso, setAviso] = useState<string | null>(null);
  const principal = useRef<HTMLElement>(null);
  const { needRefresh: [temAtualizacao], updateServiceWorker } = useRegisterSW();
  const [treino, setTreino] = useState<TreinoAtivo | null>(lerTreinoAtivo);
  const [corrida, setCorrida] = useState<CorridaAtiva | null>(lerCorridaAtiva);

  async function iniciarMusculacao(m: MusculacaoPlanejada, semana: number) {
    const [historico, cfg] = await Promise.all([historicoDe(m.itens.map((i) => i.exercicioId)), lerConfigPrograma()]);
    setTreino(montarTreino(m, { sessaoId: novoId(), data: isoLocal(), semana, agora: Date.now(), historico, cargasIniciais: cfg.cargasIniciais }));
  }

  function iniciar(p: DiaPlanejado, modo: ModoInicio) {
    if (modo === 'musculacao' || (modo === 'principal' && p.tipoPrincipal === 'musculacao')) return void iniciarMusculacao(p.musculacao!, p.semana);
    const c = modo === 'cardio' ? p.cardio! : p.corrida!;
    const treinoId = c.tipo === 'cardio' ? 'cardio-leve' : c.titulo === 'Cardio sem impacto' ? 'cardio' : c.tipo;
    setCorrida(montarCorrida(c, { sessaoId: novoId(), data: isoLocal(), semana: p.semana, agora: Date.now(), contagemSeg: 5, treinoId }));
  }

  function corridaLivre() {
    setCorrida(montarCorrida(null, { sessaoId: novoId(), data: isoLocal(), agora: Date.now(), contagemSeg: 5, treinoId: 'livre' }));
  }

  const sair = (salvo: boolean, msg: string) => {
    setAba('hoje');
    if (salvo) { setAviso(msg); void publicarAtual(); }
  };

  // mantém o placar online em dia ao abrir o perfil
  useEffect(() => { void aplicarCorrecoes().then(() => publicarAtual()); }, []);

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
    return <TreinoCorrida inicial={corrida} aoSair={(salvo) => { setCorrida(null); sair(salvo, corrida.treinoId === 'cardio-leve' ? 'Cardio salvo! 🚶' : 'Corrida salva! 🏃'); }} />;
  }

  return (
    <div className="app">
      <main ref={principal} className="principal">
        <div key={aba} className={`transicao transicao--${direcao}`}>
          {aba === 'hoje' && <Hoje aoIniciar={iniciar} aoCorridaLivre={corridaLivre} aoTrocarPerfil={aoTrocarPerfil} />}
          {aba === 'programa' && <Programa />}
          {aba === 'duelo' && <Duelo />}
          {aba === 'evolucao' && <Evolucao />}
          {aba === 'perfil' && <Perfil aoTrocarPerfil={aoTrocarPerfil} />}
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
