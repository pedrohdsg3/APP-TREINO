// Componentes de alimentos compartilhados pela Dieta e pelo plano alimentar:
// busca (TACO + IBGE + meus alimentos), quantidade com medidas caseiras, prato com vários alimentos.
import { useEffect, useMemo, useState } from 'react';
import type { RegistroAlimento } from '../db';
import { type Medida } from '../data/medidas';
import { buscar, lancar, medidasPara, porcao, recentes, REFEICOES, somar, type Alimento, type RefeicaoId } from '../lib/dieta';
import { porcaoParaPor100, proprioParaAlimento, salvarProprio, todosAlimentos, type AlimentoProprio } from '../lib/planoAlimentar';
import { Botao } from './Componentes';
import { Stepper } from './Stepper';

export const fmt = (n: number, casas = 0) => n.toLocaleString('pt-BR', { maximumFractionDigits: casas });

export { plural } from '../lib/dieta';
import { plural } from '../lib/dieta';

export function textoQtd(i: Pick<RegistroAlimento, 'medida' | 'qtd' | 'gramas'>) {
  return i.medida === 'gramas' ? `${fmt(i.gramas)} g` : `${fmt(i.qtd, 1)} ${plural(i.medida, i.qtd)} · ${fmt(i.gramas)} g`;
}

// ---------------------------------------------------------------- quantidade
export function Quantidade({ alimento, medidas: lista, medida, qtd, onChange }: {
  alimento: Pick<Alimento, 'nome' | 'kcal' | 'p' | 'c' | 'g' | 'fibra'>; medidas: Medida[]; medida: Medida; qtd: number; onChange: (m: Medida, q: number) => void;
}) {
  const medidas = [...lista];
  if (!medidas.some((m) => m.nome === medida.nome)) medidas.push(medida);
  const gramas = Math.round(medida.g * qtd);
  const t = porcao(alimento, gramas);
  return (
    <div className="quantidade">
      {medidas.length > 1 && (
        <div className="chips-sel" role="radiogroup" aria-label="Medida">
          {medidas.map((m) => (
            <button key={m.nome} role="radio" aria-checked={m.nome === medida.nome} className={`chip-sel ${m.nome === medida.nome ? 'on on--musc' : ''}`}
              onClick={() => onChange(m, m.g === 1 ? Math.round(medida.g * qtd) || 100 : 1)}>
              {m.g === 1 ? 'gramas' : `${m.nome} (${m.g} g)`}
            </button>
          ))}
        </div>
      )}
      <Stepper rotulo={medida.g === 1 ? 'Quantidade' : `Quantas (${medida.nome})`} sufixo={medida.g === 1 ? 'g' : undefined}
        passo={medida.g === 1 ? 10 : 0.5} min={0} valor={qtd} onChange={(v) => onChange(medida, v)} />
      <div className="porcao">
        <div><strong>{fmt(t.kcal)}</strong><span>kcal</span></div>
        <div><strong>{fmt(t.p, 1)}</strong><span>prot. g</span></div>
        <div><strong>{fmt(t.c, 1)}</strong><span>carb. g</span></div>
        <div><strong>{fmt(t.g, 1)}</strong><span>gord. g</span></div>
      </div>
      {medida.g !== 1 && <p className="sutil centro">≈ {fmt(gramas)} g</p>}
    </div>
  );
}

