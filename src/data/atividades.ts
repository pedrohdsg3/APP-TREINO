// Outras atividades que podem substituir a corrida do dia ou entrar como extra.
export const MODALIDADES: { id: string; nome: string; emoji: string }[] = [
  { id: 'basquete', nome: 'Basquete', emoji: '🏀' },
  { id: 'volei', nome: 'Vôlei', emoji: '🏐' },
  { id: 'futebol', nome: 'Futebol', emoji: '⚽' },
  { id: 'beach-tennis', nome: 'Beach tennis', emoji: '🎾' },
  { id: 'natacao', nome: 'Natação', emoji: '🏊' },
  { id: 'bike', nome: 'Bike', emoji: '🚴' },
  { id: 'funcional', nome: 'Funcional', emoji: '🤸' },
  { id: 'danca', nome: 'Dança', emoji: '💃' },
  { id: 'caminhada', nome: 'Caminhada', emoji: '🚶' },
];

export const INTENSIDADES = [
  { id: 'leve', nome: 'Leve', esforco: 4, descricao: 'dá para conversar tranquilo' },
  { id: 'moderada', nome: 'Moderada', esforco: 6, descricao: 'respiração acelerada, frases curtas' },
  { id: 'alta', nome: 'Alta', esforco: 8, descricao: 'intensa, com sprints e saltos' },
] as const;

export function infoModalidade(nome: string) {
  return MODALIDADES.find((m) => m.nome.toLowerCase() === nome.toLowerCase()) ?? { id: 'outra', nome, emoji: '🏅' };
}

/** Esportes com saltos e mudanças de direção: pedem atenção ao joelho. */
export const IMPACTO_ALTO = new Set(['basquete', 'volei', 'futebol', 'beach-tennis']);
