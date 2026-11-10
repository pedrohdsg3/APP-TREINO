// Seções de configuração da aba Perfil: backup, avisos, descanso, treinos, programa e instalação.
import { useRef, useState } from 'react';
import { db } from '../db';
import { EXERCICIOS, type Grupo } from '../data/musculacao';
import { musculacaoPlanejada, planoAtual, posicao, prescricao, type PersonalizacaoTreino } from '../engine/plano';
import { exportar, importar, resumir, salvarArquivo, ultimoBackup, validar, type Backup } from '../lib/backup';
import { lerConfigPrograma, salvarConfigPrograma, useConfigPrograma } from '../lib/ajustes';
import { avisar, falar, liberarAudio } from '../lib/alertas';
import { lerPrefs, salvarPrefs, type Prefs } from '../lib/prefs';
import { listarPerfis, perfilAtual } from '../lib/perfis';
import { diasEntre, formatarData, isoLocal } from '../lib/datas';
import { proximaSegunda } from './EscolherPerfil';
import { Botao, Card } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { IcEscudo } from '../ui/Icones';

// ------------------------------------------------------------------ backup
export function SecaoBackup() {
  const [ultimo, setUltimo] = useState(ultimoBackup());
  const [arquivo, setArquivo] = useState<Backup | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dias = ultimo ? diasEntre(isoLocal(ultimo), isoLocal()) : null;
  const atrasado = dias === null || dias > 7;

  async function exportarPerfis(todos: boolean) {
    setOcupado(true);
    try {
      const perfis = todos ? listarPerfis() : [perfilAtual()];
      const b = await exportar(perfis);
      const nome = `treino-${todos ? 'todos' : perfilAtual().id}-${isoLocal()}.json`;
      await salvarArquivo(b, nome);
      setUltimo(ultimoBackup());
    } finally { setOcupado(false); }
  }

  return (
    <Card className={`backup entra ${atrasado ? 'backup--alerta' : ''}`}>
      <div className="backup__topo">
        <span className="aviso-backup__icone"><IcEscudo /></span>
        <div>
          <h3>Backup dos seus dados</h3>
          <p>Tudo fica só neste aparelho. Se trocar de celular ou limpar o navegador, só o backup salva seus treinos.</p>
        </div>
      </div>
      <p className={`backup__status ${atrasado ? 'alerta' : ''}`}>
        {ultimo ? `Último backup: ${formatarData(isoLocal(ultimo))}${dias ? ` (há ${dias} dia${dias > 1 ? 's' : ''})` : ' (hoje)'}` : 'Você ainda não fez nenhum backup.'}
        {atrasado && ' · recomendado 1× por semana'}
      </p>
      <div className="perdido__acoes">
        <Botao disabled={ocupado} onClick={() => exportarPerfis(false)}>Exportar {perfilAtual().nome}</Botao>
        {listarPerfis().length > 1 && <Botao variante="secundario" disabled={ocupado} onClick={() => exportarPerfis(true)}>Exportar todos</Botao>}
      </div>
      <button className="link" onClick={() => input.current?.click()}>Importar backup (.json)</button>
      <input ref={input} type="file" accept="application/json,.json" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        try { setArquivo(validar(JSON.parse(await f.text()))); setErro(null); }
        catch (err) { setErro((err as Error).message || 'Arquivo inválido.'); }
      }} />
      {erro && <p className="aviso-campo">{erro}</p>}

      <Folha aberta={!!arquivo} aoFechar={() => setArquivo(null)} titulo="Importar backup">
        {arquivo && (
          <div className="detalhe">
            <h2 className="detalhe__titulo">Importar backup?</h2>
            <p className="detalhe__orientacao">De {formatarData(arquivo.exportadoEm.slice(0, 10))}. Os dados atuais destes perfis serão <strong>substituídos</strong>:</p>
            <ul className="lista-simples">
              {resumir(arquivo).map((r) => <li key={r.nome}><strong>{r.nome}</strong> · {r.sessoes} treinos · {r.pesos} registros de peso</li>)}
            </ul>
            <Botao grande disabled={ocupado} onClick={async () => {
              setOcupado(true);
              await importar(arquivo);
              location.reload();
            }}>Importar e substituir</Botao>
            <Botao variante="secundario" onClick={() => setArquivo(null)}>Cancelar</Botao>
          </div>
        )}
      </Folha>
    </Card>
  );
}

