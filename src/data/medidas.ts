// Medidas caseiras aproximadas (gramas) para os alimentos mais comuns da TACO.
// Valores médios de tabelas de medidas caseiras; servem para facilitar, não para precisão de laboratório.
export interface Medida { nome: string; g: number }

const R: [RegExp, Medida[]][] = [
  [/^arroz.*cozido/, [{ nome: 'colher de sopa cheia', g: 25 }, { nome: 'escumadeira', g: 90 }]],
  [/^feij(a|ã)o.*cozid/, [{ nome: 'concha média', g: 140 }, { nome: 'colher de sopa', g: 20 }]],
  [/^macarr(a|ã)o.*cozido/, [{ nome: 'pegador', g: 110 }, { nome: 'prato raso', g: 220 }]],
  [/^p(a|ã)o, trigo, franc/, [{ nome: 'unidade', g: 50 }]],
  [/^p(a|ã)o.*forma/, [{ nome: 'fatia', g: 25 }]],
  [/^p(a|ã)o, de queijo/, [{ nome: 'unidade média', g: 40 }]],
  [/^tapioca/, [{ nome: 'unidade média', g: 60 }]],
  [/^ovo, de galinha/, [{ nome: 'unidade', g: 50 }]],
  [/^leite, de vaca(?!.*p(o|ó))/, [{ nome: 'copo (200 ml)', g: 200 }, { nome: 'xícara (240 ml)', g: 240 }]],
  [/^leite, de vaca.*p(o|ó)/, [{ nome: 'colher de sopa', g: 16 }]],
  [/^iogurte/, [{ nome: 'pote', g: 170 }]],
  [/^caf(e|é), infus(a|ã)o/, [{ nome: 'xícara de café', g: 50 }, { nome: 'xícara de chá', g: 150 }]],
  [/^a(c|ç)(u|ú)car/, [{ nome: 'colher de chá', g: 5 }, { nome: 'colher de sopa', g: 12 }]],
  [/^(azeite|(o|ó)leo)/, [{ nome: 'colher de sopa', g: 8 }, { nome: 'colher de chá', g: 3 }]],
  [/^(manteiga|margarina)/, [{ nome: 'ponta de faca', g: 5 }, { nome: 'colher de chá', g: 5 }]],
  [/^requeij(a|ã)o/, [{ nome: 'colher de sopa', g: 30 }]],
  [/^queijo, (mozarela|muçarela|mussarela|prato)/, [{ nome: 'fatia', g: 15 }]],
  [/^queijo, minas/, [{ nome: 'fatia', g: 30 }]],
  [/^queijo, parmes/, [{ nome: 'colher de sopa ralado', g: 10 }]],
  [/^presunto|^mortadela|^peito de peru|^salame/, [{ nome: 'fatia', g: 15 }]],
  [/^frango, (peito|filé|file)/, [{ nome: 'filé médio', g: 100 }]],
  [/^frango, (coxa|sobrecoxa)/, [{ nome: 'unidade', g: 90 }]],
  [/^carne, bovina/, [{ nome: 'bife médio', g: 100 }, { nome: 'colher de sopa (moída)', g: 25 }]],
  [/^(porco|carne, su(i|í)na)/, [{ nome: 'bife/fatia média', g: 100 }]],
  [/^(til(a|á)pia|merluza|salm(a|ã)o|pescada|peixe)/, [{ nome: 'filé médio', g: 120 }]],
  [/^atum/, [{ nome: 'lata drenada', g: 120 }, { nome: 'colher de sopa', g: 20 }]],
  [/^lingui(c|ç)a/, [{ nome: 'gomo', g: 60 }]],
  [/^batata, inglesa/, [{ nome: 'unidade média', g: 130 }, { nome: 'colher de sopa', g: 30 }]],
  [/^batata, doce/, [{ nome: 'unidade média', g: 150 }, { nome: 'colher de sopa', g: 30 }]],
  [/^mandioca/, [{ nome: 'pedaço médio', g: 100 }]],
  [/^farinha, de mandioca|^farofa/, [{ nome: 'colher de sopa', g: 16 }]],
  [/^aveia/, [{ nome: 'colher de sopa', g: 15 }]],
  [/^granola|^cereal/, [{ nome: 'xícara', g: 40 }]],
  [/^banana/, [{ nome: 'unidade média', g: 70 }]],
  [/^ma(c|ç)(a|ã)/, [{ nome: 'unidade média', g: 130 }]],
  [/^laranja/, [{ nome: 'unidade média', g: 180 }]],
  [/^tangerina|^mexerica/, [{ nome: 'unidade média', g: 135 }]],
  [/^mam(a|ã)o/, [{ nome: 'fatia média', g: 150 }]],
  [/^melancia|^mel(a|ã)o/, [{ nome: 'fatia média', g: 200 }]],
  [/^abacaxi/, [{ nome: 'fatia média', g: 80 }]],
  [/^manga/, [{ nome: 'unidade média', g: 200 }]],
  [/^morango/, [{ nome: 'unidade', g: 12 }]],
  [/^uva/, [{ nome: 'cacho pequeno', g: 100 }]],
  [/^abacate/, [{ nome: 'colher de sopa', g: 30 }]],
  [/^tomate/, [{ nome: 'unidade média', g: 100 }, { nome: 'fatia', g: 15 }]],
  [/^alface|^r(u|ú)cula|^agri(a|ã)o/, [{ nome: 'prato de sobremesa', g: 30 }]],
  [/^cenoura/, [{ nome: 'colher de sopa (ralada)', g: 12 }, { nome: 'unidade média', g: 80 }]],
  [/^br(o|ó)colis|^couve-flor/, [{ nome: 'ramo/floreta', g: 20 }, { nome: 'xícara', g: 90 }]],
  [/^pepino/, [{ nome: 'fatia', g: 10 }]],
  [/^(amendoim|castanha|noz|am(e|ê)ndoa)/, [{ nome: 'punhado (~10 un.)', g: 15 }]],
  [/pasta de amendoim|^amendoim, torrado/, [{ nome: 'colher de sopa', g: 15 }]],
  [/^mel\b|^mel,/, [{ nome: 'colher de sopa', g: 20 }]],
  [/^chocolate/, [{ nome: 'quadradinho', g: 5 }, { nome: 'barra pequena', g: 25 }]],
  [/^(refrigerante|suco|cerveja)/, [{ nome: 'copo (200 ml)', g: 200 }, { nome: 'lata (350 ml)', g: 350 }]],
  [/^achocolatado/, [{ nome: 'colher de sopa', g: 15 }]],
  [/^biscoito/, [{ nome: 'unidade', g: 7 }]],
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Medidas disponíveis para um alimento (sempre inclui gramas). */
export function medidasDe(nome: string): Medida[] {
  const n = nome.toLowerCase();
  const a = norm(nome);
  const achado = R.find(([re]) => re.test(n) || re.test(a));
  return [{ nome: 'gramas', g: 1 }, ...(achado?.[1] ?? [])];
}
