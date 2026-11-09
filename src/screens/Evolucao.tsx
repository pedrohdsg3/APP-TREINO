import { EstadoVazio } from '../ui/Componentes';
import { IlustraGrafico } from '../ui/Ilustracoes';

export function Evolucao() {
  return (
    <div className="tela">
      <header className="cabecalho">
        <h1>Evolução</h1>
        <p className="cabecalho__sub">Cargas, corrida, peso e recordes</p>
      </header>
      <EstadoVazio ilustracao={<IlustraGrafico />} titulo="Seus gráficos aparecem aqui"
        texto="Depois do primeiro treino registrado você acompanha cargas, PRs 🏆, pace e peso corporal." />
    </div>
  );
}
