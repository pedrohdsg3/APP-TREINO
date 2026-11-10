import { Card, Segmentado } from '../ui/Componentes';
import { IcAuto, IcLua, IcSol } from '../ui/Icones';
import { useTema, type Tema } from '../lib/tema';
import { useState } from 'react';
import { atualizarPerfil, EMOJIS_PERFIL, excluirPerfil, listarPerfis, perfilAtual } from '../lib/perfis';
import { PLANOS } from '../data/planos';
import { Botao } from '../ui/Componentes';
import { Folha } from '../ui/Folha';
import { AvatarPerfil } from '../ui/Personagem';
import { SecaoAvisos, SecaoBackup, SecaoDescanso, SecaoInstalar, SecaoPrograma, SecaoTreinos } from './Configuracoes';

export function Perfil({ aoTrocarPerfil }: { aoTrocarPerfil: () => void }) {
  const [tema, setTema] = useTema();
  const [perfil, setPerfil] = useState(perfilAtual());
  const [editar, setEditar] = useState(false);
  const [nome, setNome] = useState(perfil.nome);
  const [emoji, setEmoji] = useState(perfil.emoji);
  const [excluir, setExcluir] = useState(false);
  const [confirmaNome, setConfirmaNome] = useState('');
  return (
    <div className="tela tela--perfil">
      <header className="cabecalho">
        <h1>Perfil</h1>
        <p className="cabecalho__sub">Configurações, backup e instalação</p>
      </header>

      <Card className="perfil-card entra">
        <span className="jogador__avatar jogador__avatar--personagem" aria-hidden="true"><AvatarPerfil personagem={perfil.personagem} emoji={perfil.emoji} tamanho={64} /></span>
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
          {listarPerfis().length > 1 && <button className="link link--perigo" onClick={() => { setEditar(false); setExcluir(true); }}>Excluir este perfil</button>}
        </div>
      </Folha>

      <Folha aberta={excluir} aoFechar={() => { setExcluir(false); setConfirmaNome(''); }} titulo="Excluir perfil">
        <div className="detalhe">
          <h2 className="detalhe__titulo">Excluir o perfil {perfil.nome}?</h2>
          <p className="detalhe__orientacao">Todos os treinos, cargas, peso e metas deste perfil <strong>neste aparelho</strong> serão apagados. Isso não pode ser desfeito.</p>
          <label className="campo"><span>Digite {perfil.nome} para confirmar</span><input value={confirmaNome} onChange={(e) => setConfirmaNome(e.target.value)} /></label>
          <Botao grande className="btn--perigo" disabled={confirmaNome.trim().toLowerCase() !== perfil.nome.toLowerCase()} onClick={async () => {
            await excluirPerfil(perfil);
            aoTrocarPerfil();
          }}>Excluir perfil</Botao>
          <Botao variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Botao>
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

      <SecaoBackup />
      <SecaoAvisos />
      <SecaoDescanso />
      <SecaoTreinos />
      <SecaoPrograma aoTrocarPerfil={aoTrocarPerfil} />
      <SecaoInstalar />

      <p className="rodape">Treino · versão {__VERSAO__}</p>
    </div>
  );
}
