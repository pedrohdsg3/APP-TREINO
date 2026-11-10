// ============================================================
// TUTORIAIS — "Como fazer" de cada exercício do catálogo.
// Textos próprios, baseados em orientações técnicas consolidadas (ACE, NSCA, UCLA Health).
// O vídeo é só um link de busca no YouTube (não incorporamos conteúdo de terceiros).
// ============================================================

export interface Tutorial {
  musculos: string;
  passos: string[];
  erros: string[];
  cuidado?: string;
}

export const TUTORIAIS: Record<string, Tutorial> = {
  // ---------------------------------------------------------------- Peito
  'supino-reto': {
    musculos: 'Peitoral, tríceps e parte da frente do ombro',
    passos: [
      'Deite no banco com os olhos logo abaixo da barra e os pés firmes no chão.',
      'Junte e "afunde" as escápulas no banco; mantenha um leve arco natural na lombar.',
      'Pegue a barra um pouco mais aberta que os ombros, tire do suporte com os braços estendidos.',
      'Desça controlando até encostar de leve na linha do mamilo, cotovelos a ~45° do tronco.',
      'Empurre a barra para cima soltando o ar, sem perder as escápulas presas.',
    ],
    erros: ['Abrir os cotovelos a 90° (sobrecarrega o ombro).', 'Quicar a barra no peito.', 'Tirar o quadril do banco.'],
    cuidado: 'Com carga alta, use alguém para dar segurança ou as travas de segurança do rack.',
  },
  'supino-inclinado-halter': {
    musculos: 'Peitoral (parte de cima), ombro anterior e tríceps',
    passos: [
      'Regule o banco entre 30° e 45° e sente com os halteres apoiados nas coxas.',
      'Deite levando os halteres para a altura do peito, escápulas juntas e para baixo.',
      'Empurre para cima e levemente para dentro, sem bater um halter no outro.',
      'Desça devagar até os cotovelos ficarem um pouco abaixo da linha do banco.',
    ],
    erros: ['Banco muito inclinado (vira exercício de ombro).', 'Descer rápido e sem controle.'],
  },
  'crucifixo-inclinado': {
    musculos: 'Peitoral (parte de cima)',
    passos: [
      'Banco a ~30°, halteres acima do peito com as palmas viradas uma para a outra.',
      'Cotovelos levemente dobrados e fixos durante todo o movimento.',
      'Abra os braços em arco até sentir alongar o peito, sem passar muito da linha do ombro.',
      'Volte "abraçando uma árvore", contraindo o peito no topo.',
    ],
    erros: ['Dobrar e esticar os cotovelos (vira supino).', 'Descer demais e forçar o ombro.'],
    cuidado: 'Use carga moderada: o braço longo deixa o exercício pesado para o ombro.',
  },
  'peck-deck': {
    musculos: 'Peitoral (meio do peito)',
    passos: [
      'Ajuste o banco para as pegadas ficarem na altura do peito.',
      'Costas apoiadas, cotovelos levemente flexionados.',
      'Feche os braços à frente até as mãos quase se tocarem e segure 1 s.',
      'Volte devagar até sentir um leve alongamento, sem deixar as placas baterem.',
    ],
    erros: ['Tirar as costas do encosto.', 'Voltar rápido deixando o peso "puxar" o ombro para trás.'],
  },
  'cross-over': {
    musculos: 'Peitoral (ênfase na parte de baixo e interna)',
    passos: [
      'Polias na altura dos ombros ou acima; um passo à frente, tronco levemente inclinado.',
      'Cotovelos levemente dobrados e fixos.',
      'Traga as mãos em arco para frente e para baixo, cruzando na frente do quadril.',
      'Volte controlando até sentir o peito alongar.',
    ],
    erros: ['Usar o corpo para dar impulso.', 'Transformar em um "empurrar" com os cotovelos.'],
  },

  // ---------------------------------------------------------------- Tríceps
  'triceps-testa': {
    musculos: 'Tríceps',
    passos: [
      'Deitado no banco, segure a barra (de preferência W) com os braços estendidos acima do peito.',
      'Mantendo os cotovelos apontados para o teto, dobre e leve a barra em direção à testa.',
      'Estenda os braços de volta, sem mexer os ombros.',
    ],
    erros: ['Abrir os cotovelos para os lados.', 'Mover os ombros e transformar em supino.'],
    cuidado: 'Se o cotovelo incomodar, use a versão na polia ou a corda.',
  },
  'triceps-corda': {
    musculos: 'Tríceps',
    passos: [
      'Corda na polia alta; fique de pé com o tronco levemente à frente.',
      'Cotovelos colados ao corpo, antebraços paralelos ao chão.',
      'Estenda os braços para baixo e afaste as pontas da corda no final.',
      'Volte devagar até os antebraços passarem um pouco da horizontal.',
    ],
    erros: ['Cotovelos indo para frente e para trás.', 'Usar o peso do corpo para empurrar.'],
  },
  'triceps-testa-polia': {
    musculos: 'Tríceps (cabeça longa)',
    passos: [
      'De costas para a polia (ou deitado no banco com a polia baixa), segure a barra/corda acima da cabeça.',
      'Cotovelos apontados para frente e parados.',
      'Estenda os braços até o fim e volte devagar, sentindo alongar.',
    ],
    erros: ['Deixar os cotovelos abrirem.', 'Arquear a lombar para ajudar.'],
  },
  mergulho: {
    musculos: 'Tríceps, peitoral (parte de baixo) e ombro',
    passos: [
      'Apoie nas paralelas com os braços estendidos e os ombros longe das orelhas.',
      'Tronco mais ereto para focar no tríceps.',
      'Desça dobrando os cotovelos até cerca de 90°.',
      'Empurre de volta até estender os braços.',
    ],
    erros: ['Descer demais e forçar o ombro.', 'Ombros subindo em direção às orelhas.'],
    cuidado: 'Se estiver pesado, use a máquina de mergulho assistido ou um elástico.',
  },

  // ---------------------------------------------------------------- Costas
  'barra-fixa': {
    musculos: 'Dorsais, bíceps e parte de cima das costas',
    passos: [
      'Pegue a barra com as palmas para frente, um pouco mais aberto que os ombros.',
      'Comece pendurado com os braços estendidos e o abdômen firme.',
      'Puxe levando o peito em direção à barra, cotovelos indo para baixo e para trás.',
      'Desça controlando até estender os braços.',
    ],
    erros: ['Balançar o corpo para subir.', 'Fazer meia repetição sem estender os braços.'],
    cuidado: 'Ainda não sai? Use o graviton/barra assistida ou faça pulldown.',
  },
  'remada-curvada': {
    musculos: 'Costas (dorsais e meio das costas), bíceps e posterior de ombro',
    passos: [
      'De pé, joelhos levemente dobrados; incline o tronco a ~45° levando o quadril para trás.',
      'Coluna neutra (sem arredondar), barra pendurada abaixo dos ombros.',
      'Puxe a barra em direção ao umbigo, levando os cotovelos para trás.',
      'Desça devagar mantendo a mesma inclinação do tronco.',
    ],
    erros: ['Arredondar a lombar.', 'Levantar o tronco para "roubar" a carga.'],
    cuidado: 'Se a lombar reclamar, troque pela remada baixa na máquina.',
  },
  'remada-unilateral': {
    musculos: 'Dorsais e meio das costas',
    passos: [
      'Apoie joelho e mão do mesmo lado no banco; o outro pé no chão.',
      'Tronco paralelo ao chão, coluna reta.',
      'Puxe o halter levando o cotovelo para trás, perto do quadril.',
      'Desça até estender o braço, sentindo as costas alongarem.',
    ],
    erros: ['Girar o tronco para subir o peso.', 'Puxar com o braço em vez das costas.'],
  },
  pulldown: {
    musculos: 'Dorsais e bíceps',
    passos: [
      'Ajuste o apoio das coxas; pegada um pouco mais aberta que os ombros.',
      'Tronco levemente inclinado para trás, peito aberto.',
      'Puxe a barra até a parte alta do peito, cotovelos indo para baixo.',
      'Volte controlando até estender os braços.',
    ],
    erros: ['Puxar atrás da nuca.', 'Jogar o tronco para trás para ajudar.'],
  },
  'remada-baixa': {
    musculos: 'Meio das costas, dorsais e bíceps',
    passos: [
      'Sente com o peito apoiado (máquina) ou pés na plataforma (polia), joelhos levemente dobrados.',
      'Coluna reta e peito aberto.',
      'Puxe as pegadas em direção ao abdômen, juntando as escápulas.',
      'Volte devagar até estender os braços, sem curvar as costas.',
    ],
    erros: ['Balançar o tronco para frente e para trás.', 'Encolher os ombros.'],
  },

  // ---------------------------------------------------------------- Bíceps
  'rosca-direta': {
    musculos: 'Bíceps',
    passos: [
      'De pé, barra com pegada na largura dos ombros, palmas para frente.',
      'Cotovelos colados ao lado do corpo.',
      'Suba a barra dobrando só os cotovelos.',
      'Desça devagar até quase estender os braços.',
    ],
    erros: ['Balançar o tronco.', 'Cotovelos indo para frente.'],
  },
  'rosca-alternada': {
    musculos: 'Bíceps',
    passos: [
      'De pé, halteres ao lado do corpo com as palmas viradas para dentro.',
      'Suba um braço girando o punho até a palma ficar para cima.',
      'Desça devagar e repita com o outro braço.',
    ],
    erros: ['Usar impulso do corpo.', 'Não estender o braço na descida.'],
  },
  'rosca-martelo': {
    musculos: 'Bíceps, braquial e antebraço',
    passos: [
      'Halteres ao lado do corpo, palmas viradas para dentro (pegada neutra).',
      'Suba os halteres mantendo a pegada neutra, cotovelos fixos.',
      'Desça controlando.',
    ],
    erros: ['Balançar os halteres.', 'Cotovelos se afastando do corpo.'],
  },
  'rosca-scott': {
    musculos: 'Bíceps',
    passos: [
      'Sente no banco Scott com a parte de trás do braço toda apoiada.',
      'Segure o halter com a palma para cima.',
      'Suba até a contração e desça devagar até quase estender.',
    ],
    erros: ['Estender e soltar o peso de uma vez no final.', 'Tirar o braço do apoio.'],
    cuidado: 'Não trave o cotovelo esticado embaixo com carga alta.',
  },

  // ---------------------------------------------------------------- Ombro / trapézio
  'desenvolvimento-halter': {
    musculos: 'Ombros e tríceps',
    passos: [
      'Sente com o encosto reto, halteres na altura das orelhas, palmas para frente.',
      'Abdômen firme e costas apoiadas.',
      'Empurre os halteres para cima até quase estender os braços.',
      'Desça controlando até a altura das orelhas.',
    ],
    erros: ['Arquear demais a lombar.', 'Bater os halteres no topo.'],
  },
  'desenvolvimento-maquina': {
    musculos: 'Ombros e tríceps',
    passos: [
      'Ajuste o banco para as pegadas ficarem na altura dos ombros.',
      'Costas e cabeça apoiadas.',
      'Empurre para cima sem travar os cotovelos e desça devagar.',
    ],
    erros: ['Tirar as costas do encosto.', 'Encolher os ombros.'],
  },
  'elevacao-lateral': {
    musculos: 'Ombro (parte lateral)',
    passos: [
      'De pé, halteres ao lado do corpo, leve inclinação do tronco à frente.',
      'Cotovelos levemente dobrados e um pouco à frente do corpo.',
      'Suba os braços para os lados até a linha dos ombros.',
      'Desça devagar, sem deixar o peso "cair".',
    ],
    erros: ['Usar impulso do corpo.', 'Subir acima dos ombros e encolher o trapézio.'],
    cuidado: 'Carga leve com técnica boa vale mais do que carga alta com balanço.',
  },
  'elevacao-frontal': {
    musculos: 'Ombro (parte da frente)',
    passos: [
      'Halteres à frente das coxas, palmas para baixo.',
      'Suba os braços à frente até a altura dos olhos, cotovelos levemente dobrados.',
      'Desça devagar.',
    ],
    erros: ['Jogar o tronco para trás.', 'Subir rápido demais.'],
  },
  'crucifixo-inverso': {
    musculos: 'Posterior de ombro e meio das costas',
    passos: [
      'Sente de frente para o peck deck, peito apoiado; pegadas na altura dos ombros.',
      'Cotovelos levemente dobrados.',
      'Abra os braços para trás em arco, juntando as escápulas no final.',
      'Volte devagar.',
    ],
    erros: ['Puxar com os braços dobrando os cotovelos.', 'Encolher os ombros.'],
  },
  encolhimento: {
    musculos: 'Trapézio',
    passos: [
      'De pé, halteres ao lado do corpo, braços estendidos.',
      'Suba os ombros em direção às orelhas.',
      'Segure 1 s em cima e desça devagar.',
    ],
    erros: ['Girar os ombros.', 'Dobrar os cotovelos.'],
  },

  // ---------------------------------------------------------------- Pernas (quadríceps)
  agachamento: {
    musculos: 'Quadríceps, glúteos e posterior de coxa',
    passos: [
      'Barra apoiada no alto das costas (não no pescoço), pés na largura dos ombros, pontas levemente para fora.',
      'Respire fundo e trave o abdômen.',
      'Desça levando o quadril para trás e para baixo, joelhos acompanhando a direção dos pés.',
      'Desça até onde mantiver a coluna neutra (ideal: coxas paralelas ao chão).',
      'Suba empurrando o chão com o pé inteiro, soltando o ar.',
    ],
    erros: ['Joelhos entrando para dentro.', 'Calcanhar saindo do chão.', 'Arredondar a lombar no fundo.'],
    cuidado: 'Se o joelho incomodar, reduza a amplitude ou troque por leg press / Smith.',
  },
  'agachamento-goblet': {
    musculos: 'Quadríceps, glúteos e core',
    passos: [
      'Segure um halter em pé junto ao peito, cotovelos apontando para baixo.',
      'Pés um pouco mais abertos que os ombros, pontas levemente para fora.',
      'Desça com o peito aberto, cotovelos passando por dentro dos joelhos.',
      'Suba empurrando o chão com o pé inteiro.',
    ],
    erros: ['Inclinar demais o tronco para frente.', 'Joelhos entrando.'],
    cuidado: 'É a melhor porta de entrada para o agachamento com carga: aprenda bem aqui antes da barra.',
  },
  'agachamento-smith': {
    musculos: 'Quadríceps e glúteos',
    passos: [
      'Barra do Smith no alto das costas, pés um pouco à frente da linha da barra.',
      'Destrave a barra e desça controlando, joelhos alinhados com os pés.',
      'Desça até a amplitude confortável e suba empurrando o chão.',
    ],
    erros: ['Pés muito para trás (sobrecarrega o joelho).', 'Esquecer de travar a barra no final.'],
  },
  'leg-press': {
    musculos: 'Quadríceps e glúteos',
    passos: [
      'Costas e quadril bem apoiados; pés no meio da plataforma, largura dos ombros.',
      'Destrave e desça controlando até os joelhos formarem ~90°.',
      'Empurre a plataforma com o pé inteiro, sem travar os joelhos no final.',
    ],
    erros: ['Tirar o quadril do banco no fundo.', 'Travar os joelhos esticados.', 'Joelhos entrando.'],
  },
  extensora: {
    musculos: 'Quadríceps',
    passos: [
      'Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina e o rolo acima do tornozelo.',
      'Estenda as pernas até em cima e segure 1 s.',
      'Desça devagar.',
    ],
    erros: ['Dar trancos com o peso.', 'Tirar o quadril do banco.'],
    cuidado: 'Se o joelho doer, reduza a carga e a amplitude no fim do movimento.',
  },

  // ---------------------------------------------------------------- Glúteos
  afundo: {
    musculos: 'Glúteos e quadríceps',
    passos: [
      'De pé, dê um passo largo à frente.',
      'Desça até o joelho de trás quase tocar o chão; o da frente fica sobre o pé.',
      'Tronco levemente inclinado à frente para pegar mais glúteo.',
      'Empurre com o pé da frente para voltar e troque de perna.',
    ],
    erros: ['Passo curto demais (joelho passa muito da ponta do pé).', 'Joelho da frente entrando.'],
    cuidado: 'Comece só com o peso do corpo e segure em algo se faltar equilíbrio.',
  },
  'agachamento-bulgaro': {
    musculos: 'Glúteos e quadríceps',
    passos: [
      'Peito do pé de trás apoiado no banco; pé da frente bem à frente.',
      'Desça reto, com o peso no calcanhar da perna da frente.',
      'Suba empurrando com a perna da frente. Faça todas de um lado e depois do outro.',
    ],
    erros: ['Pé da frente muito perto do banco.', 'Empurrar com a perna de trás.'],
    cuidado: 'Comece só com o corpo; adicione halteres quando estiver estável.',
  },
  'elevacao-pelvica': {
    musculos: 'Glúteos e posterior de coxa',
    passos: [
      'Sente no chão com a parte de baixo das escápulas na borda do banco.',
      'Barra (com proteção) ou halter sobre o quadril; pés firmes no chão, largura do quadril.',
      'Queixo levemente para baixo; suba o quadril até o tronco ficar alinhado com as coxas.',
      'Aperte os glúteos 1 s em cima e desça controlando.',
    ],
    erros: ['Arquear a lombar no topo em vez de usar o glúteo.', 'Pés muito longe (vira posterior) ou muito perto (vira quadríceps).'],
    cuidado: 'Na posição de cima, as canelas devem ficar perto da vertical.',
  },
  abdutora: {
    musculos: 'Glúteo médio (lateral do quadril)',
    passos: [
      'Sente com as costas apoiadas e as pernas encostadas nas almofadas.',
      'Abra as pernas para fora controlando e segure 1 s.',
      'Volte devagar sem deixar as placas baterem.',
      'Variação: tronco levemente inclinado à frente pega mais glúteo.',
    ],
    erros: ['Movimento rápido com tranco.', 'Amplitude curtinha.'],
  },
  'extensao-quadril-polia': {
    musculos: 'Glúteo máximo',
    passos: [
      'Prenda a tornozeleira na polia baixa; segure na máquina com o tronco levemente inclinado.',
      'Leve a perna para trás com o joelho levemente dobrado, apertando o glúteo.',
      'Volte devagar. Faça todas de uma perna e depois da outra.',
    ],
    erros: ['Arquear a lombar para subir mais a perna.', 'Girar o quadril.'],
  },
  'agachamento-sumo': {
    musculos: 'Glúteos, adutores e quadríceps',
    passos: [
      'Pés bem afastados, pontas viradas para fora; halter segurado no centro.',
      'Desça com o tronco ereto, joelhos indo na direção dos pés.',
      'Suba apertando os glúteos.',
    ],
    erros: ['Joelhos entrando.', 'Inclinar o tronco para frente.'],
  },

  // ---------------------------------------------------------------- Posterior / panturrilha
  stiff: {
    musculos: 'Posterior de coxa, glúteos e lombar',
    passos: [
      'De pé, halteres à frente das coxas, joelhos levemente dobrados.',
      'Leve o quadril para trás deslizando os halteres rente às pernas, coluna neutra.',
      'Desça até sentir alongar o posterior (geralmente até um pouco abaixo dos joelhos).',
      'Volte empurrando o quadril para frente e apertando os glúteos.',
    ],
    erros: ['Arredondar as costas.', 'Dobrar demais os joelhos (vira agachamento).'],
    cuidado: 'A amplitude é até onde a coluna fica reta, não até o chão.',
  },
  flexora: {
    musculos: 'Posterior de coxa',
    passos: [
      'Deite de bruços com o joelho alinhado ao eixo da máquina e o rolo acima do calcanhar.',
      'Dobre os joelhos trazendo o rolo em direção ao glúteo.',
      'Desça devagar (2–3 s).',
    ],
    erros: ['Tirar o quadril do banco.', 'Descer o peso de uma vez.'],
  },
  'cadeira-flexora': {
    musculos: 'Posterior de coxa',
    passos: [
      'Sente com o joelho alinhado ao eixo; trave a coxa com o apoio de cima.',
      'Dobre os joelhos levando o rolo para baixo e para trás.',
      'Volte devagar (2–3 s).',
    ],
    erros: ['Tirar as costas do encosto.', 'Voltar rápido.'],
  },
  panturrilha: {
    musculos: 'Panturrilha (gastrocnêmio)',
    passos: [
      'Ponta dos pés na plataforma, calcanhares para fora, joelhos estendidos (sem travar).',
      'Desça o calcanhar até alongar bem.',
      'Suba na ponta dos pés o máximo possível e segure 1 s.',
    ],
    erros: ['Movimento curto e rápido "quicando".', 'Dobrar os joelhos para ajudar.'],
  },
  'panturrilha-sentado': {
    musculos: 'Panturrilha (sóleo)',
    passos: [
      'Sente com a ponta dos pés na plataforma e o apoio sobre as coxas.',
      'Desça os calcanhares até alongar.',
      'Suba na ponta dos pés e segure 1 s.',
    ],
    erros: ['Amplitude curta.', 'Ir rápido demais.'],
  },

  // ---------------------------------------------------------------- Abdômen / core
  prancha: {
    musculos: 'Abdômen e core',
    passos: [
      'Apoie antebraços (cotovelos abaixo dos ombros) e pontas dos pés.',
      'Corpo alinhado da cabeça aos calcanhares.',
      'Contraia abdômen e glúteos e respire normalmente.',
    ],
    erros: ['Quadril caindo (força a lombar).', 'Quadril muito alto.', 'Prender a respiração.'],
  },
  'prancha-lateral': {
    musculos: 'Oblíquos e core',
    passos: [
      'De lado, cotovelo abaixo do ombro e pernas estendidas.',
      'Suba o quadril até alinhar o corpo.',
      'Segure o tempo e troque de lado.',
    ],
    erros: ['Quadril caindo.', 'Ombro encolhido perto da orelha.'],
    cuidado: 'Se estiver difícil, apoie o joelho de baixo no chão.',
  },
  'abd-remador': {
    musculos: 'Abdômen (reto abdominal)',
    passos: [
      'Ajoelhado de frente para a polia alta, segure a corda perto da cabeça.',
      'Enrole a coluna levando o peito em direção ao quadril.',
      'Volte devagar sem soltar a tensão.',
    ],
    erros: ['Mexer o quadril em vez de enrolar a coluna.', 'Puxar com os braços.'],
  },
  'rotacao-russa': {
    musculos: 'Oblíquos e abdômen',
    passos: [
      'Sentado, joelhos dobrados, tronco inclinado para trás com a coluna reta.',
      'Segure o peso junto ao peito.',
      'Gire o tronco de um lado para o outro (conte cada lado).',
    ],
    erros: ['Mexer só os braços.', 'Arredondar as costas.'],
    cuidado: 'Pés no chão deixa mais fácil; tirar os pés deixa mais difícil.',
  },
  'abd-crunch': {
    musculos: 'Abdômen (parte de cima)',
    passos: [
      'Deitado, joelhos dobrados, mãos atrás da cabeça ou cruzadas no peito.',
      'Tire as escápulas do chão enrolando a coluna, soltando o ar.',
      'Desça devagar.',
    ],
    erros: ['Puxar o pescoço com as mãos.', 'Subir com impulso.'],
  },
  'dead-bug': {
    musculos: 'Core (estabilidade)',
    passos: [
      'Deitado, braços apontados para o teto e joelhos dobrados a 90° no ar.',
      'Cole a lombar no chão.',
      'Estenda devagar um braço e a perna oposta, sem a lombar sair do chão.',
      'Volte e troque de lado (conte cada lado).',
    ],
    erros: ['Lombar descolando do chão.', 'Fazer rápido demais.'],
  },
  'abd-infra': {
    musculos: 'Abdômen (parte de baixo)',
    passos: [
      'Deitado, pernas estendidas ou com joelhos levemente dobrados, mãos ao lado do corpo.',
      'Suba as pernas até a vertical mantendo a lombar no chão.',
      'Desça devagar sem encostar os pés no chão.',
    ],
    erros: ['Lombar arqueando na descida.', 'Usar impulso.'],
    cuidado: 'Se a lombar descolar, dobre mais os joelhos.',
  },
};

/** Link de busca do vídeo no YouTube (abre fora do app). */
export const linkVideo = (nome: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nome} execução correta`)}`;
