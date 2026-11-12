// Modo de canto (entonacion/cantar-con-tempo): con el tempo elegido, tras un compás de cuenta atrás, ilumina la
// sílaba que toca cantar, escucha el micrófono, detecta la nota con pitchy (js/vendor/pitchy.js) y dibuja encima de
// cada bloque la línea de lo que se canta y, al pasar la nota, si ha salido afinada, alta o baja.
// Al acabar (o al parar) guarda el resultado en el navegador para la revisión (entonacion/revision): ver resultado()
// y claveResultado() en js/afinacion.js.
// Se activa solo: usa los controles #canto de la cabecera y la partitura #score que dibuja js/dibujo.js.

import { actual } from './controles.js';
import { instrumento, sonidoElegido, cargarTone } from './sonido.js';
import { ROW, TEXT_H } from './dibujo.js';
import {
  MARGENES, MARGEN_POR_DEFECTO, TEMPO_POR_DEFECTO, hzAMidi, comparar, mediana, secuencia, negrasPorCompas,
  segundosPorNegra, tempoValido, resultado, claveResultado,
} from './afinacion.js';

const $ = id => document.getElementById(id);
const AJUSTES = 'neo-canto-ajustes';      // margen y nota guía elegidos, guardados en este navegador
const CLARIDAD = 0.88;                    // por debajo, pitchy no está seguro de que sea una nota (ruido, consonante)
const HZ_MIN = 60, HZ_MAX = 1300;         // de un bajo muy grave a una soprano muy aguda
const GUIA_SUAVE = 16;                    // decibelios más suave que la nota de referencia normal
const NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const SIGNO = { afinada: '✓', alta: '▲', baja: '▼' };
const SVG = 'http://www.w3.org/2000/svg';

const boton = $('cantar'), caja = $('canto'), tempoIn = $('tempo'), margenSel = $('margen'), guiaIn = $('guia');
const estado = $('canto-estado'), score = $('score');

let ses = null;          // sesión en curso, o la última (con sus trazos), mientras siga la misma partitura y voz
let pitchy = null;

// ---- ajustes ----
margenSel.innerHTML = MARGENES.map(m => `<option value="${m.id}" title="${m.titulo}">${m.nombre} (±${m.cents})</option>`).join('');
try {
  const a = JSON.parse(localStorage.getItem(AJUSTES)) || {};
  margenSel.value = MARGENES.some(m => m.id === a.margen) ? a.margen : MARGEN_POR_DEFECTO;
  guiaIn.checked = a.guia !== false;
} catch (e) { margenSel.value = MARGEN_POR_DEFECTO; guiaIn.checked = true; }
const guardarAjustes = () => { try { localStorage.setItem(AJUSTES, JSON.stringify({ margen: margenSel.value, guia: guiaIn.checked })); } catch (e) {} };
margenSel.onchange = () => { guardarAjustes(); if (ses && !ses.activa) repintarTodo(); };
guiaIn.onchange = guardarAjustes;
tempoIn.onchange = () => { tempoIn.value = tempoValido(tempoIn.value); };

const decir = (html, error = false) => { estado.innerHTML = html; estado.className = error ? 'error' : ''; estado.hidden = !html; };
const firma = () => actual.data ? JSON.stringify([actual.data.title, actual.part, [...actual.shown].sort((a, b) => a - b)]) : '';
let titulo = null;

// Cada vez que se dibuja la partitura: los controles se ven si hay notas; con otra partitura, su tempo;
// con otra voz u otras estrofas se para y se borra lo cantado; si es la misma (zoom, giro del móvil), se repinta.
score.addEventListener('dibujada', () => {
  caja.hidden = !score.querySelector('.toque');
  if (actual.data && actual.data.title !== titulo) {
    titulo = actual.data.title;
    const t = actual.data.tempo;
    tempoIn.value = tempoValido(t || TEMPO_POR_DEFECTO);
    tempoIn.title = (t ? `Tempo de la partitura: ${t} negras por minuto.` : `La partitura no trae tempo: se propone ${TEMPO_POR_DEFECTO}.`) +
      ' Baja el número para cantar más despacio o súbelo para ir más rápido.';
  }
  if (ses && ses.firma !== firma()) { parar(false); ses = null; decir(''); }
  if (ses) repintarTodo();
});

boton.onclick = () => (ses && ses.activa ? parar(true) : empezar());

