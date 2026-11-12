// Prepara el MusicXML que dibuja la vista de pentagrama (neo-partitura/vista-pentagrama): una copia de la partitura
// original con solo las voces que se ven, solo los compases de las estrofas elegidas y solo la letra de tu voz.
// Va en su propio fichero, sin nada del navegador, para que las pruebas con Node lo puedan comprobar.

import { leerXML } from './lector-musicxml.js';

// Lo que se arrastra de un compás a otro dentro de <attributes>: al saltarse estrofas, el primer compás que se ve
// tras el salto los recibe para que la clave, la armadura y el compás sigan siendo los de la partitura.
const ARRASTRADOS = ['divisions', 'key', 'time', 'staves', 'clef', 'transpose'];

/**
 * texto: el MusicXML original. Opciones:
 *  partes: índices (como data.parts) de las voces que se ven, en el orden de la partitura;
 *  mia: índice de tu voz (la única con letra);
 *  compases: función i → true si el compás i (desde 0) se ve (las estrofas elegidas);
 *  colores: { índice de voz: '#rrggbb' } para pintar sus notas (cabeza y plica), o nada para dejarlas en negro;
 *  juntos: true para poner todas las voces en un solo pentagrama (o en dos unidos, agudo y grave, si alguna voz
 *  necesitaría más de tres líneas adicionales: ver elegirPentagramas). Cada voz va entonces como <voice> número
 *  de voz + 1, para que el dibujo sepa de quién es cada nota.
 * Devuelve el texto MusicXML para OpenSheetMusicDisplay. Quita también lo que no lee la neo-partitura (acordes,
 * notas de adorno, repeticiones y saltos de línea o página del programa que la exportó), para que las notas del
 * pentagrama sean exactamente las que suenan y se cantan, en el mismo orden.
 */
export function prepararPentagrama(texto, { partes, mia, compases, colores = {}, juntos = false }) {
  const root = leerXML(texto);
  const todas = hijos(root, 'part');
  const ver = new Set(partes);
  const ids = new Set(todas.filter((p, i) => ver.has(i)).map(p => p.attrs.id));
  root.children = root.children.filter(c => !['credit', 'defaults', 'identification'].includes(c.name));
  const lista = hijos(root, 'part-list')[0];
  if (lista) lista.children = lista.children.filter(c => c.name === 'score-part' && ids.has(c.attrs.id));
  root.children = root.children.filter(c => c.name !== 'part' || ids.has(c.attrs.id));
  todas.forEach((p, i) => { if (ver.has(i)) prepararParte(p, i === mia, compases, colores[i]); });
  if (juntos && ver.size > 1) juntar(root, todas.map((p, i) => ({ p, i })).filter(x => ver.has(x.i)));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + escribir(root);
}

function prepararParte(parte, conLetra, compases, color) {
  const arrastre = {};           // último valor de cada atributo (clave por número de pentagrama)
  let saltado = false;
  const quedan = [];
  hijos(parte, 'measure').forEach((m, i) => {
    for (const a of hijos(m, 'attributes')) for (const c of a.children) if (ARRASTRADOS.includes(c.name)) arrastre[c.name + (c.attrs.number || '')] = c;
    if (!compases(i)) { saltado = true; return; }
    if (saltado || !quedan.length) completarAtributos(m, arrastre);
    saltado = false;
    m.attrs = { ...m.attrs, number: String(i + 1) };   // el mismo número de compás que la neo-partitura
    m.children = m.children.filter(c => c.name !== 'print');
    for (const b of hijos(m, 'barline')) b.children = b.children.filter(c => c.name !== 'repeat' && c.name !== 'ending');
    m.children = m.children.filter(c => c.name !== 'note' || !(hijos(c, 'chord').length || hijos(c, 'grace').length));
    for (const n of hijos(m, 'note')) {
      const letras = hijos(n, 'lyric');
      // como el lector: solo la primera letra de cada nota, y solo en tu voz
      n.children = n.children.filter(c => c.name !== 'lyric' || (conLetra && c === letras[0]));
      if (conLetra && letras[0]) letras[0].attrs = { ...letras[0].attrs, number: '1' };
      if (color && !hijos(n, 'rest').length) {
        n.attrs = { ...n.attrs, color };
        for (const st of hijos(n, 'stem')) st.attrs = { ...st.attrs, color };
      }
    }
    quedan.push(m);
  });
  parte.children = quedan;
}

