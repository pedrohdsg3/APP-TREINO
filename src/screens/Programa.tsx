import { Card, EstadoVazio } from '../ui/Componentes';
import { IlustraCalendario } from '../ui/Ilustracoes';
import { TOTAL_SEMANAS, faseDaSemana, posicaoNoPrograma, INICIO_PADRAO } from '../lib/programa';
import { isoLocal } from '../lib/datas';

export function Programa() {
  const pos = posicaoNoPrograma(INICIO_PADRAO, isoLocal());
  const atual = pos.estado === 'durante' ? pos.semana : 0;
  return (
    <div className="tela">
      <header className="cabecalho">
        <h1>Programa</h1>
        <p className="cabecalho__sub">12 semanas · início em 09/11/2026</p>
      </header>
      <Card className="linha-tempo entra">
        {Array.from({ length: TOTAL_SEMANAS }, (_, i) => i + 1).map((s) => {
          const fase = faseDaSemana(s);
          return (
            <div key={s} className={`semana ${fase === 'Recuperação' ? 'semana--recup' : ''} ${s === atual ? 'semana--atual' : ''}`}>
              <span className="semana__num">{s}</span>
              <span className="semana__fase">{fase === 'Recuperação' ? 'Recup.' : fase === 'Intensificação' ? 'Intens.' : fase === 'Progressão' ? 'Progr.' : fase}</span>
            </div>
          );
        })}
      </Card>
      <EstadoVazio ilustracao={<IlustraCalendario />} titulo="Calendário completo em breve"
        texto="Na etapa 2 cada dia mostra o treino planejado e o que foi realizado." />
    </div>
  );
}
