// Controles de la cabecera: vista (neo-score, pentagrama o letra), voz, estrofas y tamaño. Cada cambio vuelve a dibujar la partitura.
import { estrofas } from './estrofas.js';
import { dibujar } from './dibujo.js';
import { dibujarPentagrama, colorVoz } from './pentagrama.js';
import { acompanamiento } from './reproduccion.js';
import { letraDeVoz, dibujarLetra } from './letra.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let quitarAnterior = () => {};
/** Lo que se ve ahora: { data, part, shown, secs, vista, acomp }. Lo leen el reproductor, el canto y el repaso.
 *  acomp: las otras voces elegidas; suenan como acompañamiento y, en la vista de pentagrama, también se ven.
 *  Con un fichero de letra (.txt) está vacío: no hay notas que tocar, reproducir ni cantar. */
export const actual = {};
const VISTA = 'neo-vista';   // la última vista elegida (neo-score, pentagrama o letra), guardada en este navegador
let vista = 'neo';
try { const v = localStorage.getItem(VISTA); if (v === 'pentagrama' || v === 'letra') vista = v; } catch (e) {}
const JUNTOS = 'neo-juntos';  // en el pentagrama, si las voces van juntas en uno (guardado en este navegador)
let juntos = false;
try { juntos = localStorage.getItem(JUNTOS) === '1'; } catch (e) {}
let cambiarAcomp = () => {};
/** Cambia las otras voces elegidas (acompañamiento) y, en la vista de pentagrama, las que se ven. */
export function elegirAcomp(lista) { cambiarAcomp(lista); }
/** Elige la vista con la que se abrirá la próxima partitura (y la recuerda), por ejemplo Letra al unir un .txt. */
export function ponerVista(v) { vista = v; try { localStorage.setItem(VISTA, v); } catch (e) {} }

/** Pone la clase de la vista en la partitura; el pentagrama se ve siempre en claro. */
function marcarVista(v) {
  $('score').classList.toggle('vista-pentagrama', v === 'pentagrama');
  $('score').classList.toggle('vista-letra', v === 'letra');
  document.documentElement.classList.toggle('claro-forzado', v === 'pentagrama');
}

/** Desplegable de estrofas (solo si hay más de una). lista: [{name, from?}]; shown: Set que se cambia aquí mismo;
 *  store: clave del navegador donde se recuerda la elección. Devuelve la función que lo desmonta. */
function selectorEstrofas(lista, shown, store, alCambiar) {
  const box = $('secs'), seclist = $('seclist');
  function resumen() {
    const n = shown.size;
    box.querySelector('summary').textContent = n === lista.length ? 'Todas las estrofas'
      : n === 0 ? 'Ninguna estrofa' : 'Estrofas: ' + [...shown].sort((a, b) => a - b).map(k => lista[k].name.replace(/^Estrofa\s*/i, '')).join(', ');
  }
  function pintar() {
    seclist.innerHTML = `<label class="all"><input type="checkbox" data-all ${shown.size === lista.length ? 'checked' : ''}> Todas</label>` +
      lista.map((s, k) => `<label><input type="checkbox" data-k="${k}" ${shown.has(k) ? 'checked' : ''}> ${esc(s.name)}${s.from ? ` <small style="color:var(--muted)">(c. ${s.from})</small>` : ''}</label>`).join('');
    resumen();
  }
  seclist.onchange = e => {
    if (e.target.dataset.all !== undefined) { shown.clear(); if (e.target.checked) lista.forEach((_, k) => shown.add(k)); }
    else e.target.checked ? shown.add(+e.target.dataset.k) : shown.delete(+e.target.dataset.k);
    try { localStorage.setItem(store, JSON.stringify([...shown])); } catch (err) {}
    pintar(); alCambiar();
  };
  const cerrar = e => { if (!box.contains(e.target)) box.open = false; };
  document.addEventListener('click', cerrar);
  box.hidden = lista.length <= 1;
  if (lista.length > 1) pintar();
  return () => document.removeEventListener('click', cerrar);
}

/** Estrofas visibles al abrir: las indicadas (o todas) y, si hay, lo último elegido en este navegador. */
function estrofasIniciales(n, inicial, store) {
  let shown = new Set((inicial || [...Array(n).keys()]).filter(k => k >= 0 && k < n));
  try { const s = JSON.parse(localStorage.getItem(store)); if (Array.isArray(s) && s.length) shown = new Set(s.filter(k => k < n)); } catch (e) {}
  return shown;
}

/** Muestra una partitura con sus controles. shownInicial: estrofas visibles al abrir (índices desde 0), o null para todas.
 *  texto: el MusicXML original, que necesita la vista de pentagrama.
 *  letraTxt: la letra de un .txt unido a la partitura ({title, estrofas}, ver leerTxt), que usa la vista de letra
 *  en lugar de la de las voces: entonces la vista de letra no tiene botones de voz y, si el .txt no tiene tantas
 *  estrofas como la partitura, se ven todas las suyas sin desplegable de estrofas. */