/** Pone en el compás m los atributos arrastrados que le falten (clave, armadura, compás…). */
function completarAtributos(m, arrastre) {
  let a = hijos(m, 'attributes')[0];
  if (!a) { a = { name: 'attributes', attrs: {}, children: [], text: '' }; m.children.unshift(a); }
  const tiene = new Set(a.children.map(c => c.name + (c.attrs.number || '')));
  const faltan = Object.entries(arrastre).filter(([k]) => !tiene.has(k)).map(([, c]) => c);
  a.children = [...a.children, ...faltan].sort((x, y) => orden(x) - orden(y));
}
const ORDEN = ['footnote', 'level', 'divisions', 'key', 'time', 'staves', 'part-symbol', 'instruments', 'clef', 'staff-details', 'transpose'];
const orden = c => { const k = ORDEN.indexOf(c.name); return k < 0 ? ORDEN.length : k; };

const hijos = (el, nombre) => el.children.filter(c => c.name === nombre);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Vuelve a escribir como texto XML un elemento de leerXML(). */
export function escribir(el) {
  const at = Object.entries(el.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  const dentro = esc(el.text.trim() ? el.text : '') + el.children.map(escribir).join('');
  return dentro ? `<${el.name}${at}>${dentro}</${el.name}>` : `<${el.name}${at}/>`;
}

// ---- Todas las voces en un solo pentagrama ----

// Alturas (MIDI, como suenan) que caben en cada clave sin más de tres líneas adicionales por arriba o por abajo,
// contando en semitonos: clave de sol, de Mi3 a Fa6; clave de fa, de Sol1 a La4.
export const RANGO_SOL = [52, 89], RANGO_FA = [31, 69];
const cabe = (r, [lo, hi]) => r.min >= lo && r.max <= hi;

/**
 * Decide los pentagramas de "todas en uno". rangos: [{ voz, min, max, mediana }] (alturas MIDI como suenan).
 * Un solo pentagrama (clave de sol o, si no cabe, de fa) mientras todas las voces quepan sin más de tres líneas
 * adicionales; si no, dos unidos: el agudo para las voces que van por encima del Do central y el grave para las demás.
 * Devuelve [{ clave: 'G' | 'F', voces: [voz…] }].
 */
export function elegirPentagramas(rangos) {
  const todas = rangos.map(r => r.voz);
  if (rangos.every(r => cabe(r, RANGO_SOL))) return [{ clave: 'G', voces: todas }];
  if (rangos.every(r => cabe(r, RANGO_FA))) return [{ clave: 'F', voces: todas }];
  const aguda = r => cabe(r, RANGO_SOL) !== cabe(r, RANGO_FA) ? cabe(r, RANGO_SOL) : r.mediana >= 60;
  const agudas = rangos.filter(aguda).map(r => r.voz);
  const graves = todas.filter(v => !agudas.includes(v));
  if (!agudas.length) return [{ clave: 'F', voces: graves }];
  if (!graves.length) return [{ clave: 'G', voces: agudas }];
  return [{ clave: 'G', voces: agudas }, { clave: 'F', voces: graves }];
}

const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const texto = (el, ruta) => { let e = el; for (const n of ruta.split('/')) e = e && hijos(e, n)[0]; return e ? e.text.trim() : null; };
const nuevo = (name, text = '', children = [], attrs = {}) => ({ name, attrs, children, text });
const mcd = (a, b) => b ? mcd(b, a % b) : a;

/** Cambia las partes visibles por una o dos partes nuevas con todas sus voces, escritas como suenan. */
function juntar(root, visibles) {
  const lista = hijos(root, 'part-list')[0];
  const voces = visibles.map(({ p, i }) => {
    const medidas = hijos(p, 'measure');
    const oct = Number(medidas.flatMap(m => hijos(m, 'attributes')).flatMap(a => hijos(a, 'clef')).map(c => texto(c, 'clef-octave-change')).find(x => x != null) || 0);
    const alturas = medidas.flatMap(m => hijos(m, 'note')).map(n => hijos(n, 'pitch')[0]).filter(Boolean)
      .map(pt => 12 * (Number(texto(pt, 'octave')) + 1 + oct) + STEP[texto(pt, 'step')] + Math.trunc(Number(texto(pt, 'alter') || 0)))
      .sort((a, b) => a - b);
    const sp = lista && hijos(lista, 'score-part').find(x => x.attrs.id === p.attrs.id);
    const nombre = (sp && texto(sp, 'part-name')) || p.attrs.id;
    const n = alturas.length;
    return { el: p, i, oct, medidas, nombre, rango: { voz: i, min: n ? alturas[0] : 60, max: n ? alturas[n - 1] : 60, mediana: n ? alturas[n >> 1] : 60 } };
  });
  // las divisiones (partes de negra) comunes a todas las voces, para que las duraciones se puedan sumar
  let D = 1;
  for (const v of voces) for (const m of v.medidas) for (const d of hijos(m, 'attributes').flatMap(a => hijos(a, 'divisions'))) {
    const x = Number(d.text); if (x > 0) D = D * x / mcd(D, x);
  }
  const grupos = elegirPentagramas(voces.map(v => v.rango));
  const nuevas = grupos.map((g, k) => {
    const vs = g.voces.map(i => voces.find(v => v.i === i));
    const id = 'PJ' + (k + 1);
    if (lista) lista.children.push(nuevo('score-part', '', [nuevo('part-name', vs.map(v => v.nombre).join(' · '))], { id }));
    vs.forEach(v => { v.div = 1; });
    return nuevo('part', '', vs[0].medidas.map((m0, j) => medidaJunta(vs, j, D, g.clave)), { id });
  });
  if (lista) lista.children = lista.children.filter(c => !voces.some(v => v.el.attrs.id === c.attrs.id));
  const pos = root.children.indexOf(voces[0].el);
  root.children = root.children.filter(c => !voces.some(v => v.el === c));
  root.children.splice(pos, 0, ...nuevas);
}

/** El compás j de un pentagrama con varias voces: cada voz seguida, con <backup> entre una y otra. */
function medidaJunta(vs, j, D, clave) {
  const m0 = vs[0].medidas[j];
  const dentro = [];
  const at0 = hijos(m0, 'attributes')[0];
  if (j === 0 || at0) {
    const at = nuevo('attributes', '', [nuevo('divisions', String(D))]);
    if (at0) for (const c of at0.children) if (c.name === 'key' || c.name === 'time') at.children.push(c);
    if (j === 0) at.children.push(nuevo('clef', '', clave === 'G' ? [nuevo('sign', 'G'), nuevo('line', '2')] : [nuevo('sign', 'F'), nuevo('line', '4')]));
    dentro.push(at);
  }
  dentro.push(...hijos(m0, 'direction'));
  vs.forEach((v, k) => {
    const m = v.medidas[j];
    if (!m) return;
    for (const d of hijos(m, 'attributes').flatMap(a => hijos(a, 'divisions'))) v.div = Number(d.text) || v.div;
    let total = 0;
    for (const n of hijos(m, 'note')) {
      const dur = Math.round(Number(texto(n, 'duration') || 0) * D / v.div);
      total += dur;
      const copia = { ...n, children: n.children.filter(c => !['staff', 'voice'].includes(c.name)).map(c => {
        if (c.name === 'duration') return nuevo('duration', String(dur));
        if (c.name === 'stem' && vs.length > 1) return { ...c, text: k % 2 ? 'down' : 'up' };
        if (c.name === 'pitch' && v.oct) return { ...c, children: c.children.map(x => x.name === 'octave' ? nuevo('octave', String(Number(x.text) + v.oct)) : x) };
        return c;
      }) };
      // <voice> va justo detrás de <duration> (y de sus <tie>), como pide MusicXML
      let iVoz = copia.children.findIndex(c => c.name === 'duration') + 1;
      while (copia.children[iVoz] && copia.children[iVoz].name === 'tie') iVoz++;
      copia.children.splice(iVoz || copia.children.length, 0, nuevo('voice', String(v.i + 1)));
      dentro.push(copia);
    }
    if (k < vs.length - 1 && total) dentro.push(nuevo('backup', '', [nuevo('duration', String(total))]));
  });
  dentro.push(...hijos(m0, 'barline'));
  return nuevo('measure', '', dentro, { ...m0.attrs });
}
