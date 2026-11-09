// Aviso de treino perdido no topo da tela Hoje.
import { useState } from 'react';
import { db, type Sessao } from '../db';
import type { ConfigPrograma } from '../engine/plano';
import { aplicarAcao, recomendar, type AcaoPerdido } from '../engine/treinoPerdido';
import { salvarConfigPrograma } from '../lib/ajustes';
import { Botao } from './Componentes';

export function CardTreinoPerdido({ cfg, sessoes, hoje }: { cfg: ConfigPrograma; sessoes: Sessao[]; hoje: string }) {
  const [ocupado, setOcupado] = useState(false);
  const rec = recomendar(cfg, sessoes, hoje);
  if (!rec) return null;

  async function escolher(a: AcaoPerdido) {
    setOcupado(true);
    const { cfg: novo, pulados } = aplicarAcao(cfg, rec!, a, hoje);
    if (pulados.length) await db.sessoes.bulkPut(pulados);
    await salvarConfigPrograma(novo);
    setOcupado(false);
  }

  return (
    <section className="card perdido entra" role="region" aria-label="Treino perdido">
      <div className="perdido__topo">
        <span className="perdido__icone" aria-hidden="true">🗓️</span>
        <h3>{rec.titulo}</h3>
      </div>
      <p className="perdido__texto">{rec.texto}</p>
      {rec.avisos.map((a) => <p key={a} className="perdido__aviso">⚠️ {a}</p>)}
      <div className="perdido__acoes">
        {rec.acoes.map((a, i) => (
          <Botao key={a.tipo + i} variante={i === 0 ? 'primario' : 'secundario'} disabled={ocupado} onClick={() => escolher(a)}>{a.rotulo}</Botao>
        ))}
      </div>
      <p className="perdido__rodape">Treinos pulados ficam registrados como "pulados" e o programa segue normalmente.</p>
    </section>
  );
}
