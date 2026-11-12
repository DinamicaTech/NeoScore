// Cálculos del reproductor (reproducir-partitura), sin nada del navegador para que las pruebas con Node los puedan
// comprobar: un reloj que se puede pausar y cambiar de tempo sin saltos, y qué nota suena en cada momento.
// Los momentos van en negras (la unidad de tiempo de la partitura) y los instantes en segundos.

/**
 * Reloj de la reproducción: dice por qué negra va la música en cada instante.
 * arrancar(t, desde): empieza (o sigue) en el instante t desde la negra `desde`; antes de t está "en cuenta atrás"
 * y la posición no se mueve. parar(t): se queda donde va. cambiarTempo(t, tempo): sigue desde el mismo sitio a otra velocidad.
 * ir(t, p): salta a la negra p (reiniciar es ir a 0).
 */
export function crearReloj(tempo) {
  let spn = 60 / tempo, pos0 = 0, t0 = null;
  const reloj = {
    get corriendo() { return t0 !== null; },
    get segundosPorNegra() { return spn; },
    /** Negra por la que va la música en el instante t. */
    pos(t) { return t0 === null || t < t0 ? pos0 : pos0 + (t - t0) / spn; },
    /** Negras que faltan para que empiece a moverse (la cuenta atrás), o 0. */
    faltan(t) { return t0 !== null && t < t0 ? (t0 - t) / spn : 0; },
    arrancar(t, desde = reloj.pos(t)) { pos0 = desde; t0 = t; },
    parar(t) { if (t0 !== null) { pos0 = reloj.pos(t); t0 = null; } },
    cambiarTempo(t, nuevo) {
      if (t0 !== null && t >= t0) { pos0 = reloj.pos(t); t0 = t; }
      spn = 60 / nuevo;
    },
    ir(t, p) { pos0 = p; if (t0 !== null && t >= t0) t0 = t; },
  };
  return reloj;
}

/**
 * Qué nota de `notas` (secuencia() de js/afinacion.js) toca en la negra `pos`, buscando desde la k (la de la vez
 * anterior, para no recorrer siempre toda la lista). Devuelve { k, dentro }: k es la nota que suena o, si es un
 * silencio, la siguiente; dentro = está sonando; k = notas.length cuando ya han pasado todas.
 */
export function notaEn(notas, pos, k = 0) {
  // si se ha vuelto atrás (reiniciar), se busca desde el principio
  if (k > notas.length || (k > 0 && pos < notas[k - 1].inicio + notas[k - 1].d)) k = 0;
  while (k < notas.length && pos >= notas[k].inicio + notas[k].d) k++;
  return { k, dentro: k < notas.length && pos >= notas[k].inicio };
}

/** La nota j sigue a la anterior sin volver a atacar: ligada, a la misma altura y justo a continuación. */
export const ligada = (notas, j) => j > 0 && j < notas.length && !!notas[j].tie && notas[j - 1].midi === notas[j].midi &&
  Math.abs(notas[j - 1].inicio + notas[j - 1].d - notas[j].inicio) < 1e-6;

/** Negra en la que acaba la última nota de todas las voces (listas de secuencia()). */
export const final = voces => Math.max(0, ...voces.flatMap(n => n.map(x => x.inicio + x.d)));

/** Voces de acompañamiento válidas: las elegidas que existen en la partitura, sin la principal, en orden. */
export function acompanamiento(elegidas, principal, numVoces) {
  return [...new Set(elegidas)].filter(p => Number.isInteger(p) && p >= 0 && p < numVoces && p !== principal).sort((a, b) => a - b);
}

/** Decibelios más suave que la nota de referencia normal: tu voz y las de acompañamiento, con o sin micrófono. */
export function volumen(principal, micro) {
  const base = micro ? 16 : 0;          // con el micrófono, tu voz muy suave (como la antigua nota guía) para que no la oiga
  return principal ? base : base + 9;   // el acompañamiento, claramente más bajo que tu voz
}