// ------------------------------------------------------------------ avisos
function Interruptor({ rotulo, detalhe, valor, onChange }: { rotulo: string; detalhe?: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="interruptor" role="switch" aria-checked={valor} onClick={() => onChange(!valor)}>
      <span className="interruptor__texto"><strong>{rotulo}</strong>{detalhe && <small>{detalhe}</small>}</span>
      <span className={`interruptor__chave ${valor ? 'on' : ''}`} aria-hidden="true"><i /></span>
    </button>
  );
}

function usePrefs(): [Prefs, (p: Partial<Prefs>) => void] {
  const [p, setP] = useState(lerPrefs());
  return [p, (n) => { salvarPrefs(n); setP(lerPrefs()); }];
}

export function SecaoAvisos() {
  const [p, set] = usePrefs();
  return (
    <Card className="entra">
      <h3 className="card__titulo">Sons e avisos</h3>
      <Interruptor rotulo="Som" detalhe="Fim do descanso e troca de fase" valor={p.som} onChange={(v) => set({ som: v })} />
      <Interruptor rotulo="Vibração" detalhe="Não funciona no iPhone (limitação do iOS)" valor={p.vibracao} onChange={(v) => set({ vibracao: v })} />
      <Interruptor rotulo="Voz" detalhe='Ex.: "Hora de caminhar" na corrida' valor={p.voz} onChange={(v) => set({ voz: v })} />
      <button className="link" onClick={() => { liberarAudio(); avisar('fim'); falar('Teste de voz. Bora treinar!'); }}>🔊 Testar avisos</button>
    </Card>
  );
}

// ------------------------------------------------------------------ descanso
export function SecaoDescanso() {
  const [p, set] = usePrefs();
  const d = p.descansoPadrao ?? {};
  const opc = (valores: number[], atual: number | undefined, padrao: number, campo: 'composto' | 'isolador') => (
    <div className="chips-sel">
      {valores.map((v) => {
        const on = (atual ?? padrao) === v;
        return <button key={v} className={`chip-sel ${on ? 'on on--musc' : ''}`} aria-pressed={on}
          onClick={() => set({ descansoPadrao: { ...d, [campo]: v === padrao ? undefined : v } })}>{v} s{v === padrao ? ' (plano)' : ''}</button>;
      })}
    </div>
  );
  return (
    <Card className="entra">
      <h3 className="card__titulo">Descanso padrão</h3>
      <p className="sutil espaco-baixo">Compostos (supino, agachamento, remada…)</p>
      {opc([60, 75, 90, 120, 150], d.composto, 90, 'composto')}
      <p className="sutil espaco-baixo espaco-cima">Isoladores (rosca, extensora, elevação…)</p>
      {opc([45, 60, 75, 90], d.isolador, 60, 'isolador')}
      <p className="sutil espaco-cima">Durante o treino você ainda ajusta com +15 s / −15 s. Unidades: kg, km e min/km.</p>
    </Card>
  );
}

// ------------------------------------------------------------------ treinos (editar exercícios e cargas iniciais)
export function SecaoTreinos() {
  const [aberto, setAberto] = useState(false);
  return (
    <Card className="entra">
      <h3 className="card__titulo">Treinos</h3>
      <p className="sutil">Troque, remova ou adicione exercícios e defina as cargas iniciais (usadas até você ter histórico).</p>
      <Botao variante="secundario" onClick={() => setAberto(true)}>Editar exercícios e cargas</Botao>
      <Folha aberta={aberto} aoFechar={() => setAberto(false)} titulo="Editar treinos">
        {aberto && <EditorTreinos />}
      </Folha>
    </Card>
  );
}

