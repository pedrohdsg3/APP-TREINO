// Duelo ⚔️ — quem comparece mais aos treinos.
import { useEffect, useState } from 'react';
import { codificar, decodificar, estatisticas, lider, placarSemanas, segundaDa, sequenciaAtual, type Participante, type Stats } from '../engine/duelo';
import { carregarParticipantes, participanteDoPerfil, publicarAtual, removerExterno, salvarExterno } from '../lib/duelo';
import { criarSala, entrarSala, formatarCodigo, nuvemConfigurada, ouvirSala, sairSala, salaDoPerfil } from '../lib/nuvem';
import { perfilAtual } from '../lib/perfis';
import { formatarData, isoLocal, somarDias } from '../lib/datas';
import { Botao, Card, Segmentado } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { AvatarPerfil } from '../ui/Personagem';

type Periodo = 'semana' | 'mes' | 'tudo';
const pct = (p: number | null) => (p === null ? '—' : `${Math.round(p * 100)}%`);

export function Duelo() {
  const [lista, setLista] = useState<Participante[] | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [ia, setIa] = useState(0);
  const [ib, setIb] = useState(1);
  const [colar, setColar] = useState(false);
  const [versao, setVersao] = useState(0);
  const [sala, setSala] = useState(salaDoPerfil());
  const [online, setOnline] = useState<Participante[]>([]);
  const [meuUid, setMeuUid] = useState<string>();
  const [estadoNuvem, setEstadoNuvem] = useState<'conectando' | 'ok' | 'erro'>('conectando');
  const hoje = isoLocal();

  // duelo online: publica o meu placar e escuta o dos outros em tempo real
  useEffect(() => {
    if (!sala) { setOnline([]); return; }
    setEstadoNuvem('conectando');
    void publicarAtual();
    return ouvirSala((l, uid) => { setOnline(l); setMeuUid(uid); setEstadoNuvem('ok'); }, () => setEstadoNuvem('erro'));
  }, [sala]);

  useEffect(() => {
    void carregarParticipantes(online, meuUid).then((l) => {
      // o perfil ativo fica à esquerda
      const atual = l.findIndex((p) => p.id === perfilAtual().id);
      const ordenada = atual > 0 ? [l[atual], ...l.filter((_, i) => i !== atual)] : l;
      setLista(ordenada);
    });
  }, [versao, online, meuUid]);

  if (!lista) return <div className="tela" />;
  const cabecalho = (
    <header className="cabecalho">
      <h1>Duelo ⚔️</h1>
      <p className="cabecalho__sub">Quem comparece mais aos treinos?</p>
    </header>
  );
  if (lista.length < 2) {
    return (
      <div className="tela tela--duelo">
        {cabecalho}
        <Card className="entra"><p className="sutil">Conecte o duelo online com a outra pessoa (cada um no seu celular) ou crie um segundo perfil neste aparelho.</p></Card>
        <DueloOnline sala={sala} estado={estadoNuvem} aoMudar={setSala} />
        <OutroCelular onColar={() => setColar(true)} />
        <ColarPlacar aberta={colar} fechar={() => setColar(false)} aoSalvar={() => setVersao((v) => v + 1)} />
      </div>
    );
  }

  const a = lista[Math.min(ia, lista.length - 1)];
  const b = lista[Math.min(ib, lista.length - 1)] === a ? lista.find((x) => x !== a)! : lista[Math.min(ib, lista.length - 1)];
  const de = periodo === 'semana' ? segundaDa(hoje) : periodo === 'mes' ? somarDias(segundaDa(hoje), -21) : '2000-01-01';
  const sa = estatisticas(a, de, hoje), sb = estatisticas(b, de, hoje);
  const quem = lider(sa, sb);
  const semanas = placarSemanas(a, b, hoje);
  const seqA = sequenciaAtual(a, hoje), seqB = sequenciaAtual(b, hoje);
  const frase = mensagem(a, b, sa, sb, quem);

  return (
    <div className="tela tela--duelo">
      {cabecalho}

      <Segmentado<Periodo> rotulo="Período" valor={periodo} onChange={setPeriodo} opcoes={[
        { valor: 'semana', rotulo: 'Semana' }, { valor: 'mes', rotulo: '4 semanas' }, { valor: 'tudo', rotulo: 'Tudo' },
      ]} />

      <div className="duelo__placar">
      <Card className="vs entra">
        <Lado p={a} s={sa} lidera={quem === 'a'} />
        <div className="vs__meio" aria-hidden="true"><span>VS</span></div>
        <Lado p={b} s={sb} lidera={quem === 'b'} />
      </Card>
      <p className="vs__frase">{frase}</p>
      </div>

      <Card className="entra">
        <h3 className="card__titulo">Comparativo</h3>
        <Linha rotulo="Presença" va={sa.presenca ?? 0} vb={sb.presenca ?? 0} ta={pct(sa.presenca)} tb={pct(sb.presenca)} max={1} />
        <Linha rotulo="Treinos feitos" va={sa.feitos} vb={sb.feitos} ta={`${sa.feitos}/${sa.planejados}`} tb={`${sb.feitos}/${sb.planejados}`} />
        <Linha rotulo="Sequência atual 🔥" va={seqA} vb={seqB} ta={`${seqA}`} tb={`${seqB}`} />
        <Linha rotulo="Cardio leve (extra)" va={sa.cardios} vb={sb.cardios} ta={`${sa.cardios}`} tb={`${sb.cardios}`} />
        <p className="sutil">Presença = treinos feitos ÷ treinos planejados de cada um. Assim é justo mesmo com planos diferentes.</p>
      </Card>

      <Card className="entra">
        <h3 className="card__titulo">Semanas vencidas</h3>
        <div className="placar">
          <span className="placar__nome">{a.nome}</span>
          <strong className="num">{semanas.a} <small>×</small> {semanas.b}</strong>
          <span className="placar__nome">{b.nome}</span>
        </div>
        {semanas.empates > 0 && <p className="sutil centro">{semanas.empates} empate(s)</p>}
        <ul className="semanas-duelo">
          {[...semanas.semanas].reverse().map((s) => (
            <li key={s.inicio}>
              <span className="sutil">{formatarData(s.inicio).slice(0, 5)}{s.emAndamento ? ' · em andamento' : ''}</span>
              <span className={`semanas-duelo__v ${s.vencedor === 'a' ? 'ganhou' : ''}`}>{pct(s.a)}</span>
              <span className="semanas-duelo__x">{s.emAndamento ? '⏳' : s.vencedor === 'a' ? '◀' : s.vencedor === 'b' ? '▶' : s.vencedor === 'empate' ? '=' : '·'}</span>
              <span className={`semanas-duelo__v ${s.vencedor === 'b' ? 'ganhou' : ''}`}>{pct(s.b)}</span>
            </li>
          ))}
          {semanas.semanas.length === 0 && <li className="sutil">O duelo começa quando os dois tiverem começado o programa.</li>}
        </ul>
      </Card>

      {lista.length > 2 && (
        <Card>
          <h3 className="card__titulo">Quem duela</h3>
          <div className="campos-2">
            <select className="seletor" value={lista.indexOf(a)} onChange={(e) => setIa(Number(e.target.value))}>{lista.map((p, i) => <option key={p.id} value={i}>{p.nome}</option>)}</select>
            <select className="seletor" value={lista.indexOf(b)} onChange={(e) => setIb(Number(e.target.value))}>{lista.map((p, i) => <option key={p.id} value={i}>{p.nome}</option>)}</select>
          </div>
        </Card>
      )}

      <DueloOnline sala={sala} estado={estadoNuvem} aoMudar={setSala} participantesOnline={lista.filter((p) => p.online)} />
      <OutroCelular onColar={() => setColar(true)} externos={lista.filter((p) => p.externo && !p.online)} aoRemover={(id) => { removerExterno(id); setVersao((v) => v + 1); }} />
      <ColarPlacar aberta={colar} fechar={() => setColar(false)} aoSalvar={() => setVersao((v) => v + 1)} />
    </div>
  );
}

