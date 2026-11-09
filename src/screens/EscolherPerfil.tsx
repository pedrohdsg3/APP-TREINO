// "Quem vai treinar?" — escolha de perfil (player) e criação de um novo.
import { useState } from 'react';
import { PLANOS, type DefinicaoPlano } from '../data/planos';
import { ativarPerfil, EMOJIS_PERFIL, listarPerfis, novoPerfil, type Perfil } from '../lib/perfis';
import { salvarConfigPrograma } from '../lib/ajustes';
import { dataPorExtenso, deIso, formatarData, isoLocal, somarDias } from '../lib/datas';
import { Botao } from '../ui/Componentes';
import { AvatarPerfil } from '../ui/Personagem';


/** Hoje, se for segunda; senão a próxima segunda. */
export function proximaSegunda(hoje = isoLocal()): string {
  const dow = deIso(hoje).getDay(); // 0 = domingo
  return dow === 1 ? hoje : somarDias(hoje, (8 - dow) % 7 || 7);
}

export function EscolherPerfil({ aoEscolher }: { aoEscolher: (p: Perfil) => void }) {
  const perfis = listarPerfis();
  const [criando, setCriando] = useState(false);
  if (criando) return <NovoPerfil aoCriar={aoEscolher} aoVoltar={() => setCriando(false)} />;
  return (
    <div className="escolher">
      <div className="escolher__corpo entra">
        <p className="rotulo-sup">Treino · 12 semanas</p>
        <h1 className="escolher__titulo">Quem vai treinar?</h1>
        <div className="escolher__lista">
          {perfis.map((p) => (
            <button key={p.id} className="jogador" onClick={() => aoEscolher(p)}>
              <span className="jogador__avatar jogador__avatar--personagem" aria-hidden="true"><AvatarPerfil personagem={p.personagem} emoji={p.emoji} tamanho={64} acao="aceno" /></span>
              <span className="jogador__info">
                <strong>{p.nome}</strong>
                <span>{PLANOS[p.plano]?.nome}</span>
              </span>
              <span className="jogador__seta" aria-hidden="true">›</span>
            </button>
          ))}
          <button className="jogador jogador--novo" onClick={() => setCriando(true)}>
            <span className="jogador__avatar" aria-hidden="true">＋</span>
            <span className="jogador__info"><strong>Novo perfil</strong><span>Cada perfil tem treinos e dados próprios</span></span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NovoPerfil({ aoCriar, aoVoltar }: { aoCriar: (p: Perfil) => void; aoVoltar: () => void }) {
  const [nome, setNome] = useState('');
  const [emoji, setEmoji] = useState('🌸');
  const [plano, setPlano] = useState<DefinicaoPlano['id']>('feminino');
  const [inicio, setInicio] = useState(proximaSegunda());
  const [salvando, setSalvando] = useState(false);
  const ehSegunda = deIso(inicio).getDay() === 1;

  return (
    <div className="escolher">
      <div className="escolher__corpo entra">
        <button className="link escolher__voltar" onClick={aoVoltar}>‹ Voltar</button>
        <h1 className="escolher__titulo">Novo perfil</h1>

        <label className="campo">
          <span>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como devo chamar?" autoFocus maxLength={20} />
        </label>

        <div className="campo">
          <span>Avatar</span>
          <div className="emojis" role="radiogroup" aria-label="Avatar">
            {EMOJIS_PERFIL.map((e) => (
              <button key={e} role="radio" aria-checked={emoji === e} className={`emoji-op ${emoji === e ? 'on' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
        </div>

        <div className="campo">
          <span>Plano de 12 semanas</span>
          <div className="opcoes">
            {(Object.values(PLANOS)).map((p) => (
              <button key={p.id} className={`opcao ${plano === p.id ? 'opcao--marcada' : ''}`} aria-pressed={plano === p.id} onClick={() => setPlano(p.id)}>
                <strong>{p.nome}</strong>
                <span>{p.descricao}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="campo">
          <span>Começa em · {dataPorExtenso(inicio)} ({formatarData(inicio)})</span>
          <input type="date" value={inicio} onChange={(e) => e.target.value && setInicio(e.target.value)} />
        </label>
        {!ehSegunda && <p className="aviso-campo">O programa começa numa segunda-feira para os dias baterem com a semana.</p>}
      </div>
      <div className="guiado__rodape">
        <Botao grande disabled={!nome.trim() || salvando} onClick={async () => {
          setSalvando(true);
          const p = novoPerfil({ nome: nome.trim(), emoji, plano, inicio });
          ativarPerfil(p);
          await salvarConfigPrograma({ inicio, repetidas: [] });
          aoCriar(p);
        }}>Criar perfil {emoji}</Botao>
      </div>
    </div>
  );
}
