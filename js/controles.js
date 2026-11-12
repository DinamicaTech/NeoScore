// Controles de la cabecera: vista (neo-score o pentagrama), voz, estrofas y tamaño. Cada cambio vuelve a dibujar la partitura.
import { estrofas } from './estrofas.js';
import { dibujar } from './dibujo.js';
import { dibujarPentagrama, colorVoz } from './pentagrama.js';
import { acompanamiento } from './reproduccion.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let quitarAnterior = () => {};
/** Lo que se ve ahora: { data, part, shown, secs, vista, acomp }. Lo leen el reproductor, el canto y el repaso.
 *  acomp: las otras voces elegidas; suenan como acompañamiento y, en la vista de pentagrama, también se ven. */
export const actual = {};
const VISTA = 'neo-vista';   // la última vista elegida (neo-score o pentagrama), guardada en este navegador
let vista = 'neo';
try { if (localStorage.getItem(VISTA) === 'pentagrama') vista = 'pentagrama'; } catch (e) {}
const JUNTOS = 'neo-juntos';  // en el pentagrama, si las voces van juntas en uno (guardado en este navegador)
let juntos = false;
try { juntos = localStorage.getItem(JUNTOS) === '1'; } catch (e) {}
let cambiarAcomp = () => {};
/** Cambia las otras voces elegidas (acompañamiento) y, en la vista de pentagrama, las que se ven. */
export function elegirAcomp(lista) { cambiarAcomp(lista); }

/** Muestra una partitura con sus controles. shownInicial: estrofas visibles al abrir (índices desde 0), o null para todas.
 *  texto: el MusicXML original, que necesita la vista de pentagrama. */
export function mostrarPartitura(data, shownInicial = null, texto = null) {
  quitarAnterior();
  const score = $('score'), legend = $('legend'), zoom = $('zoom'), vbox = $('voices');
  const secs = estrofas(data), SECTIONS = secs.lista;
  let part = Math.max(0, data.parts.findIndex(p => /alt/i.test(p.name)));   // por defecto la voz "alt..."
  const STORE = 'neo-secs:' + data.title;
  // por defecto: las indicadas (?estrofas=) o todas; luego manda lo último elegido en este navegador
  let shown = new Set((shownInicial || SECTIONS.map((_, k) => k)).filter(k => k >= 0 && k < SECTIONS.length));
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (Array.isArray(s) && s.length) shown = new Set(s.filter(k => k < SECTIONS.length)); } catch (e) {}

  const ACOMP = 'neo-acomp:' + data.title;
  let acomp = [];
  try { acomp = JSON.parse(localStorage.getItem(ACOMP)) || []; } catch (e) {}
  acomp = acompanamiento(acomp, part, data.parts.length);
  const conPentagrama = !!texto;
  if (!conPentagrama) vista = 'neo';

  const redibujar = () => {
    acomp = acompanamiento(acomp, part, data.parts.length);
    Object.assign(actual, { data, part, shown, secs, vista, acomp });
    score.classList.toggle('vista-pentagrama', vista === 'pentagrama');
    if (vista === 'pentagrama') dibujarPentagrama({ data, texto, part, visibles: acomp, zoom: +zoom.value, shown, secs, score, legend, juntos });
    else dibujar({ data, part, zoom: +zoom.value, shown, secs, score, legend });
  };
  cambiarAcomp = lista => {
    acomp = acompanamiento(lista, part, data.parts.length);
    try { localStorage.setItem(ACOMP, JSON.stringify(acomp)); } catch (e) {}
    mark();
    if (vista === 'pentagrama') redibujar();
    else { actual.acomp = acomp; document.dispatchEvent(new CustomEvent('acomp-cambiado')); }
  };

  document.title = data.title + ' · neo-partitura';
  $('tamano').hidden = false;
  $('titulo').textContent = data.title;
  // Vista: Neo-score / Pentagrama
  const vistaBox = $('vista');
  vistaBox.hidden = !conPentagrama;
  vistaBox.innerHTML = 'Vista <button data-v="neo" title="Ver la neo-partitura: la letra con la cuadrícula de colores de la melodía de tu voz">Neo-score</button>' +
    '<button data-v="pentagrama" title="Ver la partitura en pentagrama clásico, con varias voces a la vez, cada una de su color">Pentagrama</button>';
  vistaBox.onclick = e => {
    const v = e.target.dataset.v;
    if (!v || v === vista) return;
    vista = v;
    try { localStorage.setItem(VISTA, vista); } catch (err) {}
    mark(); redibujar();
  };
  // Voz: en la neo-score, un botón por voz para elegir la tuya. En el pentagrama, además, cada botón de otra voz
  // la muestra u oculta (y suena o no al reproducir), y el desplegable "Tu voz" elige la que cantas.
  vbox.onclick = e => {
    const i = e.target.dataset.i;
    if (e.target.dataset.j !== undefined) {
      juntos = e.target.dataset.j === '1';
      try { localStorage.setItem(JUNTOS, juntos ? '1' : '0'); } catch (err) {}
      mark(); redibujar(); return;
    }
    if (i === undefined) return;
    if (vista === 'pentagrama' && +i !== part) { cambiarAcomp(acomp.includes(+i) ? acomp.filter(x => x !== +i) : [...acomp, +i]); return; }
    part = +i; mark(); redibujar();
  };
  vbox.onchange = e => { if (e.target.id === 'tuvoz') { part = +e.target.value; mark(); redibujar(); } };
  const mark = () => {
    const pent = vista === 'pentagrama';
    vistaBox.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === vista));
    vbox.innerHTML = (pent ? 'Voces ' : 'Voz ') + data.parts.map((p, i) => {
      const mia = i === part, vista_ = mia || acomp.includes(i);
      const titulo = !pent ? `Ver la melodía de la voz ${esc(p.name)}`
        : mia ? `${esc(p.name)} es tu voz: se ve siempre, con su letra. Para cantar otra, elígela en "Tu voz"`
        : vista_ ? `Ocultar la voz ${esc(p.name)} (deja también de sonar al reproducir)` : `Ver también la voz ${esc(p.name)} (y oírla, más suave, al reproducir)`;
      const estilo = pent ? ` style="--vz:${colorVoz(i)}"` : '';
      return `<button data-i="${i}" class="${pent ? 'vz' : ''}${(pent ? vista_ : mia) ? ' on' : ''}"${estilo} title="${titulo}"${pent ? ` aria-pressed="${vista_}"` : ''}>${esc(p.name)}</button>`;
    }).join('') + (pent && data.parts.length > 1
      ? ` <label title="La voz que cantas: la que lleva la letra, la que se compara con el micrófono y la que suena más fuerte">Tu voz <select id="tuvoz">${data.parts.map((p, i) => `<option value="${i}"${i === part ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>` : '') +
      (pent && acomp.length
        ? ` <span class="juntos">Pentagramas <button data-j="0" class="${juntos ? '' : 'on'}" title="Cada voz en su propio pentagrama">Separados</button>` +
          `<button data-j="1" class="${juntos ? 'on' : ''}" title="Todas las voces que se ven en un solo pentagrama, cada una de su color; si alguna necesitaría más de tres rayitas por arriba o por abajo, en dos pentagramas unidos (agudo y grave)">Juntos</button></span>` : '');
  };
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
