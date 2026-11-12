// Escuchar al cantante (entonacion/cantar-con-tempo) mientras suena el reproductor (reproducir-partitura, js/reproductor.js):
// abre el micrófono, detecta la nota con pitchy (js/vendor/pitchy.js) y dibuja encima de cada bloque la línea de lo que
// se canta y, al pasar la nota, si ha salido afinada, alta o baja. Al acabar (o al reiniciar) guarda el resultado en el
// navegador para la revisión (entonacion/revision): ver resultado() y claveResultado() en js/afinacion.js.
// El ritmo lo lleva el reproductor: este módulo solo escucha, anota y dibuja lo que le dice.

import { ROW, TEXT_H } from './dibujo.js';
import { MARGENES, MARGEN_POR_DEFECTO, hzAMidi, comparar, mediana, resultado, claveResultado } from './afinacion.js';

const $ = id => document.getElementById(id);
const AJUSTES = 'neo-canto-ajustes';      // margen elegido, guardado en este navegador
const CLARIDAD = 0.88;                    // por debajo, pitchy no está seguro de que sea una nota (ruido, consonante)
const HZ_MIN = 60, HZ_MAX = 1300;         // de un bajo muy grave a una soprano muy aguda
const NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const SIGNO = { afinada: '✓', alta: '▲', baja: '▼' };
const SVG = 'http://www.w3.org/2000/svg';

const margenSel = $('margen'), score = $('score');
let pitchy = null;
let marcas = null;   // la escucha cuyas marcas se ven en la partitura (para repintarlas al redibujar)

// ---- margen ----
margenSel.innerHTML = MARGENES.map(m => `<option value="${m.id}" title="${m.titulo}">${m.nombre} (±${m.cents})</option>`).join('');
try {
  const a = JSON.parse(localStorage.getItem(AJUSTES)) || {};
  margenSel.value = MARGENES.some(m => m.id === a.margen) ? a.margen : MARGEN_POR_DEFECTO;
} catch (e) { margenSel.value = MARGEN_POR_DEFECTO; }
margenSel.onchange = () => {
  try { localStorage.setItem(AJUSTES, JSON.stringify({ margen: margenSel.value })); } catch (e) {}
  repintar();
};
const margenCents = () => (MARGENES.find(m => m.id === margenSel.value) || MARGENES[0]).cents;

/**
 * Abre el micrófono para escuchar las notas `notas` (secuencia() de la voz principal). Devuelve la escucha:
 * { stream, ctx, ..., trazos, valores, cantadas }. Si no se puede, lanza un Error con el mensaje para el usuario (HTML).
 */
export async function abrir({ data, part, notas }) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Este navegador no deja usar el micrófono aquí. Abre la página desde su dirección https:// (por ejemplo https://dinamicatech.github.io/NeoScore) con Chrome, Edge, Firefox o Safari actualizados.');
  }
  let stream, ctx;
  try {
    // sin "limpiezas" del navegador: deforman la voz y engañan al detector de notas
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    await ctx.resume();
    if (!pitchy) pitchy = await import('./vendor/pitchy.js');
  } catch (e) {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (ctx) ctx.close().catch(() => {});
    throw new Error(errorMicro(e));
  }
  const analizador = ctx.createAnalyser();
  analizador.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(analizador);
  const detector = pitchy.PitchDetector.forFloat32Array(analizador.fftSize);
  detector.minVolumeDecibels = -45;   // más flojo que esto es silencio o ruido de fondo
  quitarMarcas();
  marcas = {
    data, part, notas, stream, ctx, analizador, detector, buf: new Float32Array(analizador.fftSize),
    trazos: {}, valores: {}, cantadas: {}, abierta: true,
  };
  return marcas;
}

/** Cierra el micrófono (lo cantado se queda dibujado). */
export function cerrar(s) {
  if (!s || !s.abierta) return;
  s.abierta = false;
  s.stream.getTracks().forEach(t => t.stop());
  s.ctx.close().catch(() => {});
}