function Lado({ p, s, lidera }: { p: Participante; s: Stats; lidera: boolean }) {
  return (
    <div className={`vs__lado ${lidera ? 'lidera' : ''}`}>
      <div className="vs__avatar">
        {lidera && <span className="vs__coroa" aria-label="Na liderança">👑</span>}
        <AvatarPerfil personagem={p.personagem} emoji={p.emoji} tamanho={88} acao={lidera ? 'comemora' : 'parado'} />
      </div>
      <strong className="vs__nome">{p.nome}</strong>
      <span className="vs__pct num">{pct(s.presenca)}</span>
      <span className="sutil">{s.feitos} de {s.planejados} treinos</span>
    </div>
  );
}

function Linha({ rotulo, va, vb, ta, tb, max }: { rotulo: string; va: number; vb: number; ta: string; tb: string; max?: number }) {
  const m = max ?? Math.max(va, vb, 1);
  return (
    <div className="duelo-linha">
      <span className="duelo-linha__rotulo">{rotulo}</span>
      <div className="duelo-linha__barras">
        <span className={`num ${va > vb ? 'forte' : ''}`}>{ta}</span>
        <div className="duelo-linha__trilho duelo-linha__trilho--a"><i style={{ width: `${(va / m) * 100}%` }} /></div>
        <div className="duelo-linha__trilho duelo-linha__trilho--b"><i style={{ width: `${(vb / m) * 100}%` }} /></div>
        <span className={`num ${vb > va ? 'forte' : ''}`}>{tb}</span>
      </div>
    </div>
  );
}

