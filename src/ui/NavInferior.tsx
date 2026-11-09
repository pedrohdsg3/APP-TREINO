import { IcEvolucao, IcHoje, IcPerfil, IcPrograma } from './Icones';

export type Aba = 'hoje' | 'programa' | 'evolucao' | 'perfil';
export const ORDEM_ABAS: Aba[] = ['hoje', 'programa', 'evolucao', 'perfil'];

const ITENS: { aba: Aba; rotulo: string; Icone: typeof IcHoje }[] = [
  { aba: 'hoje', rotulo: 'Hoje', Icone: IcHoje },
  { aba: 'programa', rotulo: 'Programa', Icone: IcPrograma },
  { aba: 'evolucao', rotulo: 'Evolução', Icone: IcEvolucao },
  { aba: 'perfil', rotulo: 'Perfil', Icone: IcPerfil },
];

export function NavInferior({ ativa, onChange }: { ativa: Aba; onChange: (a: Aba) => void }) {
  return (
    <nav className="nav" aria-label="Navegação principal">
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
