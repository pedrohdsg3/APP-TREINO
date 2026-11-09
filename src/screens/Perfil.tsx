import { Card, Segmentado } from '../ui/Componentes';
import { IcAuto, IcEscudo, IcLua, IcSol } from '../ui/Icones';
import { useTema, type Tema } from '../lib/tema';

export function Perfil() {
  const [tema, setTema] = useTema();
  return (
    <div className="tela">
      <header className="cabecalho">
        <h1>Perfil</h1>
        <p className="cabecalho__sub">Preferências e backup</p>
      </header>

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
          <h3>Seus dados ficam só neste aparelho</h3>
          <p>Exportar e importar backup (JSON) chega na etapa 6. Faça backups com frequência.</p>
        </div>
      </Card>

      <p className="rodape">Treino · versão {__VERSAO__}</p>
    </div>
  );
}
