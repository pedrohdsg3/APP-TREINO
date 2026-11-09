import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Anel, Botao, Card, Chip } from '../ui/Componentes';
import { IcBalanca, IcChama, IcHalter, IcPlay, IcRelogio, IcTenis, IcTrofeu } from '../ui/Icones';
import { Folha } from '../ui/Folha';
import { BarraFases, DetalheDia } from '../ui/DetalheDia';
import { dataPorExtenso, formatarData, isoLocal, saudacao, somarDias, diasEntre } from '../lib/datas';
import { useConfigPrograma } from '../lib/ajustes';
import { SEMANAS_PROGRAMA, dataDoDia, planoDaData, posicao, formatarDuracao, type DiaPlanejado } from '../engine/plano';
import { feitosNaSemana, sequencia, ultimaSessao } from '../engine/estatisticas';

function quando(data: string, hoje: string) {
  const d = diasEntre(hoje, data);
  if (d === 0) return 'hoje';
  if (d === 1) return 'amanhã';
  if (d === -1) return 'ontem';
  return formatarData(data);
}

export function Hoje({ aoIniciar, aoCorridaLivre }: { aoIniciar: (p: DiaPlanejado, modo: 'principal' | 'musculacao') => void; aoCorridaLivre: () => void }) {
  const cfg = useConfigPrograma();
  const hoje = isoLocal();
  const sessoes = useLiveQuery(() => db.sessoes.toArray(), []) ?? [];
  const peso = useLiveQuery(() => db.corpo.orderBy('data').reverse().filter((r) => r.peso != null).first(), []);
  const [detalhe, setDetalhe] = useState<{ data: string; plano: DiaPlanejado } | null>(null);
  if (!cfg) return <div className="tela" />;

  const pos = posicao(cfg, hoje);
  // Antes do início: mostra o 1º treino. Depois do fim: nada planejado.
  const dataTreino = pos.estado === 'antes' ? cfg.inicio : hoje;
  const plano = planoDaData(cfg, dataTreino);
  const prox = planoDaData(cfg, somarDias(dataTreino, 1));
  const inicioSemana = pos.estado === 'durante' ? dataDoDia(cfg, pos.semanaCal, 0) : cfg.inicio;
  const feitos = feitosNaSemana(sessoes, inicioSemana);
  const seq = sequencia(sessoes, hoje);
  const ultima = ultimaSessao(sessoes, hoje);
  const doDia = sessoes.filter((s) => s.data === hoje && s.status !== 'pulado');
  const principalFeito = doDia.some((s) => s.tipo === (plano?.tipoPrincipal ?? 'musculacao') && s.status === 'feito');
  const extraFeito = doDia.some((s) => s.tipo === 'musculacao' && s.status === 'feito');
  const temExtra = !!(plano?.corrida && plano.musculacao);
  const cor = plano?.tipoPrincipal === 'corrida' ? 'corr' : 'musc';

  return (
    <div className="tela">
      <header className="cabecalho">
        <p className="cabecalho__data">{dataPorExtenso(hoje)}</p>
        <h1>{saudacao()}, Pedro <span className="emoji">👋</span></h1>
        {pos.estado === 'durante' && (
          <p className="cabecalho__sub">Semana {pos.semana} de {SEMANAS_PROGRAMA} · Fase {pos.fase}{pos.repetida ? ' · repetição' : ''}</p>
        )}
        {pos.estado === 'antes' && <p className="cabecalho__sub">O programa começa em {pos.diasParaComecar === 1 ? '1 dia' : `${pos.diasParaComecar} dias`} ({formatarData(cfg.inicio)})</p>}
        {pos.estado === 'depois' && <p className="cabecalho__sub">Programa de 12 semanas concluído 🏆</p>}
      </header>

      {plano ? (
        <Card destaque={cor} className="treino-dia entra">
          <div className="treino-dia__topo">
            <Chip cor={cor}>{cor === 'musc' ? <><IcHalter tamanho={16} /> Musculação</> : <><IcTenis tamanho={16} /> Corrida</>}</Chip>
            <span className="treino-dia__dur"><IcRelogio tamanho={16} /> ~{plano.minutos} min</span>
          </div>
          {pos.estado === 'antes' && <p className="sutil">Primeiro treino · {dataPorExtenso(cfg.inicio)}</p>}
          <h2 className="treino-dia__titulo">{plano.titulo}</h2>
          <div className="tags">
            {plano.grupos.map((g) => <span key={g} className="tag">{g}</span>)}
          </div>
          {plano.corrida && <BarraFases corrida={plano.corrida} />}
          {plano.recuperacao && <p className="nota-recup">🌿 Semana de recuperação: menos volume, carga ~10% menor.</p>}
          {pos.estado === 'antes' ? null : principalFeito
            ? <Botao grande variante="secundario" onClick={() => setDetalhe({ data: dataTreino, plano })}>{temExtra ? 'Corrida concluída ✅' : 'Treino de hoje concluído ✅'}</Botao>
            : <Botao grande cor={cor} icone={<IcPlay tamanho={20} />} onClick={() => aoIniciar(plano, 'principal')}>{temExtra ? 'Iniciar corrida' : 'Iniciar treino'}</Botao>}
          {pos.estado !== 'antes' && temExtra && (extraFeito
            ? <p className="sutil centro">Abdômen concluído ✅</p>
            : <Botao variante="secundario" icone={<IcHalter tamanho={18} />} onClick={() => aoIniciar(plano, 'musculacao')}>Iniciar abdômen (~{plano.musculacao!.minutos} min)</Botao>)}
          <button className="link" onClick={() => setDetalhe({ data: dataTreino, plano })}>Ver treino completo</button>
        </Card>
      ) : (
        <Card className="entra concluido">
          <IcTrofeu tamanho={40} />
          <h2>Você completou as 12 semanas!</h2>
          <p className="sutil">Confira sua evolução e, se quiser, reinicie o programa em Perfil.</p>
        </Card>
      )}

      {pos.estado === 'durante' && (
        <Card className="meta entra">
          <Anel progresso={feitos / 7} tamanho={72} espessura={7}><strong>{feitos}/7</strong></Anel>
          <div className="meta__texto">
            <h3>Meta da semana</h3>
            <p>{feitos} de 7 treinos concluídos</p>
            <p className="meta__streak"><IcChama tamanho={16} /> Sequência: {seq} {seq === 1 ? 'dia' : 'dias'}</p>
          </div>
        </Card>
      )}

      <div className="grade-mini entra">
        <Card className="mini">
          <span className="mini__rotulo">Último</span>
          <strong>{ultima ? (ultima.tipo === 'corrida' ? 'Corrida' : 'Musculação') : '—'}</strong>
          <span className="mini__sub">{ultima ? `${quando(ultima.data, hoje)}${ultima.duracaoSeg ? ` · ${formatarDuracao(ultima.duracaoSeg)}` : ''}` : 'nenhum treino ainda'}</span>
        </Card>
        <Card className="mini">
          <span className="mini__rotulo">Próximo</span>
          <strong>{prox ? prox.titulo : '—'}</strong>
          <span className="mini__sub">{prox ? quando(somarDias(dataTreino, 1), hoje) : 'fim do programa'}</span>
        </Card>
        <Card className="mini mini--largo">
          <span className="mini__rotulo"><IcBalanca tamanho={14} /> Peso corporal</span>
          <strong>{peso?.peso != null ? `${peso.peso.toLocaleString('pt-BR')} kg` : '—'}</strong>
          <span className="mini__sub">{peso ? `em ${formatarData(peso.data)}` : 'registre em Evolução › Corpo'}</span>
        </Card>
      </div>

      <button className="extra entra" onClick={aoCorridaLivre}>
        <span className="extra__icone"><IcTenis tamanho={20} /></span>
        <span className="extra__texto"><strong>Corrida livre</strong><span>Cronômetro simples, fora do plano</span></span>
        <span aria-hidden="true">›</span>
      </button>

      <Folha aberta={!!detalhe} aoFechar={() => setDetalhe(null)} titulo="Treino do dia">
        {detalhe && <DetalheDia data={detalhe.data} plano={detalhe.plano} />}
      </Folha>
    </div>
  );
}
