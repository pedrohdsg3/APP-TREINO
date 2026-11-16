// Plano alimentar dentro da Dieta: seguir / trocar / em parte / não segui, editor do plano e meus alimentos.
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Medida } from '../data/medidas';
import { REFEICOES, type Alimento, type RefeicaoId } from '../lib/dieta';
import {
  apagarProprio, desfazerRefeicao, escolhido, lancarPorcoes, lerDiaPlano, lerProprios, marcarNaoSegui, porcaoDe, salvarPlano,
  textoPorcao, totaisOpcao, totaisPorcao, type DiaPlano, type ItemPlano, type OpcaoRefeicao, type PlanoAlimentar, type Porcao, type AlimentoProprio,
} from '../lib/planoAlimentar';
import { AdicionarAlimento, fmt, FormProprio, gramasDe, type NoPrato } from '../ui/Alimentos';
import { Botao } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { Stepper } from '../ui/Stepper';

const fonteDe = (id: string): Alimento['fonte'] => (id.startsWith('meu:') ? 'Meu' : id.startsWith('ibge:') ? 'IBGE' : 'TACO');

/** Porção do plano → item do "prato" (para ajustar antes de lançar). */
export function porcaoParaPrato(x: Porcao): NoPrato {
  const a: Alimento = { id: x.alimentoId, nome: x.nome, grupo: 'Plano', ...x.por100, sodio: 0, fonte: fonteDe(x.alimentoId) };
  const medida: Medida = x.medida === 'gramas' ? { nome: 'gramas', g: 1 } : { nome: x.medida, g: Math.round((x.gramas / (x.qtd || 1)) * 10) / 10 };
  return { a, medida, qtd: x.medida === 'gramas' ? x.gramas : x.qtd };
}
const pratoParaPorcao = (x: NoPrato): Porcao => porcaoDe(x.a, x.medida, x.qtd);

const ROTULO: Record<string, string> = { segui: '✅ Segui o plano', parcial: '🟡 Segui em parte', nao: '✕ Não segui' };

