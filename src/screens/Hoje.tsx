import { Anel, Botao, Card, Chip } from '../ui/Componentes';
import { IcBalanca, IcChama, IcHalter, IcPlay, IcRelogio, IcTenis } from '../ui/Icones';
import { dataPorExtenso, isoLocal, saudacao } from '../lib/datas';
import { INICIO_PADRAO, SEMANA_PADRAO, TOTAL_SEMANAS, posicaoNoPrograma } from '../lib/programa';

export function Hoje({ aoIniciar }: { aoIniciar: () => void }) {
  const hoje = isoLocal();
  const pos = posicaoNoPrograma(INICIO_PADRAO, hoje);
  const diaIdx = (new Date().getDay() + 6) % 7; // 0 = segunda
  const dia = SEMANA_PADRAO[diaIdx];
  const prox = SEMANA_PADRAO[(diaIdx + 1) % 7];
  const cor = dia.tipo === 'musculacao' ? 'musc' : 'corr';

  return (
    <div className="tela">
      <header className="cabecalho">
        <p className="cabecalho__data">{dataPorExtenso(hoje)}</p>
        <h1>{saudacao()}, Pedro <span className="emoji">👋</span></h1>
        {pos.estado === 'durante' && (
          <p className="cabecalho__sub">Semana {pos.semana} de {TOTAL_SEMANAS} · Fase {pos.fase}</p>
        )}
        {pos.estado === 'antes' && <p className="cabecalho__sub">O programa começa em {pos.diasParaComecar} dia(s)</p>}
        {pos.estado === 'depois' && <p className="cabecalho__sub">Programa de 12 semanas concluído 🏆</p>}
      </header>

      <Card destaque={cor} className="treino-dia entra">
        <div className="treino-dia__topo">
          <Chip cor={cor}>{dia.tipo === 'musculacao' ? <><IcHalter tamanho={16} /> Musculação</> : <><IcTenis tamanho={16} /> Corrida</>}</Chip>
          <span className="treino-dia__dur"><IcRelogio tamanho={16} /> ~{dia.minutos} min</span>
        </div>
        <h2 className="treino-dia__titulo">{dia.titulo}</h2>
        <p className="treino-dia__detalhe">{dia.detalhe}</p>
        <Botao grande cor={cor} icone={<IcPlay tamanho={20} />} onClick={aoIniciar}>Iniciar treino</Botao>
      </Card>

      <Card className="meta entra" >
        <Anel progresso={0} tamanho={72} espessura={7}><strong>0/7</strong></Anel>
        <div className="meta__texto">
          <h3>Meta da semana</h3>
          <p>0 de 7 treinos concluídos</p>
          <p className="meta__streak"><IcChama tamanho={16} /> Sequência: 0 dias</p>
        </div>
      </Card>

      <div className="grade-mini entra">
        <Card className="mini">
          <span className="mini__rotulo">Próximo</span>
          <strong>{prox.titulo}</strong>
          <span className="mini__sub">amanhã</span>
        </Card>
        <Card className="mini">
          <span className="mini__rotulo"><IcBalanca tamanho={14} /> Peso</span>
          <strong>—</strong>
          <span className="mini__sub">registre em Evolução</span>
        </Card>
      </div>
    </div>
  );
}
