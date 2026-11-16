// Plano alimentar do Pedro (déficit, ~2.200–2.250 kcal · proteína ~185 g), baseado na dieta do nutricionista,
// com as trocas do dia a dia (sem arroz → batata/macarrão…, outras proteínas) e 10 opções de jantar.
// Produtos de marca entram como "alimentos próprios" com valores médios de rótulo (editáveis no app).
import type { AlimentoProprio } from '../lib/planoAlimentar';
import { porcaoParaPor100 } from '../lib/planoAlimentar';

export const PROPRIOS_PEDRO: AlimentoProprio[] = [
  { id: 'meu:whey', nome: 'Whey protein concentrado', porcaoNome: 'medidor', porcaoG: 30, por100: porcaoParaPor100(30, { kcal: 120, p: 24, c: 3, g: 2 }) },
  { id: 'meu:boldbar', nome: 'Barra de proteína Bold (Boldbar)', porcaoNome: 'barra', porcaoG: 60, por100: porcaoParaPor100(60, { kcal: 227, p: 20, c: 19, g: 9, fibra: 6 }) },
  { id: 'meu:molico-triplo-zero', nome: 'Iogurte Molico Triplo Zero', porcaoNome: 'pote', porcaoG: 170, por100: porcaoParaPor100(170, { kcal: 70, p: 7.6, c: 10, g: 0 }) },
  { id: 'meu:requeijao-light', nome: 'Requeijão cremoso light', porcaoNome: 'colher de sobremesa', porcaoG: 23, por100: porcaoParaPor100(30, { kcal: 54, p: 3.3, c: 1.2, g: 4 }) },
  { id: 'meu:creme-ricota', nome: 'Creme de ricota', porcaoNome: 'colher de sopa', porcaoG: 20, por100: porcaoParaPor100(30, { kcal: 45, p: 3, c: 1.5, g: 3 }) },
  { id: 'meu:wrap-integral', nome: 'Wrap / Rap10 integral', porcaoNome: 'unidade', porcaoG: 40, por100: porcaoParaPor100(40, { kcal: 118, p: 3.5, c: 20, g: 2.6, fibra: 2.5 }) },
];

/** [id do alimento, gramas, medida caseira, quantidade, observação?] */
export type Esp = [string, number, string, number, string?];
export interface EspItem { a: Esp; subs?: Esp[] }
export interface EspOpcao { id: string; nome: string; itens: EspItem[]; obs?: string }

const arroz: EspItem = {
  a: ['taco:3', 100, 'colher de sopa cheia', 4],
  subs: [
    ['taco:91', 240, 'batata média', 2],
    ['taco:88', 160, 'batata-doce média', 1],
    ['taco:129', 100, 'pedaço médio', 1],
    ['ibge:650340102', 90, 'pegador raso', 1, 'alho e óleo: o óleo já é a gordura da refeição, tire o azeite da salada'],
    ['ibge:690290199', 100, 'fatia média', 1],
    ['taco:1', 100, 'colher de sopa cheia', 4],
  ],
};
const feijao: EspItem = {
  a: ['taco:561', 100, 'concha pequena', 1],
  subs: [
    ['taco:577', 80, 'concha pequena', 1],
    ['ibge:630280199', 50, 'colher de sopa', 3],
    ['taco:560', 100, 'colher de sopa', 5],
  ],
};
const frango150: EspItem = {
  a: ['taco:408', 150, 'filé médio', 1.5],
  subs: [
    ['taco:377', 130, 'bife médio', 1],
    ['ibge:710430102', 130, 'colher de sopa', 5],
    ['taco:301', 180, 'filé grande', 1, 'peixe branco (merluza, tilápia, pescada)'],
    ['taco:432', 130, 'bife/fatia média', 1],
    ['taco:413', 140, 'sobrecoxa', 1.5, 'tem mais gordura: tire o azeite da salada'],
    ['taco:318', 150, 'unidade', 3, 'ótimo ômega-3; em lata, escorra o óleo e tire o azeite da salada'],
    ['ibge:770630299', 150, 'lata drenada', 1.2],
    ['taco:488', 200, 'unidade', 4, 'ovos cozidos ou mexidos'],
  ],
};
const legumes: EspItem = { a: ['taco:546', 120, 'gramas', 120] };
const folhas: EspItem = { a: ['taco:78', 30, 'prato de sobremesa', 1, 'à vontade'], subs: [['taco:152', 30, 'prato de sobremesa', 1], ['taco:157', 100, 'unidade média', 1]] };
const azeite: EspItem = { a: ['taco:260', 8, 'colher de sopa', 1] };
const pratoPrincipal: EspItem[] = [arroz, feijao, frango150, legumes, folhas, azeite];

