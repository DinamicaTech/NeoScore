// Reproductor (reproducir-partitura): hace sonar la partitura entera, la voz elegida con las estrofas que se ven, al tempo
// y con el sonido elegidos, con ▶ Reproducir / ⏸ Pausa / ▶ Continuar y ⏮ Reiniciar. Se le pueden sumar otras voces más
// suaves (Acompañamiento) y el micrófono (🎤), que escucha lo que cantas y marca cada nota (js/canto.js).
// La sílaba que suena se ilumina y la partitura se desplaza para mantenerla a la vista.
// Se activa solo: usa los controles #reproductor y #acomp de la cabecera y la partitura #score que dibuja js/dibujo.js.

import { actual } from './controles.js';
import { instrumento, sonidoElegido, cargarTone } from './sonido.js';
import { TEMPO_POR_DEFECTO, secuencia, negrasPorCompas, tempoValido, inicioComun, tramoDeCompas } from './afinacion.js';
import { crearReloj, notaEn, ligada, final, acompanamiento, volumen } from './reproduccion.js';
import * as micro from './canto.js';

const $ = id => document.getElementById(id);
const caja = $('reproductor'), play = $('play'), reiniciarBtn = $('reiniciar'), tempoIn = $('tempo');
const microBtn = $('micro'), margenSel = $('margen'), acomp = $('acomp'), acompList = $('acomplist');
const estado = $('estado-repro'), score = $('score');
const MICRO = 'neo-micro';            // si el micrófono estaba activado, guardado en este navegador
const ESPERA = 0.15;                  // segundos antes de la primera nota sin micrófono (que no se coma el arranque)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ahora = () => performance.now() / 1000;

let rep = null;        // la reproducción preparada (en marcha, en pausa o acabada) para la partitura, voz y estrofas actuales
let elegidas = [];     // voces de acompañamiento marcadas (índices de parte)
let titulo = null;
let conMicro = false;
try { conMicro = localStorage.getItem(MICRO) === '1'; } catch (e) {}

// La línea de estado queda fija arriba al desplazar, con su propio ⏸ / ▶ y ⏮: la partitura se desplaza sola mientras
// suena y los botones de la cabecera se quedan fuera de la vista.
const texto = $('estado-texto'), play2 = $('play2'), reiniciar2 = $('reiniciar2');
const decir = (html, error = false) => { texto.innerHTML = html; estado.className = error ? 'error' : ''; estado.hidden = !html; };
const firma = () => actual.data ? JSON.stringify([actual.data.title, actual.part, [...actual.shown].sort((a, b) => a - b)]) : '';

// ---- botones ----
function botones() {
  const st = rep ? rep.estado : 'parado', tramo = rep && rep.tramo && st !== 'fin';
  play.textContent = st === 'sonando' ? '⏸ Pausa' : st === 'pausa' ? '▶ Continuar' : '▶ Reproducir';
  play.classList.toggle('on', st === 'sonando');
  play.title = st === 'sonando' ? 'Parar la música donde va; luego pulsa Continuar para seguir desde ahí'
    : st === 'pausa' ? 'Seguir desde donde se ha parado'
    : 'Escuchar la partitura entera: tu voz, con las estrofas que se ven, al tempo y con el sonido elegidos' +
      (conMicro ? '. Con el micrófono, tras un compás de cuenta atrás, canta a la vez y verás si cada nota sale afinada' : '');
  if (tramo && st === 'pausa') play.title = `Seguir repitiendo el compás ${rep.tramo.compas} desde donde se ha parado`;
  reiniciarBtn.disabled = !rep || (rep.estado !== 'sonando' && rep.pos === 0 && !rep.empezada);
  reiniciarBtn.title = reiniciar2.title = tramo ? `Volver a empezar el compás ${rep.tramo.compas} (con su cuenta atrás)` : 'Volver al principio de la partitura';
  microBtn.classList.toggle('on', conMicro);
  microBtn.setAttribute('aria-pressed', conMicro);
  microBtn.title = conMicro
    ? 'Micrófono activado: mientras suena, la página te escucha y marca cada nota (✓ afinada, ▲ alta, ▼ baja). Tu voz suena suave; mejor con auriculares, para que el micrófono no oiga la música. Pulsa para solo escuchar'
    : 'Activar el micrófono para cantar a la vez que suena la música y ver si cada nota sale afinada, alta o baja';
  margenSel.hidden = !conMicro;
  play2.textContent = st === 'sonando' ? '⏸' : '▶';
  play2.title = play.title;
  reiniciar2.disabled = reiniciarBtn.disabled;
  $('mandos').hidden = !rep;
}

