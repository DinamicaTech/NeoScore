// Pruebas del reproductor (reproducir-partitura): el reloj con pausa y cambio de tempo, quÃ© nota suena en cada momento,
// las ligaduras, el reloj comÃºn de varias voces y el acompaÃ±amiento. Sin navegador: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leerMusicXML } from '../js/lector-musicxml.js';
import { estrofas } from '../js/estrofas.js';
import { secuencia, inicioComun } from '../js/afinacion.js';
import { crearReloj, notaEn, ligada, final, acompanamiento, volumen } from '../js/reproduccion.js';
import { leerIndice } from '../js/biblioteca.js';

const raiz = new URL('../', import.meta.url);
const leer = ruta => readFileSync(new URL(ruta, raiz), 'utf8');
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} â‰  ${b}`);

test('el reloj avanza al tempo, se para en la pausa y sigue desde el mismo sitio', () => {
  const r = crearReloj(60);                 // 60 negras por minuto: una negra por segundo
  assert.equal(r.corriendo, false);
  cerca(r.pos(5), 0);
  r.arrancar(10, 0);
  cerca(r.pos(12), 2);
  r.parar(13.5);
  cerca(r.pos(20), 3.5);                    // en pausa no se mueve
  r.arrancar(30);                           // continuar: desde donde se parÃ³
  cerca(r.pos(31), 4.5);
});

test('la cuenta atrÃ¡s: antes de arrancar la posiciÃ³n no se mueve y dice cuÃ¡nto falta', () => {
  const r = crearReloj(120);                // media segundo por negra
  r.arrancar(10, 0);
  cerca(r.pos(9), 0);
  cerca(r.faltan(9), 2);                    // 1 s = 2 negras
  cerca(r.faltan(10.5), 0);
});

test('cambiar el tempo mientras suena no hace saltar la mÃºsica', () => {
  const r = crearReloj(60);
  r.arrancar(0, 0);
  r.cambiarTempo(4, 120);                   // en la negra 4, el doble de rÃ¡pido
  cerca(r.pos(4), 4);
  cerca(r.pos(5), 6);
  r.parar(5); r.cambiarTempo(6, 30);
  cerca(r.pos(100), 6);
});

test('reiniciar vuelve a la primera negra', () => {
  const r = crearReloj(60);
  r.arrancar(0, 0); r.ir(7, 0);
  cerca(r.pos(7), 0); cerca(r.pos(8), 1);
});

test('quÃ© nota suena: dentro de una nota, en un silencio y al final', () => {
  const notas = [{ n: 0, inicio: 0, d: 1 }, { n: 1, inicio: 1, d: 1 }, { n: 2, inicio: 3, d: 2 }];   // silencio de 2 a 3
  assert.deepEqual(notaEn(notas, 0.5), { k: 0, dentro: true });
  assert.deepEqual(notaEn(notas, 1), { k: 1, dentro: true });
  assert.deepEqual(notaEn(notas, 2.5), { k: 2, dentro: false });
  assert.deepEqual(notaEn(notas, 4.9, 2), { k: 2, dentro: true });
  assert.deepEqual(notaEn(notas, 5), { k: 3, dentro: false });
  assert.deepEqual(notaEn(notas, 0.2, 3), { k: 0, dentro: true }, 'tras reiniciar se busca desde el principio');
});

test('las notas ligadas a la misma altura no se vuelven a atacar', () => {
  const notas = [{ midi: 60, inicio: 0, d: 1 }, { midi: 60, inicio: 1, d: 1, tie: 1 }, { midi: 62, inicio: 2, d: 1, tie: 1 }, { midi: 62, inicio: 4, d: 1, tie: 1 }];
  assert.equal(ligada(notas, 0), false);
  assert.equal(ligada(notas, 1), true);
  assert.equal(ligada(notas, 2), false, 'otra altura: se ataca');
  assert.equal(ligada(notas, 3), false, 'no va justo a continuaciÃ³n');
});

test('acompaÃ±amiento: sin la voz principal, sin repetidas y solo voces que existen', () => {
  assert.deepEqual(acompanamiento([3, 1, 1, 0, 7, -1, 'x'], 1, 4), [0, 3]);
  assert.deepEqual(acompanamiento([], 0, 4), []);
});

test('volÃºmenes: el acompaÃ±amiento mÃ¡s suave que tu voz, y todo mÃ¡s suave con el micrÃ³fono', () => {
  assert.equal(volumen(true, false), 0);
  assert.ok(volumen(false, false) > volumen(true, false));
  assert.ok(volumen(true, true) > volumen(true, false));
  assert.ok(volumen(false, true) > volumen(true, true));
});

const ejemplos = leerIndice(JSON.parse(leer('biblioteca/indice.json'))).map(p => p.ruta);
for (const ruta of ejemplos) {
  test(`${ruta}: todas las voces comparten reloj y las ligaduras llegan a la secuencia`, () => {
    const data = leerMusicXML(leer(ruta), ruta), secs = estrofas(data);
    const todas = new Set(secs.lista.map((_, k) => k)), partes = data.parts.map((_, i) => i);
    const cero = inicioComun(data, partes, todas, secs);
    const voces = partes.map(p => secuencia(data, p, todas, secs, cero));
    assert.equal(Math.min(...voces.filter(v => v.length).map(v => v[0].inicio)), 0, 'la primera nota de todas empieza en 0');
    for (const v of voces) v.forEach((x, i) => { if (i) assert.ok(x.inicio >= v[i - 1].inicio + v[i - 1].d - 1e-9, 'las notas de una voz no se pisan'); });
    // sin cero comÃºn, cada voz empieza en su primera nota (lo de siempre)
    for (const p of partes) { const s = secuencia(data, p, todas, secs); if (s.length) assert.equal(s[0].inicio, 0); }
    const fin = final(voces);
    assert.ok(fin > 0);
    // las ligaduras del lector llegan a la secuencia
    const lig = data.parts.flatMap(P => P.measures.flatMap(m => m.e)).filter(e => e.tie).length;
    assert.equal(voces.flat().filter(x => x.tie).length, lig);
  });
}
