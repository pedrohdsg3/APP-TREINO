// Preferências de aparelho (som, vibração, voz). A tela de configurações chega na etapa 6.
export interface Prefs {
  som: boolean;
  vibracao: boolean;
  voz: boolean;
  /** descanso por exercício (segundos), sobrescreve o plano */
  descansos: Record<string, number>;
}
const CHAVE = 'treino.prefs';
const PADRAO: Prefs = { som: true, vibracao: true, voz: true, descansos: {} };

export function lerPrefs(): Prefs {
  try { return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') }; } catch { return PADRAO; }
}
export function salvarPrefs(p: Partial<Prefs>) {
  try { localStorage.setItem(CHAVE, JSON.stringify({ ...lerPrefs(), ...p })); } catch { /* ignora */ }
}
