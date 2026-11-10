// Evolução: metas e conquistas, força, corrida e corpo.
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RegistroCorpo, type Sessao } from '../db';
import { EXERCICIOS } from '../data/musculacao';
import {
  conquistas, corridasComData, exerciciosComHistorico, exerciciosQueProgrediram, historicoExercicio, juntarDatas,
  mapaConsistencia, maiorTroteContinuo, mediaMovel, pesos, porSemana, progressoMeta, recordes, semanaIdx,
  sequenciaMaxima, tendenciaSemanal, valorAtual, volumePorGrupo, volumeSemanal, type MetaPessoal,
  type SerieComData, type CorridaComData,
} from '../engine/evolucao';
import { planoDaData, posicao, dataDoDia, totalSemanasCalendario, diasComTreino, treinosPorSemana } from '../engine/plano';
import { fmtKg } from '../engine/progressao';
import { fmtPace } from '../engine/corridaAtiva';
import { useConfigPrograma } from '../lib/ajustes';
import { salvarMetas, useMetas } from '../lib/metas';
import { novoId } from '../lib/historico';
import { dataPorExtenso, diasEntre, formatarData, isoLocal, somarDias } from '../lib/datas';
import { fmtRelogio } from '../lib/ganchos';
import { Botao, Card, EstadoVazio, Segmentado } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { infoModalidade } from '../data/atividades';
import { GraficoBarras, GraficoLinha, rotuloSemana } from '../ui/Graficos';
import { IlustraGrafico, IlustraHalterCorrida } from '../ui/Ilustracoes';

type Aba = 'metas' | 'forca' | 'corrida' | 'corpo';
const ABA_CHAVE = 'treino.evolucao.aba';

const num = (v: number, casas = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: casas });
const kg = (v: number) => `${num(v)} kg`;
const kgCurto = (v: number) => (v >= 1000 ? `${num(v / 1000)} t` : `${num(v, 0)}`);
const minutos = (seg: number) => `${num(seg / 60, 0)} min`;

export function Evolucao() {
  const [aba, setAbaEstado] = useState<Aba>(() => { try { return (localStorage.getItem(ABA_CHAVE) as Aba) || 'metas'; } catch { return 'metas'; } });
  const setAba = (a: Aba) => { setAbaEstado(a); try { localStorage.setItem(ABA_CHAVE, a); } catch { /* ignora */ } };
  const cfg = useConfigPrograma();
  const sessoes = useLiveQuery(() => db.sessoes.toArray(), []);
  const seriesBrutas = useLiveQuery(() => db.series.toArray(), []);
  const corridasBrutas = useLiveQuery(() => db.corridas.toArray(), []);
  const corpo = useLiveQuery(() => db.corpo.toArray(), []);
  const metas = useMetas();

  const dados = useMemo(() => {
    if (!sessoes || !seriesBrutas || !corridasBrutas || !corpo) return null;
    const cardioIds = new Set(sessoes.filter((x) => x.tipo === 'cardio').map((x) => x.id));
    return {
      sessoes, series: juntarDatas(seriesBrutas, sessoes), corpo,
      corridas: corridasComData(corridasBrutas.filter((c) => !cardioIds.has(c.sessaoId)), sessoes),
      cardios: corridasComData(corridasBrutas.filter((c) => cardioIds.has(c.sessaoId)), sessoes),
    };
  }, [sessoes, seriesBrutas, corridasBrutas, corpo]);

  return (
    <div className="tela">
      <header className="cabecalho">
        <h1>Evolução</h1>
        <p className="cabecalho__sub">Metas, cargas, corrida e corpo</p>
      </header>
      <Segmentado<Aba> rotulo="Seção" valor={aba} onChange={setAba} opcoes={[
        { valor: 'metas', rotulo: 'Metas' }, { valor: 'forca', rotulo: 'Força' },
        { valor: 'corrida', rotulo: 'Corrida' }, { valor: 'corpo', rotulo: 'Corpo' },
      ]} />
      {dados && cfg && metas && (
        <div key={aba} className="evolucao entra">
          {aba === 'metas' && <AbaMetas d={dados} inicio={cfg.inicio} semanas={totalSemanasCalendario(cfg)} metas={metas} irPara={setAba} cfg={cfg} />}
          {aba === 'forca' && <AbaForca d={dados} inicio={cfg.inicio} semanas={totalSemanasCalendario(cfg)} />}
          {aba === 'corrida' && <AbaCorrida d={dados} inicio={cfg.inicio} semanas={totalSemanasCalendario(cfg)} />}
          {aba === 'corpo' && <AbaCorpo corpo={dados.corpo} pesoAlvo={metas.pesoAlvo} />}
        </div>
      )}
    </div>
  );
}

