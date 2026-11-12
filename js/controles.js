// Controles de la cabecera: voz, estrofas y tamaño. Cada cambio vuelve a dibujar la partitura.
import { estrofas } from './estrofas.js';
import { dibujar } from './dibujo.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let quitarAnterior = () => {};
/** Lo que se ve ahora: { data, part, shown, secs }. Lo lee el modo de canto (js/canto.js). */
export const actual = {};

/** Muestra una partitura con sus controles. shownInicial: estrofas visibles al abrir (índices desde 0), o null para todas. */
export function mostrarPartitura(data, shownInicial = null) {
  quitarAnterior();
  const score = $('score'), legend = $('legend'), zoom = $('zoom'), vbox = $('voices');
  const secs = estrofas(data), SECTIONS = secs.lista;
  let part = Math.max(0, data.parts.findIndex(p => /alt/i.test(p.name)));   // por defecto la voz "alt..."
  const STORE = 'neo-secs:' + data.title;
  // por defecto: las indicadas (?estrofas=) o todas; luego manda lo último elegido en este navegador
  let shown = new Set((shownInicial || SECTIONS.map((_, k) => k)).filter(k => k >= 0 && k < SECTIONS.length));
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (Array.isArray(s) && s.length) shown = new Set(s.filter(k => k < SECTIONS.length)); } catch (e) {}

  const redibujar = () => { Object.assign(actual, { data, part, shown, secs }); dibujar({ data, part, zoom: +zoom.value, shown, secs, score, legend }); };

  document.title = data.title + ' · neo-partitura';
  $('tamano').hidden = false;
  $('titulo').textContent = data.title;
  vbox.innerHTML = 'Voz ' + data.parts.map((p, i) => `<button data-i="${i}" title="Ver la melodía de la voz ${esc(p.name)}">${esc(p.name)}</button>`).join('');
  const mark = () => vbox.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.i === part));
  vbox.onclick = e => { if (e.target.dataset.i) { part = +e.target.dataset.i; mark(); redibujar(); } };
  zoom.oninput = redibujar;

  // desplegable de estrofas (solo si la canción tiene más de una)
  const box = $('secs'), seclist = $('seclist');
  function secSummary() {
    const n = shown.size;
    box.querySelector('summary').textContent = n === SECTIONS.length ? 'Todas las estrofas'
      : n === 0 ? 'Ninguna estrofa' : 'Estrofas: ' + [...shown].sort((a, b) => a - b).map(k => SECTIONS[k].name.replace(/^Estrofa\s*/i, '')).join(', ');
  }
  function secRender() {
    seclist.innerHTML = `<label class="all"><input type="checkbox" data-all ${shown.size === SECTIONS.length ? 'checked' : ''}> Todas</label>` +
      SECTIONS.map((s, k) => `<label><input type="checkbox" data-k="${k}" ${shown.has(k) ? 'checked' : ''}> ${esc(s.name)} <small style="color:var(--muted)">(c. ${s.from})</small></label>`).join('');
    secSummary();
  }
  seclist.onchange = e => {
    if (e.target.dataset.all !== undefined) shown = new Set(e.target.checked ? SECTIONS.map((_, k) => k) : []);
    else e.target.checked ? shown.add(+e.target.dataset.k) : shown.delete(+e.target.dataset.k);
    try { localStorage.setItem(STORE, JSON.stringify([...shown])); } catch (err) {}
    secRender(); redibujar();
  };
  const cerrarSecs = e => { if (!box.contains(e.target)) box.open = false; };
  document.addEventListener('click', cerrarSecs);
  addEventListener('resize', redibujar);
  box.hidden = SECTIONS.length <= 1;
  if (!box.hidden) secRender();
  quitarAnterior = () => { document.removeEventListener('click', cerrarSecs); removeEventListener('resize', redibujar); };

  mark(); redibujar();
}
