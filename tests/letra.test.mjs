// Vista de letra (js/letra.js, nodo neo-partitura/vista-letra): la letra de una voz del MusicXML, juntada en palabras
// y cortada en versos, y la lectura de un fichero .txt de letra.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { letraDeVoz, leerTxt, tamanoLetra } from '../js/letra.js';
import { leerMusicXML } from '../js/lector-musicxml.js';
import { estrofas } from '../js/estrofas.js';

const leer = f => leerMusicXML(readFileSync(new URL('../biblioteca/' + f, import.meta.url), 'utf8'), f);
const todas = s => new Set(s.lista.map((_, k) => k));

test('El Noi de la Mare: las sílabas se juntan en palabras y cada estrofa sale en sus cuatro versos', () => {
  const d = leer('ElNoiDeLaMare_completa.musicxml'), s = estrofas(d);
  const alto = d.parts.findIndex(p => /alt/i.test(p.name));
  const letra = letraDeVoz(d, alto, todas(s), s);
  assert.equal(letra.length, 5);
  assert.equal(letra[0].name, 'Estrofa 1');
  assert.deepEqual(letra[0].versos, [
    "Qué li darem a n'el Noi de la Mare?",
    'Qué li darem que li sápiga bo?',
    'Panses i figues i nous i olives,',
    'panses i figues i mel i mató.',
  ]);
  // ninguna sílaba queda partida con guion ni con el signo de sinalefa
  assert.ok(letra.every(e => e.versos.every(v => !/-\s|-$|‿/.test(v))));
});

test('solo salen las estrofas elegidas', () => {
  const d = leer('ElNoiDeLaMare_completa.musicxml'), s = estrofas(d);
  const letra = letraDeVoz(d, 0, new Set([1, 4]), s);
  assert.deepEqual(letra.map(e => e.name), ['Estrofa 2', 'Estrofa 5']);
});

test('un silencio corta el verso, y un guion pega la sílaba con la siguiente', () => {
  const data = { parts: [{ name: 'V', measures: [
    { e: [{ p: 60, d: 1, t: 'Can-' }, { p: 62, d: 1, t: 'ta' }, { p: 62, d: 1 }, { p: 64, d: 1, t: 'fort' }] },
    { e: [{ r: 1, d: 1 }, { p: 60, d: 1, t: 'na‿en' }, { p: 60, d: 1, t: 'pau' }] },
  ] }] };
  const s = estrofas(data);
  assert.deepEqual(letraDeVoz(data, 0, todas(s), s), [{ name: 'Parte 1', versos: ['Canta fort', 'na en pau'] }]);
});

test('un .txt: cada línea es un verso, una línea en blanco separa estrofas y el título es el nombre del fichero', () => {
  const l = leerTxt('﻿Primer vers\r\n  segon vers  \r\n\r\n\r\nTercer vers\n', 'carpeta/La_meva_canco.txt');
  assert.equal(l.title, 'La meva canco');
  assert.deepEqual(l.estrofas, [
    { name: 'Estrofa 1', versos: ['Primer vers', 'segon vers'] },
    { name: 'Estrofa 2', versos: ['Tercer vers'] },
  ]);
  assert.deepEqual(leerTxt('Una sola estrofa\ni dos versos', 'a.txt').estrofas, [{ name: '', versos: ['Una sola estrofa', 'i dos versos'] }]);
});

test('un .txt vacío o que en realidad es un MusicXML da un error que dice cómo arreglarlo', () => {
  assert.throws(() => leerTxt(' \n\n ', 'v.txt'), /vacío.*Abrir fichero/);
  assert.throws(() => leerTxt('<?xml version="1.0"?>\n<score-partwise version="3.1">', 'p.txt'), /\.musicxml/);
});

test('el tamaño de la letra va de 16 a 32 px con el control de Tamaño', () => {
  assert.equal(tamanoLetra(12), 16);
  assert.equal(tamanoLetra(70), 32);
  assert.ok(tamanoLetra(40) > 16 && tamanoLetra(40) < 32);
});