// ---- sesión ----
async function empezar() {
  const { data, part, shown, secs } = actual;
  if (!data) return;
  const notas = secuencia(data, part, shown, secs);
  if (!notas.length) return decir('No hay notas que cantar: elige otra voz o más estrofas arriba.', true);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return decir('Este navegador no deja usar el micrófono aquí. Abre la página desde su dirección https:// (por ejemplo https://dinamicatech.github.io/NeoScore) con Chrome, Edge, Firefox o Safari actualizados.', true);
  }
  boton.disabled = true;
  decir('Preparando el micrófono… Si el navegador pregunta, pulsa <b>Permitir</b>.');
  let stream, ctx, T;
  try {
    // sin "limpiezas" del navegador: deforman la voz y engañan al detector de notas
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    await ctx.resume();
    if (!pitchy) pitchy = await import('./vendor/pitchy.js');
    T = await cargarTone(); await T.start();
  } catch (e) {
    boton.disabled = false;
    if (stream) stream.getTracks().forEach(t => t.stop());
    return decir(errorMicro(e), true);
  }
  const analizador = ctx.createAnalyser();
  analizador.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(analizador);
  const detector = pitchy.PitchDetector.forFloat32Array(analizador.fftSize);
  detector.minVolumeDecibels = -45;   // más flojo que esto es silencio o ruido de fondo

  const tempo = tempoValido(tempoIn.value); tempoIn.value = tempo;
  const spn = segundosPorNegra(tempo), cuenta = negrasPorCompas(data, part);
  const guia = guiaIn.checked;
  let ins = null;
  if (guia) try { ins = await instrumento(sonidoElegido(), GUIA_SUAVE); } catch (e) { /* sin nota guía: se canta igual */ }
  const tic = new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 } }).toDestination();
  tic.volume.value = -10;

  quitarMarcas();
  ses = {
    activa: true, firma: firma(), data, part, notas, tempo, guia, ins, tic, stream, ctx, analizador, detector,
    buf: new Float32Array(analizador.fftSize), trazos: {}, valores: {}, cantadas: {}, k: 0, dentro: false, sonando: null,
    inicio: performance.now() / 1000 + 0.4 + cuenta * spn, spn, cuenta,
  };
  // cuenta atrás: un compás de golpes, el primero más agudo
  const t0 = T.now() + 0.4;
  for (let k = 0; k < cuenta; k++) tic.triggerAttackRelease(k ? 'C6' : 'G6', 0.05, t0 + k * spn);
  boton.disabled = false;
  boton.textContent = '■ Parar';
  boton.title = 'Parar el canto: lo cantado hasta ahora se queda dibujado y guardado';
  boton.classList.add('on');
  seguir(ses);
}

function errorMicro(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') {
    return 'El navegador no deja usar el micrófono. Pulsa el candado (o el icono de ajustes) junto a la dirección de la página, ' +
      'pon <b>Micrófono: Permitir</b>, recarga la página y vuelve a pulsar <b>Cantar</b>. En el móvil, revisa también que el navegador tenga permiso de micrófono en los ajustes del teléfono.';
  }
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No se encuentra ningún micrófono. Conecta uno (o unos auriculares con micrófono) y vuelve a pulsar <b>Cantar</b>.';
  if (n === 'NotReadableError') return 'El micrófono está ocupado por otra aplicación (una videollamada, una grabadora…). Ciérrala y vuelve a pulsar <b>Cantar</b>.';
  return `No se ha podido empezar a escuchar (${(e && e.message) || e}). Recarga la página y vuelve a pulsar <b>Cantar</b>.`;
}

// Escucha y repinta unas 50 veces por segundo, con un reloj (no con el ritmo de pintado de la pantalla, que el
// navegador para si la página no se está mostrando, y entonces se perdería lo cantado).
const seguir = s => { s.reloj = setTimeout(bucle, 20); };

function bucle() {
  const s = ses;
  if (!s || !s.activa) return;
  const ahora = performance.now() / 1000 - s.inicio, pos = ahora / s.spn;   // pos: negras desde la primera nota
  if (pos < 0) {
    decir(`Prepárate… <b>${Math.ceil(-pos)}</b>` + (s.guia ? ' <small>(con la nota guía, mejor con auriculares: si no, el micrófono la oye)</small>' : ''));
  }
  // ¿qué nota toca?
  let k = s.k;
  while (k < s.notas.length && pos >= s.notas[k].inicio + s.notas[k].d) k++;
  const nota = s.notas[k], dentro = !!nota && pos >= nota.inicio;
  if (k !== s.k || dentro !== s.dentro) cambiarNota(s, k, dentro);
  // escuchar
  s.analizador.getFloatTimeDomainData(s.buf);
  const [hz, claridad] = s.detector.findPitch(s.buf, s.ctx.sampleRate);
  const oye = claridad >= CLARIDAD && hz >= HZ_MIN && hz <= HZ_MAX;
  if (dentro) {
    if (oye) {
      const f = (pos - nota.inicio) / nota.d, m = hzAMidi(hz);
      (s.trazos[nota.n] = s.trazos[nota.n] || []).push([f, m]);
      // para la nota que cuenta se deja fuera el arranque (se suele llegar a la nota deslizando)
      if (f >= (nota.d * s.spn < 0.5 ? 0.1 : 0.25)) (s.valores[nota.n] = s.valores[nota.n] || []).push(m);
      pintar(nota.n);
    }
    decir(`Canta: <b>${esc(nota.t || '(sigue la nota)')}</b> · compás ${nota.compas}` + (oye ? ` · oigo ${nombre(hzAMidi(hz))}` : ' · no te oigo'));
  } else if (pos >= 0 && k < s.notas.length) {
    decir('Silencio… respira');
  }
  if (k >= s.notas.length) return terminar();
  seguir(s);
}

