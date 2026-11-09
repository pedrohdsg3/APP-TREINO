import { Card, Segmentado } from '../ui/Componentes';
import { IcAuto, IcEscudo, IcLua, IcSol } from '../ui/Icones';
import { useTema, type Tema } from '../lib/tema';
import { useState } from 'react';
import { atualizarPerfil, EMOJIS_PERFIL, perfilAtual } from '../lib/perfis';
import { PLANOS } from '../data/planos';
import { Botao } from '../ui/Componentes';
import { Folha } from '../ui/Folha';

export function Perfil({ aoTrocarPerfil }: { aoTrocarPerfil: () => void }) {
  const [tema, setTema] = useTema();
  const [perfil, setPerfil] = useState(perfilAtual());
  const [editar, setEditar] = useState(false);
  const [nome, setNome] = useState(perfil.nome);
  const [emoji, setEmoji] = useState(perfil.emoji);
  return (
    <div className="tela">
      <header className="cabecalho">
        <h1>Perfil</h1>
        <p className="cabecalho__sub">Preferências e backup</p>
      </header>

      <Card className="perfil-card entra">
        <span className="jogador__avatar" aria-hidden="true">{perfil.emoji}</span>
        <div className="jogador__info">
          <strong>{perfil.nome}</strong>
          <span>{PLANOS[perfil.plano]?.nome}</span>
        </div>
        <button className="mini-btn" onClick={() => setEditar(true)}>Editar</button>
      </Card>
      <Botao variante="secundario" onClick={aoTrocarPerfil}>⇄ Trocar de perfil / criar novo</Botao>

      <Folha aberta={editar} aoFechar={() => setEditar(false)} titulo="Editar perfil">
        <div className="detalhe">
          <h2 className="detalhe__titulo">Editar perfil</h2>
          <label className="campo"><span>Nome</span><input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={20} /></label>
          <div className="emojis" role="radiogroup" aria-label="Avatar">
            {EMOJIS_PERFIL.map((e) => (
              <button key={e} role="radio" aria-checked={emoji === e} className={`emoji-op ${emoji === e ? 'on' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
          <Botao grande disabled={!nome.trim()} onClick={() => {
            const p = { ...perfil, nome: nome.trim(), emoji };
            atualizarPerfil(p); setPerfil(p); setEditar(false);
          }}>Salvar</Botao>
        </div>
      </Folha>

      <Card className="entra">
        <h3 className="card__titulo">Aparência</h3>
        <Segmentado<Tema> rotulo="Tema" valor={tema} onChange={setTema} opcoes={[
          { valor: 'auto', rotulo: 'Auto', icone: <IcAuto tamanho={18} /> },
          { valor: 'claro', rotulo: 'Claro', icone: <IcSol tamanho={18} /> },
          { valor: 'escuro', rotulo: 'Escuro', icone: <IcLua tamanho={18} /> },
        ]} />
      </Card>

      <Card className="aviso-backup entra">
        <span className="aviso-backup__icone"><IcEscudo /></span>
        <div>
          <h3>Os dados ficam só neste aparelho</h3>
          <p>Exportar e importar backup (JSON) chega na etapa 6. Faça backups com frequência.</p>
        </div>
      </Card>

      <p className="rodape">Treino · versão {__VERSAO__}</p>
    </div>
  );
}