function EditorTreinos() {
  const cfg = useConfigPrograma();
  const [sel, setSel] = useState<string | null>(null);
  const [trocar, setTrocar] = useState<string | null>(null);
  const [adicionar, setAdicionar] = useState(false);
  const plano = planoAtual();
  const ids = Object.keys(plano.treinos).filter((id) => plano.semana.some((d) => d.musculacao === id));
  const treinoId = sel ?? ids[0];
  if (!cfg) return null;
  const pos = posicao(cfg, isoLocal());
  const semana = pos.estado === 'durante' ? pos.semana : 1;
  const pers: PersonalizacaoTreino = cfg.personalizacao?.[treinoId] ?? {};
  const m = musculacaoPlanejada(treinoId, semana, { personalizacao: pers });
  const salvarPers = async (n: PersonalizacaoTreino) => {
    const c = await lerConfigPrograma();
    await salvarConfigPrograma({ ...c, personalizacao: { ...c.personalizacao, [treinoId]: n } });
  };
  const original = (id: string) => Object.entries(pers.trocar ?? {}).find(([, para]) => para === id)?.[0] ?? id;

  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">Editar treinos</h2>
      <div className="chips-sel">
        {ids.map((id) => <button key={id} className={`chip-sel ${id === treinoId ? 'on on--musc' : ''}`} onClick={() => setSel(id)}>{plano.treinos[id].titulo.split(' · ')[0]}</button>)}
      </div>
      <p className="sutil">{plano.treinos[treinoId].titulo} · prescrição da semana {semana}</p>
      <ul className="editor">
        {m.itens.map((it) => {
          const ex = EXERCICIOS[it.exercicioId];
          const trocado = original(it.exercicioId) !== it.exercicioId;
          return (
            <li key={it.exercicioId}>
              <div className="editor__info">
                <strong>{ex.nome}</strong>
                <span>{prescricao(it)}{trocado ? ` · no lugar de ${EXERCICIOS[original(it.exercicioId)].nome}` : ''}</span>
              </div>
              {!ex.semCarga && (
                <label className="editor__carga">
                  <input inputMode="decimal" aria-label={`Carga inicial de ${ex.nome}`} placeholder="inicial"
                    defaultValue={cfg.cargasIniciais?.[it.exercicioId]?.toString().replace('.', ',') ?? ''}
                    onBlur={async (e) => {
                      const v = parseFloat(e.target.value.replace(',', '.'));
                      const c = await lerConfigPrograma();
                      const cargas = { ...c.cargasIniciais };
                      if (Number.isFinite(v) && v > 0) cargas[it.exercicioId] = v; else delete cargas[it.exercicioId];
                      await salvarConfigPrograma({ ...c, cargasIniciais: cargas });
                    }} />
                  <small>kg</small>
                </label>
              )}
              <div className="editor__acoes">
                <button className="mini-btn" onClick={() => setTrocar(it.exercicioId)}>Trocar</button>
                <button className="mini-btn mini-btn--perigo" aria-label={`Remover ${ex.nome}`} onClick={() => {
                  const orig = original(it.exercicioId);
                  const adicionado = pers.adicionar?.some((a) => a.exercicioId === it.exercicioId);
                  void salvarPers(adicionado
                    ? { ...pers, adicionar: pers.adicionar!.filter((a) => a.exercicioId !== it.exercicioId) }
                    : { ...pers, remover: [...(pers.remover ?? []), orig] });
                }}>✕</button>
              </div>
            </li>
          );
        })}
      </ul>
      {(pers.remover?.length ?? 0) > 0 && (
        <p className="sutil">Removidos: {pers.remover!.map((id) => EXERCICIOS[id]?.nome).join(', ')} · <button className="link" onClick={() => salvarPers({ ...pers, remover: [] })}>restaurar</button></p>
      )}
      <Botao variante="secundario" onClick={() => setAdicionar(true)}>+ Adicionar exercício</Botao>
      {(pers.trocar || pers.remover?.length || pers.adicionar?.length) && (
        <button className="link link--sutil" onClick={() => salvarPers({})}>Voltar ao treino original do plano</button>
      )}

      <Folha aberta={!!trocar} aoFechar={() => setTrocar(null)} titulo="Trocar exercício">
        {trocar && (
          <EscolherExercicio grupo={EXERCICIOS[trocar].grupo} excluir={m.itens.map((i) => i.exercicioId)} aoEscolher={(novo) => {
            const orig = original(trocar);
            const t = { ...pers.trocar };
            if (novo === orig) delete t[orig]; else t[orig] = novo;
            void salvarPers({ ...pers, trocar: t });
            setTrocar(null);
          }} />
        )}
      </Folha>
      <Folha aberta={adicionar} aoFechar={() => setAdicionar(false)} titulo="Adicionar exercício">
        {adicionar && (
          <EscolherExercicio excluir={m.itens.map((i) => i.exercicioId)} comPrescricao aoEscolher={(id, series, reps) => {
            void salvarPers({ ...pers, adicionar: [...(pers.adicionar ?? []), { exercicioId: id, series: series ?? 3, reps: reps ?? 12 }] });
            setAdicionar(false);
          }} />
        )}
      </Folha>
    </div>
  );
}

