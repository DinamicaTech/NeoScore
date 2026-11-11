// Estrofas (secciones) de una partitura: empiezan al principio y tras cada doble barra,
// y se nombran con su indicación de texto ("Estrofa 2 · Andante" → "Estrofa 2"), buscada en cualquier voz.

/** Devuelve {lista:[{name, from}], de: índice de estrofa de cada compás, finEn(i): si el compás i acaba en doble barra}. */
export function estrofas(data) {
  const NM = data.parts[0].measures.length;
  const labelAt = i => data.parts.map(q => q.measures[i] && q.measures[i].w).find(Boolean);
  const finEn = i => data.parts.some(q => q.measures[i] && q.measures[i].end);
  const lista = [], de = [];
  for (let i = 0; i < NM; i++) {
    if (i === 0 || finEn(i - 1)) {
      const l = (labelAt(i) || '').split(' · ')[0];
      lista.push({ name: l && !/^rit/i.test(l) ? l : `Parte ${lista.length + 1}`, from: i + 1 });
    }
    de[i] = lista.length - 1;
  }
  return { lista, de, finEn };
}