interface Dados { sessoes: Sessao[]; series: SerieComData[]; corridas: CorridaComData[]; cardios: CorridaComData[]; corpo: RegistroCorpo[] }

const semanaAtualIdx = (inicio: string, total: number) => Math.min(total - 1, Math.max(0, semanaIdx(inicio, isoLocal())));

// ============================================================ METAS
function AbaMetas({ d, inicio, semanas, metas, irPara, cfg }: {
  d: Dados; inicio: string; semanas: number; metas: NonNullable<ReturnType<typeof useMetas>>; irPara: (a: Aba) => void;
  cfg: NonNullable<ReturnType<typeof useConfigPrograma>>;
}) {
  const hoje = isoLocal();
  const [nova, setNova] = useState(false);
  const [registrar, setRegistrar] = useState<MetaPessoal | null>(null);
  const [celula, setCelula] = useState<string | null>(null);
  const ps = pesos(d.corpo);
  const pesoAtual = ps.at(-1)?.valor;
  const trote = maiorTroteContinuo(d.corridas);
  const pos = posicao(cfg, hoje);
  const iniSemana = pos.estado === 'durante' ? dataDoDia(cfg, pos.semanaCal, 0) : inicio;
  const naSemana = (data: string) => data >= iniSemana && data <= somarDias(iniSemana, 6);
  const feitosSemana = new Set(d.sessoes.filter((s) => s.status !== 'pulado' && s.tipo !== 'cardio' && naSemana(s.data)).map((s) => s.data)).size;
  const nTreinos = treinosPorSemana();
  const cardioSemana = d.cardios.filter((c) => naSemana(c.data)).reduce((x, c) => x + c.duracaoSeg, 0);
  const cardioPlano = Array.from({ length: 7 }, (_, i) => { const p = planoDaData(cfg, somarDias(iniSemana, i)); return (p?.cardio ?? (p?.corrida?.tipo === 'cardio' ? p.corrida : undefined))?.totalSeg ?? 0; }).reduce((a, b) => a + b, 0);
  const minCorridaSemana = d.corridas.filter((c) => naSemana(c.data)).reduce((s, c) => s + c.duracaoSeg, 0);
  const minCorridaPlano = Array.from({ length: 7 }, (_, i) => { const c = planoDaData(cfg, somarDias(iniSemana, i))?.corrida; return c && c.tipo !== 'cardio' ? c.totalSeg : 0; }).reduce((a, b) => a + b, 0);
  const progrediram = exerciciosQueProgrediram(d.series);
  const lista = conquistas({ ...d, inicio, hoje, pesoAlvo: metas.pesoAlvo, sequenciaMax: sequenciaMaxima(d.sessoes), planejado: diasComTreino() });
  const mapa = mapaConsistencia(d.sessoes, inicio, semanas, hoje, diasComTreino());

  return (
    <div className="tela">
      <Card className="meta-peso">
        <div className="meta-peso__topo">
          <h3 className="card__titulo">🎯 Peso-alvo</h3>
          <button className="link" onClick={() => irPara('corpo')}>{metas.pesoAlvo ? 'Registrar peso ›' : 'Definir ›'}</button>
        </div>
        {metas.pesoAlvo ? (
          <BarraMeta inicial={ps[0]?.valor} alvo={metas.pesoAlvo} atual={pesoAtual} formatar={kg} cor="musc" vazio="Registre seu peso na aba Corpo." />
        ) : <p className="sutil">Defina seu peso-alvo (ex.: 90 kg) e registre seu peso toda semana.</p>}
      </Card>

      <h3 className="secao">Metas do programa</h3>
      <div className="metas-auto">
        <MetaAuto emoji="🏃" titulo="30 min trotando sem parar" valor={fmtRelogio(trote)} meta="30:00" p={trote / 1800} cor="corr" />
        <MetaAuto emoji="💪" titulo="Treinos desta semana" valor={`${feitosSemana}`} meta={`${nTreinos}`} p={feitosSemana / nTreinos} cor="musc" />
        <MetaAuto emoji="⏱️" titulo="Minutos de corrida na semana" valor={minutos(minCorridaSemana)} meta={minutos(minCorridaPlano)} p={minCorridaPlano ? minCorridaSemana / minCorridaPlano : 0} cor="corr" />
        <MetaAuto emoji="🚶" titulo="Cardio leve na semana (opcional)" valor={minutos(cardioSemana)} meta={minutos(cardioPlano)} p={cardioPlano ? cardioSemana / cardioPlano : 0} cor="corr" />
        <MetaAuto emoji="📈" titulo="Exercícios com carga maior que no início" valor={`${progrediram}`} meta={`${exerciciosComHistorico(d.series).length || '—'}`} p={exerciciosComHistorico(d.series).length ? progrediram / exerciciosComHistorico(d.series).length : 0} cor="musc" />
      </div>

      <div className="secao-linha">
        <h3 className="secao">Minhas metas</h3>
        <button className="mini-btn" onClick={() => setNova(true)}>+ Nova meta</button>
      </div>
      {metas.pessoais.length === 0 ? (
        <p className="sutil">Crie metas com um número para acompanhar, como "Supino 80 kg", "Cintura 95 cm" ou "Correr 5 km".</p>
      ) : metas.pessoais.map((m) => (
        <Card key={m.id} className="meta-pessoal">
          <div className="meta-peso__topo">
            <strong>{m.titulo}</strong>
            <button className="mini-btn" onClick={() => setRegistrar(m)}>Registrar</button>
          </div>
          <BarraMeta inicial={m.inicial} alvo={m.alvo} atual={valorAtual(m)} formatar={(v) => `${num(v, 2)} ${m.unidade}`} cor="musc" />
          {m.registros.length > 1 && (
            <GraficoLinha titulo={m.titulo} altura={140} series={[{ nome: m.titulo, pontos: m.registros, cor: 'musc' }]}
              formatar={(v) => num(v, 1)} referencia={{ valor: m.alvo, rotulo: 'meta' }} />
          )}
        </Card>
      ))}

      <h3 className="secao">Conquistas</h3>
      <div className="conquistas">
        {lista.map((c) => (
          <div key={c.id} className={`conquista ${c.obtida ? 'obtida' : ''}`} title={c.descricao}>
            <span className="conquista__emoji" aria-hidden="true">{c.emoji}</span>
            <strong>{c.titulo}</strong>
            <span>{c.obtida ? 'Conquistada' : c.descricao}</span>
            {!c.obtida && c.progresso !== undefined && c.progresso > 0 && <i className="conquista__barra" style={{ width: `${c.progresso * 100}%` }} />}
          </div>
        ))}
      </div>

      <h3 className="secao">Consistência</h3>
      <Card className="mapa">
        <div className="mapa__cab" aria-hidden="true"><span />{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => <span key={i}>{l}</span>)}</div>
        {mapa.map((semana, w) => (
          <div key={w} className="mapa__linha">
            <span className="mapa__rot">{w + 1}</span>
            {semana.map((c, dd) => {
              const data = somarDias(inicio, w * 7 + dd);
              return <button key={dd} className={`mapa__cel mapa__cel--${c} ${data === hoje ? 'hoje' : ''} ${celula === data ? 'foco' : ''}`}
                aria-label={`${formatarData(data)}: ${c}`} onClick={() => setCelula(celula === data ? null : data)} />;
            })}
          </div>
        ))}
        <p className="mapa__leitura" aria-live="polite">
          {celula ? `${dataPorExtenso(celula)}: ${({ feito: 'treino feito ✅', parcial: 'treino parcial', pulado: 'pulado', vazio: 'sem registro', futuro: 'ainda não chegou', descanso: 'descanso 🌿' } as const)[mapa.flat()[diasIdx(inicio, celula)]]}` : 'Toque num dia para ver.'}
        </p>
        <div className="legenda">
          <span><i className="ponto mapa__cel--feito" /> Feito</span>
          <span><i className="ponto mapa__cel--parcial" /> Parcial</span>
          <span><i className="ponto mapa__cel--pulado" /> Pulado</span>
          <span><i className="ponto mapa__cel--vazio" /> Sem registro</span>
          {diasComTreino().some((x) => !x) && <span><i className="ponto mapa__cel--descanso" /> Descanso</span>}
        </div>
      </Card>

      <NovaMeta aberta={nova} fechar={() => setNova(false)} />
      <RegistrarMeta meta={registrar} fechar={() => setRegistrar(null)} />
    </div>
  );
}

