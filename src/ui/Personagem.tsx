// Personagens ilustrados (SVG) do Pedro e da Yana, com pequenas animações.
// Estilo: traço limpo, cores chapadas, sem imagens. Inspirados nas fotos, não são retratos.
import { useId } from 'react';
import { perfilAtual } from '../lib/perfis';

export type IdPersonagem = 'pedro' | 'yana';
export type Acao = 'parado' | 'aceno' | 'halter' | 'corrida' | 'comemora';

// Pele clara nos dois; Pedro: cabelo castanho-escuro curto (degradê) e barba curta;
// Yana: raiz castanha com comprimento mel/loiro (luzes) e sorriso aberto.
const PALETA = {
  pedro: { pele: '#F6D3B8', peleSombra: '#E9B897', pescoco: '#EFC6A8', cabelo: '#3B2A1F', barba: '#4A3427', fundo1: '#E3E6FF', fundo2: '#C9CEFF', roupa: '#1C1F2A', roupaDetalhe: '#4F46E5' },
  yana: { pele: '#E3B28C', peleSombra: '#CF9870', pescoco: '#D9A67F', cabelo: '#4A3020', cabeloMeio: '#9A6C3E', cabeloPonta: '#E7C285', fundo1: '#FFE4EC', fundo2: '#FFC9D9', roupa: '#EC6A98', roupaDetalhe: '#F9A8C4' },
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
            <stop offset="0.32" stopColor={PALETA.yana.cabeloMeio} />
            <stop offset="0.75" stopColor={PALETA.yana.cabeloPonta} />
            <stop offset="1" stopColor="#F0D29A" />
          </linearGradient>
        )}
      </defs>
      <circle cx="60" cy="60" r="60" fill={`url(#f${uid})`} />
      <g clipPath={`url(#c${uid})`}>
        <g className="personagem__corpo">
          {/* cabelo de trás (Yana) */}
          {quem === 'yana' && (
            <path d="M32 56 C26 29 44 17 60 17 C78 17 95 29 88 58 C91 80 97 100 101 124 L19 124 C23 104 29 84 32 56 Z" fill={`url(#h${uid})`} />
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
          <path d="M51 74 L51 90 C55 94 65 94 69 90 L69 74 Z" fill={c.pescoco} />
          {/* orelhas */}
          <circle cx="37.5" cy="58" r="5" fill={c.peleSombra} />
          <circle cx="82.5" cy="58" r="5" fill={c.peleSombra} />
          {/* rosto */}
          {quem === 'pedro'
            ? <path d="M38 52 C38 36 47 30 60 30 C73 30 82 36 82 52 C82 66 78 77 70 81.5 C66 83.8 63 84.5 60 84.5 C57 84.5 54 83.8 50 81.5 C42 77 38 66 38 52 Z" fill={c.pele} />
            : <ellipse cx="60" cy="55.5" rx="21.5" ry="24.5" fill={c.pele} />}

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

function Olhos({ iris, y = 56 }: { iris: string; y?: number }) {
  return (
    <g className="personagem__olhos">
      {[51, 69].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx="3.3" ry="2.6" fill="#fff" />
          <circle cx={x} cy={y + 0.1} r="2.1" fill={iris} />
          <circle cx={x} cy={y + 0.1} r="1.1" fill="#1B1411" />
          <circle cx={x + 0.8} cy={y - 0.7} r="0.6" fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Nariz({ cor }: { cor: string }) {
  return <path d="M59.3 58.5 Q58.2 63.2 60.4 63.8 Q61.6 64 62.2 63.2" fill="none" stroke={cor} strokeWidth="1.3" strokeLinecap="round" />;
}

function RostoPedro({ c }: { c: typeof PALETA.pedro }) {
  return (
    <g>
      {/* cabelo curto: mais volume em cima, laterais baixas (degradê) */}
      <path d="M38.2 51 C37 34 47 25.5 61 25.5 C75 25.5 84.5 33.5 82 51 C80.5 44 77 39.5 71 37.6 C64 35.6 55 35.8 49 37.8 C43.5 39.8 40 44.5 38.2 51 Z" fill={c.cabelo} />
      <path d="M46 31 C52 28.5 60 27.8 67 28.6" fill="none" stroke="#5A4232" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <path d="M38 50 C37.6 54 38 57 39 59.5 L41 59 C40.4 55.6 40.3 52 41 48.5 Z" fill={c.cabelo} opacity="0.4" />
      <path d="M82 50 C82.4 54 82 57 81 59.5 L79 59 C79.6 55.6 79.7 52 79 48.5 Z" fill={c.cabelo} opacity="0.4" />
      {/* barba completa, curta e bem alinhada: maxilar, queixo e bigode num tom só */}
      <g fill={c.barba} opacity="0.62">
        <path d="M39.6 63 C40.8 73.5 47.4 81.6 55 84 C57 84.7 58.5 84.9 60 84.9 C61.5 84.9 63 84.7 65 84 C72.6 81.6 79.2 73.5 80.4 63 C79 66.8 76.6 69.4 73.2 70.4 C69.4 71.4 50.6 71.4 46.8 70.4 C43.4 69.4 41 66.8 39.6 63 Z" />
        <path d="M52.4 69.6 C55.8 67.4 64.2 67.4 67.6 69.6 C64.2 70.7 55.8 70.7 52.4 69.6 Z" />
      </g>
      {/* sorriso de boca fechada, meio de lado */}
      <path className="personagem__boca" d="M54.8 72.4 Q60.8 75.4 66.2 71.6" fill="none" stroke="#E2A391" strokeWidth="1.9" strokeLinecap="round" />
      <Nariz cor={c.peleSombra} />
      {/* sobrancelhas */}
      <path d="M45.2 48.6 Q50.5 46.4 55.6 48" fill="none" stroke={c.cabelo} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M64.4 48 Q69.5 46.4 74.8 48.6" fill="none" stroke={c.cabelo} strokeWidth="2.1" strokeLinecap="round" />
      <Olhos iris="#6B4A2E" />
      {/* óculos redondos pretos */}
      <g fill="rgba(255,255,255,0.12)" stroke="#1F1A17" strokeWidth="1.6">
        <circle cx="51" cy="56" r="7.2" />
        <circle cx="69" cy="56" r="7.2" />
      </g>
      <path d="M58.2 55.4 Q60 54 61.8 55.4 M43.8 55 L38.6 53.6 M76.2 55 L81.4 53.6" fill="none" stroke="#1F1A17" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function RostoYana({ c, gradiente }: { c: typeof PALETA.yana; gradiente: string }) {
  return (
    <g>
      {/* cortina de cabelo dos dois lados, risca levemente de lado */}
      <path d="M56 23.5 C45 24.5 36.5 32.5 35.5 49 C34.8 61 33 74 30.5 92 L40.5 93 C40.5 75 41.2 63 42.3 54 C44 41.5 49.5 32.5 56.5 29.5 Z" fill={gradiente} />
      <path d="M56 23.5 C70 23 83.5 31 84.5 49 C85.2 61 87 74 89.5 92 L79.5 93 C79.5 75 78.8 63 77.7 54 C76 42 68.5 31.5 57.5 29.6 Z" fill={gradiente} />
      {/* raiz mais escura e luzes */}
      <path d="M41 33 C47 26 53 24 56.5 24 C64 23.6 73 26.5 79 33 C72 29.5 64 28.2 56.5 29 C50 29.6 45 31 41 33 Z" fill={c.cabelo} />
      <path d="M38.5 60 C37 68 38.5 76 36.5 84 C35.5 88 36.5 91 35.5 93 M81.5 60 C83 68 81.5 76 83.5 84 C84.5 88 83.5 91 84.5 93 M44 40 C41.5 47 40.8 54 40.6 62" fill="none" stroke="#F3D6A2" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      {/* sobrancelhas */}
      <path d="M45.6 48.8 Q51 46.4 55.8 48.2" fill="none" stroke="#5B3B25" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M64.2 48.2 Q69 46.4 74.4 48.8" fill="none" stroke="#5B3B25" strokeWidth="1.7" strokeLinecap="round" />
      <Olhos iris="#5A3B26" />
      {/* cílios */}
      <path d="M47.9 54.6 Q46.6 53.9 46 52.9 M72.1 54.6 Q73.4 53.9 74 52.9" fill="none" stroke="#1E1A17" strokeWidth="1.1" strokeLinecap="round" />
      <Nariz cor={c.peleSombra} />
      {/* bochechas */}
      <ellipse cx="45.5" cy="64.5" rx="4.4" ry="2.6" fill="#E2827A" opacity="0.38" />
      <ellipse cx="74.5" cy="64.5" rx="4.4" ry="2.6" fill="#E2827A" opacity="0.38" />
      {/* sorriso aberto, mostrando os dentes */}
      <g className="personagem__boca">
        <path d="M51.2 68.2 Q60 80 68.8 68.2 Q60 70.4 51.2 68.2 Z" fill="#B8394B" />
        <path d="M53.2 69.2 Q60 75.2 66.8 69.2 Q60 70.9 53.2 69.2 Z" fill="#fff" />
      </g>
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