export const PLANO_PEDRO: { refeicao: string; opcoes: EspOpcao[] }[] = [
  {
    refeicao: 'cafe',
    opcoes: [{
      id: 'cafe', nome: 'Principal',
      itens: [
        { a: ['ibge:800050199', 100, 'fatia', 4], subs: [['taco:53', 100, 'unidade', 2], ['ibge:690290199', 200, 'fatia média', 2], ['ibge:650151699', 80, 'unidade média', 1.5, 'goma de tapioca']] },
        { a: ['taco:488', 150, 'unidade', 3] },
        { a: ['meu:requeijao-light', 23, 'colher de sobremesa', 1], subs: [['meu:creme-ricota', 25, 'colher de sopa', 1.2], ['taco:461', 20, 'fatia fina', 1]] },
        { a: ['taco:182', 80, 'unidade', 1], subs: [['taco:226', 170, 'fatia média', 1], ['ibge:680300199', 130, 'maçã média', 1]] },
      ],
    }],
  },
  { refeicao: 'almoco', opcoes: [{ id: 'almoco', nome: 'Principal', itens: pratoPrincipal }] },
  {
    refeicao: 'lanche-tarde',
    opcoes: [
      {
        id: 'lanche', nome: 'Principal',
        itens: [
          { a: ['ibge:800050199', 75, 'fatia', 3], subs: [['taco:53', 70, 'unidade', 1.4]] },
          { a: ['taco:408', 100, 'filé pequeno', 1], subs: [['ibge:770630299', 120, 'lata drenada', 1], ['taco:488', 150, 'unidade', 3]] },
          { a: ['meu:creme-ricota', 20, 'colher de sopa', 1], subs: [['meu:requeijao-light', 23, 'colher de sobremesa', 1]] },
          { a: ['taco:226', 170, 'fatia média', 1], subs: [['taco:182', 80, 'unidade', 1]] },
        ],
      },
      {
        id: 'lanche-acai', nome: 'Açaí com whey',
        itens: [
          { a: ['taco:168', 100, 'pacote de polpa', 1] },
          { a: ['meu:whey', 30, 'medidor', 1] },
          { a: ['taco:456', 20, 'colher de sopa cheia', 2] },
          { a: ['taco:182', 160, 'unidade', 2] },
          { a: ['ibge:650410199', 26, 'colher de sopa', 2] },
        ],
      },
      {
        id: 'lanche-iogurte', nome: 'Iogurte com whey e aveia',
        itens: [
          { a: ['meu:whey', 30, 'medidor', 1] },
          { a: ['taco:449', 165, 'copo pequeno', 1] },
          { a: ['taco:182', 160, 'unidade', 2] },
          { a: ['taco:7', 30, 'colher de sopa cheia', 2] },
        ],
      },
      { id: 'lanche-boldbar', nome: 'Barra de proteína', obs: 'Deixa o dia mais baixo (~1.950 kcal): use de vez em quando.', itens: [{ a: ['meu:boldbar', 60, 'barra', 1] }] },
    ],
  },
  {
    refeicao: 'jantar',
    opcoes: [
      { id: 'jantar', nome: 'Prato (igual ao almoço)', itens: pratoPrincipal },
      { id: 'jantar-pao-carne', nome: 'Pão com carne', itens: [{ a: ['ibge:800050199', 100, 'fatia', 4] }, { a: ['taco:463', 20, 'fatia média', 1] }, { a: ['taco:376', 180, 'gramas (cru)', 180] }] },
      { id: 'jantar-aveia', nome: 'Aveia com whey', itens: [{ a: ['taco:7', 40, 'colher de sopa cheia', 2.5] }, { a: ['taco:182', 160, 'unidade', 2] }, { a: ['meu:whey', 30, 'medidor', 1] }, { a: ['meu:molico-triplo-zero', 200, 'gramas', 200] }] },
      { id: 'jantar-bolonhesa', nome: 'Macarrão à bolonhesa', itens: [{ a: ['ibge:650340102', 120, 'pegador', 1.3] }, { a: ['ibge:710430102', 130, 'colher de sopa', 5] }, { a: ['taco:159', 80, 'colher de sopa', 4] }, folhas] },
      { id: 'jantar-omelete', nome: 'Omelete com pão', itens: [{ a: ['taco:488', 150, 'ovo', 3] }, { a: ['taco:486', 66, 'clara', 2] }, { a: ['taco:461', 30, 'fatia', 1] }, { a: ['taco:157', 50, 'unidade média', 0.5] }, { a: ['taco:52', 50, 'fatia', 2] }, folhas] },
      { id: 'jantar-cuscuz', nome: 'Cuscuz nordestino', itens: [{ a: ['taco:533', 150, 'fatia média', 1.5] }, { a: ['taco:488', 100, 'ovo', 2] }, { a: ['taco:408', 80, 'colher de sopa', 3] }, { a: ['taco:157', 50, 'unidade média', 0.5] }] },
      { id: 'jantar-tapioca', nome: 'Tapioca recheada', itens: [{ a: ['ibge:650151699', 60, 'unidade média', 1] }, { a: ['taco:408', 120, 'colher de sopa', 5] }, { a: ['meu:requeijao-light', 15, 'colher de sobremesa', 0.7] }, folhas] },
      { id: 'jantar-wrap', nome: 'Wrap de frango ou atum', itens: [{ a: ['meu:wrap-integral', 80, 'unidade', 2] }, { a: ['taco:408', 130, 'colher de sopa', 5], subs: [['ibge:770630299', 150, 'lata drenada', 1.2]] }, { a: ['meu:requeijao-light', 15, 'colher de sobremesa', 0.7] }, folhas] },
      { id: 'jantar-crepioca', nome: 'Crepioca', itens: [{ a: ['taco:488', 100, 'ovo', 2] }, { a: ['ibge:650151699', 20, 'colher de sopa', 1] }, { a: ['taco:408', 100, 'colher de sopa', 4] }, { a: ['taco:182', 80, 'unidade', 1] }] },
      { id: 'jantar-sopa', nome: 'Sopa de legumes com carne', itens: [{ a: ['taco:91', 150, 'batata média', 1.2] }, { a: ['taco:109', 80, 'colher de sopa', 4] }, { a: ['taco:70', 80, 'colher de sopa', 4] }, { a: ['taco:377', 130, 'gramas', 130] }, { a: ['taco:53', 50, 'unidade', 1] }] },
    ],
  },
];
