// Utilitários de data. Trabalhamos sempre com datas "locais" no formato ISO aaaa-mm-dd.

export const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Data local -> 'aaaa-mm-dd' */
export function isoLocal(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'aaaa-mm-dd' -> Date (meio-dia local, imune a horário de verão) */
export function deIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d, 12);
}

/** 'aaaa-mm-dd' -> 'dd/mm/aaaa' */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Ex.: "segunda, 9 de novembro" */
export function dataPorExtenso(iso: string): string {
  const d = deIso(iso);
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function diasEntre(deIsoA: string, ateIsoB: string): number {
  return Math.round((deIso(ateIsoB).getTime() - deIso(deIsoA).getTime()) / 86_400_000);
}

export function somarDias(iso: string, dias: number): string {
  const d = deIso(iso);
  d.setDate(d.getDate() + dias);
  return isoLocal(d);
}

export function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