/** Escucha un instante. Si la nota `nota` está sonando (dentro), anota y dibuja lo oído; f: lo que lleva de nota (0 a 1).
 *  spn: segundos por negra. Devuelve la altura oída (MIDI con decimales) o null. */
export function escuchar(s, nota, dentro, f, spn) {
  s.analizador.getFloatTimeDomainData(s.buf);
  const [hz, claridad] = s.detector.findPitch(s.buf, s.ctx.sampleRate);
  if (!(claridad >= CLARIDAD && hz >= HZ_MIN && hz <= HZ_MAX)) return null;
  const m = hzAMidi(hz);
  if (dentro && nota) {
    (s.trazos[nota.n] = s.trazos[nota.n] || []).push([f, m]);
    // para la nota que cuenta se deja fuera el arranque (se suele llegar a la nota deslizando)
    if (f >= (nota.d * spn < 0.5 ? 0.1 : 0.25)) (s.valores[nota.n] = s.valores[nota.n] || []).push(m);
    pintar(nota.n);
  }
  return m;
}

/** La nota n ya ha pasado: su altura cantada es la mediana de lo oído, y se marca afinada, alta o baja. */
export function cerrarNota(s, n) {
  if (!s || n in s.cantadas || !s.notas[n]) return;
  s.cantadas[n] = mediana(s.valores[n] || []);
  pintar(n);
}

/** Guarda el resultado para la revisión y devuelve el resumen (HTML). completa: se ha llegado al final. */
export function guardar(s, { tempo, completa }) {
  if (!s) return '';
  if (completa) for (const x of s.notas) cerrarNota(s, x.n);
  const cantadas = Object.fromEntries(s.notas.map(x => [x.n, x.n in s.cantadas ? s.cantadas[x.n] : null]));
  const res = resultado({ titulo: s.data.title, voz: s.data.parts[s.part].name, tempo, margen: margenSel.value, notas: s.notas, cantadas });
  res.completa = completa;
  try { localStorage.setItem(claveResultado(res.titulo, res.voz), JSON.stringify(res)); } catch (e) {}
  return resumen(s, completa);
}

/** Cuántas notas van afinadas, altas, bajas y sin oír (HTML). */
export function resumen(s, completa = false) {
  if (!s) return '';
  const c = { afinada: 0, alta: 0, baja: 0, 'sin-oir': 0 };
  for (const x of s.notas) {
    if (!(x.n in s.cantadas)) { if (completa) c['sin-oir']++; continue; }
    const v = s.cantadas[x.n];
    c[v == null ? 'sin-oir' : comparar(x.midi, v, margenCents()).estado]++;
  }
  const total = c.afinada + c.alta + c.baja;
  return `<span class="c-afinada">✓ ${c.afinada} afinadas</span> · <span class="c-alta">▲ ${c.alta} altas</span> · <span class="c-baja">▼ ${c.baja} bajas</span>` +
    (c['sin-oir'] ? ` · ${c['sin-oir']} sin oír` : '') + (total ? ` (de ${total} cantadas)` : '');
}

/** Nombre de la nota (Do, Re♯…) de una altura MIDI. */
export const nombre = m => NAMES[((Math.round(m) % 12) + 12) % 12];

// ---- dibujo de lo cantado ----
const bloque = n => score.querySelector(`.toque[data-n="${n}"]`);

/** Borra las marcas de lo cantado (al empezar otra vez, o con otra voz u otras estrofas). */
export function quitarMarcas(olvidar = false) {
  score.querySelectorAll('.cantado').forEach(g => g.remove());
  score.querySelectorAll('.toque[data-res]').forEach(r => {
    delete r.dataset.res;
    const t = r.querySelector('title');
    if (t) t.textContent = `Toca para oír esta nota (${NAMES[+r.dataset.e % 12]})`;
  });
  if (olvidar) marcas = null;
}

/** Vuelve a dibujar todo lo cantado (tras redibujar la partitura o cambiar el margen). */
export function repintar() {
  score.querySelectorAll('.cantado').forEach(g => g.remove());
  if (!marcas) return;
  for (const n of new Set([...Object.keys(marcas.trazos), ...Object.keys(marcas.cantadas)])) pintar(+n);
}

