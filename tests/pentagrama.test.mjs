// Pruebas del MusicXML que dibuja la vista de pentagrama (js/pentagrama-xml.js).
// Ejecutar: node --test tests/*.test.mjs
//
// Lo importante: las notas del pentagrama tienen que ser exactamente las que suenan y se cantan, en el mismo orden,
// porque la vista engancha la nota n del dibujo con la nota n de secuencia() (js/afinacion.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leerMusicXML, leerXML } from '../js/lector-musicxml.js';
import { prepararPentagrama } from '../js/pentagrama-xml.js';
import { estrofas } from '../js/estrofas.js';
import { secuencia } from '../js/afinacion.js';

const leer = ruta => readFileSync(new URL('../' + ruta, import.meta.url), 'utf8');
const PARTITURAS = ['biblioteca/MuntanyesDelCanigo.musicxml', 'biblioteca/ElNoiDeLaMare_completa.musicxml'];
const hijos = (el, n) => el.children.filter(c => c.name === n);
const todos = (el, n) => [...(el.name === n ? [el] : []), ...el.children.flatMap(c => todos(c, n))];

for (const ruta of PARTITURAS) {
  const texto = leer(ruta), data = leerMusicXML(texto, ruta), secs = estrofas(data);
  const todas = new Set(secs.lista.map((_, k) => k));
  const partes = data.parts.map((_, i) => i);

  test(`${ruta}: con todas las voces y estrofas, el pentagrama tiene las mismas notas`, () => {
    const xml = prepararPentagrama(texto, { partes, mia: 0, compases: i => todas.has(secs.de[i]) });
    const otra = leerMusicXML(xml, ruta);
    assert.equal(otra.parts.length, data.parts.length);
    for (const p of partes) {
      assert.deepEqual(secuencia(otra, p, todas, estrofas(otra)).map(x => [x.p, x.d]),
        secuencia(data, p, todas, secs).map(x => [x.p, x.d]), `La voz ${data.parts[p].name} no tiene las mismas notas en el pentagrama`);
    }
  });

  test(`${ruta}: solo las voces que se ven, y solo tu voz con letra`, () => {
    const ver = partes.slice(-2), mia = ver[0];
    const xml = prepararPentagrama(texto, { partes: ver, mia, compases: () => true });
    const raiz = leerXML(xml);
    assert.equal(hijos(raiz, 'part').length, ver.length);
    assert.equal(hijos(hijos(raiz, 'part-list')[0], 'score-part').length, ver.length);
    const [conLetra, sinLetra] = hijos(raiz, 'part');
    assert.ok(todos(conLetra, 'lyric').length > 0, 'Tu voz debe llevar su letra');
    assert.equal(todos(sinLetra, 'lyric').length, 0, 'Las otras voces no deben llevar letra');
  });

  if (secs.lista.length > 1) {
    test(`${ruta}: con una sola estrofa (no la primera), su primer compás lleva clave, armadura y compás`, () => {
      const k = secs.lista.length - 1, una = new Set([k]);
      const xml = prepararPentagrama(texto, { partes, mia: 0, compases: i => una.has(secs.de[i]) });
      const raiz = leerXML(xml);
      for (const parte of hijos(raiz, 'part')) {
        const at = hijos(hijos(parte, 'measure')[0], 'attributes')[0];
        assert.ok(at, 'El primer compás que se ve debe llevar sus atributos');
        for (const n of ['divisions', 'key', 'time', 'clef']) assert.ok(hijos(at, n).length, `Falta <${n}> en el primer compás`);
      }
      const otra = leerMusicXML(xml, ruta);
      assert.deepEqual(secuencia(otra, 0, new Set(estrofas(otra).lista.map((_, j) => j)), estrofas(otra)).map(x => x.p),
        secuencia(data, 0, una, secs).map(x => x.p));
    });
  }

  test(`${ruta}: las notas llevan el color de su voz`, () => {
    const xml = prepararPentagrama(texto, { partes: [0], mia: 0, compases: () => true, colores: { 0: '#7048E8' } });
    const notas = todos(leerXML(xml), 'note').filter(n => !hijos(n, 'rest').length);
    assert.ok(notas.length && notas.every(n => n.attrs.color === '#7048E8'));
  });
}

// ---- Todas las voces en un solo pentagrama ----
import { elegirPentagramas } from '../js/pentagrama-xml.js';

test('elegirPentagramas: uno solo si todas caben, dos unidos si alguna necesitaría más de tres rayitas', () => {
  const r = (voz, min, max) => ({ voz, min, max, mediana: Math.round((min + max) / 2) });
  assert.deepEqual(elegirPentagramas([r(0, 60, 79), r(1, 55, 72)]), [{ clave: 'G', voces: [0, 1] }]);
  assert.deepEqual(elegirPentagramas([r(0, 40, 62), r(1, 36, 55)]), [{ clave: 'F', voces: [0, 1] }]);
  assert.deepEqual(elegirPentagramas([r(0, 60, 79), r(1, 55, 72), r(3, 41, 62)]), [{ clave: 'G', voces: [0, 1] }, { clave: 'F', voces: [3] }]);
});

for (const ruta of PARTITURAS) {
  test(`${ruta}: juntas, cada voz conserva sus notas (por su número de <voice>)`, () => {
    const texto = leer(ruta), data = leerMusicXML(texto, ruta), secs = estrofas(data);
    const todas = new Set(secs.lista.map((_, k) => k)), partes = data.parts.map((_, i) => i);
    const raiz = leerXML(prepararPentagrama(texto, { partes, mia: 0, compases: () => true, juntos: true }));
    assert.ok(hijos(raiz, 'part').length <= 2, 'Juntas deben ir en uno o dos pentagramas');
    const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const txt = (el, n) => (hijos(el, n)[0] || { text: '' }).text.trim();
    for (const p of partes) {
      const notas = todos(raiz, 'note').filter(n => txt(n, 'voice') === String(p + 1) && hijos(n, 'pitch').length).map(n => {
        const pt = hijos(n, 'pitch')[0];
        return 12 * (Number(txt(pt, 'octave')) + 1) + STEP[txt(pt, 'step')] + Math.trunc(Number(txt(pt, 'alter') || 0));
      });
      assert.deepEqual(notas, secuencia(data, p, todas, secs).map(x => x.midi), `La voz ${data.parts[p].name} cambia al juntar las voces`);
    }
  });
}
