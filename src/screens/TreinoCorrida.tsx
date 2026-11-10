// Modo Corrida: fases guiadas (ou cronômetro livre) → registro → cuidados com o joelho.
import { useEffect, useRef, useState } from 'react';
import {
  comecarAgora, naContagem, encerrar, estadoFase, fmtPace, fraseDaFase, gravarCorridaAtiva, informarDor, pace, pausada, pausar,
  pularFase, resumirCorrida, retomar, tempoAtivo, totalPlano, type CorridaAtiva,
} from '../engine/corridaAtiva';
import { proximaCorrida } from '../engine/plano';
import { REGRAS_JOELHO } from '../data/corrida';
import { avisar, falar } from '../lib/alertas';
import { fmtRelogio, useAgora, useWakeLock } from '../lib/ganchos';
import { baixarTreinoEmAndamento, dorCorridaAnterior, salvarCorrida } from '../lib/historico';
import { lerConfigPrograma, salvarConfigPrograma } from '../lib/ajustes';
import { dataPorExtenso, formatarData } from '../lib/datas';
import { Botao } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { Escala, textoDor, textoEsforco } from '../ui/Escala';
import { Confete } from '../ui/Confete';
import { Personagem, Saudacao } from '../ui/Personagem';
import { perfilAtual } from '../lib/perfis';

type Atualizar = (f: (x: CorridaAtiva) => CorridaAtiva) => void;

export function TreinoCorrida({ inicial, aoSair }: { inicial: CorridaAtiva; aoSair: (salvo: boolean) => void }) {
  const [t, setT] = useState(inicial);
  const [cuidado, setCuidado] = useState<{ dor: number; repetiu: boolean; data: string } | null>(null);
  useEffect(() => { gravarCorridaAtiva(t); }, [t]);
  useWakeLock(t.etapa === 'correndo');
  const atualizar: Atualizar = (f) => setT((x) => f(x));

  if (cuidado) return <CuidadoJoelho {...cuidado} aoSair={() => aoSair(true)} />;
  if (t.etapa === 'registro') {
    return <Registro t={t} atualizar={atualizar} aoSair={aoSair} aoDor={(dor, repetiu) => setCuidado({ dor, repetiu, data: t.data })} />;
  }
  return <Correndo t={t} atualizar={atualizar} aoSair={aoSair} />;
}

