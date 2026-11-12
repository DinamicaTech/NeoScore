// Revisión al acabar (entonacion/revision): al terminar la canción con el micrófono, un panel de repaso con las sílabas
// que han salido altas o bajas y cuánto. Al tocar una, la partitura va hasta ella y suena su nota de referencia;
// 🔁 repite su compás con cuenta atrás y el micrófono la vuelve a escuchar (repetir() de js/reproductor.js).
// El botón "📋 Repaso" de la cabecera muestra el último intento guardado aunque se haya recargado la página, y el panel
// dice cómo van los últimos intentos completos (historial en el navegador). Los cálculos están en js/afinacion.js.

import { actual } from './controles.js';
import { instrumento, sonidoElegido, cargarTone, DURACION } from './sonido.js';
import {
  MARGENES, secuencia, claveResultado, claveHistorial, textoHistorial, fueraDeMargen, desvioEnPalabras, coincide, cuentas, comparar,
} from './afinacion.js';
import { repetir } from './reproductor.js';
import * as micro from './canto.js';

const $ = id => document.getElementById(id);
const panel = $('repaso'), boton = $('repaso-btn'), margenSel = $('margen'), score = $('score');
const SIGNO = { alta: '▲', baja: '▼' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const leer = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

const voz = () => actual.data && actual.data.parts[actual.part].name;
const guardado = () => actual.data ? leer(claveResultado(actual.data.title, voz())) : null;
const notasActuales = () => secuencia(actual.data, actual.part, actual.shown, actual.secs);
const margenCents = () => (MARGENES.find(m => m.id === margenSel.value) || MARGENES[0]).cents;
let firmaPanel = '';   // partitura y voz del panel abierto: con otra, se cierra
const firma = () => actual.data ? actual.data.title + '\n' + voz() : '';

boton.onclick = () => (panel.hidden ? abrir(true) : cerrar());
margenSel.addEventListener('change', () => { if (!panel.hidden) pintar(); });

// Cada vez que se dibuja la partitura: el botón se ve si hay un intento guardado de esta partitura y voz.
score.addEventListener('dibujada', () => {
  boton.hidden = !guardado();
  if (!panel.hidden && firmaPanel !== firma()) cerrar();
  else if (!panel.hidden) pintar();
});

boton.hidden = !guardado();   // por si la partitura se ha dibujado antes de cargar este módulo

// Al acabar la canción (o un compás repetido) con el micrófono: se abre o se actualiza el repaso.
document.addEventListener('canto-guardado', e => {
  boton.hidden = !guardado();
  if (e.detail.repaso || !panel.hidden) abrir(false);
});

/** Abre el panel con el último intento. cargarMarcas: si lo cantado no está ya en la partitura, se dibuja (tras recargar). */
function abrir(cargarMarcas) {
  const res = guardado();
  if (!res) return cerrar();
  const m = micro.actuales();
  const yaSeVe = m && m.data === actual.data && m.part === actual.part && (m.abierta || Object.keys(m.cantadas).length);
  if (cargarMarcas && !yaSeVe && coincide(res, notasActuales())) {
    micro.cargar({ ...actual, notas: notasActuales(), estrofas: [...actual.shown] }, res);
  }
  firmaPanel = firma();
  panel.hidden = false;
  boton.classList.add('on');
  pintar();
}

function cerrar() {
  panel.hidden = true;
  boton.classList.remove('on');
}

function pintar() {
  const res = guardado();
  if (!res) return cerrar();
  const cents = margenCents();
  const filas = fueraDeMargen(res, cents);
  const vale = coincide(res, notasActuales());
  const c = cuentas(res.notas.map(x => x.cantada == null ? x : { ...x, ...comparar(x.esperada, x.cantada, cents) }));
  const hist = textoHistorial(leer(claveHistorial(res.titulo, res.voz)) || []);
  const fecha = new Date(res.fecha);
  const cuando = isNaN(fecha) ? '' : fecha.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  let html = `<div class="cab"><b>📋 Repaso</b><span class="quien">${esc(res.voz)}${cuando ? ' · ' + cuando : ''}</span>` +
    `<button class="cerrar" title="Cerrar el repaso (vuelve a abrirlo con 📋 Repaso, arriba)">✕</button></div>` +
    `<p class="cuentas"><span class="c-afinada">✓ ${c.afinada} afinadas</span> · <span class="c-alta">▲ ${c.alta} altas</span> · ` +
    `<span class="c-baja">▼ ${c.baja} bajas</span> <small>(de ${res.notas.length} notas${res.completa ? '' : '; este intento no llegó al final'})</small></p>` +
    (hist ? `<p class="hist" title="Las notas afinadas en cada uno de tus últimos intentos completos, del más antiguo al más reciente">📈 ${esc(hist)}</p>` : '');
  if (!vale) {
    html += `<p class="aviso">Este repaso es de ${nombresEstrofas(res)}, no de las que se ven ahora. Para tocar sus sílabas y repetirlas, ` +
      'elige arriba esas mismas estrofas (y la misma voz), o canta otra vez con <b>▶ Reproducir</b>.</p>';
  }
  if (!filas.length) {
    html += `<p>${c.afinada ? '🎉 ¡Todo lo que se te ha oído ha salido afinado!' : 'No se te ha oído en ninguna nota: comprueba el micrófono y canta otra vez.'}</p>`;
  } else {
    html += '<p class="ayuda">Toca una sílaba para oír su nota y verla en la partitura; <b>🔁</b> repite su compás con cuenta atrás y te vuelve a escuchar (mejor con auriculares).</p><ul>' +
      filas.map(x => {
        const sil = x.silaba ? `«${esc(x.silaba)}»` : '<i>(nota ligada)</i>';
        return `<li><button class="ir c-${x.estado}" data-n="${x.n}" data-m="${x.esperada}" ${vale ? '' : 'disabled'} ` +
          `title="Oír la nota que tocaba en ${x.silaba ? esc(x.silaba) : 'esta nota'} y verla en la partitura">` +
          `<span class="sil">${sil}</span> <small>c. ${x.compas}</small> <span>${SIGNO[x.estado]} ${desvioEnPalabras(x.cents)}</span></button>` +
          `<button class="rep" data-n="${x.n}" ${vale ? '' : 'disabled'} title="Repetir el compás ${x.compas}: cuenta atrás, suena y canta; se vuelve a marcar si sale afinada">🔁</button></li>`;
      }).join('') + '</ul>';
  }
  panel.innerHTML = html;
}

panel.addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.classList.contains('cerrar')) return cerrar();
  const n = +b.dataset.n;
  if (b.classList.contains('rep')) { repetir(n); return; }
  if (b.classList.contains('ir')) {
    ir(n);
    try {
      const T = await cargarTone(); await T.start();
      const ins = await instrumento(sonidoElegido());
      const m = +b.dataset.m;
      ins.empezar(m);
      setTimeout(() => ins.soltar(m), DURACION * 1000);
    } catch (err) {
      $('aviso').className = 'error';
      $('aviso').textContent = `No suena la nota: ${err.message}. Comprueba la conexión y vuelve a tocarla; si sigue igual, recarga la página.`;
    }
  }
});

/** Lleva la partitura hasta la nota n y la resalta un momento. */
function ir(n) {
  const r = score.querySelector(`.toque[data-n="${n}"]`);
  if (!r) return;
  r.ownerSVGElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
  r.classList.add('sonando');
  setTimeout(() => r.classList.remove('sonando'), DURACION * 1000);
}

function nombresEstrofas(res) {
  const lista = actual.secs && actual.secs.lista;
  if (!Array.isArray(res.estrofas) || !lista) return 'otras estrofas';
  const nombres = res.estrofas.map(k => lista[k] && lista[k].name).filter(Boolean);
  return nombres.length ? 'las estrofas ' + nombres.join(', ') : 'otras estrofas';
}