const diasIdx = (inicio: string, data: string) => diasEntre(inicio, data);

function MetaAuto({ emoji, titulo, valor, meta, p, cor }: { emoji: string; titulo: string; valor: string; meta: string; p: number; cor: 'musc' | 'corr' }) {
  return (
    <div className="meta-auto">
      <span className="meta-auto__emoji" aria-hidden="true">{emoji}</span>
      <div className="meta-auto__info">
        <span>{titulo}</span>
        <strong className="num">{valor} <small>/ {meta}</small></strong>
        <div className="barra-meta" aria-hidden="true"><i className={`barra-meta__fill--${cor}`} style={{ width: `${Math.min(1, p) * 100}%` }} /></div>
      </div>
      {p >= 1 && <span aria-label="concluída">✅</span>}
    </div>
  );
}

function BarraMeta({ inicial, alvo, atual, formatar, cor, vazio }: { inicial?: number; alvo: number; atual?: number; formatar: (v: number) => string; cor: 'musc' | 'corr'; vazio?: string }) {
  if (atual === undefined || inicial === undefined) return <p className="sutil">{vazio ?? 'Sem registros ainda.'}</p>;
  const p = progressoMeta(inicial, alvo, atual);
  const falta = Math.abs(alvo - atual);
  const chegou = p >= 1;
  return (
    <div className="barra-meta-bloco">
      <div className="barra-meta-bloco__nums">
        <div><span>Início</span><strong className="num">{formatar(inicial)}</strong></div>
        <div className="centro"><span>Atual</span><strong className="num destaque">{formatar(atual)}</strong></div>
        <div className="dir"><span>Meta</span><strong className="num">{formatar(alvo)}</strong></div>
      </div>
      <div className="barra-meta barra-meta--grande" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
        <i className={`barra-meta__fill--${cor}`} style={{ width: `${p * 100}%` }} />
      </div>
      <p className="sutil">{chegou ? 'Meta atingida! 🎉' : `${Math.round(p * 100)}% do caminho · faltam ${formatar(falta)}`}</p>
    </div>
  );
}