play.onclick = () => {
  if (rep && rep.firma !== firma()) descartar();
  if (rep && rep.estado === 'sonando') pausar();
  else arrancar();
};
reiniciarBtn.onclick = reiniciar2.onclick = () => reiniciar();
play2.onclick = () => play.click();
microBtn.onclick = () => {
  if (rep && rep.estado === 'sonando') pausar();
  conMicro = !conMicro;
  try { localStorage.setItem(MICRO, conMicro ? '1' : '0'); } catch (e) {}
  if (rep && !conMicro && rep.escucha) {   // se deja de escuchar: lo cantado se guarda y queda dibujado
    micro.guardar(rep.escucha, { tempo: rep.tempo, completa: false }); micro.cerrar(rep.escucha); rep.escucha = null;
  }
  if (rep) aplicarVolumenes();
  botones();
};
tempoIn.onchange = () => {
  const t = tempoValido(tempoIn.value); tempoIn.value = t;
  if (rep) { rep.reloj.cambiarTempo(ahora(), t); rep.tempo = t; }   // sigue desde el mismo sitio, a otra velocidad
};
document.addEventListener('sonido-elegido', () => { if (rep) aplicarVolumenes(); });

// ---- acompañamiento ----
function acompRender() {
  const { data, part } = actual;
  const otras = data.parts.map((p, i) => i).filter(i => i !== part);
  acomp.hidden = !otras.length;
  elegidas = acompanamiento(elegidas, part, data.parts.length);
  acompList.innerHTML = otras.map(i => `<label title="Hacer sonar también la voz ${esc(data.parts[i].name)}, más suave que la tuya, para oír la armonía">` +
    `<input type="checkbox" data-i="${i}" ${elegidas.includes(i) ? 'checked' : ''}> ${esc(data.parts[i].name)}</label>`).join('');
  acomp.querySelector('summary').textContent = elegidas.length
    ? 'Acompañamiento: ' + elegidas.map(i => data.parts[i].name).join(', ') : 'Acompañamiento';
}
acompList.onchange = e => {
  const i = +e.target.dataset.i;
  elegidas = e.target.checked ? [...elegidas, i] : elegidas.filter(x => x !== i);
  try { localStorage.setItem('neo-acomp:' + actual.data.title, JSON.stringify(elegidas)); } catch (err) {}
  acompRender();
  if (rep) aplicarVolumenes();   // las voces se suman o se quitan sobre la marcha
};
document.addEventListener('click', e => { if (!acomp.contains(e.target)) acomp.open = false; });

// Cada vez que se dibuja la partitura: los controles se ven si hay notas; con otra partitura, su tempo y su acompañamiento;
// con otra voz u otras estrofas se para y se borra lo cantado; si es la misma (zoom, giro del móvil), se repinta.
score.addEventListener('dibujada', () => {
  caja.hidden = !score.querySelector('.toque');
  if (!actual.data) return;
  if (actual.data.title !== titulo) {
    titulo = actual.data.title;
    const t = actual.data.tempo;
    tempoIn.value = tempoValido(t || TEMPO_POR_DEFECTO);
    tempoIn.title = (t ? `Tempo de la partitura: ${t} negras por minuto.` : `La partitura no trae tempo: se propone ${TEMPO_POR_DEFECTO}.`) +
      ' Baja el número para ir más despacio o súbelo para ir más rápido; se puede cambiar mientras suena.';
    try { elegidas = JSON.parse(localStorage.getItem('neo-acomp:' + titulo)) || []; } catch (e) { elegidas = []; }
  }
  acompRender();
  if (rep && rep.firma !== firma()) { descartar(); decir(''); }
  micro.repintar();
  if (rep && rep.dentro) iluminar(rep.k, false);
  botones();
});

