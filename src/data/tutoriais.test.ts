import { describe, expect, it } from 'vitest';
import { EXERCICIOS } from './musculacao';
import { TUTORIAIS, linkVideo } from './tutoriais';

describe('tutoriais', () => {
  it('todo exercício do catálogo tem tutorial completo', () => {
    for (const id of Object.keys(EXERCICIOS)) {
      const t = TUTORIAIS[id];
      expect(t, id).toBeDefined();
      expect(t.passos.length, id).toBeGreaterThanOrEqual(3);
      expect(t.erros.length, id).toBeGreaterThanOrEqual(1);
      expect(t.musculos.length, id).toBeGreaterThan(3);
    }
  });
  it('não há tutorial órfão', () => {
    for (const id of Object.keys(TUTORIAIS)) expect(EXERCICIOS[id], id).toBeDefined();
  });
  it('link de vídeo é uma busca no YouTube', () => {
    expect(linkVideo('Supino reto com barra')).toBe('https://www.youtube.com/results?search_query=Supino%20reto%20com%20barra%20execu%C3%A7%C3%A3o%20correta');
  });
});