export function EscolherRefeicao({ valor, onChange }: { valor: RefeicaoId; onChange: (r: RefeicaoId) => void }) {
  return (
    <div className="campo">
      <span>Refeição</span>
      <div className="chips-sel">
        {REFEICOES.map((r) => (
          <button key={r.id} className={`chip-sel ${valor === r.id ? 'on on--musc' : ''}`} aria-pressed={valor === r.id} onClick={() => onChange(r.id)}>{r.emoji} {r.nome}</button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- adicionar
export interface NoPrato { a: Alimento; medida: Medida; qtd: number }
export const gramasDe = (x: Pick<NoPrato, 'medida' | 'qtd'>) => Math.round(x.medida.g * x.qtd);
export const praRefeicao = (id: RefeicaoId) => `${id === 'ceia' ? 'na' : 'no'} ${REFEICOES.find((r) => r.id === id)!.nome.toLowerCase()}`;

/**
 * Busca → quantidade. Dá para montar o "prato" com vários alimentos (ex.: pão + ovo)
 * e salvar tudo de uma vez.
 */
export function AdicionarAlimento({ data, refeicao: inicial, aoFechar, inicialPrato, aoSalvar, titulo }: {
  data: string; refeicao: RefeicaoId; aoFechar: () => void;
  /** começa com estes alimentos no prato (ex.: "segui em parte" do plano) */
  inicialPrato?: NoPrato[];
  /** em vez de lançar no diário, devolve os alimentos (editor do plano, plano "em parte") */
  aoSalvar?: (itens: NoPrato[], refeicao: RefeicaoId) => Promise<void> | void;
  titulo?: string;
}) {
  const [base, setBase] = useState<Alimento[] | null>(null);
  const [erroBase, setErroBase] = useState(false);
  const [termo, setTermo] = useState('');
  const [rec, setRec] = useState<RegistroAlimento[]>([]);
  const [escolhido, setEscolhido] = useState<NoPrato | null>(null);
  const [prato, setPrato] = useState<NoPrato[]>(inicialPrato ?? []);
  const [cadastrar, setCadastrar] = useState(false);
  const [refeicao, setRefeicao] = useState<RefeicaoId>(inicial);
  const [salvando, setSalvando] = useState(false);

  const recarregar = () => todosAlimentos().then(setBase).catch(() => setErroBase(true));
  useEffect(() => { void recarregar(); void recentes().then(setRec); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const resultados = useMemo(() => (base && termo.trim().length >= 2 ? buscar(base, termo) : []), [base, termo]);

  function escolher(a: Alimento, ultimo?: RegistroAlimento) {
    const ms = medidasPara(a);
    if (ultimo) {
      const m = ms.find((x) => x.nome === ultimo.medida) ?? { nome: 'gramas', g: 1 };
      return setEscolhido({ a, medida: m, qtd: m.g === 1 ? ultimo.gramas : ultimo.qtd });
    }
    const caseira = ms[1];
    setEscolhido(caseira ? { a, medida: caseira, qtd: 1 } : { a, medida: ms[0], qtd: 100 });
  }

  async function salvar(itens: NoPrato[]) {
    setSalvando(true);
    try {
      if (aoSalvar) await aoSalvar(itens, refeicao);
      else for (const x of itens) await lancar(data, refeicao, x.a, gramasDe(x), { nome: x.medida.nome, qtd: x.qtd });
      aoFechar();
    } finally { setSalvando(false); }
  }

  if (cadastrar) {
    return <FormProprio inicialNome={termo} aoVoltar={() => setCadastrar(false)} aoSalvar={async (a) => { await recarregar(); setCadastrar(false); escolher(proprioParaAlimento(a)); }} />;
  }

  function incluir() {
    if (!escolhido) return;
    setPrato([...prato, escolhido]); setEscolhido(null); setTermo('');
  }

  const totalPrato = somar(prato.map((x) => porcao(x.a, gramasDe(x))));

  if (escolhido) {
    const gramas = gramasDe(escolhido);
    const n = prato.length + 1;
    return (
      <div className="detalhe">
        <button className="link escolher__voltar" onClick={() => setEscolhido(null)}>‹ Voltar à busca</button>
        <h2 className="detalhe__titulo">{escolhido.a.nome}</h2>
        <p className="sutil">{escolhido.a.grupo} · {fmt(escolhido.a.kcal)} kcal em 100 g · {escolhido.a.fonte}</p>
        <Quantidade alimento={escolhido.a} medidas={medidasPara(escolhido.a)} medida={escolhido.medida} qtd={escolhido.qtd} onChange={(medida, qtd) => setEscolhido({ ...escolhido, medida, qtd })} />
        <EscolherRefeicao valor={refeicao} onChange={setRefeicao} />
        <div className="acoes-fixas">
          {!!prato.length && <p className="sutil centro">Já no prato: {prato.map((x) => x.a.nome.split(',')[0]).join(' · ')}</p>}
          <Botao grande disabled={gramas <= 0 || salvando} onClick={() => void salvar([...prato, escolhido])}>
            {aoSalvar ? `Salvar (${n} ${n === 1 ? 'alimento' : 'alimentos'})` : n > 1 ? `Salvar ${n} alimentos ${praRefeicao(refeicao)}` : `Salvar ${praRefeicao(refeicao)}`}
          </Botao>
          <Botao variante="secundario" disabled={gramas <= 0} onClick={incluir}>＋ Incluir e adicionar outro alimento</Botao>
        </div>
      </div>
    );
  }

  const deRecente = (r: RegistroAlimento): Alimento => {
    const b = base?.find((x) => x.id === r.alimentoId);
    return b ?? { id: r.alimentoId, nome: r.nome, grupo: 'Recente', kcal: r.por100.kcal, p: r.por100.p, c: r.por100.c, g: r.por100.g, fibra: r.por100.fibra, sodio: 0, fonte: 'TACO' };
  };

  return (
    <div className="detalhe busca-alimento">
      <h2 className="detalhe__titulo">{titulo ?? (prato.length ? 'Adicionar mais' : 'Adicionar alimento')}</h2>
      {!!prato.length && (
        <div className="prato">
          <div className="prato__topo"><strong>No prato · {fmt(totalPrato.kcal)} kcal</strong><span className="sutil">{praRefeicao(refeicao)}</span></div>
          <ul>
            {prato.map((x, i) => (
              <li key={i}>
                <button className="prato__item" onClick={() => { setPrato(prato.filter((_, j) => j !== i)); setEscolhido(x); }} aria-label={`Ajustar ${x.a.nome}`}>
                  {x.a.nome} <small>· {textoQtd({ medida: x.medida.g === 1 ? 'gramas' : x.medida.nome, qtd: x.qtd, gramas: gramasDe(x) })} · {fmt(porcao(x.a, gramasDe(x)).kcal)} kcal ✎</small>
                </button>
                <button className="mini-btn mini-btn--perigo" aria-label={`Tirar ${x.a.nome}`} onClick={() => setPrato(prato.filter((_, j) => j !== i))}>✕</button>
              </li>
            ))}
          </ul>
          <Botao disabled={salvando} onClick={() => void salvar(prato)}>Salvar {prato.length} {prato.length === 1 ? 'alimento' : 'alimentos'}{aoSalvar ? '' : ` ${praRefeicao(refeicao)}`}</Botao>
        </div>
      )}
      <input className="busca" type="search" autoFocus placeholder="Buscar: arroz, ovo frito, tapioca…" value={termo} onChange={(e) => setTermo(e.target.value)} aria-label="Buscar alimento" />
      {!base && !erroBase && <p className="sutil">Carregando a tabela de alimentos…</p>}
      {erroBase && <p className="aviso-campo">Não consegui carregar a tabela de alimentos. Abra o app com internet uma vez para ela ficar salva.</p>}
      {termo.trim().length < 2 ? (
        rec.length ? (
          <>
            <h3 className="detalhe__secao">Recentes</h3>
            <ul className="lista-alimentos">
              {rec.map((r) => (
                <li key={r.id}><button onClick={() => escolher(deRecente(r), r)}>
                  <span className="lista-alimentos__nome">{r.nome}</span>
                  <span className="lista-alimentos__info">{textoQtd(r)} · {fmt(r.kcal)} kcal</span>
                </button></li>
              ))}
            </ul>
          </>
        ) : <p className="sutil">Digite pelo menos 2 letras. A busca ignora acentos e a ordem das palavras (ex.: "ovo frito", "frango grelhado").</p>
      ) : resultados.length ? (
        <ul className="lista-alimentos">
          {resultados.map((a) => (
            <li key={a.id}><button onClick={() => escolher(a)}>
              <span className="lista-alimentos__nome">{a.nome} <span className={`fonte fonte--${a.fonte.toLowerCase()}`}>{a.fonte}</span></span>
              <span className="lista-alimentos__info">{fmt(a.kcal)} kcal · P {fmt(a.p, 1)} · C {fmt(a.c, 1)} · G {fmt(a.g, 1)} <small>(100 g)</small></span>
            </button></li>
          ))}
        </ul>
      ) : base ? <p className="sutil">Nada encontrado para "{termo}". Tente outra palavra (ex.: "pão" em vez de "pãozinho").</p> : null}
      {termo.trim().length >= 2 && base && <button className="link" onClick={() => setCadastrar(true)}>＋ Cadastrar "{termo.trim()}" como meu alimento (pelo rótulo)</button>}
    </div>
  );
}

// ---------------------------------------------------------------- meu alimento (pelo rótulo)
export function FormProprio({ inicial, inicialNome, aoVoltar, aoSalvar, aoApagar }: {
  inicial?: AlimentoProprio; inicialNome?: string; aoVoltar: () => void; aoSalvar: (a: AlimentoProprio) => void | Promise<void>; aoApagar?: () => void;
}) {
  const por = (k: keyof AlimentoProprio['por100']) => (inicial ? Math.round(((inicial.por100[k] * inicial.porcaoG) / 100) * 10) / 10 : 0);
  const [nome, setNome] = useState(inicial?.nome ?? inicialNome ?? '');
  const [porcaoNome, setPorcaoNome] = useState(inicial?.porcaoNome ?? 'porção');
  const [porcaoG, setPorcaoG] = useState(inicial?.porcaoG ?? 30);
  const [v, setV] = useState({ kcal: por('kcal'), p: por('p'), c: por('c'), g: por('g'), fibra: por('fibra') });
  const ok = nome.trim().length >= 2 && porcaoG > 0 && v.kcal >= 0;
  const campo = (k: keyof typeof v, rotulo: string, passo: number) => (
    <Stepper compacto rotulo={rotulo} sufixo={k === 'kcal' ? 'kcal' : 'g'} passo={passo} valor={v[k]} onChange={(x) => setV({ ...v, [k]: Math.round(x * 10) / 10 })} />
  );
  return (
    <div className="detalhe">
      <button className="link escolher__voltar" onClick={aoVoltar}>‹ Voltar</button>
      <h2 className="detalhe__titulo">{inicial ? 'Editar meu alimento' : 'Cadastrar meu alimento'}</h2>
      <p className="detalhe__orientacao">Copie da tabela nutricional da embalagem, na coluna "por porção".</p>
      <label className="campo"><span>Nome</span><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Whey Growth baunilha" maxLength={60} /></label>
      <div className="grade-2">
        <label className="campo"><span>Porção (nome)</span><input value={porcaoNome} onChange={(e) => setPorcaoNome(e.target.value)} placeholder="medidor, barra, fatia…" maxLength={30} /></label>
        <Stepper compacto rotulo="Porção" sufixo="g" passo={5} valor={porcaoG} onChange={(x) => setPorcaoG(Math.max(1, Math.round(x)))} />
      </div>
      <div className="grade-2">
        {campo('kcal', 'Calorias', 10)}
        {campo('p', 'Proteína', 1)}
        {campo('c', 'Carboidrato', 1)}
        {campo('g', 'Gordura', 1)}
        {campo('fibra', 'Fibra', 1)}
      </div>
      <Botao grande disabled={!ok} onClick={async () => {
        const a: AlimentoProprio = { id: inicial?.id ?? `meu:${Date.now().toString(36)}`, nome: nome.trim(), porcaoNome: porcaoNome.trim() || 'porção', porcaoG, por100: porcaoParaPor100(porcaoG, v) };
        await salvarProprio(a);
        await aoSalvar(a);
      }}>Salvar alimento</Botao>
      {aoApagar && <button className="link link--perigo" onClick={aoApagar}>Apagar este alimento</button>}
    </div>
  );
}