// ---- reproducción ----
/** Las voces que suenan ahora: la tuya y las de acompañamiento, con el reloj común. */
function voces() {
  const { data, part, shown, secs } = actual;
  const partes = [part, ...acompanamiento(elegidas, part, data.parts.length)];
  const cero = inicioComun(data, data.parts.map((p, i) => i), shown, secs);   // todas: el cero no cambia al sumar voces
  return partes.map(p => ({ part: p, principal: p === part, notas: secuencia(data, p, shown, secs, cero), k: 0, sonando: null, ins: null }));
}

function preparar() {
  const { data, part, shown, secs } = actual;
  const vs = voces();
  if (!vs[0].notas.length) { decir('No hay notas que tocar: elige otra voz o más estrofas arriba.', true); return null; }
  const tempo = tempoValido(tempoIn.value); tempoIn.value = tempo;
  return {
    firma: firma(), data, part, voces: vs, tempo, reloj: crearReloj(tempo), fin: final(vs.map(v => v.notas)),
    cuenta: negrasPorCompas(data, part), estado: 'parado', pos: 0, empezada: false, k: 0, dentro: false, escucha: null, linea: null,
    secsVisibles: shown, secs,
  };
}

/** Ajusta qué voces suenan y con qué sonido y volumen (al empezar, al cambiar el acompañamiento, el sonido o el micrófono). */
async function aplicarVolumenes() {
  const r = rep;
  const vivas = voces();
  // conserva por dónde iba cada voz que sigue sonando; las que se quitan se callan
  for (const v of r.voces) if (!vivas.some(w => w.part === v.part)) callar(v);
  r.voces = vivas.map(w => r.voces.find(v => v.part === w.part) || w);
  r.fin = r.tramo ? r.tramo.hasta : final(r.voces.map(v => v.notas));
  const id = sonidoElegido();
  await Promise.all(r.voces.map(async v => {
    const ins = await instrumento(id, volumen(v.principal, conMicro || !!r.tramo), 'p' + v.part);
    if (v.ins !== ins) { callar(v); v.ins = ins; }
  }));
}

function callar(v) {
  if (v.sonando != null && v.ins) v.ins.soltar(v.notas[v.sonando].midi);
  v.sonando = null;
}

async function arrancar() {
  if (!actual.data) return;
  if (!rep || rep.estado === 'fin') {
    if (rep) descartar();
    rep = preparar();
    if (!rep) return;
  }
  const r = rep;
  play.disabled = true;
  try {
    const T = await cargarTone(); await T.start();
    if (r.estado === 'parado' || r.estado === 'pausa') decir('Preparando el sonido…');
    await aplicarVolumenes();
    if ((conMicro || r.tramo) && !r.escucha) {
      decir('Preparando el micrófono… Si el navegador pregunta, pulsa <b>Permitir</b>.');
      const main = r.voces.find(v => v.principal);
      r.escucha = await micro.abrir({
        data: r.data, part: r.part, notas: main.notas, estrofas: [...r.secsVisibles].sort((a, b) => a - b),
        previa: r.tramo ? r.tramo.previa : null, repetir: r.tramo ? r.tramo.ns : null,
      });
    }
    if (rep !== r) return;
    // con el micrófono, un compás de cuenta atrás (el primer golpe más agudo); sin él, empieza ya
    const t = ahora(), spn = r.reloj.segundosPorNegra;
    if (r.escucha) {
      const tic = r.tic || (r.tic = new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 } }).toDestination());
      tic.volume.value = -10;
      const t0 = T.now() + 0.3;
      for (let k = 0; k < r.cuenta; k++) tic.triggerAttackRelease(k ? 'C6' : 'G6', 0.05, t0 + k * spn);
      r.reloj.arrancar(t + 0.3 + r.cuenta * spn, r.pos);
    } else {
      r.reloj.arrancar(t + ESPERA, r.pos);
    }
    r.estado = 'sonando'; r.empezada = true;
    seguir(r);
  } catch (e) {
    decir(e.message || String(e), true);
  } finally {
    play.disabled = false;
    botones();
  }
}

