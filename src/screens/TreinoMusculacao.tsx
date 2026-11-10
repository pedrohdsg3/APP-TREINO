// Modo Musculação: aquecimento → exercício a exercício (séries, carga, descanso) → resumo.
import { useCallback, useEffect, useRef, useState } from 'react';
import { EXERCICIOS } from '../data/musculacao';
import { faseDaSemana, prescricao } from '../engine/plano';
import { fmtKg, passoCarga } from '../engine/progressao';
import {
  AQUECIMENTO, adicionarSerie, ajustarDescanso, ajustarSerie, alternativas, concluirSerie, desfazerSerie,
  exConcluido, fazerAgora, gravarTreinoAtivo, proximoPendente, pularExercicio, removerSerie, resumir,
  seriesFeitas, treinoConcluido, trocarExercicio, type TreinoAtivo,
} from '../engine/treinoAtivo';
import { baixarTreinoEmAndamento, historicoDe, salvarTreino, sessaoAnteriorDoTreino } from '../lib/historico';
import { avisar } from '../lib/alertas';
import { fmtRelogio, useAgora, useWakeLock } from '../lib/ganchos';
import { lerPrefs } from '../lib/prefs';
import { formatarData } from '../lib/datas';
import { Anel, Botao, Chip } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { Stepper } from '../ui/Stepper';
import { Confete } from '../ui/Confete';
import { IcHalter, IcTrofeu } from '../ui/Icones';
import { Escala } from '../ui/Escala';
import { Personagem, Saudacao } from '../ui/Personagem';
import { perfilAtual } from '../lib/perfis';
import type { Sessao } from '../db';

const DORES = ['Joelho', 'Ombro', 'Cotovelo', 'Punho', 'Lombar', 'Quadril', 'Outro'];

export function TreinoMusculacao({ inicial, aoSair }: { inicial: TreinoAtivo; aoSair: (salvo: boolean) => void }) {
  const [t, setT] = useState(inicial);
  const agora = useAgora(250);
  const [confete, setConfete] = useState(0);
  const [prAviso, setPrAviso] = useState<string | null>(null);
  useWakeLock(t.etapa !== 'resumo');

  // grava a cada mudança (retoma se o app fechar)
  useEffect(() => { gravarTreinoAtivo(t); }, [t]);

  const atualizar = useCallback((f: (x: TreinoAtivo) => TreinoAtivo) => setT((x) => f(x)), []);

  if (t.etapa === 'aquecimento') return <Aquecimento t={t} atualizar={atualizar} agora={agora} aoSair={aoSair} />;
  if (t.etapa === 'resumo') return <ResumoTreino t={t} atualizar={atualizar} aoSair={aoSair} />;

  return (
    <>
      <Exercicios t={t} atualizar={atualizar} agora={agora} aoSair={aoSair}
        aoPR={(txt) => { setPrAviso(txt); setConfete(Date.now()); avisar('sucesso'); setTimeout(() => setPrAviso(null), 3200); }} />
      {prAviso && <div className="pr-aviso" role="status"><IcTrofeu tamanho={22} /> {prAviso}</div>}
      <Confete disparo={confete} />
    </>
  );
}

type PropsEtapa = { t: TreinoAtivo; atualizar: (f: (x: TreinoAtivo) => TreinoAtivo) => void; aoSair: (salvo: boolean) => void };

// ------------------------------------------------------------------ cabeçalho
function Topo({ t, agora, aoMenu, aoLista }: { t: TreinoAtivo; agora: number; aoMenu: () => void; aoLista?: () => void }) {
  const total = t.exercicios.length;
  return (
    <header className="guiado__topo">
      <button className="icone-btn" onClick={aoMenu} aria-label="Encerrar ou descartar treino">✕</button>
      <div className="guiado__titulo">
        <strong>{t.titulo}</strong>
        <span className="num">⏱️ {fmtRelogio((agora - t.inicio) / 1000)}</span>
      </div>
      {aoLista ? <button className="icone-btn" onClick={aoLista} aria-label="Lista de exercícios">☰</button> : <span className="icone-btn" />}
      <div className="progresso-ex" aria-label={`Exercício ${t.atual + 1} de ${total}`}>
        {t.exercicios.map((e, i) => (
          <span key={i} className={`progresso-ex__seg ${exConcluido(e) ? 'feito' : ''} ${i === t.atual && t.etapa === 'exercicio' ? 'atual' : ''}`}
            style={{ ['--p' as string]: `${(seriesFeitas(e) / e.series.length) * 100}%` }} />
        ))}
      </div>
    </header>
  );
}

