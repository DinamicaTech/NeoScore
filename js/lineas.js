// Reparto de los compases en líneas según el ancho disponible (pantalla del móvil, del PC o papel).
// Va en su propio fichero, sin nada del navegador, para que las pruebas con Node lo puedan comprobar.

const MARGEN = 4;   // 2 px a cada lado del compás, entre sus barras y las notas

/**
 * Reparte los compases en líneas que no pasen de maxW píxeles.
 * compases: [{ evs: [{ w, ... }], w, end, label, ... }], donde w es el ancho del compás (suma de sus notas + MARGEN).
 * Tras una doble barra (end) empieza línea nueva. Un compás que no cabe solo en una línea se parte en tramos:
 * el primero conserva el número y la indicación ("Estrofa 2"...), los siguientes llevan cont: true y el último
 * se queda con la doble barra. Una nota sola más ancha que la línea (una redonda con el tamaño al máximo en un
 * móvil estrecho) se estrecha hasta caber: el ritmo ya es aproximado (las notas cortas se ensanchan por la letra).
 * Devuelve una lista de líneas, cada una una lista de compases (o tramos de compás).
 */
export function repartirEnLineas(compases, maxW) {
  const lines = []; let cur = [], cw = 0;
  const cerrar = () => { if (cur.length) lines.push(cur); cur = []; cw = 0; };
  for (const m of compases) {
    for (const t of tramos(m, maxW)) {
      if (cur.length && cw + t.w > maxW) cerrar();
      cur.push(t); cw += t.w;
      if (t.end) cerrar();
    }
  }
  cerrar();
  return lines;
}

/** Parte un compás en tramos que quepan en maxW; si cabe entero, lo devuelve tal cual. */
function tramos(m, maxW) {
  if (m.w <= maxW) return [m];
  const tope = Math.max(maxW - MARGEN, 1);
  if (m.evs.some(e => e.w > tope)) {
    const evs = m.evs.map(e => e.w > tope ? { ...e, w: tope } : e);
    m = { ...m, evs, w: evs.reduce((s, e) => s + e.w, 0) + MARGEN };
    if (m.w <= maxW) return [m];
  }
  const grupos = []; let g = [], gw = MARGEN;
  for (const e of m.evs) {
    if (g.length && gw + e.w > maxW) { grupos.push(g); g = []; gw = MARGEN; }
    g.push(e); gw += e.w;
  }
  grupos.push(g);
  return grupos.map((evs, k) => ({
    ...m, evs, w: evs.reduce((s, e) => s + e.w, 0) + MARGEN,
    cont: k > 0,                                   // tramo que sigue un compás de la línea anterior
    label: k === 0 ? m.label : undefined,
    end: k === grupos.length - 1 ? m.end : false,
  }));
}
