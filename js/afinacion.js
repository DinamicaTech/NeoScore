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
  if (octavas) { octava = Math.round(dif / 12) || 0; dif -= 12 * octava; }   // || 0: sin "-0"
  const cents = Math.round(dif * 100) || 0;
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
 *   d: duración en negras, inicio: en negras desde la primera nota, compas: número de compás, t?: sílaba,
 *   tie?: 1 si sigue ligada a la anterior }.
 * Los silencios no son notas pero ocupan su tiempo. El tiempo empieza en la primera nota (el silencio inicial no se espera),
 * o en `cero` (negras desde el primer compás visible) si se da: así varias voces comparten reloj (ver inicioComun).
 */
export function secuencia(data, part, shown, secs, cero = null) {
  const notas = sinMover(data, part, shown, secs);
  if (cero == null) cero = notas.length ? notas[0].inicio : 0;
  for (const x of notas) x.inicio -= cero;
  return notas;
}

// Las notas de una voz con su momento contado desde el primer compás visible (sin llevarlo a la primera nota).
// tie: 1 si la nota sigue ligada a la anterior (misma altura: suenan como una sola nota larga).
function sinMover(data, part, shown, secs) {
  const P = data.parts[part], oct = P.oct || 0, notas = [];
  let t = 0;
  P.measures.forEach((m, i) => {
    if (!shown.has(secs.de[i])) return;
    for (const e of m.e) {
      if (!e.r) notas.push({ n: notas.length, p: e.p, midi: e.p + oct, d: e.d, inicio: t, compas: i + 1, ...(e.t ? { t: e.t } : {}), ...(e.tie ? { tie: 1 } : {}) });
      t += e.d;
    }
  });
  return notas;
}

/** Momento (en negras desde el primer compás visible) de la primera nota de cualquiera de las voces `partes`:
 *  el cero común para que varias voces suenen a la vez (secuencia(..., cero)). */
export function inicioComun(data, partes, shown, secs) {
  const primeras = partes.map(p => sinMover(data, p, shown, secs)).filter(n => n.length).map(n => n[0].inicio);
  return primeras.length ? Math.min(...primeras) : 0;
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
export function resultado({ titulo, voz, tempo, margen, notas, cantadas, estrofas, fecha = new Date().toISOString() }) {
  const m = MARGENES.find(x => x.id === margen) || MARGENES[0];
  return {
    version: 1, titulo, voz, fecha, tempo, margen: m.id, cents: m.cents, ...(estrofas ? { estrofas } : {}),
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

// ---- Revisión al acabar (entonacion/revision) ----

export const HISTORIAL_MAX = 10;   // intentos completos que se recuerdan por partitura y voz

/** Clave de localStorage del historial de intentos completos de una partitura y voz. */
export const claveHistorial = (titulo, voz) => `neo-canto-historial:${titulo}:${voz}`;

/** Cuántas notas de un resultado salieron afinadas, altas, bajas y sin oír. */
export function cuentas(notas) {
  const c = { afinada: 0, alta: 0, baja: 0, 'sin-oir': 0 };
  for (const x of notas) if (x.estado in c) c[x.estado]++;
  return c;
}

/** Añade un intento al historial (solo si llegó al final) y deja los últimos HISTORIAL_MAX. Devuelve el historial nuevo. */
export function anadirIntento(historial, res) {
  const lista = Array.isArray(historial) ? historial.filter(h => h && Number.isFinite(h.afinadas) && Number.isFinite(h.total)) : [];
  if (!res || !res.completa) return lista;
  const c = cuentas(res.notas);
  lista.push({ fecha: res.fecha, tempo: res.tempo, margen: res.margen, afinadas: c.afinada, altas: c.alta, bajas: c.baja, sinOir: c['sin-oir'], total: res.notas.length });
  return lista.slice(-HISTORIAL_MAX);
}

/** Una línea con la evolución: "Tus últimos intentos: 28 · 33 · 37 afinadas de 42" ('' si no hay intentos). */
export function textoHistorial(historial) {
  if (!historial || !historial.length) return '';
  const total = historial[historial.length - 1].total, iguales = historial.every(h => h.total === total);
  const uno = historial.length === 1;
  return (uno ? 'Tu intento completo: ' : 'Tus últimos intentos: ') +
    (iguales ? historial.map(h => h.afinadas).join(' · ') + ` afinadas de ${total}` : historial.map(h => `${h.afinadas}/${h.total}`).join(' · ') + ' afinadas');
}

/** Las notas de un resultado que salieron fuera del margen (altas o bajas), recalculadas con el margen `cents`
 *  que está elegido ahora. Las que no se oyeron no salen. */
export function fueraDeMargen(res, cents) {
  return res.notas.filter(x => x.cantada != null)
    .map(x => ({ ...x, ...comparar(x.esperada, x.cantada, cents) }))
    .filter(x => x.estado !== 'afinada');
}

/** Cuánto se ha desviado, en palabras: "un poco alta (+35 cents, un tercio de semitono)". */
export function desvioEnPalabras(cents) {
  const a = Math.abs(cents), dir = cents > 0 ? 'alta' : 'baja';
  const grado = a < 50 ? `un poco ${dir}` : a < 100 ? dir : `muy ${dir}`;
  let medida;
  if (a < 100) {
    const marcas = [[25, 'un cuarto de semitono'], [33, 'un tercio de semitono'], [50, 'medio semitono'], [75, 'tres cuartos de semitono'], [100, 'casi un semitono']];
    medida = marcas.reduce((m, x) => Math.abs(x[0] - a) < Math.abs(m[0] - a) ? x : m)[1];
  } else {
    const s = Math.round(a / 100);
    medida = s === 1 ? 'un semitono' : `${s} semitonos`;
  }
  return `${grado} (${cents > 0 ? '+' : ''}${cents} cents, ${medida})`;
}

/** El tramo que se repite para practicar una nota: su compás entero (las notas de ese compás).
 *  Devuelve { desde, hasta (en negras, como inicio en secuencia()), ns: números de las notas del tramo }. */
export function tramoDeCompas(notas, compas) {
  const del = notas.filter(x => x.compas === compas);
  if (!del.length) return null;
  return { compas, desde: del[0].inicio, hasta: Math.max(...del.map(x => x.inicio + x.d)), ns: del.map(x => x.n) };
}

/** El resultado guardado corresponde a las notas que se ven ahora (mismas estrofas): se pueden marcar y repetir. */
export const coincide = (res, notas) => !!res && Array.isArray(res.notas) && res.notas.length === notas.length &&
  res.notas.every((x, i) => x.n === notas[i].n && x.compas === notas[i].compas && x.esperada === notas[i].midi);