function MenuSair({ aberto, fechar, t, atualizar, aoSair }: PropsEtapa & { aberto: boolean; fechar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const algumaFeita = t.exercicios.some((e) => seriesFeitas(e) > 0);
  return (
    <Folha aberta={aberto} aoFechar={() => { setConfirmar(false); fechar(); }} titulo="Encerrar treino">
      <div className="detalhe">
        <h2 className="detalhe__titulo">{algumaFeita ? 'Encerrar treino?' : 'Cancelar treino?'}</h2>
        {!algumaFeita ? (
          <>
            <p className="detalhe__orientacao">Nenhuma série foi feita ainda. Se abriu sem querer, é só cancelar: nada será salvo.</p>
            <Botao grande className="btn--perigo" onClick={() => { gravarTreinoAtivo(null); aoSair(false); }}>Cancelar treino</Botao>
            <Botao variante="secundario" onClick={fechar}>Continuar</Botao>
          </>
        ) : !confirmar ? (
          <>
            <p className="detalhe__orientacao">O treino fica salvo se você fechar o app; dá para continuar depois.</p>
            {algumaFeita && <Botao grande onClick={() => { fechar(); atualizar((x) => ({ ...x, etapa: 'resumo', fim: Date.now(), descanso: undefined })); }}>Finalizar e ver resumo</Botao>}
            <Botao variante="secundario" onClick={fechar}>Continuar treinando</Botao>
            <Botao variante="fantasma" onClick={() => setConfirmar(true)}>Descartar este treino</Botao>
          </>
        ) : (
          <>
            <p className="detalhe__orientacao">As séries registradas neste treino serão apagadas. Tem certeza?</p>
            <Botao grande className="btn--perigo" onClick={() => { gravarTreinoAtivo(null); aoSair(false); }}>Sim, descartar</Botao>
            <Botao variante="secundario" onClick={() => setConfirmar(false)}>Voltar</Botao>
          </>
        )}
      </div>
    </Folha>
  );
}

// ------------------------------------------------------------------ aquecimento
function Aquecimento({ t, atualizar, agora, aoSair }: PropsEtapa & { agora: number }) {
  const [menu, setMenu] = useState(false);
  const feitos = t.aquecimento.filter(Boolean).length;
  return (
    <div className="guiado">
      <Topo t={t} agora={agora} aoMenu={() => setMenu(true)} />
      <div className="guiado__corpo entra">
        <Saudacao acao="halter" frase={`Bora, ${perfilAtual().nome}! 💪`} />
        <p className="rotulo-sup">Antes de começar</p>
        <h1 className="guiado__h1">Aquecimento · 5 min 🔥</h1>
        <p className="sutil">Prepara articulações e músculos e reduz o risco de lesão.</p>
        <ul className="checklist">
          {AQUECIMENTO.map((txt, i) => (
            <li key={i}>
              <button className={`check-item ${t.aquecimento[i] ? 'feito' : ''}`} aria-pressed={t.aquecimento[i]}
                onClick={() => atualizar((x) => ({ ...x, aquecimento: x.aquecimento.map((v, k) => (k === i ? !v : v)) }))}>
                <span className="check-item__caixa" aria-hidden="true"><Check /></span>
                <span>{txt}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="guiado__rodape">
        <Botao grande onClick={() => atualizar((x) => ({ ...x, etapa: 'exercicio' }))}>
          {feitos === AQUECIMENTO.length ? 'Começar treino 💪' : 'Começar treino'}
        </Botao>
        <div className="links-rodape">
          {feitos < AQUECIMENTO.length && <button className="link" onClick={() => atualizar((x) => ({ ...x, etapa: 'exercicio' }))}>Pular aquecimento</button>}
          <button className="link link--perigo" onClick={() => { gravarTreinoAtivo(null); aoSair(false); }}>Cancelar</button>
        </div>
      </div>
      <MenuSair aberto={menu} fechar={() => setMenu(false)} t={t} atualizar={atualizar} aoSair={aoSair} />
    </div>
  );
}

function Check() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path className="check-traco" d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
}

// ------------------------------------------------------------------ exercícios
function Exercicios({ t, atualizar, agora, aoSair, aoPR }: PropsEtapa & { agora: number; aoPR: (txt: string) => void }) {
  const e = t.exercicios[t.atual];
  const ex = EXERCICIOS[e.item.exercicioId];
  const proximaPendente = e.series.findIndex((s) => !s.feita);
  const [foco, setFoco] = useState(proximaPendente === -1 ? 0 : proximaPendente);
  const [menu, setMenu] = useState(false);
  const [lista, setLista] = useState(false);
  const [trocar, setTrocar] = useState(false);
  const [nota, setNota] = useState(false);
  const [mostraDica, setMostraDica] = useState(false);

  // ao trocar de exercício, foca na primeira série pendente
  useEffect(() => {
    const i = t.exercicios[t.atual].series.findIndex((s) => !s.feita);
    setFoco(i === -1 ? 0 : i);
    setMostraDica(false);
  }, [t.atual, t.exercicios[t.atual]?.item.exercicioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const descansoDe = (exId: string, padrao: number) => lerPrefs().descansos[exId] ?? padrao;

  function concluir(si: number) {
    const descanso = descansoDe(e.item.exercicioId, e.item.descanso);
    const { treino, pr } = concluirSerie(t, t.atual, si, Date.now(), descanso);
    let novo = treino;
    // terminou o exercício? avança para o próximo pendente (o descanso continua valendo)
    if (exConcluido(novo.exercicios[t.atual])) {
      const prox = proximoPendente(novo);
      if (prox !== undefined) novo = { ...novo, atual: prox };
    } else {
      const prox = novo.exercicios[t.atual].series.findIndex((s) => !s.feita);
      setFoco(prox);
    }
    atualizar(() => novo);
    if (pr) aoPR(`PR! ${ex.nome}: ${fmtKg(pr.carga)} × ${pr.reps}`);
    if (treinoConcluido(novo)) {
      avisar('sucesso');
      atualizar((x) => ({ ...x, etapa: 'resumo', fim: Date.now() }));
    }
  }

  const unidadeReps = ex.medida === 'segundos' ? 's' : 'reps';
  const ant = e.anterior;

  return (
    <div className="guiado">
      <Topo t={t} agora={agora} aoMenu={() => setMenu(true)} aoLista={() => setLista(true)} />

      <div className="guiado__corpo" key={e.item.exercicioId + t.atual} aria-hidden={t.descanso ? true : undefined}>
        <div className="ex-cab entra-ex">
          <div className="ex-cab__linha">
            <Chip cor="musc"><IcHalter tamanho={15} /> {ex.grupo}</Chip>
            <span className="rotulo-sup">Exercício {t.atual + 1} de {t.exercicios.length}</span>
          </div>
          <h1 className="guiado__h1">{ex.nome}</h1>
          <p className="ex-cab__presc">{prescricao(e.item)} · descanso {descansoDe(e.item.exercicioId, e.item.descanso)} s
            {e.item.cargaPct < 100 && <span className="sutil"> · carga ~{e.item.cargaPct}%</span>}
          </p>
          {e.planejado !== e.item.exercicioId && <p className="sutil">Substituindo {EXERCICIOS[e.planejado].nome}</p>}
          <button className="dica" onClick={() => setMostraDica((v) => !v)} aria-expanded={mostraDica}>
            💡 {mostraDica ? ex.dica : 'Dica técnica'}
          </button>
          {ant ? (
            <div className={`ultima ${e.sugestao?.subir ? 'ultima--subir' : ''}`}>
              <span className="ultima__rotulo">Última vez{e.anteriorData ? ` · ${formatarData(e.anteriorData)}` : ''}</span>
              <span className="ultima__valores num">{ant.map((s) => (ex.semCarga ? `${s.reps}` : `${fmtNum(s.carga)}×${s.reps}`)).join(' · ')}</span>
              {e.sugestao && <span className="ultima__sug">{e.sugestao.subir ? '⬆️ ' : ''}{e.sugestao.texto}</span>}
            </div>
          ) : (
            <div className="ultima"><span className="ultima__sug">Primeira vez: escolha uma carga confortável (esforço 7–8/10). Ela vira a referência para as próximas.</span></div>
          )}
        </div>

        <ol className="series">
          {e.series.map((s, si) => {
            const ativo = si === foco && !s.feita;
            return (
              <li key={si} className={`serie ${s.feita ? 'serie--feita' : ''} ${ativo ? 'serie--ativa' : ''}`}>
                {ativo ? (
                  <div className="serie__edicao">
                    <p className="serie__titulo">Série {si + 1} de {e.series.length}</p>
                    <div className="serie__campos">
                      {!ex.semCarga && (
                        <Stepper rotulo="Carga" sufixo="kg" passo={passoCarga(ex)} valor={s.carga}
                          onChange={(v) => atualizar((x) => ajustarSerie(x, x.atual, si, 'carga', v))} />
                      )}
                      <Stepper rotulo={ex.medida === 'segundos' ? 'Tempo' : 'Repetições'} sufixo={unidadeReps} passo={ex.medida === 'segundos' ? 5 : 1} valor={s.reps}
                        onChange={(v) => atualizar((x) => ajustarSerie(x, x.atual, si, 'reps', v))} />
                    </div>
                    <button className="btn-concluir" onClick={() => concluir(si)}>
                      <Check /> Concluir série
                    </button>
                  </div>
                ) : (
                  <button className="serie__resumo" onClick={() => (s.feita ? atualizar((x) => desfazerSerie(x, x.atual, si)) : setFoco(si))}
                    aria-label={s.feita ? `Série ${si + 1} feita. Tocar para desfazer` : `Editar série ${si + 1}`}>
                    <span className="serie__num">{si + 1}</span>
                    <span className="serie__val num">
                      {ex.semCarga ? '' : `${fmtNum(s.carga)} kg × `}{s.reps} {unidadeReps}
                    </span>
                    {s.pr && <span className="selo-pr">🏆 PR</span>}
                    <span className={`serie__check ${s.feita ? 'on' : ''}`} aria-hidden="true"><Check /></span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <div className="series__acoes">
          <button className="link" onClick={() => atualizar((x) => adicionarSerie(x, x.atual))}>+ Série</button>
          {e.series.length > 1 && !e.series.at(-1)!.feita && <button className="link link--sutil" onClick={() => atualizar((x) => removerSerie(x, x.atual))}>− Série</button>}
        </div>

        <div className="acoes-ex">
          <button onClick={() => setTrocar(true)}>🔄<span>Trocar</span></button>
          <button onClick={() => setNota(true)}>📝<span>{e.nota || e.dores.length ? 'Nota ✓' : 'Nota / dor'}</span></button>
          <button onClick={() => atualizar(pularExercicio)} disabled={t.exercicios.filter((x) => !exConcluido(x)).length <= 1}>⏭️<span>Pular</span></button>
        </div>
      </div>

      <div className="guiado__rodape">
        {exConcluido(e) || seriesFeitas(e) > 0 ? (
          <Botao grande variante={exConcluido(e) ? 'primario' : 'secundario'} onClick={() => {
            const prox = proximoPendente(t);
            if (prox === undefined) atualizar((x) => ({ ...x, etapa: 'resumo', fim: Date.now(), descanso: undefined }));
            else atualizar((x) => ({ ...x, atual: prox }));
          }}>
            {proximoPendente(t) === undefined ? 'Finalizar treino' : 'Próximo exercício →'}
          </Botao>
        ) : null}
      </div>

      {t.descanso && <Descanso t={t} agora={agora} atualizar={atualizar} />}

      <MenuSair aberto={menu} fechar={() => setMenu(false)} t={t} atualizar={atualizar} aoSair={aoSair} />

      <Folha aberta={lista} aoFechar={() => setLista(false)} titulo="Exercícios do treino">
        <div className="detalhe">
          <h2 className="detalhe__titulo">Exercícios</h2>
          <p className="sutil">Toque em "Fazer agora" para mudar a ordem (ex.: aparelho ocupado).</p>
          <ol className="lista-exercicios">
            {t.exercicios.map((x, i) => (
              <li key={i} className={i === t.atual ? 'atual' : ''}>
                <span className="lista-exercicios__num">{exConcluido(x) ? '✓' : i + 1}</span>
                <div className="lista-exercicios__info">
                  <strong>{EXERCICIOS[x.item.exercicioId].nome}</strong>
                  <span>{seriesFeitas(x)}/{x.series.length} séries</span>
                </div>
                {i !== t.atual && !exConcluido(x) && (
                  <button className="mini-btn" onClick={() => { atualizar((y) => fazerAgora(y, i)); setLista(false); }}>Fazer agora</button>
                )}
                {i === t.atual && <span className="sutil">atual</span>}
              </li>
            ))}
          </ol>
        </div>
      </Folha>

      <TrocarExercicio aberto={trocar} fechar={() => setTrocar(false)} t={t} atualizar={atualizar} />
      <NotaDor aberto={nota} fechar={() => setNota(false)} t={t} atualizar={atualizar} />
    </div>
  );
}

function fmtNum(n: number) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }

// ------------------------------------------------------------------ descanso
function Descanso({ t, agora, atualizar }: { t: TreinoAtivo; agora: number; atualizar: PropsEtapa['atualizar'] }) {
  const d = t.descanso!;
  const resta = Math.max(0, (d.fim - agora) / 1000);
  const acabou = resta <= 0;
  const avisado = useRef<number | null>(null);
  const tique = useRef<number>(-1);

  useEffect(() => {
    const seg = Math.ceil(resta);
    if (!acabou && seg <= 3 && seg >= 1 && tique.current !== seg) { tique.current = seg; avisar('tique'); }
    if (acabou && avisado.current !== d.fim) {
      avisado.current = d.fim;
      // só toca se o fim foi agora (não ao reabrir o app muito depois)
      if (agora - d.fim < 5000) avisar('fim');
    }
  }, [resta, acabou, d.fim, agora]);

  // fecha sozinho 4 s depois de acabar
  useEffect(() => {
    if (!acabou) return;
    const id = setTimeout(() => atualizar((x) => (x.descanso?.fim === d.fim ? { ...x, descanso: undefined } : x)), Math.max(0, 4000 - (agora - d.fim)));
    return () => clearTimeout(id);
  }, [acabou]); // eslint-disable-line react-hooks/exhaustive-deps

  const e = t.exercicios[t.atual];
  const si = e.series.findIndex((s) => !s.feita);
  const ex = EXERCICIOS[e.item.exercicioId];
  const prox = si >= 0 ? e.series[si] : undefined;

  return (
    <div className={`descanso ${acabou ? 'descanso--fim' : ''}`} role="timer" aria-live="polite">
      <p className="rotulo-sup">{acabou ? 'Descanso concluído' : 'Descanso'}</p>
      <Anel progresso={acabou ? 1 : 1 - resta / d.total} tamanho={232} espessura={12} cor={acabou ? 'corr' : 'musc'}>
        <div className="descanso__tempo num">{acabou ? 'Bora! 💪' : fmtRelogio(resta)}</div>
      </Anel>
      {prox && (
        <p className="descanso__prox">
          A seguir: <strong>{ex.nome}</strong><br />
          Série {si + 1} · {ex.semCarga ? '' : `${fmtNum(prox.carga)} kg × `}{prox.reps} {ex.medida === 'segundos' ? 's' : 'reps'}
        </p>
      )}
      <div className="descanso__btns">
        <button className="redondo" onClick={() => atualizar((x) => ajustarDescanso(x, -15, Date.now()))} disabled={acabou}>−15s</button>
        <button className="redondo redondo--principal" onClick={() => atualizar((x) => ({ ...x, descanso: undefined }))}>{acabou ? 'Continuar' : 'Pular'}</button>
        <button className="redondo" onClick={() => atualizar((x) => ajustarDescanso(x, 15, Date.now()))} disabled={acabou}>+15s</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ trocar / nota
function TrocarExercicio({ aberto, fechar, t, atualizar }: { aberto: boolean; fechar: () => void; t: TreinoAtivo; atualizar: PropsEtapa['atualizar'] }) {
  const e = t.exercicios[t.atual];
  const opcoes = alternativas(e.item.exercicioId, e.planejado);
  const sugeridas = new Set(EXERCICIOS[e.planejado].alternativas ?? []);
  return (
    <Folha aberta={aberto} aoFechar={fechar} titulo="Trocar exercício">
      <div className="detalhe">
        <h2 className="detalhe__titulo">Trocar exercício</h2>
        <p className="sutil">Aparelho ocupado ou desconforto? Escolha uma alternativa. As séries planejadas continuam as mesmas.</p>
        {seriesFeitas(e) > 0 && <p className="aviso-campo">As séries já feitas deste exercício serão substituídas.</p>}
        <div className="opcoes">
          {opcoes.map((id) => (
            <button key={id} className="opcao" onClick={async () => {
              const h = await historicoDe([id]);
              atualizar((x) => trocarExercicio(x, x.atual, id, h[id]));
              fechar();
            }}>
              <strong>{EXERCICIOS[id].nome}</strong>
              <span>{id === e.planejado ? 'original do plano' : sugeridas.has(id) ? 'recomendado se o joelho incomodar' : EXERCICIOS[id].grupo}</span>
            </button>
          ))}
        </div>
      </div>
    </Folha>
  );
}

function NotaDor({ aberto, fechar, t, atualizar }: { aberto: boolean; fechar: () => void; t: TreinoAtivo; atualizar: PropsEtapa['atualizar'] }) {
  const e = t.exercicios[t.atual];
  const alternar = (p: string) => atualizar((x) => ({
    ...x, exercicios: x.exercicios.map((y, i) => (i === x.atual ? { ...y, dores: y.dores.includes(p) ? y.dores.filter((d) => d !== p) : [...y.dores, p] } : y)),
  }));
  return (
    <Folha aberta={aberto} aoFechar={fechar} titulo="Nota do exercício">
      <div className="detalhe">
        <h2 className="detalhe__titulo">Nota · {EXERCICIOS[e.item.exercicioId].nome}</h2>
        <label className="campo">
          <span>Observação</span>
          <textarea rows={3} value={e.nota ?? ''} placeholder="Ex.: banco na posição 4, pegada mais aberta…"
            onChange={(ev) => { const v = ev.target.value; atualizar((x) => ({ ...x, exercicios: x.exercicios.map((y, i) => (i === x.atual ? { ...y, nota: v } : y)) })); }} />
        </label>
        <p className="campo"><span>Dor ou desconforto?</span></p>
        <div className="chips-sel">
          {DORES.map((p) => (
            <button key={p} className={`chip-sel ${e.dores.includes(p) ? 'on' : ''}`} aria-pressed={e.dores.includes(p)} onClick={() => alternar(p)}>{p}</button>
          ))}
        </div>
        {e.dores.length > 0 && <p className="nota-cuidado">Se doer, reduza a carga ou a amplitude, ou troque o exercício. Dor aguda é sinal para parar. 🙏</p>}
        <Botao onClick={fechar}>Pronto</Botao>
      </div>
    </Folha>
  );
}

// ------------------------------------------------------------------ resumo
function ResumoTreino({ t, atualizar, aoSair }: PropsEtapa) {
  const r = resumir(t, Date.now());
  const [esforco, setEsforco] = useState<number | undefined>();
  const [notas, setNotas] = useState('');
  const [anterior, setAnterior] = useState<Sessao | undefined>();
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [confete, setConfete] = useState(0);
  useEffect(() => { void sessaoAnteriorDoTreino(t.treinoId, t.data, t.sessaoId).then(setAnterior); }, [t.treinoId, t.data, t.sessaoId]);
  useEffect(() => { if (treinoConcluido(t) || r.prs.length) setConfete(Date.now()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const completo = treinoConcluido(t);

  const difVol = anterior?.volumeKg ? ((r.volumeKg - anterior.volumeKg) / anterior.volumeKg) * 100 : undefined;
  const difTempo = anterior?.duracaoSeg ? r.duracaoSeg - anterior.duracaoSeg : undefined;

  return (
    <div className="guiado">
      <div className="guiado__corpo resumo entra">
        <div className="resumo__hero">
          {perfilAtual().personagem ? <Personagem quem={perfilAtual().personagem!} acao="comemora" tamanho={120} className="resumo__personagem" /> : <div className="resumo__trofeu"><IcTrofeu tamanho={44} /></div>}
          <h1 className="guiado__h1">{completo ? 'Treino concluído!' : 'Treino parcial registrado'}</h1>
          <p className="sutil">{t.titulo} · {formatarData(t.data)}</p>
        </div>

        <div className="resumo__grade">
          <div className="stat"><span>Tempo</span><strong className="num">{fmtRelogio(r.duracaoSeg)}</strong>
            {difTempo !== undefined && <small>{difTempo <= 0 ? '−' : '+'}{fmtRelogio(Math.abs(difTempo))} vs. anterior</small>}</div>
          <div className="stat"><span>Volume</span><strong className="num">{Math.round(r.volumeKg).toLocaleString('pt-BR')} kg</strong>
            {difVol !== undefined && <small className={difVol >= 0 ? 'positivo' : ''}>{difVol >= 0 ? '+' : ''}{difVol.toFixed(0)}% vs. anterior</small>}</div>
          <div className="stat"><span>Séries</span><strong className="num">{r.seriesFeitas}/{r.seriesTotal}</strong></div>
          <div className="stat stat--ouro"><span>PRs</span><strong className="num">{r.prs.length} {r.prs.length ? '🏆' : ''}</strong></div>
        </div>
        {anterior && <p className="sutil centro">Comparado com {anterior.treinoId === t.treinoId ? 'o último ' + t.titulo : 'o treino anterior'} em {formatarData(anterior.data)}.</p>}

        {r.prs.length > 0 && (
          <div className="prs">
            {r.prs.map((p) => (
              <div key={p.exercicioId} className="prs__item">
                <span>🏆</span>
                <div><strong>{EXERCICIOS[p.exercicioId].nome}</strong>
                  <small>{fmtKg(p.carga)} × {p.reps} · {p.tipo === '1rm' ? `1RM est. ${fmtKg(Math.round(p.e1rm * 10) / 10)}` : `maior carga para ${p.reps}+ reps`}</small></div>
              </div>
            ))}
          </div>
        )}

        <div className="campo">
          <span>Percepção de esforço (1–10)</span>
          <Escala de={1} ate={10} valor={esforco} onChange={setEsforco} rotulo="Percepção de esforço" />
          <small className="sutil">{esforco ? (esforco <= 4 ? 'Leve' : esforco <= 6 ? 'Moderado' : esforco <= 8 ? 'Forte' : 'Máximo') : `Fase ${faseDaSemana(t.semana)}: o ideal é ${({ 'Adaptação': '~6', Base: '7–8', 'Progressão': '8–9', 'Construção': '7–8', 'Intensificação': '8–9', 'Recuperação': '6–7' } as Record<string, string>)[faseDaSemana(t.semana)] ?? '7–8'}.`}</small>
        </div>
        <label className="campo">
          <span>Nota livre</span>
          <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Como foi o treino?" />
        </label>
      </div>
      <div className="guiado__rodape">
        {erroSalvar && (
          <div className="erro-salvar" role="alert">
            <strong>Não consegui salvar ainda.</strong>
            <span>Seu treino continua guardado neste celular — nada foi perdido. Toque em "Tentar de novo".</span>
            <small>Detalhe: {erroSalvar}</small>
            <button className="link" onClick={() => baixarTreinoEmAndamento(t, `treino-${t.data}-${t.treinoId}.json`)}>Baixar uma cópia do treino</button>
          </div>
        )}
        <Botao grande disabled={salvando} onClick={async () => {
          setSalvando(true); setErroSalvar(null);
          try {
            await salvarTreino(t, { esforco, notas }, Date.now());
            gravarTreinoAtivo(null);
            aoSair(true);
          } catch (e) {
            setErroSalvar(`${(e as Error).name ?? 'Erro'}: ${(e as Error).message ?? e}`.slice(0, 200));
            setSalvando(false);
          }
        }}>{salvando ? 'Salvando…' : erroSalvar ? 'Tentar de novo' : 'Salvar treino ✅'}</Botao>
        {!completo && <button className="link" onClick={() => atualizar((x) => ({ ...x, etapa: 'exercicio', fim: undefined }))}>Voltar ao treino</button>}
      </div>
      <Confete disparo={confete} />
    </div>
  );
}
