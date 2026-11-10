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
import { ativarPerfil, listarPerfis, perfilAtual, perfilComTreinoEmAndamento, type Perfil as TPerfil } from './lib/perfis';
import { contaSalva, definirSemConta, enviarAgora, iniciarSync, loginDisponivel, pararSync, perfilDaConta, sairDaConta, usaSemConta, verificarConta, type Conta } from './lib/conta';
import { TelaLogin, TelaVincular } from './screens/Entrada';
import { entrarOuCriarSala, salaDoPerfil, SALA_CASAL } from './lib/nuvem';
import { EscolherPerfil } from './screens/EscolherPerfil';
import { publicarAtual } from './lib/duelo';
import { aplicarCorrecoes } from './lib/correcoes';

type Fase =
  | { t: 'login' }
  | { t: 'vincular'; conta: Conta }
  | { t: 'escolher' }
  | { t: 'perfil'; perfil: TPerfil; conta?: Conta };

/** Fase inicial: treino em andamento > conta salva > modo sem conta > login. */
function faseInicial(): Fase {
  const conta = loginDisponivel ? contaSalva() : null;
  const andamento = perfilComTreinoEmAndamento();
  if (andamento && (!andamento.uid || andamento.uid === conta?.uid)) { ativarPerfil(andamento); return { t: 'perfil', perfil: andamento, conta: andamento.uid ? conta! : undefined }; }
  if (conta) {
    const p = perfilDaConta(conta.uid);
    if (p) { ativarPerfil(p); return { t: 'perfil', perfil: p, conta }; }
    return { t: 'vincular', conta };
  }
  if (loginDisponivel && !usaSemConta()) return { t: 'login' };
  const unicos = listarPerfis().filter((p) => !p.uid);
  if (unicos.length === 1) { ativarPerfil(unicos[0]); return { t: 'perfil', perfil: unicos[0] }; }
  return { t: 'escolher' };
}

export function App() {
  const [fase, setFase] = useState<Fase>(faseInicial);
  const abrir = (perfil: TPerfil, conta?: Conta) => { ativarPerfil(perfil); setFase({ t: 'perfil', perfil, conta }); };

  // confere a sessão do Google (também recebe a volta de um login por redirecionamento)
  useEffect(() => {
    if (!loginDisponivel || fase.t === 'escolher') return;
    let vivo = true;
    verificarConta().then((c) => {
      if (!vivo) return;
      setFase((f) => {
        if (f.t === 'login' && c) return { t: 'vincular', conta: c };
        if (f.t === 'perfil' && f.conta && !c && !perfilComTreinoEmAndamento()) { pararSync(); return { t: 'login' }; }
        if (f.t === 'vincular' && !c) return { t: 'login' };
        return f;
      });
    }).catch(() => { /* offline: segue com a conta salva */ });
    return () => { vivo = false; };
  }, [fase.t]);

  async function sair() {
    try { await sairDaConta(); } catch { /* offline: sai mesmo assim */ }
    setFase({ t: 'login' });
  }

  if (fase.t === 'login') return <TelaLogin aoEntrar={(conta) => setFase({ t: 'vincular', conta })} aoSemConta={() => { definirSemConta(true); setFase(faseInicial()); }} />;
  if (fase.t === 'vincular') return <TelaVincular conta={fase.conta} aoPronto={(p) => abrir(p, fase.conta)} aoSair={() => void sair()} />;
  if (fase.t === 'escolher') {
    return <EscolherPerfil aoEscolher={(p) => abrir(p)} aoEntrar={loginDisponivel ? () => { definirSemConta(false); setFase({ t: 'login' }); } : undefined} />;
  }
  const conta = fase.conta;
  return <AppDoPerfil key={fase.perfil.id} conta={conta} aoSairConta={() => void sair()} aoTrocarPerfil={() => setFase({ t: 'escolher' })} />;
}

function AppDoPerfil({ aoTrocarPerfil: trocarLocal, conta, aoSairConta }: { aoTrocarPerfil: () => void; conta?: Conta; aoSairConta: () => void }) {
  const [aba, setAba] = useState<Aba>('hoje');
  // com conta, o perfil é o da conta: o botão de perfil leva à aba Perfil (onde fica "Sair da conta")
  const aoTrocarPerfil = conta ? () => trocar('perfil') : trocarLocal;
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
    if (salvo) { setAviso(msg); void publicarAtual(); void enviarAgora(); }
  };

  // mantém o placar online em dia ao abrir o perfil
  useEffect(() => { void aplicarCorrecoes().then(() => publicarAtual()); }, []);

  // sincronização com a conta + sala de duelo do casal
  useEffect(() => {
    if (!conta) return;
    iniciarSync(conta.uid);
    const p = perfilAtual();
    if ((p.personagem === 'pedro' || p.personagem === 'yana') && !salaDoPerfil()) {
      void entrarOuCriarSala(SALA_CASAL).then(() => publicarAtual()).catch(() => { /* tenta na próxima abertura */ });
    }
    return () => pararSync();
  }, [conta]);

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
          {aba === 'perfil' && <Perfil aoTrocarPerfil={trocarLocal} conta={conta} aoSairConta={aoSairConta} />}
        </div>
      </main>
      {temAtualizacao && (
        <div className="atualizacao" role="status">
          <span>Nova versão disponível</span>
          <Botao variante="secundario" onClick={() => updateServiceWorker(true)}>Atualizar</Botao>
        </div>
      )}
      {aviso && <div className="toast" role="status">{aviso}</div>}
      <NavInferior ativa={aba} onChange={trocar} aoTrocarPerfil={aoTrocarPerfil} />
    </div>
  );
}