function NovaMeta({ aberta, fechar }: { aberta: boolean; fechar: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [unidade, setUnidade] = useState('kg');
  const [inicial, setInicial] = useState('');
  const [alvo, setAlvo] = useState('');
  const n = (s: string) => parseFloat(s.replace(',', '.'));
  const ok = titulo.trim() && Number.isFinite(n(inicial)) && Number.isFinite(n(alvo));
  return (
    <Folha aberta={aberta} aoFechar={fechar} titulo="Nova meta">
      <div className="detalhe">
        <h2 className="detalhe__titulo">Nova meta</h2>
        <label className="campo"><span>O que você quer alcançar?</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Supino 80 kg, Cintura 95 cm" /></label>
        <div className="campos-2">
          <label className="campo"><span>Valor hoje</span><input inputMode="decimal" value={inicial} onChange={(e) => setInicial(e.target.value)} placeholder="60" /></label>
          <label className="campo"><span>Meta</span><input inputMode="decimal" value={alvo} onChange={(e) => setAlvo(e.target.value)} placeholder="80" /></label>
        </div>
        <label className="campo"><span>Unidade</span><input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="kg, cm, km, min…" /></label>
        <Botao grande disabled={!ok} onClick={async () => {
          const hoje = isoLocal();
          await salvarMetas((m) => ({ ...m, pessoais: [...m.pessoais, { id: novoId(), titulo: titulo.trim(), unidade: unidade.trim(), inicial: n(inicial), alvo: n(alvo), registros: [{ data: hoje, valor: n(inicial) }], criada: hoje }] }));
          setTitulo(''); setInicial(''); setAlvo('');
          fechar();
        }}>Criar meta</Botao>
      </div>
    </Folha>
  );
}

function RegistrarMeta({ meta, fechar }: { meta: MetaPessoal | null; fechar: () => void }) {
  const [valor, setValor] = useState('');
  const [data, setData] = useState(isoLocal());
  const [apagar, setApagar] = useState(false);
  const v = parseFloat(valor.replace(',', '.'));
  return (
    <Folha aberta={!!meta} aoFechar={() => { setApagar(false); fechar(); }} titulo="Registrar meta">
      {meta && (
        <div className="detalhe">
          <h2 className="detalhe__titulo">{meta.titulo}</h2>
          <p className="detalhe__orientacao">Atual: {num(valorAtual(meta), 2)} {meta.unidade} · meta {num(meta.alvo, 2)} {meta.unidade}</p>
          <div className="campos-2">
            <label className="campo"><span>Novo valor ({meta.unidade})</span><input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} autoFocus /></label>
            <label className="campo"><span>Data · {formatarData(data)}</span><input type="date" value={data} onChange={(e) => e.target.value && setData(e.target.value)} /></label>
          </div>
          <Botao grande disabled={!Number.isFinite(v)} onClick={async () => {
            await salvarMetas((m) => ({ ...m, pessoais: m.pessoais.map((x) => (x.id === meta.id ? { ...x, registros: [...x.registros.filter((r) => r.data !== data), { data, valor: v }] } : x)) }));
            setValor(''); fechar();
          }}>Salvar registro</Botao>
          {[...meta.registros].reverse().slice(0, 6).map((r) => <p key={r.data} className="sutil">{formatarData(r.data)} · {num(r.valor, 2)} {meta.unidade}</p>)}
          {!apagar ? <button className="link link--perigo" onClick={() => setApagar(true)}>Excluir meta</button> : (
            <div className="links-rodape">
              <button className="link link--perigo" onClick={async () => { await salvarMetas((m) => ({ ...m, pessoais: m.pessoais.filter((x) => x.id !== meta.id) })); setApagar(false); fechar(); }}>Excluir mesmo</button>
              <button className="link link--sutil" onClick={() => setApagar(false)}>Não</button>
            </div>
          )}
        </div>
      )}
    </Folha>
  );
}

