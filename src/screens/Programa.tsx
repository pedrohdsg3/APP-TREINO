import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Sessao } from '../db';
import { Botao, Card } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { DetalheDia } from '../ui/DetalheDia';
import { IcHalter, IcTenis } from '../ui/Icones';
import { deIso, formatarData, isoLocal } from '../lib/datas';
import { salvarConfigPrograma, useConfigPrograma } from '../lib/ajustes';
import {
  SEMANAS_PROGRAMA, dataDoDia, planoDaData, planoAtual, faseDaSemana, posicao, repetirSemana,
  semanaDoPrograma, totalSemanasCalendario, type ConfigPrograma, type DiaPlanejado,
} from '../engine/plano';

const SIGLA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const curta = (iso: string) => formatarData(iso).slice(0, 5);

type EstadoDia = 'feito' | 'parcial' | 'pulado' | 'hoje' | 'passado' | 'futuro' | 'descanso';
function estadoDia(data: string, hoje: string, porData: Map<string, Sessao[]>, descanso = false): EstadoDia {
  // cardio leve só conta como "feito" num dia de descanso
  const s = (porData.get(data) ?? []).filter((x) => descanso || x.tipo !== 'cardio');
  if (s.some((x) => x.status === 'feito')) return 'feito';
  if (s.some((x) => x.status === 'parcial')) return 'parcial';
  if (s.some((x) => x.status === 'pulado')) return 'pulado';
  if (data === hoje) return 'hoje';
  if (descanso) return 'descanso';
  return data < hoje ? 'passado' : 'futuro';
}

function DiaPilula({ data, plano, estado, onClick }: { data: string; plano: DiaPlanejado; estado: EstadoDia; onClick: () => void }) {
  const dia = (deIso(data).getDay() + 6) % 7;
  const Ic = plano.descanso ? () => <span aria-hidden="true">🌿</span> : plano.tipoPrincipal === 'corrida' ? IcTenis : IcHalter;
  return (
    <button className={`pilula pilula--${plano.tipoPrincipal === 'corrida' ? 'corr' : 'musc'} pilula--${estado}`} onClick={onClick}
      aria-label={`${SIGLA[dia]} ${formatarData(data)}: ${plano.titulo}, ${estado}`}>
      <span className="pilula__dia">{SIGLA[dia]}</span>
      <span className="pilula__icone"><Ic tamanho={18} /></span>
      <span className="pilula__data">{deIso(data).getDate()}</span>
    </button>
  );
}

