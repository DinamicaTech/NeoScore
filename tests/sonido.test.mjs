// Pruebas de la nota de referencia (js/sonido.js): nombres de las notas, lista de sonidos y grabaciones.
// Ejecutar: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SONIDOS, POR_DEFECTO, nombreFichero, nombreTone, grabaciones } from '../js/sonido.js';
import { leerMusicXML } from '../js/lector-musicxml.js';

const raiz = new URL('../', import.meta.url);

test('nombres de nota: altura MIDI → fichero y nombre de Tone.js', () => {
  assert.equal(nombreFichero(60), 'C4');
  assert.equal(nombreFichero(63), 'Ds4');
  assert.equal(nombreFichero(69), 'A4');
  assert.equal(nombreFichero(33), 'A1');
  assert.equal(nombreFichero(84), 'C6');
  assert.equal(nombreTone(66), 'F#4');
  assert.deepEqual(grabaciones({ notas: ['C4', 'Ds4'] }), { C4: 'C4.mp3', 'D#4': 'Ds4.mp3' });
});

test('la lista de sonidos: ids únicos, el de por defecto existe y cada uno tiene nombre y tooltip', () => {
  assert.equal(new Set(SONIDOS.map(s => s.id)).size, SONIDOS.length);
  assert.ok(SONIDOS.some(s => s.id === POR_DEFECTO), `POR_DEFECTO ("${POR_DEFECTO}") no está en SONIDOS`);
  for (const s of SONIDOS) {
    assert.ok(s.nombre && s.titulo, `al sonido "${s.id}" le falta el nombre o el tooltip`);
    assert.ok(['voz', 'grabado'].includes(s.tipo), `tipo desconocido en "${s.id}": ${s.tipo}`);
  }
});

test('cada sonido grabado tiene sus ficheros y su licencia en el repositorio', () => {
  for (const s of SONIDOS.filter(s => s.tipo === 'grabado')) {
    for (const n of s.notas) {
      assert.match(n, /^[A-G]s?\d$/, `nombre de grabación no válido en "${s.id}": ${n}`);
      assert.ok(existsSync(new URL(s.carpeta + n + '.mp3', raiz)), `falta ${s.carpeta}${n}.mp3`);
    }
    assert.ok(existsSync(new URL(s.carpeta + 'LICENCIA.md', raiz)), `falta ${s.carpeta}LICENCIA.md (licencia y autoría de las grabaciones)`);
  }
});

test('las grabaciones cubren todas las notas de las partituras de la biblioteca (como mucho a 3 semitonos)', () => {
  const indice = JSON.parse(readFileSync(new URL('biblioteca/indice.json', raiz), 'utf8'));
  for (const origen of indice.partituras.map(p => 'biblioteca/' + p.fichero)) {
    const datos = leerMusicXML(readFileSync(new URL(origen, raiz), 'utf8'));
    const alturas = datos.parts.flatMap(p => p.measures.flatMap(m => m.e).filter(e => !e.r).map(e => e.p + (p.oct || 0)));
    for (const s of SONIDOS.filter(s => s.tipo === 'grabado')) {
      const midi = s.notas.map(n => 12 * (+n.at(-1) + 1) + ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'].indexOf(n.slice(0, -1)));
      for (const a of alturas) {
        const cerca = Math.min(...midi.map(m => Math.abs(m - a)));
        assert.ok(cerca <= 3, `${origen}: la nota ${nombreFichero(a)} queda lejos de las grabaciones de "${s.id}"; añade una cercana`);
      }
    }
  }
});
