// Pruebas del modo de canto (entonacion/cantar-con-tempo): los cálculos de js/afinacion.js y que pitchy
// (js/vendor/pitchy.js) reconoce notas conocidas. Ejecutar: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leerMusicXML } from '../js/lector-musicxml.js';
import { estrofas } from '../js/estrofas.js';
import {
  MARGENES, hzAMidi, comparar, mediana, secuencia, negrasPorCompas, tempoValido, resultado, claveResultado, TEMPO_POR_DEFECTO,
  HISTORIAL_MAX, claveHistorial, cuentas, anadirIntento, textoHistorial, fueraDeMargen, desvioEnPalabras, tramoDeCompas, coincide,
} from '../js/afinacion.js';
import { PitchDetector } from '../js/vendor/pitchy.js';
import { leerIndice } from '../js/biblioteca.js';

const raiz = new URL('../', import.meta.url);
const leer = ruta => readFileSync(new URL(ruta, raiz), 'utf8');
const rutas = leerIndice(JSON.parse(leer('biblioteca/indice.json'))).map(p => p.ruta);

test('de hercios a nota', () => {
  assert.equal(hzAMidi(440), 69);
  assert.ok(Math.abs(hzAMidi(261.6256) - 60) < 1e-4);
  assert.ok(Math.abs(hzAMidi(220) - 57) < 1e-9);
});

test('afinada, alta o baja según el margen', () => {
  assert.deepEqual(comparar(60, 60.2, 50), { cents: 20, octava: 0, estado: 'afinada' });
  assert.deepEqual(comparar(60, 60.6, 50), { cents: 60, octava: 0, estado: 'alta' });
  assert.deepEqual(comparar(60, 59.3, 50), { cents: -70, octava: 0, estado: 'baja' });
  assert.equal(comparar(60, 60.3, 25).estado, 'alta');
  assert.equal(comparar(60, 60.5, 50).estado, 'afinada');   // justo en el borde cuenta
  assert.deepEqual(MARGENES.map(m => m.cents), [50, 35, 25]);
});

test('cantar una octava más grave o más aguda cuenta como la misma nota', () => {
  assert.deepEqual(comparar(67, 55.1, 50), { cents: 10, octava: -1, estado: 'afinada' });
  assert.deepEqual(comparar(55, 79, 50), { cents: 0, octava: 2, estado: 'afinada' });
  assert.equal(comparar(67, 55.1, 50, false).estado, 'baja');
});

test('mediana: no se deja llevar por un golpe de voz suelto', () => {
  assert.equal(mediana([60, 60.1, 72, 59.9, 60]), 60);
  assert.equal(mediana([1, 2]), 1.5);
  assert.equal(mediana([]), null);
});

test('tempo: el que se escribe, dentro de unos límites', () => {
  assert.equal(tempoValido(96), 96);
  assert.equal(tempoValido('72.4'), 72);
  assert.equal(tempoValido(5), 30);
  assert.equal(tempoValido(900), 200);
  assert.equal(tempoValido('hola'), TEMPO_POR_DEFECTO);
});

for (const ruta of rutas) {
  test(`${ruta}: la secuencia de notas sigue la partitura`, () => {
    const data = leerMusicXML(leer(ruta), ruta), secs = estrofas(data);
    for (let part = 0; part < data.parts.length; part++) {
      const P = data.parts[part];
      const todas = new Set(secs.lista.map((_, k) => k));
      const notas = secuencia(data, part, todas, secs);
      const esperadas = P.measures.flatMap(m => m.e).filter(e => !e.r);
      assert.equal(notas.length, esperadas.length, `${P.name}: no salen todas las notas`);
      notas.forEach((x, i) => {
        assert.equal(x.n, i);
        assert.equal(x.p, esperadas[i].p);
        assert.equal(x.midi, esperadas[i].p + (P.oct || 0), `${P.name}: la altura que suena debe llevar la octava de la voz`);
        if (i) assert.ok(x.inicio >= notas[i - 1].inicio + notas[i - 1].d - 1e-9, `${P.name}: la nota ${i} empieza antes de acabar la anterior`);
      });
      assert.equal(notas[0].inicio, 0);
      assert.ok(negrasPorCompas(data, part) >= 2);
      // solo la segunda estrofa: empieza en su primer compás, desde el tiempo 0
      if (secs.lista.length > 1) {
        const una = secuencia(data, part, new Set([1]), secs);
        assert.ok(una.length > 0 && una.every(x => secs.de[x.compas - 1] === 1));
        assert.equal(una[0].inicio, 0);
      }
    }
  });
}

