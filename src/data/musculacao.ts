// ============================================================
// PLANO DE MUSCULAÇÃO — edite aqui para trocar exercícios.
// reps = topo da faixa (o que aparece como "4 × 8"); repsMin = base da
// progressão dupla. descanso em segundos (padrão: 90 compostos, 60 isoladores).
// ============================================================

export type Grupo = 'Peito' | 'Tríceps' | 'Costas' | 'Bíceps' | 'Ombro' | 'Trapézio' | 'Quadríceps'
  | 'Posterior' | 'Glúteos' | 'Panturrilha' | 'Abdômen' | 'Core';

export interface Exercicio {
  id: string;
  nome: string;
  grupo: Grupo;
  tipo: 'composto' | 'isolador';
  /** como a série é medida */
  medida: 'reps' | 'segundos' | 'falha';
  /** membro superior/inferior: define o incremento de carga sugerido */
  regiao: 'superior' | 'inferior' | 'core';
  dica: string;
  /** exercícios que podem substituir este (ex.: joelho incomodando) */
  alternativas?: string[];
  semCarga?: boolean;
}

export interface ItemTreino {
  exercicioId: string;
  series: number;
  reps: number; // ou segundos, se medida = 'segundos'
  repsMin?: number;
  descanso?: number; // sobrescreve o padrão
  /** texto extra exibido junto à prescrição (ex.: "cada lado") */
  obs?: string;
}