export function mostrarPartitura(data, shownInicial = null, texto = null, letraTxt = null) {
  quitarAnterior();
  const score = $('score'), legend = $('legend'), zoom = $('zoom'), vbox = $('voices');
  const secs = estrofas(data), SECTIONS = secs.lista;
  let part = Math.max(0, data.parts.findIndex(p => /alt/i.test(p.name)));   // por defecto la voz "alt..."
  const shown = estrofasIniciales(SECTIONS.length, shownInicial, 'neo-secs:' + data.title);

  const ACOMP = 'neo-acomp:' + data.title;
  let acomp = [];
  try { acomp = JSON.parse(localStorage.getItem(ACOMP)) || []; } catch (e) {}
  acomp = acompanamiento(acomp, part, data.parts.length);
  const conPentagrama = !!texto;
  if (!conPentagrama && vista === 'pentagrama') vista = 'neo';
  const coinciden = !!letraTxt && letraTxt.estrofas.length === SECTIONS.length;   // la misma elección de estrofas vale para el .txt

  const redibujar = () => {
    acomp = acompanamiento(acomp, part, data.parts.length);
    Object.assign(actual, { data, part, shown, secs, vista, acomp });
    marcarVista(vista);
    const letraDelTxt = vista === 'letra' && letraTxt;
    $('secs').hidden = SECTIONS.length <= 1 || (letraDelTxt && !coinciden);
    if (letraDelTxt) dibujarLetra({ estrofas: coinciden ? letraTxt.estrofas.map((e, k) => ({ ...e, name: SECTIONS[k].name })).filter((_, k) => shown.has(k)) : letraTxt.estrofas, zoom: +zoom.value, score, legend });
    else if (vista === 'pentagrama') dibujarPentagrama({ data, texto, part, visibles: acomp, zoom: +zoom.value, shown, secs, score, legend, juntos });
    else if (vista === 'letra') dibujarLetra({ estrofas: letraDeVoz(data, part, shown, secs), zoom: +zoom.value, score, legend });
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
  // Vista: Neo-score / Pentagrama / Letra
  const vistaBox = $('vista');
  vistaBox.hidden = false;
  vistaBox.innerHTML = 'Vista <button data-v="neo" title="Ver la neo-partitura: la letra con la cuadrícula de colores de la melodía de tu voz">Neo-score</button>' +
    (conPentagrama ? '<button data-v="pentagrama" title="Ver la partitura en pentagrama clásico, con varias voces a la vez, cada una de su color">Pentagrama</button>' : '') +
    '<button data-v="letra" title="Leer solo la letra de tu voz, por estrofas y sin notas: aquí no se reproduce ni se canta">Letra</button>';
  vistaBox.onclick = e => {
    const v = e.target.dataset.v;
    if (!v || v === vista) return;
    vista = v;
    try { localStorage.setItem(VISTA, vista); } catch (err) {}
    mark(); redibujar();
  };
  // Voz: en la neo-score y en la letra, un botón por voz para elegir la tuya. En el pentagrama, además, cada botón de otra voz
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
    document.documentElement.classList.toggle('claro-forzado', pent);   // antes de pintar los botones con sus colores
    vistaBox.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === vista));
    vbox.hidden = vista === 'letra' && !!letraTxt;   // la letra del .txt es la misma para todas las voces
    vbox.innerHTML = (pent ? 'Voces ' : 'Voz ') + data.parts.map((p, i) => {
      const mia = i === part, vista_ = mia || acomp.includes(i);
      const titulo = vista === 'letra' ? `Leer la letra de la voz ${esc(p.name)}`
        : !pent ? `Ver la melodía de la voz ${esc(p.name)}`
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

  const quitarEstrofas = selectorEstrofas(SECTIONS, shown, 'neo-secs:' + data.title, redibujar);
  addEventListener('resize', redibujar);
  quitarAnterior = () => { quitarEstrofas(); removeEventListener('resize', redibujar); };

  mark(); redibujar();
}

/** Muestra un fichero de letra (.txt, ver leerTxt en js/letra.js): siempre en vista de letra, sin botón de vista,
 *  sin voces y sin nada que suene. letra: {title, estrofas:[{name, versos}]}. */
export function mostrarLetra(letra) {
  quitarAnterior();
  const score = $('score'), legend = $('legend'), zoom = $('zoom');
  for (const k of Object.keys(actual)) delete actual[k];
  cambiarAcomp = () => {};
  const lista = letra.estrofas, store = 'neo-secs:letra:' + letra.title;
  const shown = estrofasIniciales(lista.length, null, store);
  const redibujar = () => {
    marcarVista('letra');
    dibujarLetra({ estrofas: lista.filter((_, k) => shown.has(k)), zoom: +zoom.value, score, legend });
  };
  document.title = letra.title + ' · letra';
  $('titulo').textContent = letra.title;
  $('vista').hidden = true;
  $('voices').hidden = true;
  $('tamano').hidden = false;
  zoom.oninput = redibujar;
  quitarAnterior = selectorEstrofas(lista, shown, store, redibujar);
  redibujar();
}
