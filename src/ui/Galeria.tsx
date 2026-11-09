// Página de conferência dos personagens (abrir com ?galeria).
import { Personagem, type Acao } from './Personagem';

const ACOES: Acao[] = ['parado', 'aceno', 'halter', 'corrida', 'comemora'];
export function Galeria() {
  return (
    <div className="galeria">
      {(['pedro', 'yana'] as const).map((q) => ACOES.map((a) => (
        <div key={q + a} style={{ textAlign: 'center', fontSize: 12 }}><Personagem quem={q} acao={a} tamanho={150} />{q} · {a}</div>
      )))}
    </div>
  );
}