/** Dibuja sobre el bloque de la nota n la línea de lo cantado y, si ya ha pasado, su resultado. */
function pintar(n) {
  const r = bloque(n), s = marcas;
  if (!r || !s) return;
  const g0 = r.parentNode, hi = +g0.dataset.hi, lo = +g0.dataset.lo, e = +r.dataset.e, esperada = +r.dataset.p;
  const x = +r.getAttribute('x'), w = +r.getAttribute('width');
  const yDe = escrita => TEXT_H + (hi - Math.max(lo - 2, Math.min(hi + 2, escrita))) * ROW + ROW / 2;
  // la altura cantada, llevada a la octava de la nota esperada (cantar una octava más grave cuenta como esa nota)
  const plegada = m => { let d = m - esperada; d -= 12 * Math.round(d / 12); return e + d; };
  let g = g0.querySelector(`.cantado[data-c="${n}"]`);
  if (!g) { g = document.createElementNS(SVG, 'g'); g.setAttribute('class', 'cantado'); g.dataset.c = n; g0.insertBefore(g, r); }
  let html = '';
  const tr = s.trazos[n] || [];
  if (tr.length) {
    const pts = tr.map(([f, m]) => `${(x + 1 + f * (w - 2)).toFixed(1)},${yDe(plegada(m)).toFixed(1)}`);
    if (pts.length === 1) pts.push(pts[0].replace(/^[\d.]+/, v => (+v + 1).toFixed(1)));
    html += `<polyline class="traza" points="${pts.join(' ')}"/>`;
  }
  if (n in s.cantadas) {
    const c = s.cantadas[n], ye = TEXT_H + (hi - e) * ROW;
    if (c == null) {
      html += `<text class="marca sin-oir" x="${x + w / 2}" y="${ye - 1.5}">·</text>`;
      r.dataset.res = 'No se te ha oído en esta nota';
    } else {
      const v = comparar(esperada, c, margenCents());
      const oct = v.octava ? ` · una octava más ${v.octava < 0 ? 'grave' : 'aguda'}` : '';
      html += `<rect class="caja c-${v.estado}" x="${x + 0.5}" y="${ye - 0.5}" width="${w - 1}" height="${ROW + 1}" rx="2"/>` +
        `<text class="marca c-${v.estado}" x="${x + w / 2}" y="${ye - 1.5}">${SIGNO[v.estado]}</text>`;
      r.dataset.res = `Has cantado ${nombre(c)} (${v.cents > 0 ? '+' : ''}${v.cents} cents): ${v.estado}${oct}`;
    }
    const t = r.querySelector('title');
    if (t) t.textContent = `${r.dataset.res}. Toca para oír la nota que tocaba (${NAMES[e % 12]})`;
  }
  g.innerHTML = html;
}

function errorMicro(e) {
  const n = e && e.name, otra = 'y vuelve a pulsar <b>▶ Reproducir</b> con <b>🎤 Micrófono</b> activado';
  if (n === 'NotAllowedError' || n === 'SecurityError') {
    return 'El navegador no deja usar el micrófono. Pulsa el candado (o el icono de ajustes) junto a la dirección de la página, ' +
      `pon <b>Micrófono: Permitir</b>, recarga la página ${otra}. En el móvil, revisa también que el navegador tenga permiso de micrófono en los ajustes del teléfono. ` +
      'Si solo quieres escuchar, desactiva <b>🎤 Micrófono</b>.';
  }
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return `No se encuentra ningún micrófono. Conecta uno (o unos auriculares con micrófono) ${otra}, o desactiva <b>🎤 Micrófono</b> para solo escuchar.`;
  if (n === 'NotReadableError') return `El micrófono está ocupado por otra aplicación (una videollamada, una grabadora…). Ciérrala ${otra}.`;
  return `No se ha podido empezar a escuchar (${(e && e.message) || e}). Recarga la página ${otra}.`;
}