export const EXERCICIOS: Record<string, Exercicio> = Object.fromEntries(([
  // Peito / tríceps
  { id: 'supino-reto', nome: 'Supino reto com barra', grupo: 'Peito', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Escápulas retraídas, pés firmes; desça a barra até a linha do mamilo.' },
  { id: 'supino-inclinado-halter', nome: 'Supino inclinado com halteres', grupo: 'Peito', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Banco a 30°; cotovelos ~45° do tronco, sem bater os halteres no topo.' },
  { id: 'crucifixo-inclinado', nome: 'Crucifixo inclinado', grupo: 'Peito', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Foco no peito superior. Cotovelos levemente flexionados e fixos; abra até sentir alongar.' },
  { id: 'peck-deck', nome: 'Crucifixo na máquina (peck deck)', grupo: 'Peito', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Foco no meio do peito. Segure 1 s com as mãos juntas, volte controlando.' },
  { id: 'cross-over', nome: 'Cross over (cabo)', grupo: 'Peito', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Tronco levemente à frente; feche as mãos à frente do quadril.' },
  { id: 'triceps-testa', nome: 'Tríceps testa com barra', grupo: 'Tríceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Cotovelos apontando para o teto, sem abrir; desça até a testa.' },
  { id: 'triceps-corda', nome: 'Tríceps corda no cabo', grupo: 'Tríceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Cotovelos colados ao corpo; abra a corda no final do movimento.' },
  // Costas / bíceps
  { id: 'barra-fixa', nome: 'Barra fixa (pegada pronada)', grupo: 'Costas', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Peito em direção à barra; use elástico ou graviton se precisar. Carga = peso extra (0 = só o corpo).', alternativas: ['pulldown'] },
  { id: 'remada-curvada', nome: 'Remada curvada com barra', grupo: 'Costas', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Coluna neutra, tronco ~45°; puxe a barra em direção ao umbigo.' },
  { id: 'remada-unilateral', nome: 'Remada unilateral com haltere', grupo: 'Costas', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Apoio firme no banco; puxe o cotovelo para trás, perto do quadril.', },
  { id: 'pulldown', nome: 'Pulldown (puxada frontal)', grupo: 'Costas', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Puxe até a parte alta do peito, sem jogar o tronco para trás.' },
  { id: 'rosca-direta', nome: 'Rosca direta com barra', grupo: 'Bíceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Cotovelos parados ao lado do corpo; sem balançar o tronco.' },
  { id: 'rosca-alternada', nome: 'Rosca alternada com haltere', grupo: 'Bíceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Gire o punho (supinação) durante a subida.' },
  // Ombro / braços
  { id: 'desenvolvimento-halter', nome: 'Desenvolvimento com halteres', grupo: 'Ombro', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Sentado com encosto; desça até as mãos na altura das orelhas.' },
  { id: 'elevacao-lateral', nome: 'Elevação lateral', grupo: 'Ombro', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Suba até a linha dos ombros, cotovelos levemente à frente; sem embalo.' },
  { id: 'elevacao-frontal', nome: 'Elevação frontal', grupo: 'Ombro', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Até a altura dos olhos, controlando a descida.' },
  { id: 'encolhimento', nome: 'Encolhimento com halteres', grupo: 'Trapézio', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Suba os ombros em direção às orelhas e segure 1 s; sem girar.' },
  { id: 'rosca-martelo', nome: 'Rosca martelo', grupo: 'Bíceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Pegada neutra (polegar para cima), cotovelos fixos.' },
  { id: 'mergulho', nome: 'Mergulho nas paralelas', grupo: 'Tríceps', tipo: 'composto', medida: 'falha', regiao: 'superior', dica: 'Até perto da falha, sem chegar à falha total. Tronco ereto foca o tríceps.', semCarga: true },
  { id: 'prancha', nome: 'Prancha', grupo: 'Core', tipo: 'isolador', medida: 'segundos', regiao: 'core', dica: 'Corpo alinhado, glúteos e abdômen contraídos; não deixe o quadril cair.', semCarga: true },
  // Pernas
  { id: 'agachamento', nome: 'Agachamento livre', grupo: 'Quadríceps', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Joelhos na direção dos pés; amplitude confortável. Se o joelho incomodar, troque.', alternativas: ['leg-press', 'agachamento-smith'] },
  { id: 'agachamento-smith', nome: 'Agachamento no Smith', grupo: 'Quadríceps', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Pés um pouco à frente; amplitude confortável para o joelho.' },
  { id: 'leg-press', nome: 'Leg press', grupo: 'Quadríceps', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Lombar sempre apoiada; não trave os joelhos no topo.' },
  { id: 'extensora', nome: 'Cadeira extensora', grupo: 'Quadríceps', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Suba controlando e segure 1 s no topo; desça devagar.' },
  { id: 'flexora', nome: 'Mesa flexora', grupo: 'Posterior', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Quadril colado no banco; sem tirar o quadril para ajudar.' },
  { id: 'stiff', nome: 'Stiff com halteres', grupo: 'Posterior', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Joelhos semiflexionados, quadril para trás, coluna neutra.' },
  { id: 'panturrilha', nome: 'Panturrilha em pé', grupo: 'Panturrilha', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Amplitude completa: alongue embaixo, pause 1 s em cima.' },
  // Abdômen
  { id: 'abd-remador', nome: 'Abdominal remador (cabo)', grupo: 'Abdômen', tipo: 'isolador', medida: 'reps', regiao: 'core', dica: 'Enrole a coluna levando o peito ao quadril; o quadril não se mexe.' },
  { id: 'rotacao-russa', nome: 'Rotação russa com peso', grupo: 'Abdômen', tipo: 'isolador', medida: 'reps', regiao: 'core', dica: 'Tronco inclinado, gire os ombros, não só os braços.' },
  { id: 'prancha-lateral', nome: 'Prancha lateral', grupo: 'Core', tipo: 'isolador', medida: 'segundos', regiao: 'core', dica: 'Cotovelo abaixo do ombro, quadril alto e alinhado.', semCarga: true },
  { id: 'abd-crunch', nome: 'Abdominal supra (solo ou máquina)', grupo: 'Abdômen', tipo: 'isolador', medida: 'reps', regiao: 'core', dica: 'Tire as escápulas do chão enrolando a coluna; sem puxar o pescoço.' },
  { id: 'dead-bug', nome: 'Dead bug', grupo: 'Core', tipo: 'isolador', medida: 'reps', regiao: 'core', dica: 'Lombar colada no chão; estenda braço e perna opostos devagar. Conte cada lado.', semCarga: true },
  { id: 'abd-infra', nome: 'Abdominal infra (elevação de pernas)', grupo: 'Abdômen', tipo: 'isolador', medida: 'reps', regiao: 'core', dica: 'Deitada, suba as pernas sem tirar a lombar do chão; desça devagar.', semCarga: true },
  // Inferiores (foco glúteos/pernas)
  { id: 'agachamento-goblet', nome: 'Agachamento goblet (com halter)', grupo: 'Quadríceps', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Halter junto ao peito, peito aberto; desça entre as pernas até onde mantiver a coluna neutra.', alternativas: ['leg-press', 'agachamento-smith'] },
  { id: 'afundo', nome: 'Afundo / avanço alternado', grupo: 'Glúteos', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Passo largo, tronco levemente à frente para mais glúteo; joelho de trás quase toca o chão.' },
  { id: 'agachamento-bulgaro', nome: 'Agachamento búlgaro', grupo: 'Glúteos', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Pé de trás no banco; desça reto, peso no calcanhar da frente. Comece só com o corpo.', alternativas: ['afundo'] },
  { id: 'elevacao-pelvica', nome: 'Elevação pélvica (hip thrust)', grupo: 'Glúteos', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Costas no banco, queixo para baixo; suba até o quadril alinhar e aperte o glúteo 1 s no topo.' },
  { id: 'abdutora', nome: 'Cadeira abdutora', grupo: 'Glúteos', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Tronco levemente inclinado à frente pega mais glúteo; volte controlando.' },
  { id: 'extensao-quadril-polia', nome: 'Extensão de quadril na polia (coice)', grupo: 'Glúteos', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Quadril parado, leve a perna para trás apertando o glúteo; sem arquear a lombar. Conte cada perna.' },
  { id: 'cadeira-flexora', nome: 'Cadeira flexora', grupo: 'Posterior', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Joelho alinhado ao eixo da máquina; desça devagar (2–3 s).', alternativas: ['flexora'] },
  { id: 'agachamento-sumo', nome: 'Agachamento sumô (halter ou máquina)', grupo: 'Glúteos', tipo: 'composto', medida: 'reps', regiao: 'inferior', dica: 'Pés afastados e apontados para fora; joelhos acompanham os pés.' },
  { id: 'panturrilha-sentado', nome: 'Panturrilha sentado', grupo: 'Panturrilha', tipo: 'isolador', medida: 'reps', regiao: 'inferior', dica: 'Amplitude completa, pausa de 1 s em cima.', alternativas: ['panturrilha'] },
  // Superiores
  { id: 'remada-baixa', nome: 'Remada baixa / máquina (pegada neutra)', grupo: 'Costas', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Peito aberto; puxe os cotovelos para trás juntando as escápulas.', alternativas: ['remada-unilateral'] },
  { id: 'desenvolvimento-maquina', nome: 'Desenvolvimento na máquina', grupo: 'Ombro', tipo: 'composto', medida: 'reps', regiao: 'superior', dica: 'Costas apoiadas; não trave os cotovelos no topo.', alternativas: ['desenvolvimento-halter'] },
  { id: 'crucifixo-inverso', nome: 'Crucifixo inverso no peck deck', grupo: 'Ombro', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'De frente para a máquina; abra os braços com cotovelos levemente flexionados (posterior de ombro).' },
  { id: 'triceps-testa-polia', nome: 'Tríceps testa na polia', grupo: 'Tríceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Cotovelos fixos apontando para frente; estenda até o fim.', alternativas: ['triceps-corda'] },
  { id: 'rosca-scott', nome: 'Rosca Scott com halteres', grupo: 'Bíceps', tipo: 'isolador', medida: 'reps', regiao: 'superior', dica: 'Braço todo apoiado; desça até quase estender, sem soltar.', alternativas: ['rosca-alternada'] },
] satisfies Exercicio[]).map((e) => [e.id, e]));

const i = (exercicioId: string, series: number, reps: number, extra: Partial<ItemTreino> = {}): ItemTreino => ({
  exercicioId, series, reps,
  repsMin: EXERCICIOS[exercicioId]?.medida === 'reps' ? Math.max(1, reps - 2) : undefined,
  ...extra,
});

export type TreinoMusculacaoId = string;

export interface TreinoMusculacao {
  id: TreinoMusculacaoId;
  titulo: string;
  /** Monta a lista para uma semana do programa (o crucifixo do peito alterna). */
  itens: (semanaPrograma: number) => ItemTreino[];
}

export const TREINOS_MUSCULACAO: Record<string, TreinoMusculacao> = {
  'peito-triceps': {
    id: 'peito-triceps',
    titulo: 'Peito + Tríceps',
    itens: (s) => [
      i('supino-reto', 4, 8),
      i('supino-inclinado-halter', 3, 10),
      // Semanas ímpares: peito superior (crucifixo inclinado). Pares: miolo (peck deck).
      s % 2 === 1 ? i('crucifixo-inclinado', 3, 12) : i('peck-deck', 3, 12),
      i('cross-over', 3, 12),
      i('triceps-testa', 3, 10),
      i('triceps-corda', 3, 12),
    ],
  },
  'costas-biceps': {
    id: 'costas-biceps',
    titulo: 'Costas + Bíceps',
    itens: () => [
      i('barra-fixa', 4, 8),
      i('remada-curvada', 4, 8),
      i('remada-unilateral', 3, 10),
      i('pulldown', 3, 12),
      i('rosca-direta', 3, 10),
      i('rosca-alternada', 3, 12),
    ],
  },
  'ombro-bracos': {
    id: 'ombro-bracos',
    titulo: 'Ombro + Bíceps + Tríceps',
    itens: () => [
      i('desenvolvimento-halter', 4, 10),
      i('elevacao-lateral', 4, 12),
      i('elevacao-frontal', 3, 12),
      i('encolhimento', 3, 12),
      i('rosca-martelo', 3, 12),
      i('mergulho', 3, 0, { obs: 'até perto da falha' }),
      i('prancha', 3, 45, { descanso: 60 }),
    ],
  },
  pernas: {
    id: 'pernas',
    titulo: 'Pernas',
    itens: () => [
      i('agachamento', 4, 8),
      i('leg-press', 4, 10),
      i('extensora', 3, 12),
      i('flexora', 3, 12),
      i('stiff', 4, 10),
      i('panturrilha', 4, 15),
    ],
  },
  abdomen: {
    id: 'abdomen',
    titulo: 'Abdômen',
    itens: () => [
      i('abd-remador', 3, 15, { descanso: 45 }),
      i('rotacao-russa', 3, 20, { obs: 'cada lado', descanso: 45 }),
      i('prancha-lateral', 3, 30, { obs: 'cada lado', descanso: 45 }),
    ],
  },
};

export const DESCANSO_PADRAO = { composto: 90, isolador: 60 } as const;