function mensagem(a: Participante, b: Participante, sa: Stats, sb: Stats, quem: ReturnType<typeof lider>): string {
  if (quem === null) return 'O duelo começa no primeiro treino planejado. Que vença quem aparecer mais! 💪';
  if (quem === 'empate') return 'Empate técnico! Quem treina amanhã desempata 🔥';
  const [l, o, sl, so] = quem === 'a' ? [a, b, sa, sb] : [b, a, sb, sa];
  const dif = Math.round(((sl.presenca ?? 0) - (so.presenca ?? 0)) * 100);
  return dif > 0 ? `${l.nome} na frente por ${dif} ponto(s) de presença. Bora, ${o.nome}! 😤` : `${l.nome} na frente por treinos feitos. Tá apertado!`;
}

function DueloOnline({ sala, estado, aoMudar, participantesOnline = [] }: {
  sala: string | null; estado: 'conectando' | 'ok' | 'erro'; aoMudar: (s: string | null) => void; participantesOnline?: Participante[];
}) {
  const [entrar, setEntrar] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  if (!nuvemConfigurada()) return null;

  async function executar(f: () => Promise<string>) {
    setOcupado(true); setErro(null);
    try { aoMudar(await f()); setEntrar(false); setCodigo(''); }
    catch (e) { setErro(navigator.onLine ? (e as Error).message : 'Sem internet. Tente de novo conectado.'); }
    finally { setOcupado(false); }
  }
  async function compartilhar(c: string) {
    const texto = `Bora duelar no app de treino! 💪 Abra a aba Duelo → "Entrar com código" e use: ${formatarCodigo(c)}`;
    try { if (navigator.share) await navigator.share({ text: texto }); else await navigator.clipboard.writeText(texto); }
    catch { await navigator.clipboard?.writeText(texto).catch(() => {}); }
  }

  if (sala) {
    return (
      <Card className="online entra">
        <div className="online__topo">
          <span className={`online__ponto online__ponto--${estado}`} aria-hidden="true" />
          <div>
            <h3>Duelo online {estado === 'ok' ? 'conectado' : estado === 'erro' ? '· sem conexão' : '· conectando…'}</h3>
            <p className="sutil">Atualiza sozinho quando alguém salva um treino.{estado === 'erro' ? ' Sem internet agora: o placar atualiza quando voltar.' : ''}</p>
          </div>
        </div>
        <div className="online__codigo">
          <span className="sutil">Código da sala</span>
          <strong className="num">{formatarCodigo(sala)}</strong>
        </div>
        {participantesOnline.length > 0 && (
          <p className="sutil">Na sala: {participantesOnline.map((p) => `${p.nome}${p.atualizadoEm ? ` (atualizado ${formatarData(p.atualizadoEm.slice(0, 10))})` : ''}`).join(', ')}</p>
        )}
        {participantesOnline.length === 0 && estado === 'ok' && <p className="sutil">Esperando a outra pessoa entrar com o código…</p>}
        <div className="perdido__acoes">
          <Botao variante="secundario" onClick={() => compartilhar(sala)}>Enviar código</Botao>
          <Botao variante="fantasma" onClick={async () => { await sairSala(); aoMudar(null); }}>Sair da sala</Botao>
        </div>
      </Card>
    );
  }

  return (
    <Card className="online entra">
      <h3 className="card__titulo">🌐 Duelo online (automático)</h3>
      <p className="sutil">Cada um no seu celular e o placar atualiza sozinho. Uma pessoa cria a sala e manda o código; a outra entra com ele.</p>
      <p className="sutil">Vai para a nuvem só: nome, avatar, plano e as datas em que treinou. Cargas, peso e corridas ficam no celular.</p>
      <div className="perdido__acoes">
        <Botao disabled={ocupado} onClick={() => executar(criarSala)}>Criar sala</Botao>
        <Botao variante="secundario" disabled={ocupado} onClick={() => setEntrar(true)}>Entrar com código</Botao>
      </div>
      {erro && <p className="aviso-campo">{erro}</p>}
      <Folha aberta={entrar} aoFechar={() => setEntrar(false)} titulo="Entrar com código">
        <div className="detalhe">
          <h2 className="detalhe__titulo">Entrar no duelo</h2>
          <label className="campo"><span>Código de 8 caracteres</span>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="ABCD-2345" autoCapitalize="characters" autoComplete="off" maxLength={9} /></label>
          {erro && <p className="aviso-campo">{erro}</p>}
          <Botao grande disabled={ocupado || codigo.replace(/[^A-Z0-9]/gi, '').length !== 8} onClick={() => executar(() => entrarSala(codigo))}>{ocupado ? 'Entrando…' : 'Entrar'}</Botao>
        </div>
      </Folha>
    </Card>
  );
}

