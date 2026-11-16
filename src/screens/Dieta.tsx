// Dieta: metas do dia, diário por refeição (TACO) e água.
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RegistroAlimento } from '../db';
import { type Medida } from '../data/medidas';
import {
  alterarQuantidade, apagarLancamento, ATIVIDADES, calcularMetas, carregarBase, medidasPara, lerMetas, moverRefeicao, OBJETIVOS, porcao,
  REFEICOES, salvarMetas, somar, somarAgua, type DadosCorpo, type MetasDieta, type RefeicaoId,
} from '../lib/dieta';
import { dataPorExtenso, isoLocal, somarDias } from '../lib/datas';
import { perfilAtual } from '../lib/perfis';
import { Anel, Botao, Card, Segmentado } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { Stepper } from '../ui/Stepper';
import { EditorPlano, MeusAlimentos, PlanoNaRefeicao } from './DietaPlano';
import { lerPlano, semearPlanoPedro } from '../lib/planoAlimentar';
import { AdicionarAlimento, fmt, Quantidade, EscolherRefeicao, textoQtd } from '../ui/Alimentos';
export { plural } from '../ui/Alimentos';

const litros = (ml: number) => `${fmt(ml / 1000, 2)} L`;

export function Dieta() {
  const hoje = isoLocal();
  const [data, setData] = useState(hoje);
  const metas = useLiveQuery(lerMetas, []);
  const itens = useLiveQuery(() => db.diario.where('data').equals(data).sortBy('ts'), [data]) ?? [];
  const agua = useLiveQuery(() => db.agua.get(data), [data])?.ml ?? 0;
  const [adicionar, setAdicionar] = useState<RefeicaoId | null>(null);
  const [editar, setEditar] = useState<RegistroAlimento | null>(null);
  const [abrirMetas, setAbrirMetas] = useState(false);
  const plano = useLiveQuery(lerPlano, []);
  const [editorPlano, setEditorPlano] = useState(false);
  const [meusAlimentos, setMeusAlimentos] = useState(false);
  // Pedro: dieta de ~2.250 kcal cadastrada uma vez (16/11/2026)
  useEffect(() => { if (perfilAtual().personagem === 'pedro') void semearPlanoPedro(); }, []);
  const opcoesDe = (id: string) => plano?.refeicoes.find((r) => r.refeicao === id)?.opcoes.filter((o) => o.itens.length) ?? [];

  const total = somar(itens);
  const porRefeicao = (id: string) => itens.filter((i) => i.refeicao === id);

  return (
    <div className="tela tela--dieta">
      <header className="cabecalho">
        <h1>Dieta</h1>
        <div className="dia-nav">
          <button className="mini-btn" onClick={() => setData(somarDias(data, -1))} aria-label="Dia anterior">‹</button>
          <span className="dia-nav__data">{data === hoje ? 'Hoje' : data === somarDias(hoje, -1) ? 'Ontem' : dataPorExtenso(data)}</span>
          <button className="mini-btn" onClick={() => setData(somarDias(data, 1))} disabled={data >= hoje} aria-label="Próximo dia">›</button>
          {data !== hoje && <button className="link" onClick={() => setData(hoje)}>voltar para hoje</button>}
        </div>
      </header>

      {metas === undefined || metas === null ? (
        <Card className="entra dieta-sem-meta">
          <h3 className="card__titulo">🎯 Defina suas metas</h3>
          <p className="sutil">Com peso, altura, idade, atividade e objetivo o app sugere calorias, proteína, carboidrato, gordura e água — e você ajusta como quiser.</p>
          <Botao onClick={() => setAbrirMetas(true)}>Definir metas</Botao>
        </Card>
      ) : (
        <Resumo total={total} metas={metas} aoEditar={() => setAbrirMetas(true)} />
      )}

      <Agua ml={agua} meta={metas?.aguaMl} aoSomar={(ml) => void somarAgua(data, ml)} />

      <div className="refeicoes">
        {REFEICOES.map((r) => {
          const l = porRefeicao(r.id);
          const t = somar(l);
          return (
            <Card key={r.id} className="refeicao entra">
              <div className="refeicao__topo">
                <h3><span aria-hidden="true">{r.emoji}</span> {r.nome}</h3>
                {!!l.length && <span className="refeicao__kcal">{fmt(t.kcal)} kcal</span>}
              </div>
              {!!opcoesDe(r.id).length && <PlanoNaRefeicao key={data + r.id} data={data} refeicao={r.id} opcoes={opcoesDe(r.id)} />}
              {!!l.length && (
                <ul className="refeicao__lista">
                  {l.map((i) => (
                    <li key={i.id}>
                      <button className="item-alimento" onClick={() => setEditar(i)}>
                        <span className="item-alimento__nome">{i.nome}</span>
                        <span className="item-alimento__qtd">{textoQtd(i)}</span>
                        <span className="item-alimento__kcal">{fmt(i.kcal)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!!l.length && <p className="refeicao__macros">P {fmt(t.p)} g · C {fmt(t.c)} g · G {fmt(t.g)} g</p>}
              <button className="refeicao__add" onClick={() => setAdicionar(r.id)}>＋ Adicionar alimento</button>
            </Card>
          );
        })}
      </div>

      <Card className="entra plano-card">
        <h3 className="card__titulo">📋 Plano alimentar</h3>
        <p className="sutil">{plano ? plano.nome : 'Cadastre um cardápio (ex.: o do nutricionista) com opções e substituições, e marque cada refeição como seguida.'}</p>
        <div className="plano-card__botoes">
          <Botao variante="secundario" onClick={() => setEditorPlano(true)}>{plano ? 'Editar plano' : 'Criar plano'}</Botao>
          <Botao variante="secundario" onClick={() => setMeusAlimentos(true)}>Meus alimentos</Botao>
        </div>
      </Card>

      <p className="rodape">Valores nutricionais: TACO (NEPA/UNICAMP, 4ª ed.) e IBGE (POF 2008-2009, composição e medidas referidas). Medidas caseiras são aproximadas.</p>

      <Folha aberta={editorPlano} aoFechar={() => setEditorPlano(false)} titulo="Plano alimentar">
        {editorPlano && <EditorPlano plano={plano ?? undefined} aoFechar={() => setEditorPlano(false)} />}
      </Folha>
      <Folha aberta={meusAlimentos} aoFechar={() => setMeusAlimentos(false)} titulo="Meus alimentos">
        {meusAlimentos && <MeusAlimentos />}
      </Folha>

      <Folha aberta={!!adicionar} aoFechar={() => setAdicionar(null)} titulo="Adicionar alimento">
        {adicionar && <AdicionarAlimento data={data} refeicao={adicionar} aoFechar={() => setAdicionar(null)} />}
      </Folha>
      <Folha aberta={!!editar} aoFechar={() => setEditar(null)} titulo="Editar alimento">
        {editar && <EditarLancamento r={editar} aoFechar={() => setEditar(null)} />}
      </Folha>
      <Folha aberta={abrirMetas} aoFechar={() => setAbrirMetas(false)} titulo="Metas da dieta">
        {abrirMetas && <EditarMetas atual={metas ?? undefined} aoFechar={() => setAbrirMetas(false)} />}
      </Folha>
    </div>
  );
}

/** "2 colher de sopa" → "2 colheres de sopa" (só a primeira palavra). */
// ---------------------------------------------------------------- resumo do dia
function Resumo({ total, metas, aoEditar }: { total: ReturnType<typeof somar>; metas: MetasDieta; aoEditar: () => void }) {
  const falta = metas.kcal - total.kcal;
  const macros = [
    { nome: 'Proteína', v: total.p, m: metas.p, cls: 'p' },
    { nome: 'Carboidrato', v: total.c, m: metas.c, cls: 'c' },
    { nome: 'Gordura', v: total.g, m: metas.g, cls: 'g' },
  ];
  return (
    <Card className="resumo-dieta entra">
      <div className="resumo-dieta__topo">
        <Anel progresso={total.kcal / metas.kcal} tamanho={96} espessura={9} cor="corr">
          <strong>{fmt(total.kcal)}</strong><small>kcal</small>
        </Anel>
        <div className="resumo-dieta__texto">
          <span className="rotulo-sup">Calorias</span>
          <strong>{falta >= 0 ? `Faltam ${fmt(falta)} kcal` : `${fmt(-falta)} kcal acima`}</strong>
          <span className="sutil">Meta {fmt(metas.kcal)} kcal</span>
          <button className="link" onClick={aoEditar}>Ajustar metas</button>
        </div>
      </div>
      <div className="macros">
        {macros.map((x) => (
          <div key={x.nome} className={`macro macro--${x.cls}`}>
            <span>{x.nome}</span>
            <strong>{fmt(x.v)}<small> / {fmt(x.m)} g</small></strong>
            <div className="barra-meta"><i style={{ width: `${Math.min(100, (x.v / Math.max(1, x.m)) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- água
function Agua({ ml, meta, aoSomar }: { ml: number; meta?: number; aoSomar: (ml: number) => void }) {
  const copos = meta ? Math.ceil(meta / 250) : 8;
  const cheios = Math.floor(ml / 250);
  return (
    <Card className="agua entra">
      <div className="agua__topo">
        <h3 className="card__titulo">💧 Água</h3>
        <span><strong>{litros(ml)}</strong>{meta ? <span className="sutil"> de {litros(meta)}</span> : null}</span>
      </div>
      <div className="agua__copos" aria-hidden="true">
        {Array.from({ length: Math.min(copos, 20) }, (_, i) => <span key={i} className={i < cheios ? 'cheio' : ''} />)}
      </div>
      <div className="agua__botoes">
        <button className="mini-btn" onClick={() => aoSomar(-250)} disabled={ml <= 0} aria-label="Tirar 250 ml">−</button>
        <button className="chip-sel" onClick={() => aoSomar(250)}>+ copo 250 ml</button>
        <button className="chip-sel" onClick={() => aoSomar(500)}>+ garrafa 500 ml</button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- editar
function EditarLancamento({ r, aoFechar }: { r: RegistroAlimento; aoFechar: () => void }) {
  const [medidas, setMedidas] = useState<Medida[]>(medidasPara({ nome: r.nome }));
  const [medida, setMedida] = useState<Medida>(medidas.find((m) => m.nome === r.medida) ?? { nome: r.medida === 'gramas' ? 'gramas' : r.medida, g: r.medida === 'gramas' ? 1 : r.gramas / (r.qtd || 1) });
  const [qtd, setQtd] = useState(r.medida === 'gramas' ? r.gramas : r.qtd);
  const [refeicao, setRefeicao] = useState<RefeicaoId>(r.refeicao as RefeicaoId);
  useEffect(() => { void carregarBase().then((b) => { const a = b.find((x) => x.id === r.alimentoId); if (a) setMedidas(medidasPara(a)); }).catch(() => { /* fica com as gerais */ }); }, [r.alimentoId]);
  const gramas = Math.round(medida.g * qtd);
  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">{r.nome}</h2>
      <Quantidade alimento={{ nome: r.nome, ...r.por100 }} medidas={medidas} medida={medida} qtd={qtd} onChange={(m, q) => { setMedida(m); setQtd(q); }} />
      <EscolherRefeicao valor={refeicao} onChange={setRefeicao} />
      <Botao grande disabled={gramas <= 0} onClick={async () => {
        await alterarQuantidade(r, gramas, { nome: medida.nome, qtd });
        if (refeicao !== r.refeicao) await moverRefeicao({ ...r, gramas, medida: medida.nome, qtd, ...porcao(r.por100, gramas) }, refeicao);
        aoFechar();
      }}>Salvar</Botao>
      <button className="link link--perigo" onClick={async () => { await apagarLancamento(r.id); aoFechar(); }}>Remover da refeição</button>
    </div>
  );
}

// ---------------------------------------------------------------- metas
function EditarMetas({ atual, aoFechar }: { atual?: MetasDieta; aoFechar: () => void }) {
  const perfil = perfilAtual();
  const pesoAtual = useLiveQuery(() => db.corpo.orderBy('data').reverse().filter((r) => r.peso != null).first(), [])?.peso;
  const fem = perfil.plano === 'feminino';
  const [d, setD] = useState<DadosCorpo>(atual?.corpo ?? {
    sexo: fem ? 'f' : 'm', idade: 30, alturaCm: fem ? 163 : 178, pesoKg: fem ? 60 : 90, atividade: 'moderado', objetivo: 'perder',
  });
  const [usouPeso, setUsouPeso] = useState(!!atual?.corpo);
  useEffect(() => { if (!usouPeso && pesoAtual) { setD((x) => ({ ...x, pesoKg: pesoAtual })); setUsouPeso(true); } }, [pesoAtual, usouPeso]);
  const sugestao = calcularMetas(d);
  const [manual, setManual] = useState(!!atual?.manual);
  const [m, setM] = useState<MetasDieta>(atual ?? sugestao);
  const final = manual ? { ...m, corpo: d, manual: true } : sugestao;
  const mud = (x: Partial<DadosCorpo>) => setD({ ...d, ...x });

  return (
    <div className="detalhe metas-dieta">
      <h2 className="detalhe__titulo">Metas da dieta</h2>
      <p className="detalhe__orientacao">O app calcula uma sugestão pelo gasto do dia a dia (fórmula de Mifflin-St Jeor). Se você tiver metas de um nutricionista, use "Digitar minhas metas".</p>

      <Segmentado<'m' | 'f'> rotulo="Sexo" valor={d.sexo} onChange={(sexo) => mud({ sexo })} opcoes={[{ valor: 'm', rotulo: 'Masculino' }, { valor: 'f', rotulo: 'Feminino' }]} />
      <div className="grade-2">
        <Stepper compacto rotulo="Idade" sufixo="anos" passo={1} min={14} valor={d.idade} onChange={(idade) => mud({ idade: Math.round(idade) })} />
        <Stepper compacto rotulo="Altura" sufixo="cm" passo={1} min={120} valor={d.alturaCm} onChange={(alturaCm) => mud({ alturaCm: Math.round(alturaCm) })} />
      </div>
      <Stepper rotulo="Peso atual" sufixo="kg" passo={0.5} min={30} valor={d.pesoKg} onChange={(pesoKg) => mud({ pesoKg })} />

      <div className="campo">
        <span>Atividade física</span>
        <div className="opcoes">
          {ATIVIDADES.map((a) => (
            <button key={a.id} className={`opcao ${d.atividade === a.id ? 'opcao--marcada' : ''}`} aria-pressed={d.atividade === a.id} onClick={() => mud({ atividade: a.id })}>
              <strong>{a.nome}</strong><span>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="campo">
        <span>Objetivo</span>
        <div className="opcoes">
          {OBJETIVOS.map((o) => (
            <button key={o.id} className={`opcao ${d.objetivo === o.id ? 'opcao--marcada' : ''}`} aria-pressed={d.objetivo === o.id} onClick={() => mud({ objetivo: o.id })}>
              <strong>{o.nome}</strong><span>{o.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <Segmentado<'auto' | 'manual'> rotulo="Metas" valor={manual ? 'manual' : 'auto'} onChange={(v) => { setManual(v === 'manual'); if (v === 'manual') setM(sugestao); }}
        opcoes={[{ valor: 'auto', rotulo: 'Sugestão do app' }, { valor: 'manual', rotulo: 'Digitar minhas metas' }]} />

      {manual ? (
        <div className="grade-2">
          <Stepper compacto rotulo="Calorias" sufixo="kcal" passo={50} valor={m.kcal} onChange={(kcal) => setM({ ...m, kcal: Math.round(kcal) })} />
          <Stepper compacto rotulo="Proteína" sufixo="g" passo={5} valor={m.p} onChange={(p) => setM({ ...m, p: Math.round(p) })} />
          <Stepper compacto rotulo="Carboidrato" sufixo="g" passo={5} valor={m.c} onChange={(c) => setM({ ...m, c: Math.round(c) })} />
          <Stepper compacto rotulo="Gordura" sufixo="g" passo={5} valor={m.g} onChange={(g) => setM({ ...m, g: Math.round(g) })} />
          <Stepper compacto rotulo="Água" sufixo="ml" passo={250} valor={m.aguaMl} onChange={(aguaMl) => setM({ ...m, aguaMl: Math.round(aguaMl) })} />
        </div>
      ) : (
        <div className="sugestao-metas">
          <div><strong>{fmt(sugestao.kcal)}</strong><span>kcal</span></div>
          <div><strong>{sugestao.p} g</strong><span>proteína</span></div>
          <div><strong>{sugestao.c} g</strong><span>carboidrato</span></div>
          <div><strong>{sugestao.g} g</strong><span>gordura</span></div>
          <div><strong>{litros(sugestao.aguaMl)}</strong><span>água</span></div>
        </div>
      )}
      <p className="sutil">É uma estimativa para orientar. Se tiver alguma condição de saúde, siga a orientação de um nutricionista.</p>
      <Botao grande onClick={async () => { await salvarMetas(final); aoFechar(); }}>Salvar metas</Botao>
    </div>
  );
}

/** Resumo para a tela Hoje. */
export function CardDietaHoje({ aoAbrir }: { aoAbrir: () => void }) {
  const hoje = isoLocal();
  const metas = useLiveQuery(lerMetas, []);
  const itens = useLiveQuery(() => db.diario.where('data').equals(hoje).toArray(), [hoje]) ?? [];
  const agua = useLiveQuery(() => db.agua.get(hoje), [hoje])?.ml ?? 0;
  const t = somar(itens);
  return (
    <Card className="dieta-hoje entra">
      {metas ? (
        <>
          <Anel progresso={t.kcal / metas.kcal} tamanho={64} espessura={7} cor="corr"><strong className="dieta-hoje__n">{Math.round((t.kcal / metas.kcal) * 100)}%</strong></Anel>
          <div className="dieta-hoje__texto">
            <h3>Dieta de hoje</h3>
            <p>{fmt(t.kcal)} de {fmt(metas.kcal)} kcal · proteína {fmt(t.p)}/{metas.p} g</p>
            <p className="sutil">💧 {litros(agua)} de {litros(metas.aguaMl)}</p>
          </div>
        </>
      ) : (
        <div className="dieta-hoje__texto"><h3>🥗 Dieta</h3><p>Defina suas metas e registre as refeições.</p></div>
      )}
      <button className="mini-btn" onClick={aoAbrir}>{itens.length ? 'Abrir' : 'Lançar'}</button>
    </Card>
  );
}