// ============================================================ FORÇA
function AbaForca({ d, inicio, semanas }: { d: Dados; inicio: string; semanas: number }) {
  const exs = exerciciosComHistorico(d.series);
  const [sel, setSel] = useState<string | undefined>(exs[0]);
  if (!d.series.length) {
    return <EstadoVazio ilustracao={<IlustraHalterCorrida />} titulo="Sem treinos de musculação ainda" texto="Depois do primeiro treino você acompanha cargas, 1RM estimado, volume e recordes 🏆." />;
  }
  const atual = semanaAtualIdx(inicio, semanas);
  const vol = volumeSemanal(d.series, inicio, semanas);
  const iniSem = somarDias(inicio, atual * 7);
  const grupos = volumePorGrupo(d.series, iniSem, somarDias(iniSem, 6));
  const maxSeries = Math.max(1, ...grupos.map((g) => g.series));
  const exId = sel && exs.includes(sel) ? sel : exs[0];
  const h = historicoExercicio(d.series, exId);
  const melhor = h.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), h[0]);
  const volEx = volumeSemanal(d.series, inicio, semanas, exId);
  const recs = recordes(d.series);

  return (
    <div className="tela">
      <Card>
        <h3 className="card__titulo">Volume semanal de musculação</h3>
        <p className="sutil">Soma de carga × repetições. Semana atual: <strong>{kgCurto(vol[atual])} kg</strong></p>
        <GraficoBarras titulo="Volume semanal (kg)" cor="musc" destaque={atual} formatar={kgCurto}
          barras={vol.map((v, i) => ({ rotulo: rotuloSemana(i), valor: v, detalhe: `Semana ${i + 1}` }))} />
      </Card>

      <Card>
        <h3 className="card__titulo">Séries por grupo muscular · semana {atual + 1}</h3>
        {grupos.length === 0 ? <p className="sutil">Nenhuma série nesta semana ainda.</p> : (
          <ul className="grupos">
            {grupos.map((g) => (
              <li key={g.grupo}>
                <span className="grupos__nome">{g.grupo}</span>
                <span className="grupos__barra"><i style={{ width: `${(g.series / maxSeries) * 100}%` }} /></span>
                <span className="grupos__val num">{g.series} <small>· {kgCurto(g.volume)} kg</small></span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="card__titulo">Por exercício</h3>
        <label className="campo">
          <span className="sr-only">Exercício</span>
          <select className="seletor" value={exId} onChange={(e) => setSel(e.target.value)}>
            {exs.map((id) => <option key={id} value={id}>{EXERCICIOS[id].nome}</option>)}
          </select>
        </label>
        <div className="stats-3">
          <div><span>Melhor série</span><strong className="num">{melhor ? `${num(melhor.melhor.carga)}×${melhor.melhor.reps}` : '—'}</strong></div>
          <div><span>1RM estimado</span><strong className="num">{melhor ? kg(Math.round(melhor.e1rm * 10) / 10) : '—'}</strong></div>
          <div><span>Sessões</span><strong className="num">{h.length}</strong></div>
        </div>
        <GraficoLinha nota="Carga máxima por treino (kg)" titulo={`Carga máxima · ${EXERCICIOS[exId].nome}`} rotuloTabela="Carga máx." formatar={(v) => num(v)}
          series={[{ nome: 'Carga máxima', pontos: h.map((x) => ({ data: x.data, valor: x.cargaMax })), cor: 'musc' }]} />
        {h.length > 1 && (
          <>
            <GraficoLinha nota="1RM estimado (Epley, kg)" titulo="1RM estimado" rotuloTabela="1RM est." formatar={(v) => num(v)} altura={150}
              series={[{ nome: '1RM estimado', pontos: h.map((x) => ({ data: x.data, valor: Math.round(x.e1rm * 10) / 10 })), cor: 'musc' }]} />
          </>
        )}
        <GraficoBarras nota="Volume semanal deste exercício (kg)" titulo="Volume semanal do exercício" cor="musc" destaque={atual} formatar={kgCurto} altura={130}
          barras={volEx.map((v, i) => ({ rotulo: rotuloSemana(i), valor: v, detalhe: `Semana ${i + 1}` }))} />
      </Card>

      <Card>
        <h3 className="card__titulo">🏆 Recordes pessoais</h3>
        {recs.length === 0 ? <p className="sutil">Seus recordes aparecem aqui.</p> : (
          <ul className="recordes">
            {recs.map((r) => (
              <li key={r.exercicioId}>
                <div><strong>{EXERCICIOS[r.exercicioId].nome}</strong><span>{formatarData(r.data)}</span></div>
                <div className="dir"><strong className="num">{fmtKg(r.carga)} × {r.reps}</strong><span>1RM {kg(Math.round(r.e1rm * 10) / 10)}</span></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================================ CORRIDA
function AbaCorrida({ d, inicio, semanas }: { d: Dados; inicio: string; semanas: number }) {
  if (!d.corridas.length && !d.cardios.length && !d.sessoes.some((x) => x.tipo === 'atividade')) {
    return <EstadoVazio ilustracao={<IlustraGrafico />} titulo="Sem corridas ainda" texto="Depois da primeira corrida você vê distância, tempo trotando, pace e a dor no joelho ao longo das semanas." />;
  }
  const atual = semanaAtualIdx(inicio, semanas);
  const c = d.corridas;
  const totalKm = c.reduce((s, x) => s + (x.distanciaKm ?? 0), 0);
  const trote = maiorTroteContinuo(c);
  const minSem = porSemana(c, inicio, semanas, (x) => x.duracaoSeg / 60);
  const kmSem = porSemana(c, inicio, semanas, (x) => x.distanciaKm ?? 0);
  const comPace = c.filter((x) => x.paceSegKm);
  const comDor = c.filter((x) => x.dorJoelho !== undefined);
  const porDia = (f: (x: typeof c[number]) => number | undefined) => {
    const m = new Map<string, number>();
    for (const x of c) { const v = f(x); if (v !== undefined) m.set(x.data, Math.max(m.get(x.data) ?? 0, v)); }
    return [...m.entries()].map(([data, valor]) => ({ data, valor }));
  };

  return (
    <div className="tela">
      <div className="stats-3 stats-3--cards">
        <div><span>Maior trote contínuo</span><strong className="num">{fmtRelogio(trote)}</strong><small>meta 30:00</small></div>
        <div><span>Distância total</span><strong className="num">{num(totalKm)} km</strong></div>
        <div><span>Corridas</span><strong className="num">{c.length}</strong></div>
      </div>

      <Card>
        <h3 className="card__titulo">Maior trecho contínuo de trote</h3>
        <GraficoLinha nota="Minutos, por corrida" titulo="Maior trote contínuo (min)" rotuloTabela="Minutos" formatar={(v) => num(v, 1)} dominioY={[0, 32]}
          referencia={{ valor: 30, rotulo: 'meta 30 min' }}
          series={[{ nome: 'Trote contínuo', pontos: porDia((x) => (x.maiorTroteSeg ?? 0) / 60), cor: 'corr' }]} />
      </Card>

      <Card>
        <h3 className="card__titulo">Minutos de corrida por semana</h3>
        <GraficoBarras titulo="Minutos por semana" cor="corr" destaque={atual} formatar={(v) => num(v, 0)}
          barras={minSem.map((v, i) => ({ rotulo: rotuloSemana(i), valor: v, detalhe: `Semana ${i + 1}` }))} />
      </Card>

      {d.sessoes.some((x) => x.tipo === 'atividade') && <OutrasAtividades sessoes={d.sessoes.filter((x) => x.tipo === 'atividade')} />}

      {d.cardios.length > 0 && (
        <Card>
          <h3 className="card__titulo">🚶 Cardio leve por semana</h3>
          <GraficoBarras titulo="Minutos de cardio leve por semana" cor="corr" destaque={atual} formatar={(v) => num(v, 0)}
            barras={porSemana(d.cardios, inicio, semanas, (x) => x.duracaoSeg / 60).map((v, i) => ({ rotulo: rotuloSemana(i), valor: v, detalhe: `Semana ${i + 1}` }))} />
        </Card>
      )}

      <Card>
        <h3 className="card__titulo">Distância por semana</h3>
        {totalKm === 0 ? <p className="sutil">Informe a distância ao registrar a corrida para ver este gráfico.</p> : (
          <GraficoBarras titulo="Km por semana" cor="corr" destaque={atual} formatar={(v) => num(v, 1)}
            barras={kmSem.map((v, i) => ({ rotulo: rotuloSemana(i), valor: v, detalhe: `Semana ${i + 1}` }))} />
        )}
      </Card>

      {comPace.length > 0 && (
        <Card>
          <h3 className="card__titulo">Pace médio</h3>
          <GraficoLinha nota="min/km (menor = mais rápido). A progressão do plano é por tempo e esforço, não por pace." titulo="Pace médio (min/km)" rotuloTabela="Pace" formatar={(v) => fmtPace(v).replace(' /km', '')}
            series={[{ nome: 'Pace', pontos: comPace.map((x) => ({ data: x.data, valor: x.paceSegKm! })), cor: 'corr' }]} />
        </Card>
      )}

      {comDor.length > 0 && (
        <Card>
          <h3 className="card__titulo">🦵 Dor no joelho</h3>
          <GraficoLinha nota="0 = sem dor · a partir de 4 o app sugere reduzir" titulo="Dor no joelho (0–10)" rotuloTabela="Dor" formatar={(v) => num(v, 0)} dominioY={[0, 10]} nMarcas={5}
            referencia={{ valor: 4, rotulo: 'atenção ≥ 4' }}
            series={[{ nome: 'Dor', pontos: porDia((x) => x.dorJoelho), cor: 'coral' }]} />
        </Card>
      )}
    </div>
  );
}

// ============================================================ CORPO
function AbaCorpo({ corpo, pesoAlvo }: { corpo: RegistroCorpo[]; pesoAlvo?: number }) {
  const [data, setData] = useState(isoLocal());
  const [peso, setPeso] = useState('');
  const [medidas, setMedidas] = useState(false);
  const [cintura, setCintura] = useState('');
  const [braco, setBraco] = useState('');
  const [coxa, setCoxa] = useState('');
  const [editAlvo, setEditAlvo] = useState(false);
  const [alvoTxt, setAlvoTxt] = useState(pesoAlvo ? String(pesoAlvo).replace('.', ',') : '');
  const [apagar, setApagar] = useState<string | null>(null);
  const n = (s: string) => { const v = parseFloat(s.replace(',', '.')); return Number.isFinite(v) && v > 0 ? v : undefined; };
  const ps = pesos(corpo);
  const mm = mediaMovel(ps, 7);
  const tend = tendenciaSemanal(ps);
  const atual = ps.at(-1)?.valor;
  const semanasPara = pesoAlvo && atual && tend && tend < 0 && atual > pesoAlvo ? Math.ceil((atual - pesoAlvo) / -tend) : undefined;
  const medidasSerie = (k: 'cintura' | 'braco' | 'coxa') => corpo.filter((c) => c[k] != null).map((c) => ({ data: c.data, valor: c[k]! }));
  const ordenado = [...corpo].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="tela">
      <Card className="meta-peso">
        <div className="meta-peso__topo">
          <h3 className="card__titulo">🎯 Meta de peso</h3>
          {pesoAlvo && !editAlvo && <button className="link" onClick={() => setEditAlvo(true)}>Editar</button>}
        </div>
        {!pesoAlvo || editAlvo ? (
          <div className="linha-form">
            <label className="campo"><span>Peso-alvo (kg)</span><input inputMode="decimal" value={alvoTxt} onChange={(e) => setAlvoTxt(e.target.value)} placeholder="90" /></label>
            <Botao disabled={!n(alvoTxt)} onClick={async () => { await salvarMetas((m) => ({ ...m, pesoAlvo: n(alvoTxt) })); setEditAlvo(false); }}>Salvar</Botao>
          </div>
        ) : (
          <>
            <BarraMeta inicial={ps[0]?.valor} alvo={pesoAlvo} atual={atual} formatar={kg} cor="musc" vazio="Registre seu primeiro peso abaixo." />
            {tend !== undefined && (
              <p className="tendencia">
                Tendência: <strong className={tend <= 0 ? 'positivo' : 'negativo'}>{tend > 0 ? '+' : ''}{num(tend, 2)} kg/semana</strong>
                {semanasPara ? ` · no ritmo atual, ~${semanasPara} semana(s) para a meta` : ''}
              </p>
            )}
            <p className="sutil">Foco: perder gordura mantendo músculo. Uma boa faixa é perder 0,5–1% do peso por semana.</p>
          </>
        )}
      </Card>

      <Card>
        <h3 className="card__titulo">Registrar</h3>
        <div className="campos-2">
          <label className="campo"><span>Peso (kg)</span><input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder={atual ? num(atual) : '0,0'} /></label>
          <label className="campo"><span>Data · {formatarData(data)}</span><input type="date" value={data} max={isoLocal()} onChange={(e) => e.target.value && setData(e.target.value)} /></label>
        </div>
        <button className="link" onClick={() => setMedidas((v) => !v)} aria-expanded={medidas}>{medidas ? '− Ocultar medidas' : '+ Medidas (cintura, braço, coxa)'}</button>
        {medidas && (
          <div className="campos-3">
            <label className="campo"><span>Cintura (cm)</span><input inputMode="decimal" value={cintura} onChange={(e) => setCintura(e.target.value)} /></label>
            <label className="campo"><span>Braço (cm)</span><input inputMode="decimal" value={braco} onChange={(e) => setBraco(e.target.value)} /></label>
            <label className="campo"><span>Coxa (cm)</span><input inputMode="decimal" value={coxa} onChange={(e) => setCoxa(e.target.value)} /></label>
          </div>
        )}
        <Botao grande disabled={!n(peso) && !n(cintura) && !n(braco) && !n(coxa)} onClick={async () => {
          const ant = await db.corpo.get(data);
          await db.corpo.put({ ...ant, data, peso: n(peso) ?? ant?.peso, cintura: n(cintura) ?? ant?.cintura, braco: n(braco) ?? ant?.braco, coxa: n(coxa) ?? ant?.coxa });
          setPeso(''); setCintura(''); setBraco(''); setCoxa('');
        }}>Salvar registro</Botao>
      </Card>

      {ps.length > 0 ? (
        <Card>
          <h3 className="card__titulo">Peso corporal</h3>
          <GraficoLinha nota="A média de 7 dias suaviza oscilações de água e sal: olhe a tendência, não o dia." titulo="Peso corporal (kg)" formatar={(v) => num(v)}
            referencia={pesoAlvo ? { valor: pesoAlvo, rotulo: `meta ${num(pesoAlvo)} kg` } : undefined}
            series={[
              { nome: 'Peso', pontos: ps, estilo: 'pontos', cor: 'texto' },
              { nome: 'Média 7 dias', pontos: mm.map((p) => ({ ...p, valor: Math.round(p.valor * 10) / 10 })), estilo: 'linha', cor: 'musc' },
            ]} />
        </Card>
      ) : (
        <EstadoVazio ilustracao={<IlustraGrafico />} titulo="Registre seu peso" texto="Uma vez por semana, no mesmo horário (ex.: segunda ao acordar), já é suficiente para ver a tendência." />
      )}

      {(['cintura', 'braco', 'coxa'] as const).map((k) => {
        const s = medidasSerie(k);
        if (s.length < 2) return null;
        const nome = { cintura: 'Cintura', braco: 'Braço', coxa: 'Coxa' }[k];
        return (
          <Card key={k}>
            <h3 className="card__titulo">{nome} (cm)</h3>
            <GraficoLinha titulo={`${nome} (cm)`} altura={140} formatar={(v) => num(v)} rotuloTabela="cm" series={[{ nome, pontos: s, cor: 'musc' }]} />
          </Card>
        );
      })}

      {ordenado.length > 0 && (
        <Card>
          <h3 className="card__titulo">Histórico</h3>
          <ul className="historico-corpo">
            {ordenado.map((c) => (
              <li key={c.data}>
                <span>{formatarData(c.data)}</span>
                <span className="num">{[c.peso && kg(c.peso), c.cintura && `cintura ${num(c.cintura)}`, c.braco && `braço ${num(c.braco)}`, c.coxa && `coxa ${num(c.coxa)}`].filter(Boolean).join(' · ')}</span>
                {apagar === c.data
                  ? <button className="link link--perigo" onClick={async () => { await db.corpo.delete(c.data); setApagar(null); }}>Excluir?</button>
                  : <button className="link link--sutil" aria-label={`Excluir registro de ${formatarData(c.data)}`} onClick={() => setApagar(c.data)}>✕</button>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}


function OutrasAtividades({ sessoes }: { sessoes: Sessao[] }) {
  const por = new Map<string, { n: number; min: number; trocas: number }>();
  for (const s of sessoes) {
    const k = s.atividade?.modalidade ?? 'Atividade';
    const x = por.get(k) ?? { n: 0, min: 0, trocas: 0 };
    por.set(k, { n: x.n + 1, min: x.min + (s.duracaoSeg ?? 0) / 60, trocas: x.trocas + (s.atividade?.substituiuCorrida ? 1 : 0) });
  }
  return (
    <Card>
      <h3 className="card__titulo">🏀 Outras atividades</h3>
      <ul className="recordes">
        {[...por.entries()].sort((a, b) => b[1].min - a[1].min).map(([nome, x]) => (
          <li key={nome}>
            <div><strong>{infoModalidade(nome).emoji} {nome}</strong><span>{x.n}× {x.trocas ? `· ${x.trocas} no lugar da corrida` : ''}</span></div>
            <div className="dir"><strong className="num">{num(x.min, 0)} min</strong></div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
