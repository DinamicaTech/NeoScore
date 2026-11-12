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
 *  colores: { índice de voz: '#rrggbb' } para pintar sus notas (cabeza y plica), o nada para dejarlas en negro.
 * Devuelve el texto MusicXML para OpenSheetMusicDisplay. Quita también lo que no lee la neo-partitura (acordes,
 * notas de adorno, repeticiones y saltos de línea o página del programa que la exportó), para que las notas del
 * pentagrama sean exactamente las que suenan y se cantan, en el mismo orden.
 */
export function prepararPentagrama(texto, { partes, mia, compases, colores = {} }) {
  const root = leerXML(texto);
  const todas = hijos(root, 'part');
  const ver = new Set(partes);
  const ids = new Set(todas.filter((p, i) => ver.has(i)).map(p => p.attrs.id));
  root.children = root.children.filter(c => !['credit', 'defaults', 'identification'].includes(c.name));
  const lista = hijos(root, 'part-list')[0];
  if (lista) lista.children = lista.children.filter(c => c.name === 'score-part' && ids.has(c.attrs.id));
  root.children = root.children.filter(c => c.name !== 'part' || ids.has(c.attrs.id));
  todas.forEach((p, i) => { if (ver.has(i)) prepararParte(p, i === mia, compases, colores[i]); });
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