test('resultado guardado para la revisión: esperada y cantada por sílaba', () => {
  const notas = [{ n: 0, midi: 60, compas: 1, t: 'Ca-' }, { n: 1, midi: 62, compas: 1, t: 'ní' }, { n: 2, midi: 64, compas: 2 }];
  const r = resultado({ titulo: 'T', voz: 'Alto', tempo: 80, margen: 'facil', notas, cantadas: { 0: 60.1, 1: 62.8, 2: null }, fecha: 'f' });
  assert.equal(r.version, 1);
  assert.equal(r.cents, 50);
  assert.deepEqual(r.notas, [
    { n: 0, compas: 1, silaba: 'Ca-', esperada: 60, cantada: 60.1, cents: 10, octava: 0, estado: 'afinada' },
    { n: 1, compas: 1, silaba: 'ní', esperada: 62, cantada: 62.8, cents: 80, octava: 0, estado: 'alta' },
    { n: 2, compas: 2, silaba: '', esperada: 64, cantada: null, cents: null, octava: 0, estado: 'sin-oir' },
  ]);
  assert.equal(claveResultado('T', 'Alto'), 'neo-canto:T:Alto');
});

test('revisión: el resultado guarda las estrofas que se veían', () => {
  const r = resultado({ titulo: 'T', voz: 'Alto', tempo: 80, margen: 'facil', notas: [], cantadas: {}, estrofas: [0, 2], fecha: 'f' });
  assert.deepEqual(r.estrofas, [0, 2]);
  assert.equal('estrofas' in resultado({ titulo: 'T', voz: 'Alto', tempo: 80, margen: 'facil', notas: [], cantadas: {} }), false);
});

const notasRes = [
  { n: 0, compas: 1, silaba: 'a', esperada: 60, cantada: 60.1, cents: 10, octava: 0, estado: 'afinada' },
  { n: 1, compas: 1, silaba: 'b', esperada: 62, cantada: 62.4, cents: 40, octava: 0, estado: 'afinada' },
  { n: 2, compas: 2, silaba: 'c', esperada: 64, cantada: 63.2, cents: -80, octava: 0, estado: 'baja' },
  { n: 3, compas: 2, silaba: '', esperada: 65, cantada: null, cents: null, octava: 0, estado: 'sin-oir' },
];

test('revisión: las sílabas fuera del margen, con el margen elegido ahora y sin las no oídas', () => {
  const res = { notas: notasRes };
  assert.deepEqual(fueraDeMargen(res, 50).map(x => [x.n, x.estado, x.cents]), [[2, 'baja', -80]]);
  assert.deepEqual(fueraDeMargen(res, 25).map(x => [x.n, x.estado, x.cents]), [[1, 'alta', 40], [2, 'baja', -80]]);
  assert.deepEqual(cuentas(notasRes), { afinada: 2, alta: 0, baja: 1, 'sin-oir': 1 });
});

test('revisión: cuánto se ha desviado, en palabras', () => {
  assert.equal(desvioEnPalabras(35), 'un poco alta (+35 cents, un tercio de semitono)');
  assert.equal(desvioEnPalabras(-27), 'un poco baja (-27 cents, un cuarto de semitono)');
  assert.equal(desvioEnPalabras(55), 'alta (+55 cents, medio semitono)');
  assert.equal(desvioEnPalabras(-95), 'baja (-95 cents, casi un semitono)');
  assert.equal(desvioEnPalabras(130), 'muy alta (+130 cents, un semitono)');
  assert.equal(desvioEnPalabras(-260), 'muy baja (-260 cents, 3 semitonos)');
});

