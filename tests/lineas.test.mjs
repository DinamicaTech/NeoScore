// El reparto en líneas (js/lineas.js) nunca pasa del ancho de la pantalla: así la neo-partitura se lee en un
// móvil en vertical sin desplazamiento lateral (nodo neo-partitura/movil-vertical).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { repartirEnLineas } from '../js/lineas.js';
import { leerMusicXML } from '../js/lector-musicxml.js';

const ancho = linea => linea.reduce((s, m) => s + m.w, 0);
const compas = (i, ws, extra = {}) => {
  const evs = ws.map(w => ({ w }));
  return { i, evs, w: ws.reduce((s, w) => s + w, 0) + 4, ...extra };
};

test('los compases que caben se reparten enteros, como antes', () => {
  const lineas = repartirEnLineas([compas(0, [50, 50]), compas(1, [50, 50]), compas(2, [50, 50])], 220);
  assert.deepEqual(lineas.map(l => l.map(m => m.i)), [[0, 1], [2]]);
  assert.ok(lineas.flat().every(m => !m.cont));
});

test('tras una doble barra empieza línea nueva', () => {
  const lineas = repartirEnLineas([compas(0, [20], { end: true }), compas(1, [20])], 500);
  assert.deepEqual(lineas.map(l => l.map(m => m.i)), [[0], [1]]);
});

test('un compás más ancho que la pantalla se parte en tramos que caben', () => {
  const lineas = repartirEnLineas([compas(0, [80, 80, 80, 80], { label: 'Estrofa 2', end: true }), compas(1, [40])], 200);
  const tramos = lineas.flat().filter(m => m.i === 0);
  assert.equal(tramos.length, 2);
  assert.ok(lineas.every(l => ancho(l) <= 200));
  assert.equal(tramos[0].label, 'Estrofa 2');            // la indicación va solo en el primer tramo
  assert.equal(tramos[1].label, undefined);
  assert.deepEqual(tramos.map(t => !!t.cont), [false, true]);
  assert.deepEqual(tramos.map(t => !!t.end), [false, true]);   // la doble barra, en el último
  assert.equal(tramos.flatMap(t => t.evs).length, 4);      // no se pierde ninguna nota
});

test('una nota sola más ancha que la línea se estrecha hasta caber', () => {
  const lineas = repartirEnLineas([compas(0, [300])], 200);
  assert.equal(lineas.length, 1);
  assert.ok(ancho(lineas[0]) <= 200);
});

// Las partituras de ejemplo, en un móvil de 320 y de 360 px, con el control de tamaño al mínimo, en medio y al máximo.
// El ancho de la letra se estima (8 px por letra, más que lo que mide de verdad a 14 px) porque Node no mide textos.
for (const f of ['MuntanyesDelCanigo.musicxml', 'ElNoiDeLaMare_completa.musicxml']) {
  const data = leerMusicXML(readFileSync(new URL('../sources/' + f, import.meta.url), 'utf8'), f);
  for (const pantalla of [320, 360]) for (const zoom of [24, 40, 70]) {
    test(`${f}: en ${pantalla} px con tamaño ${zoom} ninguna línea pasa del ancho`, () => {
      const maxW = pantalla - 32 - 40;   // como en js/dibujo.js
      for (const P of data.parts) {
        const compases = P.measures.map((m, i) => {
          const evs = m.e.map(e => ({ ...e, w: Math.max(e.d * zoom, e.t ? e.t.length * 8 + 6 : 6) }));
          return { i, evs, w: evs.reduce((s, e) => s + e.w, 0) + 4, end: m.end };
        });
        const lineas = repartirEnLineas(compases, maxW);
        for (const l of lineas) assert.ok(ancho(l) <= maxW, `${P.name}: una línea mide ${ancho(l)} px y caben ${maxW}`);
        assert.equal(lineas.flat().flatMap(m => m.evs).length, compases.flatMap(m => m.evs).length, `${P.name}: se ha perdido alguna nota`);
      }
    });
  }
}