// ------------------------------------------------------------------ correndo
function Correndo({ t, atualizar, aoSair }: { t: CorridaAtiva; atualizar: Atualizar; aoSair: (s: boolean) => void }) {
  const agora = useAgora(200);
  const e = estadoFase(t, agora);
  const parada = pausada(t);
  const [menu, setMenu] = useState(false);
  const [dor, setDor] = useState(false);
  const ultimaFase = useRef(e.indice);
  const ultimoTique = useRef(-1);

  // avisos: troca de fase (+ 3 s antes) e fim do treino
  useEffect(() => {
    if (t.modo === 'livre' || parada) return;
    if (e.indice !== ultimaFase.current) {
      const recente = e.concluida || e.decorridoFase < 3; // não toca avisos antigos ao reabrir o app
      ultimaFase.current = e.indice;
      if (recente) {
        avisar(e.concluida ? 'sucesso' : 'fase');
        falar(fraseDaFase(e.fase));
      }
      if (e.concluida) atualizar((x) => encerrar(x, Date.now()));
      return;
    }
    const seg = Math.ceil(e.restante);
    if (e.fase && seg <= 3 && seg >= 1 && ultimoTique.current !== seg + e.indice * 1000) {
      ultimoTique.current = seg + e.indice * 1000;
      avisar('tique');
    }
  }, [e.indice, e.restante, e.concluida, e.decorridoFase, e.fase, parada, t.modo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (naContagem(t, agora)) return <Contagem t={t} agora={agora} atualizar={atualizar} aoSair={aoSair} />;

  const decorrido = tempoAtivo(t, agora);
  const tipo = t.modo === 'livre' ? 'trote' : (e.fase?.tipo ?? 'desaquecimento');
  const progressoTotal = t.modo === 'livre' ? 0 : Math.min(1, e.noPlano / totalPlano(t));

  return (
    <div className={`corrida corrida--${tipo} ${parada ? 'corrida--pausada' : ''}`}>
      <header className="corrida__topo">
        <button className="icone-btn" onClick={() => setMenu(true)} aria-label="Encerrar corrida">✕</button>
        <div className="guiado__titulo">
          <strong>{t.titulo}</strong>
          <span className="num">Total {fmtRelogio(decorrido)}</span>
        </div>
        <span className="icone-btn icone-btn--vazio" />
      </header>

      <main className="corrida__centro" aria-live="polite">
        {t.modo === 'livre' ? (
          <>
            <p className="corrida__fase">CORRIDA LIVRE</p>
            <p className="corrida__tempo num">{fmtRelogio(decorrido)}</p>
            <p className="corrida__sub">Corra no seu ritmo · "consigo falar frases"</p>
          </>
        ) : (
          <>
            {e.fase?.bloco && <span className="corrida__bloco">Bloco {e.fase.bloco} de {e.totalBlocos}</span>}
            <p className="corrida__fase" key={e.indice}>{e.fase?.rotulo ?? 'CONCLUÍDO'}</p>
            <p className="corrida__tempo num">{fmtRelogio(e.restante)}</p>
            <div className="corrida__barra-fase" aria-hidden="true">
              <span style={{ width: `${e.fase ? (e.decorridoFase / e.fase.seg) * 100 : 100}%` }} />
            </div>
            {e.proxima && <p className="corrida__sub">A seguir: <strong>{e.proxima.rotulo.toLowerCase()}</strong> · {fmtRelogio(e.proxima.seg)}</p>}
          </>
        )}
        {parada && <p className="corrida__pausa">⏸ Pausado</p>}
        {(t.dorDurante ?? 0) >= 4 && <p className="corrida__alerta">🦵 Trote encerrado hoje: siga caminhando.</p>}
      </main>

      {t.modo === 'guiada' && (
        <div className="corrida__linha" aria-hidden="true">
          <div className="barra-fases barra-fases--grande">
            {t.fases.map((f, i) => <span key={i} className={`barra-fases__seg barra-fases__seg--${f.tipo}`} style={{ flexGrow: f.seg }} />)}
          </div>
          <span className="corrida__marcador" style={{ left: `${progressoTotal * 100}%` }} />
        </div>
      )}

      <footer className="corrida__controles">
        <button className="corrida__lateral" onClick={() => setDor(true)}>🦵<span>Dor no joelho</span></button>
        <button className="corrida__principal" onClick={() => atualizar((x) => (pausada(x) ? retomar(x, Date.now()) : pausar(x, Date.now())))}
          aria-label={parada ? 'Retomar' : 'Pausar'}>
          {parada ? <svg viewBox="0 0 24 24" width="38" height="38"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" /></svg>
            : <svg viewBox="0 0 24 24" width="38" height="38"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" /></svg>}
        </button>
        {t.modo === 'guiada'
          ? <button className="corrida__lateral" onClick={() => atualizar((x) => pularFase(x, Date.now()))} disabled={parada}>⏭️<span>Pular fase</span></button>
          : <button className="corrida__lateral" onClick={() => atualizar((x) => encerrar(x, Date.now()))}>🏁<span>Encerrar</span></button>}
      </footer>

      <Folha aberta={menu} aoFechar={() => setMenu(false)} titulo="Encerrar corrida">
        <MenuEncerrar t={t} atualizar={atualizar} aoSair={aoSair} fechar={() => setMenu(false)} recente={decorrido < 60} />
      </Folha>
      <Folha aberta={dor} aoFechar={() => setDor(false)} titulo="Dor no joelho">
        <DorDurante t={t} atualizar={atualizar} fechar={() => setDor(false)} />
      </Folha>
    </div>
  );
}

function MenuEncerrar({ atualizar, aoSair, fechar, recente }: { t: CorridaAtiva; atualizar: Atualizar; aoSair: (s: boolean) => void; fechar: () => void; recente: boolean }) {
  const [descartar, setDescartar] = useState(false);
  if (recente) {
    return (
      <div className="detalhe">
        <h2 className="detalhe__titulo">Cancelar a corrida?</h2>
        <p className="detalhe__orientacao">Começou há menos de 1 minuto. Se foi sem querer, cancele: nada será salvo.</p>
        <Botao grande className="btn--perigo" onClick={() => { gravarCorridaAtiva(null); aoSair(false); }}>Cancelar corrida</Botao>
        <Botao variante="secundario" onClick={fechar}>Continuar correndo</Botao>
      </div>
    );
  }
  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">Encerrar corrida?</h2>
      {!descartar ? (
        <>
          <p className="detalhe__orientacao">Você vai registrar distância, esforço e dor no joelho.</p>
          <Botao grande cor="corr" onClick={() => { fechar(); atualizar((x) => encerrar(x, Date.now())); }}>Encerrar e registrar</Botao>
          <Botao variante="secundario" onClick={fechar}>Continuar correndo</Botao>
          <Botao variante="fantasma" onClick={() => setDescartar(true)}>Descartar esta corrida</Botao>
        </>
      ) : (
        <>
          <p className="detalhe__orientacao">Nada desta corrida será salvo. Tem certeza?</p>
          <Botao grande className="btn--perigo" onClick={() => { gravarCorridaAtiva(null); aoSair(false); }}>Sim, descartar</Botao>
          <Botao variante="secundario" onClick={() => setDescartar(false)}>Voltar</Botao>
        </>
      )}
    </div>
  );
}

function DorDurante({ t, atualizar, fechar }: { t: CorridaAtiva; atualizar: Atualizar; fechar: () => void }) {
  const [n, setN] = useState<number | undefined>(t.dorDurante);
  const forte = (n ?? 0) >= 4;
  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">Como está o joelho?</h2>
      <p className="detalhe__orientacao">0 = sem dor · 10 = dor máxima</p>
      <Escala de={0} ate={10} valor={n} onChange={setN} rotulo="Dor no joelho" tipo="dor" />
      <p className="sutil">{textoDor(n)}</p>
      {forte && (
        <p className="nota-cuidado">
          Com dor 4 ou mais, o certo é <strong>voltar para a caminhada e encerrar o trote de hoje</strong>.
          O app vai trocar o trote restante por caminhada.
        </p>
      )}
      <Botao grande cor="corr" disabled={n === undefined} onClick={() => {
        atualizar((x) => informarDor(x, n!, Date.now()));
        if (forte) { falar('Hora de caminhar. Trote encerrado por hoje.'); avisar('fase'); }
        fechar();
      }}>{forte ? 'Voltar a caminhar' : 'Registrar e continuar'}</Botao>
    </div>
  );
}

// ------------------------------------------------------------------ registro
function Registro({ t, atualizar, aoSair, aoDor }: {
  t: CorridaAtiva; atualizar: Atualizar; aoSair: (s: boolean) => void; aoDor: (dor: number, repetiu: boolean) => void;
}) {
  const r = resumirCorrida(t, Date.now());
  const [km, setKm] = useState('');
  const [esforco, setEsforco] = useState<number | undefined>();
  const [dor, setDor] = useState<number | undefined>(t.dorDurante);
  const [notas, setNotas] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [descartar, setDescartar] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [confete] = useState(Date.now());
  const dist = parseFloat(km.replace(',', '.'));
  const p = pace(r.duracaoSeg, Number.isFinite(dist) ? dist : undefined);

  return (
    <div className="guiado">
      <div className="guiado__corpo resumo entra">
        <div className="resumo__hero">
          {perfilAtual().personagem ? <Personagem quem={perfilAtual().personagem!} acao="comemora" tamanho={120} className="resumo__personagem" /> : <div className="resumo__trofeu resumo__trofeu--corr">{t.treinoId === 'cardio-leve' ? '🚶' : '🏃'}</div>}
          <h1 className="guiado__h1">{t.treinoId === 'cardio-leve' ? 'Cardio concluído!' : 'Corrida concluída!'}</h1>
          <p className="sutil">{t.titulo} · {t.resumo}</p>
        </div>
        <div className="resumo__grade">
          <div className="stat"><span>Duração</span><strong className="num">{fmtRelogio(r.duracaoSeg)}</strong></div>
          {t.treinoId !== 'cardio-leve' && (
            <div className="stat"><span>Trotando</span><strong className="num">{fmtRelogio(r.troteSeg)}</strong>
            {t.modo === 'guiada' && <small>maior trecho {fmtRelogio(r.maiorTroteSeg)}</small>}</div>
          )}
          <label className="stat stat--input">
            <span>Distância (km)</span>
            <input inputMode="decimal" placeholder="0,0" value={km} onChange={(e) => setKm(e.target.value)} aria-label="Distância em km" />
          </label>
          <div className="stat"><span>Pace médio</span><strong className="num">{fmtPace(p)}</strong></div>
        </div>
        <p className="sutil centro">Distância informada por você (relógio, app ou esteira).</p>

        <div className="campo">
          <span>Esforço percebido (1–10)</span>
          <Escala de={1} ate={10} valor={esforco} onChange={setEsforco} rotulo="Esforço percebido" />
          <small className="sutil">{esforco ? textoEsforco(esforco) : 'Meta: 4–6 (consigo falar frases).'}</small>
        </div>
        <div className="campo">
          <span>Dor no joelho (0–10)</span>
          <Escala de={0} ate={10} valor={dor} onChange={setDor} rotulo="Dor no joelho" tipo="dor" />
          <small className="sutil">{dor === undefined ? 'Opcional, mas ajuda a proteger o joelho: o app ajusta o plano se doer.' : textoDor(dor)}</small>
        </div>
        <label className="campo">
          <span>Nota</span>
          <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Superfície, tênis, como se sentiu…" />
        </label>
      </div>
      <div className="guiado__rodape">
        {erroSalvar && (
          <div className="erro-salvar" role="alert">
            <strong>Não consegui salvar ainda.</strong>
            <span>A corrida continua guardada neste celular — nada foi perdido. Toque em "Tentar de novo".</span>
            <small>Detalhe: {erroSalvar}</small>
            <button className="link" onClick={() => baixarTreinoEmAndamento(t, `corrida-${t.data}.json`)}>Baixar uma cópia da corrida</button>
          </div>
        )}
        <Botao grande cor="corr" disabled={salvando} onClick={async () => {
          setSalvando(true); setErroSalvar(null);
          try {
            const agora = Date.now();
            await salvarCorrida(t, { distanciaKm: Number.isFinite(dist) && dist > 0 ? dist : undefined, esforco, dorJoelho: dor, notas }, agora);
            gravarCorridaAtiva(null);
            if ((dor ?? 0) >= 4) {
              const anterior = await dorCorridaAnterior(t.inicio, t.sessaoId).catch(() => undefined);
              aoDor(dor!, (anterior ?? 0) >= 4);
            } else aoSair(true);
          } catch (e) {
            setErroSalvar(`${(e as Error).name ?? 'Erro'}: ${(e as Error).message ?? e}`.slice(0, 200));
            setSalvando(false);
          }
        }}>{salvando ? 'Salvando…' : erroSalvar ? 'Tentar de novo' : 'Salvar corrida ✅'}</Botao>
        <div className="links-rodape">
          <button className="link" onClick={() => atualizar((x) => ({ ...x, etapa: 'correndo', fim: undefined }))}>Voltar à corrida</button>
          <button className="link link--perigo" onClick={() => setDescartar(true)}>Descartar corrida</button>
        </div>
      </div>
      <Confete disparo={confete} />
      <Folha aberta={descartar} aoFechar={() => setDescartar(false)} titulo="Descartar corrida">
        <div className="detalhe">
          <h2 className="detalhe__titulo">Descartar esta corrida?</h2>
          <p className="detalhe__orientacao">Ela não será salva no histórico. Use se começou sem querer.</p>
          <Botao grande className="btn--perigo" onClick={() => { gravarCorridaAtiva(null); aoSair(false); }}>Sim, descartar</Botao>
          <Botao variante="secundario" onClick={() => setDescartar(false)}>Voltar</Botao>
        </div>
      </Folha>
    </div>
  );
}

// ------------------------------------------------------------------ contagem
function Contagem({ t, agora, atualizar, aoSair }: { t: CorridaAtiva; agora: number; atualizar: Atualizar; aoSair: (s: boolean) => void }) {
  const resta = Math.ceil((t.inicio - agora) / 1000);
  const ultimo = useRef(-1);
  useEffect(() => {
    if (resta === ultimo.current) return;
    ultimo.current = resta;
    if (resta <= 3 && resta >= 1) avisar('tique');
  }, [resta]);
  const cancelado = useRef(false);
  // ao sair da contagem para a corrida (não ao cancelar): som + voz
  useEffect(() => () => { if (!cancelado.current) { avisar('fase'); falar(t.modo === 'livre' ? 'Vamos lá!' : 'Vamos lá! Aquecimento: caminhe leve.'); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="corrida corrida--aquecimento">
      <main className="corrida__centro contagem">
        <Saudacao acao="corrida" frase={`Bora, ${perfilAtual().nome}!`} />
        <p className="rotulo-sup">{t.titulo}</p>
        <p className="corrida__fase">Prepare-se</p>
        <p className="contagem__num num" key={resta}>{Math.max(1, resta)}</p>
        <p className="corrida__sub">{t.modo === 'livre' ? 'O cronômetro começa em instantes' : `Começa com ${t.fases[0]?.rotulo.toLowerCase() ?? 'aquecimento'}`}</p>
      </main>
      <footer className="contagem__acoes">
        <Botao grande variante="secundario" onClick={() => { cancelado.current = true; gravarCorridaAtiva(null); aoSair(false); }}>Cancelar</Botao>
        <Botao grande cor="corr" onClick={() => atualizar((x) => comecarAgora(x, Date.now()))}>Começar agora</Botao>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------ cuidados
function CuidadoJoelho({ dor, repetiu, data, aoSair }: { dor: number; repetiu: boolean; data: string; aoSair: () => void }) {
  const [feito, setFeito] = useState<string | null>(null);
  const [prox, setProx] = useState<string | undefined>();
  useEffect(() => { void lerConfigPrograma().then((c) => setProx(proximaCorrida(c, data))); }, [data]);

  async function recuar() {
    const c = await lerConfigPrograma();
    await salvarConfigPrograma({ ...c, recuoCorrida: (c.recuoCorrida ?? 0) + 1 });
    setFeito('A corrida voltou uma semana no plano. A musculação continua normal.');
  }
  async function trocar() {
    const c = await lerConfigPrograma();
    if (!prox) return;
    await salvarConfigPrograma({ ...c, cardioAlternativo: [...new Set([...(c.cardioAlternativo ?? []), prox])] });
    setFeito(`A corrida de ${dataPorExtenso(prox)} virou cardio sem impacto (bike, elíptico ou caminhada).`);
  }

  return (
    <div className="guiado">
      <div className="guiado__corpo resumo entra">
        <div className="resumo__hero">
          <div className="resumo__trofeu resumo__trofeu--cuidado">🦵</div>
          <h1 className="guiado__h1">Vamos cuidar desse joelho</h1>
          <p className="sutil">Dor {dor}/10 registrada. Corrida salva.</p>
        </div>
        <div className="card cuidado">
          {repetiu ? (
            <p><strong>A dor se repetiu na corrida anterior.</strong> Troque a próxima corrida por bike, elíptico ou caminhada
              e procure uma avaliação profissional (fisioterapeuta ou ortopedista) antes de voltar a trotar.</p>
          ) : (
            <p>Dor a partir de 4 é sinal para reduzir. A recomendação é <strong>repetir a semana anterior de corrida</strong> ou
              <strong> trocar o próximo treino de corrida</strong> por algo sem impacto. Se a dor continuar ou piorar amanhã, procure avaliação.</p>
          )}
        </div>
        {feito ? (
          <p className="nota-recup">✅ {feito}</p>
        ) : (
          <div className="opcoes">
            {prox && (
              <button className={`opcao ${repetiu ? 'opcao--recomendada' : ''}`} onClick={trocar}>
                <strong>Trocar a próxima corrida por cardio sem impacto</strong>
                <span>{dataPorExtenso(prox)} · {formatarData(prox)} · bike, elíptico ou caminhada</span>
              </button>
            )}
            <button className={`opcao ${!repetiu ? 'opcao--recomendada' : ''}`} onClick={recuar}>
              <strong>Repetir a semana anterior de corrida</strong>
              <span>A corrida volta 1 semana; a musculação segue normal</span>
            </button>
          </div>
        )}
        <details className="regras" open>
          <summary>Regras de segurança do joelho</summary>
          <ul>{REGRAS_JOELHO.map((r) => <li key={r}>{r}</li>)}</ul>
        </details>
      </div>
      <div className="guiado__rodape">
        <Botao grande cor="corr" onClick={aoSair}>{feito ? 'Concluir' : 'Agora não'}</Botao>
      </div>
    </div>
  );
}
