// Cálculos del modo de canto (entonacion/cantar-con-tempo), sin nada del navegador para que las pruebas con Node
// los puedan comprobar: el orden y el momento de cada nota, de hercios a nota, y si lo cantado está afinado.
//
// Palabras: un semitono es el paso más pequeño entre dos notas (de una fila a la siguiente de la cuadrícula);
// un cent es la centésima parte de un semitono. Las alturas van en números MIDI (60 = Do central, 61 = Do♯…).

/** Márgenes para dar una nota por afinada, en cents arriba o abajo. */
export const MARGENES = [
  { id: 'facil', nombre: 'Fácil', cents: 50, titulo: 'Afinada si te desvías como mucho medio semitono (50 cents): para empezar' },
  { id: 'normal', nombre: 'Normal', cents: 35, titulo: 'Afinada si te desvías como mucho un tercio de semitono (35 cents)' },
  { id: 'dificil', nombre: 'Difícil', cents: 25, titulo: 'Afinada si te desvías como mucho un cuarto de semitono (25 cents): exigente' },
];
export const MARGEN_POR_DEFECTO = 'facil';
export const TEMPO_POR_DEFECTO = 80;   // negras por minuto, si la partitura no trae tempo
export const TEMPO_MIN = 30, TEMPO_MAX = 200;

/** Frecuencia (Hz) → altura MIDI con decimales: 440 → 69 (La), 466,16 → 70. */
export const hzAMidi = hz => 69 + 12 * Math.log2(hz / 440);

/**
 * Compara la nota cantada con la esperada (las dos en MIDI que suena; la cantada con decimales).
 * Con octavas = true, cantar la misma nota una octava (o dos) más grave o más aguda cuenta como esa nota:
 * es lo natural cuando un hombre canta una voz escrita para mujeres, o al revés.
 * Devuelve { cents: desviación respecto a la esperada (+ alta, − baja), octava: octavas de diferencia (−1 = más grave),
 *            estado: 'afinada' | 'alta' | 'baja' }.
 */
export function comparar(esperada, cantada, margen, octavas = true) {
  let dif = cantada - esperada, octava = 0;
  if (octavas) { octava = Math.round(dif / 12); dif -= 12 * octava; }
  const cents = Math.round(dif * 100);
  const estado = Math.abs(cents) <= margen ? 'afinada' : cents > 0 ? 'alta' : 'baja';
  return { cents, octava, estado };
}

/** La altura central de una lista de alturas cantadas (la mediana): no se deja llevar por un golpe de voz suelto. */
export function mediana(valores) {
  if (!valores.length) return null;
  const v = [...valores].sort((a, b) => a - b), m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/**
 * Las notas que se cantan, en el orden en que se dibujan: las de la voz `part` en las estrofas visibles (`shown`,
 * Set de índices de estrofa; `secs` = estrofas(data)). Cada una:
 * { n: número de orden (el data-n de su bloque en el dibujo), p: altura escrita, midi: altura que suena,
 *   d: duración en negras, inicio: en negras desde la primera nota, compas: número de compás, t?: sílaba }.
 * Los silencios no son notas pero ocupan su tiempo. El tiempo empieza en la primera nota (el silencio inicial no se espera).
 */
export function secuencia(data, part, shown, secs) {
  const P = data.parts[part], oct = P.oct || 0, notas = [];
  let t = 0;
  P.measures.forEach((m, i) => {
    if (!shown.has(secs.de[i])) return;
    for (const e of m.e) {
      if (!e.r) notas.push({ n: notas.length, p: e.p, midi: e.p + oct, d: e.d, inicio: t, compas: i + 1, ...(e.t ? { t: e.t } : {}) });
      t += e.d;
    }
  });
  const cero = notas.length ? notas[0].inicio : 0;
  for (const x of notas) x.inicio -= cero;
  return notas;
}

/** Negras que dura un compás de la voz (el más largo de los primeros): las de la cuenta atrás. */
export function negrasPorCompas(data, part) {
  const largos = data.parts[part].measures.slice(0, 4).map(m => m.e.reduce((s, e) => s + e.d, 0));
  const n = Math.round(Math.max(0, ...largos));
  return n >= 2 && n <= 8 ? n : 4;
}

/** Segundos que dura una negra a este tempo (negras por minuto). */
export const segundosPorNegra = tempo => 60 / tempo;

/** Tempo válido a partir de lo que escribe el usuario o trae la partitura. */
export const tempoValido = t => {
  const n = Math.round(+t);
  return Number.isFinite(n) && n > 0 ? Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, n)) : TEMPO_POR_DEFECTO;
};

/**
 * Resultado de una sesión de canto, tal como se guarda en el navegador para la revisión al acabar
 * (entonacion/revision). notas: secuencia(...); cantadas[n]: altura cantada (MIDI con decimales) de la nota n, o null.
 */
export function resultado({ titulo, voz, tempo, margen, notas, cantadas, fecha = new Date().toISOString() }) {
  const m = MARGENES.find(x => x.id === margen) || MARGENES[0];
  return {
    version: 1, titulo, voz, fecha, tempo, margen: m.id, cents: m.cents,
    notas: notas.map(x => {
      const c = cantadas[x.n];
      const base = { n: x.n, compas: x.compas, silaba: x.t || '', esperada: x.midi };
      if (c == null) return { ...base, cantada: null, cents: null, octava: 0, estado: 'sin-oir' };
      return { ...base, cantada: Math.round(c * 100) / 100, ...comparar(x.midi, c, m.cents) };
    }),
  };
}

/** Clave de localStorage del último resultado de una partitura y voz. */
export const claveResultado = (titulo, voz) => `neo-canto:${titulo}:${voz}`;