// ---------------------------------------------------------------- plano na refeição
export function PlanoNaRefeicao({ data, refeicao, opcoes }: { data: string; refeicao: RefeicaoId; opcoes: OpcaoRefeicao[] }) {
  const dia = useLiveQuery(() => lerDiaPlano(data), [data]) as DiaPlano | undefined;
  const [opcaoId, setOpcaoId] = useState(opcoes[0]?.id);
  const [trocas, setTrocas] = useState<Record<string, Record<number, number>>>({});
  const [trocar, setTrocar] = useState<number | null>(null);
  const [emParte, setEmParte] = useState(false);
  const [aberto, setAberto] = useState(false);
  const marca = dia?.[refeicao];
  const opcao = opcoes.find((o) => o.id === opcaoId) ?? opcoes[0];
  if (!opcao) return null;
  const tr = trocas[opcao.id] ?? {};
  const porcoes = opcao.itens.map((it, k) => escolhido(it, tr[k]));
  const t = totaisOpcao(opcao, tr);

  if (marca) {
    const nome = opcoes.find((o) => o.id === marca.opcaoId)?.nome;
    return (
      <div className={`plano-ref plano-ref--${marca.status}`}>
        <span>{ROTULO[marca.status]}{nome && opcoes.length > 1 ? ` · ${nome}` : ''}</span>
        <button className="link" onClick={() => void desfazerRefeicao(data, refeicao)}>desfazer</button>
      </div>
    );
  }

  return (
    <div className="plano-ref">
      <button className="plano-ref__cab" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        <span>📋 Plano{opcoes.length > 1 ? ` · ${opcao.nome}` : ''}</span>
        <span className="plano-ref__kcal">{fmt(t.kcal)} kcal · P {fmt(t.p)} g {aberto ? '▴' : '▾'}</span>
      </button>
      {aberto && (
        <>
          {opcoes.length > 1 && (
            <div className="chips-sel chips-sel--rolagem" role="radiogroup" aria-label="Opção da refeição">
              {opcoes.map((o) => (
                <button key={o.id} role="radio" aria-checked={o.id === opcao.id} className={`chip-sel ${o.id === opcao.id ? 'on on--musc' : ''}`} onClick={() => setOpcaoId(o.id)}>{o.nome}</button>
              ))}
            </div>
          )}
          {opcao.obs && <p className="sutil">{opcao.obs}</p>}
          <ul className="plano-ref__itens">
            {opcao.itens.map((it, k) => {
              const x = porcoes[k];
              return (
                <li key={k}>
                  <div>
                    <strong>{x.nome}</strong>
                    <small>{textoPorcao(x)} · {fmt(totaisPorcao(x).kcal)} kcal{x.obs ? ` · ${x.obs}` : ''}</small>
                  </div>
                  {!!it.subs?.length && (
                    <button className={`mini-btn ${tr[k] !== undefined ? 'mini-btn--on' : ''}`} onClick={() => setTrocar(k)} aria-label={`Trocar ${it.nome}`}>⇄ {tr[k] !== undefined ? 'trocado' : 'trocar'}</button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="plano-ref__acoes">
            <Botao onClick={() => void lancarPorcoes(data, refeicao, porcoes, { status: 'segui', opcaoId: opcao.id })}>✓ Segui</Botao>
            <Botao variante="secundario" onClick={() => setEmParte(true)}>Em parte</Botao>
            <Botao variante="secundario" onClick={() => void marcarNaoSegui(data, refeicao)}>Não segui</Botao>
          </div>
        </>
      )}

      <Folha aberta={trocar !== null} aoFechar={() => setTrocar(null)} titulo="Substituições">
        {trocar !== null && (
          <EscolherTroca item={opcao.itens[trocar]} atual={tr[trocar]} aoEscolher={(i) => {
            setTrocas({ ...trocas, [opcao.id]: { ...tr, [trocar]: i } as Record<number, number> });
            setTrocar(null);
          }} />
        )}
      </Folha>
      <Folha aberta={emParte} aoFechar={() => setEmParte(false)} titulo="Segui em parte">
        {emParte && (
          <AdicionarAlimento data={data} refeicao={refeicao} titulo="Ajuste o que você comeu" aoFechar={() => setEmParte(false)}
            inicialPrato={porcoes.map(porcaoParaPrato)}
            aoSalvar={(itens, ref) => lancarPorcoes(data, ref, itens.map(pratoParaPorcao), { status: ref === refeicao ? 'parcial' : 'parcial', opcaoId: opcao.id })} />
        )}
      </Folha>
    </div>
  );
}

function EscolherTroca({ item, atual, aoEscolher }: { item: ItemPlano; atual?: number; aoEscolher: (i: number | undefined) => void }) {
  const linha = (x: Porcao, i: number | undefined) => {
    const t = totaisPorcao(x);
    const on = atual === i;
    return (
      <li key={i ?? 'orig'}>
        <button className={`troca ${on ? 'troca--on' : ''}`} onClick={() => aoEscolher(i)} aria-pressed={on}>
          <strong>{x.nome}</strong>
          <span>{textoPorcao(x)} · {fmt(t.kcal)} kcal · P {fmt(t.p, 1)} · C {fmt(t.c, 1)} · G {fmt(t.g, 1)}</span>
          {x.obs && <small>{x.obs}</small>}
        </button>
      </li>
    );
  };
  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">Trocar {item.nome.split(',')[0].toLowerCase()}</h2>
      <p className="detalhe__orientacao">Quantidades já equivalentes em calorias e macros.</p>
      <ul className="lista-trocas">
        {linha(item, undefined)}
        {item.subs!.map((s, i) => linha(s, i))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- editor do plano
const NOVO_PLANO = (): PlanoAlimentar => ({ nome: 'Meu plano', atualizadoEm: new Date().toISOString(), refeicoes: [] });

export function EditorPlano({ plano, aoFechar }: { plano?: PlanoAlimentar; aoFechar: () => void }) {
  const [p, setP] = useState<PlanoAlimentar>(() => structuredClone(plano ?? NOVO_PLANO()));
  const [ref, setRef] = useState<RefeicaoId>('cafe');
  const [add, setAdd] = useState<string | null>(null); // id da opção que recebe alimentos
  const [salvo, setSalvo] = useState(false);
  const rp = p.refeicoes.find((r) => r.refeicao === ref);
  const opcoes = rp?.opcoes ?? [];

  function mudarOpcoes(f: (o: OpcaoRefeicao[]) => OpcaoRefeicao[]) {
    const novas = f(opcoes);
    const resto = p.refeicoes.filter((r) => r.refeicao !== ref);
    setP({ ...p, refeicoes: novas.length ? [...resto, { refeicao: ref, opcoes: novas }] : resto });
    setSalvo(false);
  }
  const mudarOpcao = (id: string, f: (o: OpcaoRefeicao) => OpcaoRefeicao) => mudarOpcoes((l) => l.map((o) => (o.id === id ? f(o) : o)));

  return (
    <div className="detalhe editor-plano">
      <h2 className="detalhe__titulo">Plano alimentar</h2>
      <label className="campo"><span>Nome do plano</span><input value={p.nome} onChange={(e) => { setP({ ...p, nome: e.target.value }); setSalvo(false); }} maxLength={60} /></label>
      <div className="chips-sel chips-sel--rolagem" role="tablist" aria-label="Refeição">
        {REFEICOES.map((r) => {
          const n = p.refeicoes.find((x) => x.refeicao === r.id)?.opcoes.length ?? 0;
          return <button key={r.id} role="tab" aria-selected={ref === r.id} className={`chip-sel ${ref === r.id ? 'on on--musc' : ''}`} onClick={() => setRef(r.id)}>{r.emoji} {r.nome}{n ? ` (${n})` : ''}</button>;
        })}
      </div>

      {!opcoes.length && <p className="sutil">Sem plano para esta refeição. Ela continua livre no diário.</p>}
      {opcoes.map((o, oi) => {
        const t = totaisOpcao(o);
        return (
          <div key={o.id} className="opcao-plano">
            <div className="opcao-plano__topo">
              <input className="opcao-plano__nome" value={o.nome} aria-label="Nome da opção" onChange={(e) => mudarOpcao(o.id, (x) => ({ ...x, nome: e.target.value }))} />
              <span className="sutil">{fmt(t.kcal)} kcal · P {fmt(t.p)} · C {fmt(t.c)} · G {fmt(t.g)}</span>
            </div>
            {oi === 0 && opcoes.length > 1 && <small className="sutil">Principal (aparece primeiro)</small>}
            <ul className="opcao-plano__itens">
              {o.itens.map((it, k) => (
                <li key={k}>
                  <div className="opcao-plano__item">
                    <strong>{it.nome}</strong>
                    <small>{fmt(totaisPorcao(it).kcal)} kcal{it.subs?.length ? ` · ${it.subs.length} substituições` : ''}</small>
                  </div>
                  <Stepper compacto rotulo="Gramas" sufixo="g" passo={10} min={1} valor={it.gramas} onChange={(g) => mudarOpcao(o.id, (x) => ({
                    ...x, itens: x.itens.map((y, j) => (j === k ? { ...y, gramas: Math.round(g), qtd: y.medida === 'gramas' ? Math.round(g) : Math.round((g / (y.gramas / (y.qtd || 1))) * 10) / 10 } : y)),
                  }))} />
                  <button className="mini-btn mini-btn--perigo" aria-label={`Tirar ${it.nome}`} onClick={() => mudarOpcao(o.id, (x) => ({ ...x, itens: x.itens.filter((_, j) => j !== k) }))}>✕</button>
                </li>
              ))}
            </ul>
            <div className="opcao-plano__acoes">
              <button className="link" onClick={() => setAdd(o.id)}>＋ Alimento</button>
              {oi > 0 && <button className="link" onClick={() => mudarOpcoes((l) => [o, ...l.filter((x) => x.id !== o.id)])}>Tornar principal</button>}
              <button className="link link--perigo" onClick={() => mudarOpcoes((l) => l.filter((x) => x.id !== o.id))}>Apagar opção</button>
            </div>
          </div>
        );
      })}
      <Botao variante="secundario" onClick={() => mudarOpcoes((l) => [...l, { id: `op-${Date.now().toString(36)}`, nome: l.length ? `Opção ${l.length + 1}` : 'Principal', itens: [] }])}>＋ Nova opção para esta refeição</Botao>

      <div className="acoes-fixas">
        <Botao grande onClick={async () => { await salvarPlano(p); setSalvo(true); aoFechar(); }}>{salvo ? 'Salvo ✓' : 'Salvar plano'}</Botao>
      </div>

      <Folha aberta={!!add} aoFechar={() => setAdd(null)} titulo="Adicionar ao plano">
        {add && (
          <AdicionarAlimento data="" refeicao={ref} titulo="Adicionar ao plano" aoFechar={() => setAdd(null)}
            aoSalvar={(itens) => mudarOpcao(add, (x) => ({ ...x, itens: [...x.itens, ...itens.map((n) => ({ ...porcaoDe(n.a, n.medida, n.qtd), gramas: gramasDe(n) }))] }))} />
        )}
      </Folha>
    </div>
  );
}

// ---------------------------------------------------------------- meus alimentos
export function MeusAlimentos() {
  const lista = useLiveQuery(lerProprios, []) ?? [];
  const [editar, setEditar] = useState<AlimentoProprio | 'novo' | null>(null);
  if (editar) {
    const atual = editar === 'novo' ? undefined : editar;
    return <FormProprio inicial={atual} aoVoltar={() => setEditar(null)} aoSalvar={() => setEditar(null)}
      aoApagar={atual ? async () => { await apagarProprio(atual.id); setEditar(null); } : undefined} />;
  }
  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">Meus alimentos</h2>
      <p className="detalhe__orientacao">Produtos de marca e receitas que não estão na TACO/IBGE. Aparecem primeiro na busca.</p>
      <ul className="lista-alimentos">
        {lista.map((a) => {
          const k = Math.round((a.por100.kcal * a.porcaoG) / 100);
          return (
            <li key={a.id}><button onClick={() => setEditar(a)}>
              <span className="lista-alimentos__nome">{a.nome}</span>
              <span className="lista-alimentos__info">1 {a.porcaoNome} ({a.porcaoG} g) · {k} kcal · P {fmt((a.por100.p * a.porcaoG) / 100, 1)} g</span>
            </button></li>
          );
        })}
      </ul>
      {!lista.length && <p className="sutil">Nenhum ainda.</p>}
      <Botao onClick={() => setEditar('novo')}>＋ Cadastrar alimento</Botao>
    </div>
  );
}