function pausar() {
  const r = rep;
  if (!r || r.estado !== 'sonando') return;
  clearTimeout(r.reloj_t);
  r.reloj.parar(ahora());
  r.pos = Math.max(0, r.reloj.pos(ahora()));
  r.voces.forEach(callar);
  r.estado = 'pausa';
  decir('En pausa' + (r.escucha ? ' · ' + micro.resumen(r.escucha) : '') + '. Pulsa <b>▶ Continuar</b> para seguir desde aquí o <b>⏮</b> para volver al principio.');
  botones();
}

/** Vuelve al principio. Si estaba sonando, sigue sonando desde el principio; si no, se queda listo para empezar. */
function reiniciar() {
  const r = rep;
  if (!r) return;
  if (r.tramo && r.estado !== 'fin') return repetir(r.tramo.n);   // repitiendo un compás: vuelve a empezar el compás
  const sonaba = r.estado === 'sonando';
  if (sonaba) pausar();
  if (r.escucha) { micro.guardar(r.escucha, { tempo: r.tempo, completa: false }); micro.cerrar(r.escucha); r.escucha = null; }
  micro.quitarMarcas(true);
  quitarLuz();
  r.pos = 0; r.k = 0; r.dentro = false; r.linea = null; r.empezada = false;
  r.reloj.ir(ahora(), 0);
  r.voces.forEach(v => { v.k = 0; });
  r.estado = 'parado';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  decir('');
  botones();
  if (sonaba) arrancar();
}

/** Deja la reproducción (otra partitura, voz o estrofas): calla, cierra el micrófono y borra lo cantado. */
function descartar() {
  const r = rep;
  if (!r) return;
  clearTimeout(r.reloj_t);
  r.voces.forEach(callar);
  if (r.escucha) { if (r.estado !== 'fin') micro.guardar(r.escucha, { tempo: r.tempo, completa: false }); micro.cerrar(r.escucha); }
  if (r.tic) r.tic.dispose();
  micro.quitarMarcas(true);
  quitarLuz();
  rep = null;
  botones();
}

// Avanza unas 50 veces por segundo con un reloj (no con el ritmo de pintado de la pantalla, que el navegador para si
// la página no se está mostrando).
const seguir = r => { r.reloj_t = setTimeout(() => paso(r), 20); };

function paso(r) {
  if (rep !== r || r.estado !== 'sonando') return;
  const t = ahora(), faltan = r.reloj.faltan(t), pos = r.reloj.pos(t), spn = r.reloj.segundosPorNegra;
  if (faltan > 0) {
    decir(`Prepárate… <b>${Math.ceil(faltan)}</b> <small>(con auriculares, para que el micrófono no oiga la música)</small>`);
    return seguir(r);
  }
  r.pos = pos;
  // cada voz: qué nota toca y, si cambia, suelta la anterior y ataca la nueva (salvo si va ligada a la misma altura)
  for (const v of r.voces) {
    const { k, dentro } = notaEn(v.notas, pos, v.k);
    // cada nota se suelta un instante antes de acabar (60 ms), para que dos notas seguidas iguales se oigan separadas
    const x = v.notas[k], corte = x ? Math.min(0.06 / spn, x.d * 0.15) : 0;
    const toca = dentro && (pos < x.inicio + x.d - corte || ligada(v.notas, k + 1)) ? k : null;
    if (toca !== v.sonando) {
      if (toca != null && v.sonando != null && toca === v.sonando + 1 && ligada(v.notas, toca)) v.sonando = toca;
      else { callar(v); if (toca != null && v.ins) { v.ins.empezar(v.notas[toca].midi); v.sonando = toca; } }
    }
    v.k = k;
  }
  // la voz principal: ilumina su sílaba, escucha y dice por dónde va
  const main = r.voces.find(v => v.principal), notas = main.notas;
  const { k, dentro } = notaEn(notas, pos, r.k);
  if (r.escucha) for (let j = r.k; j < k; j++) micro.cerrarNota(r.escucha, j);   // la que acaba (y las saltadas)
  if (k !== r.k || dentro !== r.dentro) { r.k = k; r.dentro = dentro; dentro ? iluminar(k, true) : quitarLuz(); }
  const nota = notas[k];
  const oida = r.escucha ? micro.escuchar(r.escucha, nota, dentro, dentro ? (pos - nota.inicio) / nota.d : 0, spn) : null;
  if (dentro) {
    decir((r.escucha ? 'Canta: ' : 'Suena: ') + `<b>${esc(nota.t || '(sigue la nota)')}</b> · compás ${nota.compas}` +
      (r.escucha ? (oida != null ? ` · oigo ${micro.nombre(oida)}` : ' · no te oigo') : ''));
  } else if (k < notas.length) {
    decir(r.escucha ? 'Silencio… respira' : 'Silencio…');
  }
  if (pos >= r.fin) return acabar(r);
  seguir(r);
}