export function Programa() {
  const cfg = useConfigPrograma();
  const sessoes = useLiveQuery(() => db.sessoes.toArray(), []) ?? [];
  const [aberta, setAberta] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<{ data: string; plano: DiaPlanejado } | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  if (!cfg) return <div className="tela" />;

  const hoje = isoLocal();
  const pos = posicao(cfg, hoje);
  const atual = pos.estado === 'durante' ? pos.semanaCal : pos.estado === 'antes' ? 0 : -1;
  const porData = new Map<string, Sessao[]>();
  for (const s of sessoes) porData.set(s.data, [...(porData.get(s.data) ?? []), s]);
  const semanaAberta = aberta ?? atual;
  const total = totalSemanasCalendario(cfg);
  const fim = dataDoDia(cfg, total - 1, 6);

  const salvar = (c: ConfigPrograma) => salvarConfigPrograma(c);

  function dias(semanaCal: number) {
    return Array.from({ length: 7 }, (_, d) => {
      const data = dataDoDia(cfg!, semanaCal, d);
      return { data, plano: planoDaData(cfg!, data)! };
    });
  }

  return (
    <div className="tela tela--programa">
      <header className="cabecalho">
        <h1>Programa</h1>
        <p className="cabecalho__sub">
          {pos.estado === 'durante' ? `Semana ${pos.semana} de ${SEMANAS_PROGRAMA} · Fase ${pos.fase}` : `${SEMANAS_PROGRAMA} semanas`}
          {' · '}{formatarData(cfg.inicio)} a {formatarData(fim)}
        </p>
      </header>

      <div className="legenda-fases entra">
        {planoAtual().fases.map((f) => <span key={f.nome}><i className={`ponto ponto--${f.nome}`} /> {f.nome}</span>)}
      </div>

      <div className="linha-tempo entra">
        {Array.from({ length: total }, (_, sc) => {
          const sp = semanaDoPrograma(cfg, sc);
          const fase = faseDaSemana(sp);
          const ds = dias(sc);
          const feitos = ds.filter((d) => !d.plano.descanso && estadoDia(d.data, hoje, porData) === 'feito').length;
          const nTreinos = ds.filter((d) => !d.plano.descanso).length;
          const expandida = semanaAberta === sc;
          return (
            <Card key={sc} className={`semana semana--${fase} ${sc === atual ? 'semana--atual' : ''} ${expandida ? 'semana--aberta' : ''}`}>
              <button className="semana__cab" onClick={() => setAberta(expandida ? -1 : sc)} aria-expanded={expandida}>
                <span className="semana__num">{sp}</span>
                <span className="semana__info">
                  <strong>Semana {sp}{cfg.repetidas.includes(sc) ? ' · repetição' : ''}{sc === atual ? ' · atual' : ''}</strong>
                  <span>{fase} · {curta(ds[0].data)} – {curta(ds[6].data)}</span>
                </span>
                <span className="semana__prog">{feitos}/{nTreinos}</span>
              </button>
              {expandida && (
                <div className="semana__dias">
                  {ds.map((d) => (
                    <DiaPilula key={d.data} data={d.data} plano={d.plano} estado={estadoDia(d.data, hoje, porData, d.plano.descanso)}
                      onClick={() => setDetalhe(d)} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="entra">
        <h3 className="card__titulo">Ajustes do programa</h3>
        <label className="campo">
          <span>Data de início (segunda-feira) · {formatarData(cfg.inicio)}</span>
          <input type="date" value={cfg.inicio} onChange={(e) => {
            const v = e.target.value;
            if (v) salvar({ ...cfg, inicio: v });
          }} />
        </label>
        {deIso(cfg.inicio).getDay() !== 1 && <p className="aviso-campo">Atenção: essa data não é uma segunda-feira, os dias do plano ficarão deslocados.</p>}
        {pos.estado === 'durante' && (
          <>
            <p className="sutil espaco">Semana ruim ou lesão? Repetir a semana adia o restante do programa em 7 dias.</p>
            <Botao variante="secundario" onClick={() => setConfirmar(true)}>Repetir a semana {pos.semana}</Botao>
          </>
        )}
        {(cfg.recuoCorrida ?? 0) > 0 && (
          <div className="ajuste-ativo">
            <span>🦵 Corrida {cfg.recuoCorrida} semana(s) atrás do programa (joelho).</span>
            <button className="link" onClick={() => salvar({ ...cfg, recuoCorrida: Math.max(0, (cfg.recuoCorrida ?? 0) - 1) })}>Avançar 1 semana</button>
          </div>
        )}
        {cfg.repetidas.length > 0 && (
          <button className="link" onClick={() => salvar({ ...cfg, repetidas: cfg.repetidas.slice(0, -1) })}>
            Desfazer última repetição ({cfg.repetidas.length} {cfg.repetidas.length === 1 ? 'semana repetida' : 'semanas repetidas'})
          </button>
        )}
      </Card>

      <Folha aberta={!!detalhe} aoFechar={() => setDetalhe(null)} titulo="Treino do dia">
        {detalhe && <DetalheDia data={detalhe.data} plano={detalhe.plano} />}
      </Folha>

      <Folha aberta={confirmar} aoFechar={() => setConfirmar(false)} titulo="Repetir semana">
        {pos.estado === 'durante' && (
          <div className="detalhe">
            <h2 className="detalhe__titulo">Repetir a semana {pos.semana}?</h2>
            <p className="detalhe__orientacao">
              A próxima semana refaz o treino da semana {pos.semana} e o programa termina 7 dias depois.
              Tudo bem fazer isso: consistência vale mais que pressa. 💪
            </p>
            <Botao grande onClick={async () => { await salvar(repetirSemana(cfg, pos.semanaCal)); setConfirmar(false); }}>Sim, repetir</Botao>
            <Botao variante="fantasma" onClick={() => setConfirmar(false)}>Cancelar</Botao>
          </div>
        )}
      </Folha>
    </div>
  );
}
