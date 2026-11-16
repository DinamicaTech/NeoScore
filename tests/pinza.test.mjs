// Tamaño con la pinza (js/pinza.js, nodo neo-partitura/controles): el tamaño nuevo sigue a los dedos y no sale de 12 a 70.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tamanoTras, MIN, MAX, NORMAL } from '../js/pinza.js';

test('separar los dedos agranda y juntarlos encoge, en proporción', () => {
  assert.equal(tamanoTras(40, 1.5), 60);
  assert.equal(tamanoTras(40, 0.5), 20);
  assert.equal(tamanoTras(40, 1), 40);
});

test('la pinza se para en el mínimo y en el máximo', () => {
  assert.equal(tamanoTras(40, 10), MAX);
  assert.equal(tamanoTras(40, 0.01), MIN);
  assert.equal(MIN, 12);
  assert.equal(MAX, 70);
});

test('un gesto sin sentido (dedos en el mismo punto) deja el tamaño normal', () => {
  assert.equal(tamanoTras(40, NaN), NORMAL);
  assert.equal(tamanoTras(40, Infinity), NORMAL);
});