function EscolherExercicio({ grupo, excluir, comPrescricao, aoEscolher }: {
  grupo?: Grupo; excluir: string[]; comPrescricao?: boolean; aoEscolher: (id: string, series?: number, reps?: number) => void;
}) {
  const [filtro, setFiltro] = useState<Grupo | 'todos'>(grupo ?? 'todos');
  const [series, setSeries] = useState(3);
  const [reps, setReps] = useState(12);
  const grupos = [...new Set(Object.values(EXERCICIOS).map((e) => e.grupo))];
  const lista = Object.values(EXERCICIOS).filter((e) => !excluir.includes(e.id) && (filtro === 'todos' || e.grupo === filtro));
  return (
    <div className="detalhe">
      <h2 className="detalhe__titulo">{comPrescricao ? 'Adicionar exercício' : 'Trocar por…'}</h2>
      <select className="seletor" value={filtro} onChange={(e) => setFiltro(e.target.value as Grupo | 'todos')} aria-label="Grupo muscular">
        <option value="todos">Todos os grupos</option>
        {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      {comPrescricao && (
        <div className="campos-2">
          <label className="campo"><span>Séries</span><input inputMode="numeric" value={series} onChange={(e) => setSeries(Math.max(1, Number(e.target.value) || 1))} /></label>
          <label className="campo"><span>Repetições (ou segundos)</span><input inputMode="numeric" value={reps} onChange={(e) => setReps(Math.max(1, Number(e.target.value) || 1))} /></label>
        </div>
      )}
      <div className="opcoes">
        {lista.map((e) => (
          <button key={e.id} className="opcao" onClick={() => aoEscolher(e.id, series, reps)}>
            <strong>{e.nome}</strong><span>{e.grupo} · {e.tipo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ programa
export function SecaoPrograma({ aoTrocarPerfil }: { aoTrocarPerfil: () => void }) {
  const [acao, setAcao] = useState<'recomecar' | 'apagar' | null>(null);
  const [inicio, setInicio] = useState(proximaSegunda());
  const [confirma, setConfirma] = useState('');
  return (
    <Card className="entra">
      <h3 className="card__titulo">Programa</h3>
      <p className="sutil">A data de início e "repetir semana" ficam na aba Programa.</p>
      <div className="perdido__acoes">
        <Botao variante="secundario" onClick={() => setAcao('recomecar')}>Recomeçar programa</Botao>
        <Botao variante="fantasma" className="texto-perigo" onClick={() => setAcao('apagar')}>Apagar dados</Botao>
      </div>
      <Folha aberta={acao !== null} aoFechar={() => { setAcao(null); setConfirma(''); }} titulo="Programa">
        {acao === 'recomecar' && (
          <div className="detalhe">
            <h2 className="detalhe__titulo">Recomeçar as 12 semanas?</h2>
            <p className="detalhe__orientacao">O programa volta para a semana 1 a partir da data escolhida. <strong>Seu histórico (treinos, cargas, peso, PRs) é mantido</strong>; ajustes de semanas repetidas, corrida recuada e reagendamentos são zerados.</p>
            <label className="campo"><span>Nova data de início · {formatarData(inicio)}</span><input type="date" value={inicio} onChange={(e) => e.target.value && setInicio(e.target.value)} /></label>
            <Botao grande onClick={async () => {
              const c = await lerConfigPrograma();
              await salvarConfigPrograma({ inicio, repetidas: [], personalizacao: c.personalizacao, cargasIniciais: c.cargasIniciais });
              setAcao(null);
            }}>Recomeçar</Botao>
          </div>
        )}
        {acao === 'apagar' && (
          <div className="detalhe">
            <h2 className="detalhe__titulo">Apagar todos os dados de {perfilAtual().nome}?</h2>
            <p className="detalhe__orientacao">Treinos, cargas, corridas, peso, metas e ajustes deste perfil serão apagados{perfilAtual().uid ? ' neste aparelho e na nuvem' : ' neste aparelho'}. Faça um backup antes. Isso não pode ser desfeito.</p>
            <label className="campo"><span>Digite APAGAR para confirmar</span><input value={confirma} onChange={(e) => setConfirma(e.target.value)} /></label>
            <Botao grande className="btn--perigo" disabled={confirma.trim().toUpperCase() !== 'APAGAR'} onClick={async () => {
              await db.transaction('rw', [db.sessoes, db.series, db.corridas, db.corpo, db.ajustes], async () => {
                // apaga registro a registro para a exclusão também chegar à nuvem (se houver conta)
                await Promise.all([db.sessoes.toCollection().delete(), db.series.toCollection().delete(), db.corridas.toCollection().delete(), db.corpo.toCollection().delete(), db.ajustes.toCollection().delete()]);
              });
              setAcao(null); aoTrocarPerfil();
            }}>Apagar tudo</Botao>
          </div>
        )}
      </Folha>
    </Card>
  );
}

// ------------------------------------------------------------------ instalação
export function SecaoInstalar() {
  const instalado = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    <Card className="entra">
      <h3 className="card__titulo">📲 Instalar na tela de início</h3>
      {instalado && <p className="nota-recup">✅ O app já está instalado neste aparelho.</p>}
      <details className="instalar" open={!instalado}>
        <summary>iPhone (Safari)</summary>
        <ol>
          <li>Abra o link do app no <strong>Safari</strong>.</li>
          <li>Toque em <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
          <li>Role e toque em <strong>Adicionar à Tela de Início</strong> → <strong>Adicionar</strong>.</li>
          <li>Abra pelo ícone novo: ele abre em tela cheia e funciona offline.</li>
        </ol>
      </details>
      <details className="instalar" open={!instalado}>
        <summary>Android (Chrome)</summary>
        <ol>
          <li>Abra o link do app no <strong>Chrome</strong>.</li>
          <li>Toque no menu <strong>⋮</strong> e em <strong>Instalar app</strong> (ou "Adicionar à tela inicial").</li>
          <li>Confirme em <strong>Instalar</strong>.</li>
        </ol>
      </details>
      <p className="sutil">Dica: mantenha o app aberto durante o treino. A tela fica acesa sozinha e os avisos tocam na hora certa.</p>
    </Card>
  );
}
