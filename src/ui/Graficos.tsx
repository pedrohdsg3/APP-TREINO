// Gráficos leves em SVG (sem biblioteca). Linha com cursor + leitura; barras com leitura por toque.
// Regras: traços finos, grade discreta, um eixo só, texto sempre na cor de texto, tabela "Ver dados".
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deIso, diasEntre, formatarData } from '../lib/datas';

type Cor = 'musc' | 'corr' | 'texto' | 'ouro' | 'coral';

function useLargura<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** 3–5 marcas "redondas" no eixo y. */
function marcas(min: number, max: number, n = 4): number[] {
  if (min === max) { min -= 1; max += 1; }
  const bruto = (max - min) / n;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? bruto;
  const ini = Math.floor(min / passo) * passo;
  const out: number[] = [];
  for (let v = ini; v <= max + passo * 0.001; v += passo) out.push(Math.round(v * 1000) / 1000);
  if (out.at(-1)! < max) out.push(out.at(-1)! + passo);
  return out;
}

const dataCurta = (iso: string) => formatarData(iso).slice(0, 5);

export interface SerieLinha {
  nome: string;
  pontos: { data: string; valor: number }[];
  /** 'linha' liga os pontos; 'pontos' só marca; 'ambos' */
  estilo?: 'linha' | 'pontos' | 'ambos';
  cor: Cor;
}

export function GraficoLinha({ series, formatar, referencia, altura = 190, titulo, rotuloTabela = 'Valor', dominioY, nota, nMarcas = 4 }: {
  nota?: string;
  nMarcas?: number;
  series: SerieLinha[];
  formatar: (v: number) => string;
  referencia?: { valor: number; rotulo: string };
  altura?: number;
  titulo: string;
  rotuloTabela?: string;
  dominioY?: [number, number];
}) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<string | null>(null);
  const todas = series.flatMap((s) => s.pontos);
  const datas = useMemo(() => [...new Set(todas.map((p) => p.data))].sort(), [todas]);

  if (todas.length === 0) return null;
  const valores = [...todas.map((p) => p.valor), ...(referencia ? [referencia.valor] : [])];
  const [y0, y1] = dominioY ?? (() => { const mi = Math.min(...valores), ma = Math.max(...valores); const f = (ma - mi) * 0.12 || 1; return [mi - f, ma + f]; })();
  const ticks = marcas(y0, y1, nMarcas);
  const yMin = ticks[0], yMax = ticks.at(-1)!;
  const esq = 44, dir = 12, topo = 12, base = 26;
  const larg = Math.max(100, w - esq - dir), alt = altura - topo - base;
  const d0 = datas[0], span = Math.max(1, diasEntre(d0, datas.at(-1)!));
  const x = (d: string) => esq + (datas.length === 1 ? larg / 2 : (diasEntre(d0, d) / span) * larg);
  const y = (v: number) => topo + alt - ((v - yMin) / (yMax - yMin)) * alt;

  function mover(ev: React.PointerEvent<SVGSVGElement>) {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ev.clientX - r.left;
    let melhor = datas[0], dist = Infinity;
    for (const d of datas) { const dd = Math.abs(x(d) - px); if (dd < dist) { dist = dd; melhor = d; } }
    setFoco(melhor);
  }

  const leitura = foco ? series.map((s) => ({ s, p: s.pontos.find((p) => p.data === foco) })).filter((r) => r.p) : [];
  const fx = foco ? x(foco) : 0;

  return (
    <figure className="grafico" aria-label={titulo}>
      {nota && <p className="grafico__nota grafico__nota--topo">{nota}</p>}
      <div className="grafico__area" ref={ref}>
        <svg width={w} height={altura} role="img" aria-label={titulo}
          onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setFoco(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={esq} x2={esq + larg} y1={y(t)} y2={y(t)} className="grafico__grade" />
              <text x={esq - 8} y={y(t)} className="grafico__eixo" textAnchor="end" dominantBaseline="middle">{formatar(t)}</text>
            </g>
          ))}
          <text x={esq} y={altura - 6} className="grafico__eixo" textAnchor="start">{dataCurta(datas[0])}</text>
          {datas.length > 1 && <text x={esq + larg} y={altura - 6} className="grafico__eixo" textAnchor="end">{dataCurta(datas.at(-1)!)}</text>}
          {referencia && (
            <g>
              <line x1={esq} x2={esq + larg} y1={y(referencia.valor)} y2={y(referencia.valor)} className="grafico__ref" />
              <text x={esq + larg} y={y(referencia.valor) - 6} className="grafico__ref-rotulo" textAnchor="end">{referencia.rotulo}</text>
            </g>
          )}
          {series.map((s) => {
            const pts = [...s.pontos].sort((a, b) => a.data.localeCompare(b.data));
            const estilo = s.estilo ?? 'ambos';
            return (
              <g key={s.nome} className={`grafico__serie grafico__serie--${s.cor}`}>
                {estilo !== 'pontos' && pts.length > 1 && (
                  <polyline fill="none" points={pts.map((p) => `${x(p.data)},${y(p.valor)}`).join(' ')} className="grafico__linha" />
                )}
                {estilo !== 'linha' && pts.map((p) => (
                  <circle key={p.data} cx={x(p.data)} cy={y(p.valor)} r={foco === p.data ? 6 : 4.5} className="grafico__ponto" />
                ))}
              </g>
            );
          })}
          {foco && <line x1={fx} x2={fx} y1={topo} y2={topo + alt} className="grafico__cursor" />}
        </svg>
        {foco && leitura.length > 0 && (
          <div className="grafico__leitura" style={{ left: Math.min(Math.max(fx, 70), w - 70) }}>
            {leitura.map(({ s, p }) => (
              <div key={s.nome} className="grafico__leitura-linha">
                <i className={`chave chave--${s.cor}`} />
                <strong>{formatar(p!.valor)}</strong>
                {series.length > 1 && <span>{s.nome}</span>}
              </div>
            ))}
            <span className="grafico__leitura-data">{formatarData(foco)}</span>
          </div>
        )}
      </div>
      {series.length > 1 && (
        <figcaption className="grafico__legenda">
          {series.map((s) => <span key={s.nome}><i className={`chave chave--${s.cor} ${s.estilo === 'pontos' ? 'chave--ponto' : ''}`} />{s.nome}</span>)}
        </figcaption>
      )}
      <Tabela cabecalho={['Data', ...series.map((s) => (series.length > 1 ? s.nome : rotuloTabela))]}
        linhas={[...datas].reverse().map((d) => [formatarData(d), ...series.map((s) => { const p = s.pontos.find((q) => q.data === d); return p ? formatar(p.valor) : '—'; })])} />
    </figure>
  );
}

