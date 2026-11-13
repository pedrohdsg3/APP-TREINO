import { IcDieta, IcDuelo, IcEvolucao, IcHoje, IcPerfil, IcPrograma } from './Icones';
import { AvatarPerfil } from './Personagem';
import { perfilAtual } from '../lib/perfis';

export type Aba = 'hoje' | 'dieta' | 'programa' | 'duelo' | 'evolucao' | 'perfil';
export const ORDEM_ABAS: Aba[] = ['hoje', 'dieta', 'programa', 'duelo', 'evolucao', 'perfil'];

const ITENS: { aba: Aba; rotulo: string; Icone: typeof IcHoje }[] = [
  { aba: 'hoje', rotulo: 'Hoje', Icone: IcHoje },
  { aba: 'dieta', rotulo: 'Dieta', Icone: IcDieta },
  { aba: 'programa', rotulo: 'Programa', Icone: IcPrograma },
  { aba: 'duelo', rotulo: 'Duelo', Icone: IcDuelo },
  { aba: 'evolucao', rotulo: 'Evolução', Icone: IcEvolucao },
  { aba: 'perfil', rotulo: 'Perfil', Icone: IcPerfil },
];

export function NavInferior({ ativa, onChange, aoTrocarPerfil }: { ativa: Aba; onChange: (a: Aba) => void; aoTrocarPerfil?: () => void }) {
  const perfil = perfilAtual();
  return (
    <nav className="nav" aria-label="Navegação principal">
      {/* só aparece no computador (barra lateral) */}
      <div className="nav__marca" aria-hidden="true">
        <img src="./icon.svg" alt="" width="32" height="32" />
        <span>Treino <small>12 semanas</small></span>
      </div>
      <button className="nav__perfil" onClick={aoTrocarPerfil} aria-label={`Perfil de ${perfil.nome}. Trocar perfil`}>
        <AvatarPerfil personagem={perfil.personagem} emoji={perfil.emoji} tamanho={44} />
        <span><strong>{perfil.nome}</strong><small>Trocar perfil ⇄</small></span>
      </button>
      {ITENS.map(({ aba, rotulo, Icone }) => (
        <button key={aba} className={`nav__item ${ativa === aba ? 'ativo' : ''}`}
          aria-current={ativa === aba ? 'page' : undefined} onClick={() => onChange(aba)}>
          <span className="nav__icone"><Icone /></span>
          <span className="nav__rotulo">{rotulo}</span>
        </button>
      ))}
    </nav>
  );
}