function OutroCelular({ onColar, externos = [], aoRemover }: { onColar: () => void; externos?: Participante[]; aoRemover?: (id: string) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function enviar() {
    const p = await participanteDoPerfil(perfilAtual());
    const texto = `Meu placar no app de treino 💪 Cole na aba Duelo: ${codificar(p)}`;
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else { await navigator.clipboard.writeText(texto); setMsg('Copiado! Mande pelo WhatsApp.'); }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { await navigator.clipboard?.writeText(texto).catch(() => {}); setMsg('Copiado! Mande pelo WhatsApp.'); }
    }
  }
  return (
    <Card className="outro-celular">
      <h3 className="card__titulo">{nuvemConfigurada() ? '📱 Sem internet? Placar manual' : '📱 Cada um no seu celular?'}</h3>
      <p className="sutil">Os dados ficam em cada aparelho. Para duelar, envie seu placar pelo WhatsApp e a outra pessoa cola aqui (e vice-versa). Repita quando quiser atualizar.</p>
      <div className="perdido__acoes">
        <Botao variante="secundario" onClick={enviar}>Enviar meu placar</Botao>
        <Botao variante="secundario" onClick={onColar}>Colar placar</Botao>
      </div>
      {msg && <p className="sutil">{msg}</p>}
      {externos.map((e) => (
        <p key={e.id} className="sutil">Placar de {e.nome} atualizado em {e.atualizadoEm ? formatarData(e.atualizadoEm.slice(0, 10)) : '—'} · <button className="link link--perigo" onClick={() => aoRemover?.(e.id)}>remover</button></p>
      ))}
    </Card>
  );
}

function ColarPlacar({ aberta, fechar, aoSalvar }: { aberta: boolean; fechar: () => void; aoSalvar: () => void }) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Folha aberta={aberta} aoFechar={fechar} titulo="Colar placar">
      <div className="detalhe">
        <h2 className="detalhe__titulo">Colar placar</h2>
        <p className="detalhe__orientacao">Cole a mensagem inteira que a outra pessoa enviou.</p>
        <label className="campo"><span>Mensagem</span><textarea rows={4} value={texto} onChange={(e) => { setTexto(e.target.value); setErro(null); }} placeholder="Meu placar no app de treino… TREINO-PLACAR:…" /></label>
        {erro && <p className="aviso-campo">{erro}</p>}
        <Botao grande disabled={!texto.trim()} onClick={() => {
          try { const p = decodificar(texto); salvarExterno(p); setTexto(''); aoSalvar(); fechar(); }
          catch (e) { setErro((e as Error).message); }
        }}>Salvar placar</Botao>
      </div>
    </Folha>
  );
}
