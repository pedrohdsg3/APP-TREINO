// Conteúdo da folha de um dia: treino planejado completo + o que foi realizado.
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { EXERCICIOS } from '../data/musculacao';
import { REGRAS_JOELHO } from '../data/corrida';
import { orientacaoCorrida, orientacaoFase, formatarDuracao, prescricao, type CorridaPlanejada, type DiaPlanejado, type MusculacaoPlanejada } from '../engine/plano';
import { dataPorExtenso, formatarData } from '../lib/datas';
import { Chip } from './Componentes';
import { IcHalter, IcRelogio, IcTenis } from './Icones';
import { Folha } from './Folha';
import { infoModalidade } from '../data/atividades';
import { Tutorial } from './Tutorial';

export function BarraFases({ corrida }: { corrida: CorridaPlanejada }) {
  return (
    <div className="barra-fases" aria-hidden="true">
      {corrida.fases.map((f, i) => (
        <span key={i} className={`barra-fases__seg barra-fases__seg--${f.tipo}`} style={{ flexGrow: f.seg }} />
      ))}
    </div>
  );
}

function BlocoCorrida({ c }: { c: CorridaPlanejada }) {
  return (
    <div className="bloco-plano">
      <div className="bloco-plano__topo">
        <Chip cor="corr"><IcTenis tamanho={15} /> {c.titulo}</Chip>
        <span className="detalhe-meta"><IcRelogio tamanho={15} /> {formatarDuracao(c.totalSeg)}</span>
      </div>
      <p className="bloco-plano__resumo">{c.resumo}</p>
      <BarraFases corrida={c} />
      <div className="legenda">
        <span><i className="ponto ponto--caminhada" /> Caminhada</span>
        <span><i className="ponto ponto--trote" /> Trote</span>
      </div>
      <ul className="lista-simples">
        <li>5' caminhada de aquecimento</li>
        <li>{c.resumo} <span className="sutil">· {formatarDuracao(c.utilSeg)} de tempo útil</span></li>
        <li>5' caminhada de desaquecimento</li>
      </ul>
      <p className="sutil">{c.esforco}</p>
    </div>
  );
}

function BlocoCardio({ c, extra }: { c: CorridaPlanejada; extra?: boolean }) {
  return (
    <div className="bloco-plano">
      <div className="bloco-plano__topo">
        <Chip cor="corr">🚶 Cardio leve{extra ? ' · opcional' : ''}</Chip>
        <span className="detalhe-meta"><IcRelogio tamanho={15} /> {formatarDuracao(c.totalSeg)}</span>
      </div>
      <p className="sutil">{c.resumo}. {c.esforco}. {extra ? 'Depois da musculação.' : ''}</p>
    </div>
  );
}

function BlocoMusculacao({ m, pct }: { m: MusculacaoPlanejada; pct: number }) {
  const [tutorial, setTutorial] = useState<string | null>(null);
  return (
    <div className="bloco-plano">
      <div className="bloco-plano__topo">
        <Chip cor="musc"><IcHalter tamanho={15} /> {m.id === 'abdomen' ? 'Abdômen' : 'Musculação'}</Chip>
        <span className="detalhe-meta"><IcRelogio tamanho={15} /> ~{m.minutos} min</span>
      </div>
      {pct < 100 && <p className="sutil">Carga ~{pct}% da habitual nesta semana.</p>}
      <ol className="lista-exercicios">
        {m.itens.map((it, i) => {
          const ex = EXERCICIOS[it.exercicioId];
          return (
            <li key={it.exercicioId + i}>
              <span className="lista-exercicios__num">{i + 1}</span>
              <button className="lista-exercicios__info lista-exercicios__info--botao" onClick={() => setTutorial(it.exercicioId)} aria-label={`Como fazer: ${ex.nome}`}>
                <strong>{ex.nome}</strong>
                <span>{ex.grupo} · descanso {it.descanso} s · <u>como fazer</u></span>
              </button>
              <span className="lista-exercicios__presc">{prescricao(it)}</span>
            </li>
          );
        })}
      </ol>
      <Folha aberta={!!tutorial} aoFechar={() => setTutorial(null)} titulo="Como fazer">
        {tutorial && <Tutorial exercicioId={tutorial} />}
      </Folha>
    </div>
  );
}

const STATUS = { feito: 'Concluído ✅', parcial: 'Parcial', pulado: 'Pulado' } as const;

export function DetalheDia({ data, plano }: { data: string; plano: DiaPlanejado }) {
  const sessoes = useLiveQuery(() => db.sessoes.where('data').equals(data).toArray(), [data]) ?? [];
  const [excluir, setExcluir] = useState<string | null>(null);
  async function apagar(id: string) {
    await db.transaction('rw', db.sessoes, db.series, db.corridas, async () => {
      await db.series.where('sessaoId').equals(id).delete();
      await db.corridas.delete(id);
      await db.sessoes.delete(id);
    });
    setExcluir(null);
  }
  return (
    <div className="detalhe">
      <p className="detalhe__data">{dataPorExtenso(data)} · {formatarData(data)}</p>
      <h2 className="detalhe__titulo">{plano.titulo}</h2>
      <p className="detalhe__fase">Semana {plano.semana} · Fase {plano.fase}</p>
      <p className="detalhe__orientacao">{plano.descanso ? 'Dia de descanso. Se quiser se mexer, um cardio leve ajuda na recuperação.' : (plano.tipoPrincipal === 'corrida' ? orientacaoCorrida : orientacaoFase)(plano.fase)}</p>

      {plano.corrida && (plano.corrida.tipo === 'cardio' ? <BlocoCardio c={plano.corrida} /> : <BlocoCorrida c={plano.corrida} />)}
      {plano.musculacao && <BlocoMusculacao m={plano.musculacao} pct={plano.musculacao.itens[0]?.cargaPct ?? 100} />}
      {plano.cardio && <BlocoCardio c={plano.cardio} extra />}

      <h3 className="detalhe__secao">Realizado</h3>
      {sessoes.length === 0 ? (
        <p className="sutil">Nada registrado neste dia ainda.</p>
      ) : (
        <ul className="lista-simples">
          {sessoes.map((s) => (
            <li key={s.id} className="realizado">
              <span>
                {s.tipo === 'atividade' ? `${infoModalidade(s.atividade?.modalidade ?? 'Atividade').emoji} ${s.atividade?.modalidade ?? 'Atividade'}${s.atividade?.substituiuCorrida ? ' (no lugar da corrida)' : ''}` : s.tipo === 'cardio' ? '🚶 Cardio leve' : s.tipo === 'corrida' ? (s.treinoId === 'livre' ? '🏃 Corrida livre' : '🏃 Corrida') : '💪 Musculação'} · {STATUS[s.status]}
                {s.duracaoSeg ? ` · ${formatarDuracao(s.duracaoSeg)}` : ''}{s.esforco ? ` · esforço ${s.esforco}/10` : ''}
              </span>
              {excluir === s.id ? (
                <span className="realizado__confirma">
                  <button className="link link--perigo" onClick={() => apagar(s.id)}>Excluir mesmo</button>
                  <button className="link link--sutil" onClick={() => setExcluir(null)}>Não</button>
                </span>
              ) : (
                <button className="link link--sutil" onClick={() => setExcluir(s.id)} aria-label="Excluir este registro">Excluir</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {plano.corrida && (
        <details className="regras">
          <summary>Cuidados com o joelho</summary>
          <ul>{REGRAS_JOELHO.map((r) => <li key={r}>{r}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
