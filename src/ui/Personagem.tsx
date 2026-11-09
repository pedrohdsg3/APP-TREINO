// Personagens ilustrados (SVG) do Pedro e da Yana, com pequenas animações.
// Estilo: traço limpo, cores chapadas, sem imagens. Inspirados nas fotos, não são retratos.
import { useId } from 'react';
import { perfilAtual } from '../lib/perfis';

export type IdPersonagem = 'pedro' | 'yana';
export type Acao = 'parado' | 'aceno' | 'halter' | 'corrida' | 'comemora';

const PALETA = {
  pedro: { pele: '#D6A07C', peleSombra: '#C08867', cabelo: '#231A15', fundo1: '#E3E6FF', fundo2: '#C9CEFF', roupa: '#1C1F2A', roupaDetalhe: '#4F46E5' },
  yana: { pele: '#EDC3A2', peleSombra: '#DCA987', cabelo: '#5B3B25', cabeloPonta: '#E0B470', fundo1: '#FFE4EC', fundo2: '#FFC9D9', roupa: '#EC6A98', roupaDetalhe: '#F9A8C4' },
} as const;

export function Personagem({ quem, tamanho = 64, acao = 'parado', className = '' }: { quem: IdPersonagem; tamanho?: number; acao?: Acao; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const c = PALETA[quem];
  const bracoDir = acao === 'halter' || acao === 'aceno' || acao === 'comemora';
  const bracoEsq = acao === 'comemora';
  return (
    <svg viewBox="0 0 120 120" width={tamanho} height={tamanho} className={`personagem personagem--${acao} ${className}`}
      role="img" aria-label={quem === 'pedro' ? 'Personagem do Pedro' : 'Personagem da Yana'}>
      <defs>
        <radialGradient id={`f${uid}`} cx="50%" cy="35%" r="75%">
          <stop offset="0" stopColor={c.fundo1} />
          <stop offset="1" stopColor={c.fundo2} />
        </radialGradient>
        <clipPath id={`c${uid}`}><circle cx="60" cy="60" r="60" /></clipPath>
        {quem === 'yana' && (
          <linearGradient id={`h${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PALETA.yana.cabelo} />
            <stop offset="0.45" stopColor="#9A6A3C" />
            <stop offset="1" stopColor={PALETA.yana.cabeloPonta} />
          </linearGradient>
        )}
      </defs>
      <circle cx="60" cy="60" r="60" fill={`url(#f${uid})`} />
      <g clipPath={`url(#c${uid})`}>
        <g className="personagem__corpo">
          {/* cabelo de trás (Yana) */}
          {quem === 'yana' && (
            <path d="M33 56 C28 30 45 19 60 19 C77 19 93 30 87 58 C89 82 94 102 99 124 L21 124 C26 102 31 82 33 56 Z" fill={`url(#h${uid})`} />
          )}
          {/* braço esquerdo levantado (comemora) */}
          {bracoEsq && (
            <g className="personagem__braco-esq">
              <path d="M32 104 L20 70" stroke={c.pele} strokeWidth="10" strokeLinecap="round" />
              <circle cx="19" cy="66" r="6" fill={c.pele} />
            </g>
          )}
          {/* tronco */}
          <path d="M16 124 C18 100 35 90 60 90 C85 90 102 100 104 124 Z" fill={c.roupa} />
          {quem === 'pedro'
            ? <path d="M50 91 L60 101 L70 91" fill="none" stroke={c.roupaDetalhe} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            : <path d="M44 92 C50 97 70 97 76 92" fill="none" stroke={c.roupaDetalhe} strokeWidth="3" strokeLinecap="round" />}
          {/* pescoço */}
          <path d="M51 74 L51 90 C55 94 65 94 69 90 L69 74 Z" fill={c.peleSombra} />
          {/* orelhas */}
          <circle cx="37.5" cy="58" r="5" fill={c.peleSombra} />
          <circle cx="82.5" cy="58" r="5" fill={c.peleSombra} />
          {/* rosto */}
          <ellipse cx="60" cy="56" rx="22" ry="25" fill={c.pele} />

          {quem === 'pedro' ? <RostoPedro c={PALETA.pedro} /> : <RostoYana c={PALETA.yana} gradiente={`url(#h${uid})`} />}

          {/* braço direito em ação */}
          {bracoDir && (
            <g className="personagem__braco-dir">
              <path d="M90 106 L103 76" stroke={c.pele} strokeWidth="10" strokeLinecap="round" />
              <path d="M88 112 L93 96" stroke={c.roupa} strokeWidth="13" strokeLinecap="round" />
              <circle cx="104.5" cy="72" r="6.2" fill={c.pele} />
              {acao === 'halter' && (
                <g className="personagem__halter">
                  <rect x="95" y="68.5" width="20" height="7" rx="2" fill="#3A3F4B" />
                  <rect x="91" y="63" width="6" height="18" rx="2" fill="#2A2E37" />
                  <rect x="113" y="63" width="6" height="18" rx="2" fill="#2A2E37" />
                </g>
              )}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

function Olhos({ cor = '#1E1A17', y = 56 }: { cor?: string; y?: number }) {
  return (
    <g className="personagem__olhos">
      <ellipse cx="51" cy={y} rx="2.1" ry="2.6" fill={cor} />
      <ellipse cx="69" cy={y} rx="2.1" ry="2.6" fill={cor} />
      <circle cx="51.8" cy={y - 0.9} r="0.7" fill="#fff" />
      <circle cx="69.8" cy={y - 0.9} r="0.7" fill="#fff" />
    </g>
  );
}

function RostoPedro({ c }: { c: typeof PALETA.pedro }) {
  return (
    <g>
      {/* cabelo curto com risca */}
      <path d="M37 54 C35 36 45 27 60 27 C76 27 86 36 83 54 C82 46 79 41 74 39 C66 36 55 36 47 39 C42 42 39 47 37 54 Z" fill={c.cabelo} />
      <path d="M50 30 C52 34 52 37 51 39" fill="none" stroke="#3A2C24" strokeWidth="1.4" strokeLinecap="round" />
      {/* barba e bigode */}
      <path d="M38.6 61 C39.5 75 47 84.5 60 85.5 C73 84.5 80.5 75 81.4 61 C79.5 67.5 76 71.8 71.5 72 C67.5 69.2 52.5 69.2 48.5 72 C44 71.8 40.5 67.5 38.6 61 Z" fill={c.cabelo} />
      <path d="M50.5 67.5 C54.5 64.6 65.5 64.6 69.5 67.5 C65 68.6 55 68.6 50.5 67.5 Z" fill={c.cabelo} />
      <path className="personagem__boca" d="M54.5 71.6 Q60 75.4 65.5 71.6" fill="none" stroke="#E7B8A3" strokeWidth="2.2" strokeLinecap="round" />
      {/* sobrancelhas */}
      <path d="M45.5 47.5 Q51 45.4 55.5 47" fill="none" stroke={c.cabelo} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M64.5 47 Q69 45.4 74.5 47.5" fill="none" stroke={c.cabelo} strokeWidth="2.2" strokeLinecap="round" />
      <Olhos />
      {/* óculos redondos */}
      <g fill="rgba(255,255,255,0.18)" stroke="#262019" strokeWidth="1.9">
        <circle cx="51" cy="56" r="7.4" />
        <circle cx="69" cy="56" r="7.4" />
      </g>
      <path d="M58.4 55.2 Q60 53.8 61.6 55.2 M43.6 55 L38.5 53.5 M76.4 55 L81.5 53.5" fill="none" stroke="#262019" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function RostoYana({ c, gradiente }: { c: typeof PALETA.yana; gradiente: string }) {
  return (
    <g>
      {/* franja lateral */}
      <path d="M37 52 C38 33 49 25 62 25 C76 25 84 35 83 52 C79 41 70 34.5 59 35.5 C50 36.5 43 42 37 52 Z" fill={c.cabelo} />
      <path d="M58 26 C52 32 46 40 42 50" fill="none" stroke="#7A5232" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      {/* mechas da frente caindo sobre os ombros */}
      <path d="M38 50 C33 68 33 92 29 116 L41 116 C42 94 42 72 42.5 58 Z" fill={gradiente} />
      <path d="M82 50 C87 68 87 92 91 116 L79 116 C78 94 78 72 77.5 58 Z" fill={gradiente} />
      {/* sobrancelhas finas */}
      <path d="M45.5 48.5 Q51 46 55.5 48" fill="none" stroke="#5B3B25" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M64.5 48 Q69 46 74.5 48.5" fill="none" stroke="#5B3B25" strokeWidth="1.6" strokeLinecap="round" />
      <Olhos />
      {/* cílios */}
      <path d="M47.8 54.2 L46.6 53 M54.2 54.2 L55.4 53 M65.8 54.2 L64.6 53 M72.2 54.2 L73.4 53" stroke="#1E1A17" strokeWidth="1.1" strokeLinecap="round" />
      {/* bochechas */}
      <ellipse cx="46" cy="64" rx="4.2" ry="2.6" fill="#F29A9A" opacity="0.45" />
      <ellipse cx="74" cy="64" rx="4.2" ry="2.6" fill="#F29A9A" opacity="0.45" />
      {/* sorriso com batom */}
      <path className="personagem__boca" d="M52.5 68.5 Q60 77.5 67.5 68.5 Q60 71.5 52.5 68.5 Z" fill="#C8364A" />
      <path d="M54.6 69.6 Q60 73.2 65.4 69.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      {/* colar */}
      <path d="M50 88 Q60 95 70 88" fill="none" stroke="#E2B95A" strokeWidth="1" />
      <circle cx="60" cy="93.2" r="1.6" fill="#E2B95A" />
    </g>
  );
}

/** Avatar de um perfil: personagem ilustrado se houver, senão o emoji. */
export function AvatarPerfil({ personagem, emoji, tamanho = 56, acao }: { personagem?: IdPersonagem; emoji: string; tamanho?: number; acao?: Acao }) {
  if (personagem) return <Personagem quem={personagem} tamanho={tamanho} acao={acao} />;
  return <span className="avatar-emoji" style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.52 }} aria-hidden="true">{emoji}</span>;
}

/** Personagem do perfil ativo com uma frase (ex.: "Bora, Pedro!"), usado ao começar um treino. */
export function Saudacao({ acao, frase }: { acao: Acao; frase: string }) {
  const p = perfilAtual();
  if (!p.personagem) return null;
  return (
    <div className="saudacao">
      <Personagem quem={p.personagem} acao={acao} tamanho={96} />
      <span className="saudacao__balao">{frase}</span>
    </div>
  );
}