test('revisión: historial de los últimos intentos completos', () => {
  const res = (afinadas, completa = true) => ({ completa, fecha: 'f', tempo: 80, margen: 'facil',
    notas: Array.from({ length: 4 }, (_, i) => ({ estado: i < afinadas ? 'afinada' : 'alta' })) });
  let h = anadirIntento(null, res(1));
  h = anadirIntento(h, res(3, false));            // un intento a medias no cuenta
  assert.equal(h.length, 1);
  for (let i = 0; i < 12; i++) h = anadirIntento(h, res(i % 5));
  assert.equal(h.length, HISTORIAL_MAX);
  assert.deepEqual(h[0], { fecha: 'f', tempo: 80, margen: 'facil', afinadas: (2 % 5), altas: 4 - 2, bajas: 0, sinOir: 0, total: 4 });
  assert.equal(textoHistorial([{ afinadas: 28, total: 42 }, { afinadas: 33, total: 42 }, { afinadas: 37, total: 42 }]),
    'Tus últimos intentos: 28 · 33 · 37 afinadas de 42');
  assert.equal(textoHistorial([{ afinadas: 10, total: 20 }, { afinadas: 30, total: 42 }]), 'Tus últimos intentos: 10/20 · 30/42 afinadas');
  assert.equal(textoHistorial([{ afinadas: 5, total: 9 }]), 'Tu intento completo: 5 afinadas de 9');
  assert.equal(textoHistorial([]), '');
  assert.equal(claveHistorial('T', 'Alto'), 'neo-canto-historial:T:Alto');
});

for (const ruta of rutas) {
  test(`${ruta}: repetir el compás de cualquier nota y reconocer su resultado`, () => {
    const data = leerMusicXML(leer(ruta), ruta), secs = estrofas(data);
    const todas = new Set(secs.lista.map((_, k) => k));
    for (let part = 0; part < data.parts.length; part++) {
      const notas = secuencia(data, part, todas, secs);
      for (const x of notas) {
        const t = tramoDeCompas(notas, x.compas);
        assert.ok(t.ns.includes(x.n));
        assert.ok(t.desde <= x.inicio && x.inicio + x.d <= t.hasta + 1e-9);
        assert.ok(t.ns.every(n => notas[n].compas === x.compas));
      }
      assert.equal(tramoDeCompas(notas, 99999), null);
      const res = resultado({ titulo: data.title, voz: data.parts[part].name, tempo: 80, margen: 'facil', notas, cantadas: {} });
      assert.ok(coincide(res, notas));
      if (secs.lista.length > 1) assert.ok(!coincide(res, secuencia(data, part, new Set([1]), secs)), 'con otras estrofas no coincide');
    }
  });
}

test('pitchy reconoce notas conocidas (onda pura y onda rica en armónicos, como la voz)', () => {
  const N = 2048, sr = 44100, det = PitchDetector.forFloat32Array(N);
  for (const midi of [43, 57, 64, 69, 79]) {   // de un Sol grave de bajo a un Sol agudo de soprano
    const hz = 440 * 2 ** ((midi - 69) / 12);
    for (const forma of ['seno', 'sierra']) {
      const b = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const fase = (hz * i / sr) % 1;
        b[i] = 0.5 * (forma === 'seno' ? Math.sin(2 * Math.PI * fase) : 2 * fase - 1);
      }
      const [f, claridad] = det.findPitch(b, sr);
      assert.ok(claridad > 0.9, `${forma} ${midi}: claridad ${claridad}`);
      assert.ok(Math.abs(hzAMidi(f) - midi) < 0.1, `${forma} ${midi}: detecta ${hzAMidi(f).toFixed(2)}`);
    }
  }
});