/** Pasa a la nota k (dentro: ya toca cantarla; si no, es un silencio antes de ella): cierra las anteriores
 *  (su resultado), ilumina la nueva y hace sonar su guía. */
function cambiarNota(s, k, dentro) {
  for (let j = s.k; j < k; j++) cerrarNota(s, j);   // la que acaba (y las saltadas, si la pestaña estuvo en segundo plano)
  s.k = k; s.dentro = dentro;
  score.querySelectorAll('.toque.toca').forEach(r => r.classList.remove('toca'));
  if (s.sonando != null && s.ins) { s.ins.soltar(s.sonando); s.sonando = null; }
  if (!dentro) return;
  const nueva = k, r = bloque(nueva);
  if (r) {
    r.classList.add('toca');
    const svg = r.ownerSVGElement;
    if (svg !== s.linea) { s.linea = svg; svg.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
  if (s.ins) { s.sonando = s.notas[nueva].midi; s.ins.empezar(s.sonando); }
}

function cerrarNota(s, n) {
  if (n in s.cantadas) return;
  s.cantadas[n] = mediana(s.valores[n] || []);
  pintar(n);
}

function terminar() {
  const s = ses;
  for (let j = 0; j < s.notas.length; j++) cerrarNota(s, j);
  parar(true, true);
}

/** Para la sesión. guardar: guarda el resultado para la revisión; completa: se ha cantado hasta el final. */
function parar(guardar, completa = false) {
  const s = ses;
  if (!s || !s.activa) return;
  s.activa = false;
  clearTimeout(s.reloj);
  if (s.sonando != null && s.ins) s.ins.soltar(s.sonando);
  s.stream.getTracks().forEach(t => t.stop());
  s.ctx.close().catch(() => {});
  s.tic.dispose();
  score.querySelectorAll('.toque.toca').forEach(r => r.classList.remove('toca'));
  boton.textContent = '🎤 Cantar';
  boton.title = TITULO_CANTAR;
  boton.classList.remove('on');
  if (!guardar) return;
  if (s.dentro) cerrarNota(s, s.k);
  const cantadas = Object.fromEntries(s.notas.map(x => [x.n, x.n in s.cantadas ? s.cantadas[x.n] : null]));
  const res = resultado({ titulo: s.data.title, voz: s.data.parts[s.part].name, tempo: s.tempo, margen: margenSel.value, notas: s.notas, cantadas });
  res.completa = completa;
  try { localStorage.setItem(claveResultado(res.titulo, res.voz), JSON.stringify(res)); } catch (e) {}
  const c = { afinada: 0, alta: 0, baja: 0, 'sin-oir': 0 };
  for (const x of res.notas) if (s.cantadas[x.n] !== undefined || completa) c[x.estado]++;
  const total = c.afinada + c.alta + c.baja;
  decir((completa ? '¡Fin! ' : 'Parado. ') +
    `<span class="c-afinada">✓ ${c.afinada} afinadas</span> · <span class="c-alta">▲ ${c.alta} altas</span> · <span class="c-baja">▼ ${c.baja} bajas</span>` +
    (c['sin-oir'] ? ` · ${c['sin-oir']} sin oír` : '') + (total ? ` (de ${total} cantadas)` : '') +
    '. Pasa el dedo o el ratón por una sílaba para ver cuánto te has desviado; pulsa <b>Cantar</b> para repetir.');
}

// ---- dibujo de lo cantado ----
const bloque = n => score.querySelector(`.toque[data-n="${n}"]`);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const nombre = m => NAMES[((Math.round(m) % 12) + 12) % 12];
const margenCents = () => (MARGENES.find(m => m.id === margenSel.value) || MARGENES[0]).cents;

function quitarMarcas() { score.querySelectorAll('.cantado').forEach(g => g.remove()); }
function repintarTodo() {
  quitarMarcas();
  if (!ses) return;
  for (const n of new Set([...Object.keys(ses.trazos), ...Object.keys(ses.cantadas)])) pintar(+n);
  if (ses.activa && ses.dentro) { const r = bloque(ses.k); if (r) { r.classList.add('toca'); ses.linea = r.ownerSVGElement; } }
}

/** Dibuja sobre el bloque de la nota n la línea de lo cantado y, si ya ha pasado, su resultado. */
function pintar(n) {
  const r = bloque(n), s = ses;
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

const TITULO_CANTAR = 'Cantar la voz elegida al tempo de al lado: tras un compás de cuenta atrás se ilumina cada sílaba cuando toca, ' +
  'el micrófono te escucha y encima de cada nota se dibuja lo que cantas (✓ afinada, ▲ alta, ▼ baja)';
boton.title = TITULO_CANTAR;