function acabar(r) {
  r.voces.forEach(callar);
  r.estado = 'fin';
  quitarLuz();
  if (r.tramo) {
    const s = r.escucha;
    if (s) { micro.guardar(s, { tempo: r.tempo, completa: true }); micro.cerrar(s); r.escucha = null; }
    const nota = r.voces.find(v => v.principal).notas[r.tramo.n];
    decir(`Compás ${r.tramo.compas} repetido: «${esc(nota.t || '…')}» ${micro.comoSalio(s, r.tramo.n)}. ` +
      'Pulsa otra vez <b>🔁</b> en el repaso para repetirlo, o <b>▶ Reproducir</b> para cantar la canción entera.');
  } else if (r.escucha) {
    const res = micro.guardar(r.escucha, { tempo: r.tempo, completa: true });
    micro.cerrar(r.escucha); r.escucha = null;
    decir('¡Fin! ' + res + '. Debajo tienes el repaso de lo desafinado; pasa el dedo o el ratón por una sílaba para ver cuánto te has desviado o pulsa <b>▶ Reproducir</b> para repetir.');
  } else {
    decir('¡Fin! Pulsa <b>▶ Reproducir</b> para escucharla otra vez.');
  }
  botones();
}

// ---- repetir un compás (entonacion/revision) ----
/**
 * Repite el compás de la nota n de tu voz para practicarla: cuenta atrás, suena ese compás (tu voz suave y el
 * acompañamiento elegido) y el micrófono vuelve a escuchar sus notas; lo demás de lo cantado se conserva.
 */
export async function repetir(n) {
  if (!actual.data) return;
  if (rep && rep.estado === 'sonando') pausar();
  if (rep) {   // deja lo que hubiera (sin borrar lo cantado, que se conserva fuera del compás)
    clearTimeout(rep.reloj_t);
    rep.voces.forEach(callar);
    if (rep.escucha) { micro.guardar(rep.escucha, { tempo: rep.tempo, completa: false }); micro.cerrar(rep.escucha); }
    if (rep.tic) rep.tic.dispose();
    quitarLuz();
    rep = null;
  }
  const r = preparar();
  if (!r) return;
  const main = r.voces.find(v => v.principal);
  const t = main.notas[n] && tramoDeCompas(main.notas, main.notas[n].compas);
  if (!t) { decir('Esa sílaba ya no está en la partitura que se ve: vuelve a cantar la canción con ▶ Reproducir.', true); return; }
  r.tramo = { ...t, n, previa: micro.actuales() };
  r.pos = t.desde; r.fin = t.hasta;
  r.k = notaEn(main.notas, t.desde).k;
  rep = r;
  await arrancar();
}

// ---- la sílaba que suena ----
const bloque = n => score.querySelector(`.toque[data-n="${n}"]`);
function quitarLuz() { score.querySelectorAll('.toque.toca').forEach(x => x.classList.remove('toca')); }
function iluminar(n, desplazar) {
  quitarLuz();
  const b = bloque(n);
  if (!b) return;
  b.classList.add('toca');
  const svg = b.ownerSVGElement;
  if (desplazar && svg !== rep.linea) { rep.linea = svg; svg.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  else if (!desplazar) rep.linea = svg;
}

botones();
