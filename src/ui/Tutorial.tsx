// Conteúdo do "Como fazer" de um exercício.
import { EXERCICIOS } from '../data/musculacao';
import { TUTORIAIS, linkVideo } from '../data/tutoriais';

export function Tutorial({ exercicioId }: { exercicioId: string }) {
  const ex = EXERCICIOS[exercicioId];
  const t = TUTORIAIS[exercicioId];
  if (!ex) return null;
  return (
    <div className="detalhe tutorial">
      <p className="detalhe__data">Como fazer</p>
      <h2 className="detalhe__titulo">{ex.nome}</h2>
      {t ? (
        <>
          <p className="tutorial__musculos">🎯 {t.musculos}</p>
          <h3 className="detalhe__secao">Passo a passo</h3>
          <ol className="tutorial__passos">{t.passos.map((p) => <li key={p}>{p}</li>)}</ol>
          <h3 className="detalhe__secao">Erros comuns</h3>
          <ul className="tutorial__erros">{t.erros.map((e) => <li key={e}>{e}</li>)}</ul>
          {t.cuidado && <p className="nota-cuidado">⚠️ {t.cuidado}</p>}
        </>
      ) : <p className="sutil">{ex.dica}</p>}
      <p className="sutil">💡 {ex.dica}</p>
      <a className="btn btn--secundario btn--musc tutorial__video" href={linkVideo(ex.nome)} target="_blank" rel="noopener noreferrer">▶️ Ver vídeos no YouTube</a>
      <p className="tutorial__nota">Abre uma busca no YouTube. Prefira vídeos de profissionais de educação física.</p>
    </div>
  );
}
