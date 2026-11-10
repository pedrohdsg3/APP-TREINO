// Correções pontuais de dados, aplicadas uma única vez por aparelho.
import { db } from '../db';
import { perfilAtual } from './perfis';

const FEITAS = 'treino.correcoes';
function feitas(): string[] { try { return JSON.parse(localStorage.getItem(FEITAS) ?? '[]'); } catch { return []; } }
function marcar(id: string) { try { localStorage.setItem(FEITAS, JSON.stringify([...feitas(), id])); } catch { /* ignora */ } }

/**
 * 09/11/2026: a Yana treinou (Inferior A, ~1 h, ~2.000 kg) antes de a data de início dela ser corrigida,
 * então o treino não foi registrado. Adiciona a sessão uma vez, se ainda não houver treino nesse dia.
 */
export async function aplicarCorrecoes() {
  const id = 'yana-2026-11-09';
  if (perfilAtual().id !== 'yana' || feitas().includes(id)) return;
  try {
    const existe = (await db.sessoes.where('data').equals('2026-11-09').toArray()).some((s) => s.tipo === 'musculacao' && s.status !== 'pulado');
    if (!existe) {
      await db.sessoes.put({
        id: 'manual-yana-2026-11-09', data: '2026-11-09', tipo: 'musculacao', status: 'feito', semana: 1, treinoId: 'inferior-a',
        duracaoSeg: 3600, volumeKg: 2000, prs: 0, notas: 'Registrado manualmente: treino feito antes da atualização do app (cargas por série não registradas).',
        inicioTs: new Date(2026, 10, 9, 20, 0).getTime(), fimTs: new Date(2026, 10, 9, 21, 0).getTime(),
      });
    }
    marcar(id);
  } catch { /* tenta de novo na próxima abertura */ }
}