export function GraficoBarras({ barras, formatar, cor, titulo, altura = 170, destaque, nota }: {
  nota?: string;
  barras: { rotulo: string; valor: number; detalhe?: string }[];
  formatar: (v: number) => string;
  cor: Cor;
  titulo: string;
  altura?: number;
  /** índice da barra atual (ex.: semana atual) */
  destaque?: number;
}) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<number | null>(null);
  const max = Math.max(...barras.map((b) => b.valor), 0);
  const ticks = marcas(0, max || 1, 3);
  const yMax = ticks.at(-1)!;
  const esq = 44, dir = 6, topo = 10, base = 24;
  const larg = Math.max(100, w - esq - dir), alt = altura - topo - base;
  const bw = larg / barras.length;
  const y = (v: number) => topo + alt - (v / yMax) * alt;
  // rótulos: todos até 7 barras; senão a cada 3 + a atual, sem encostar um no outro
  const base3 = (i: number) => i % 3 === 0 || (i === barras.length - 1 && i % 3 === 2);
  const mostrar = (i: number) => barras.length <= 7 || i === destaque || (base3(i) && (destaque === undefined || Math.abs(i - destaque) > 1));

  return (
    <figure className="grafico" aria-label={titulo}>
      {nota && <p className="grafico__nota grafico__nota--topo">{nota}</p>}
      <div className="grafico__area" ref={ref}>
        <svg width={w} height={altura} role="img" aria-label={titulo} onPointerLeave={() => setFoco(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={esq} x2={esq + larg} y1={y(t)} y2={y(t)} className="grafico__grade" />
              <text x={esq - 8} y={y(t)} className="grafico__eixo" textAnchor="end" dominantBaseline="middle">{formatar(t)}</text>
            </g>
          ))}
          {barras.map((b, i) => {
            const h = Math.max(b.valor > 0 ? 3 : 0, alt - (y(b.valor) - topo));
            const bx = esq + i * bw + 1, larguraBarra = Math.max(2, bw - 2);
            const r = Math.min(4, larguraBarra / 2, h);
            const by = topo + alt - h;
            return (
              <g key={i} className={`grafico__barra grafico__serie--${cor} ${foco === i ? 'foco' : ''} ${destaque === i ? 'atual' : ''}`}
                tabIndex={0} role="button" aria-label={`${b.rotulo}: ${formatar(b.valor)}`}
                onPointerEnter={() => setFoco(i)} onPointerDown={() => setFoco(i)} onFocus={() => setFoco(i)} onBlur={() => setFoco(null)}>
                <rect x={esq + i * bw} y={topo} width={bw} height={alt} fill="transparent" />
                {h > 0 && <path d={`M${bx},${topo + alt} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + larguraBarra - r} Q${bx + larguraBarra},${by} ${bx + larguraBarra},${by + r} V${topo + alt} Z`} className="grafico__barra-forma" />}
                {mostrar(i) && <text x={esq + i * bw + bw / 2} y={altura - 6} className={`grafico__eixo ${destaque === i ? 'grafico__eixo--forte' : ''}`} textAnchor="middle">{b.rotulo}</text>}
              </g>
            );
          })}
          <line x1={esq} x2={esq + larg} y1={topo + alt} y2={topo + alt} className="grafico__base" />
        </svg>
        {foco !== null && (
          <div className="grafico__leitura" style={{ left: Math.min(Math.max(esq + foco * bw + bw / 2, 70), w - 70) }}>
            <div className="grafico__leitura-linha"><i className={`chave chave--${cor} chave--barra`} /><strong>{formatar(barras[foco].valor)}</strong></div>
            <span className="grafico__leitura-data">{barras[foco].detalhe ?? barras[foco].rotulo}</span>
          </div>
        )}
      </div>
      <Tabela cabecalho={['', 'Valor']} linhas={barras.map((b) => [b.detalhe ?? b.rotulo, formatar(b.valor)])} />
    </figure>
  );
}

export function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: ReactNode[][] }) {
  return (
    <details className="grafico__tabela">
      <summary>Ver dados</summary>
      <table>
        <thead><tr>{cabecalho.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>{linhas.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

/** Rótulo de semana (S1..S12) a partir de um índice. */
export const rotuloSemana = (i: number) => `S${i + 1}`;
export const diaDaSemanaCurto = (iso: string) => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][deIso(iso).getDay()];
