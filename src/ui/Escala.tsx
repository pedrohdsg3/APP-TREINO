// Escala numérica tocável (esforço 1–10, dor 0–10).
export function Escala({ valor, onChange, de, ate, rotulo, tipo = 'esforco' }: {
  valor?: number; onChange: (n: number) => void; de: number; ate: number; rotulo: string; tipo?: 'esforco' | 'dor';
}) {
  const nivel = (n: number) => (tipo === 'dor' ? (n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4) : n <= 4 ? 1 : n <= 6 ? 2 : n <= 8 ? 3 : 4);
  const nums = Array.from({ length: ate - de + 1 }, (_, i) => de + i);
  return (
    <div className="escala" role="radiogroup" aria-label={rotulo} style={{ gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))` }}>
      {nums.map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valor === n}
          className={`escala__n nv-${nivel(n)} ${valor === n ? 'on' : ''}`} onClick={() => onChange(n)}>{n}</button>
      ))}
    </div>
  );
}

export function textoEsforco(n?: number) {
  if (!n) return '';
  return n <= 4 ? 'Leve' : n <= 6 ? 'Moderado' : n <= 8 ? 'Forte' : 'Máximo';
}
export function textoDor(n?: number) {
  if (n === undefined) return '';
  return n === 0 ? 'Sem dor' : n <= 3 ? 'Leve' : n <= 5 ? 'Moderada — atenção' : 'Forte — pare e cuide';
}
