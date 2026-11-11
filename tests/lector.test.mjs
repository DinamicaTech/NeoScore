// Pruebas del lector de MusicXML en JavaScript (js/lector-musicxml.js).
// Ejecutar: node --test tests/*.test.mjs
//
// La prueba principal comprueba que, para cada partitura de la lista, el lector da exactamente los mismos datos
// que daba neopartitura.py (el conversor en Python ya retirado). Esos datos de referencia se guardaron en
// tests/referencia/ con la última versión de neopartitura.py; no se regeneran con el lector nuevo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leerMusicXML, leerXML } from '../js/lector-musicxml.js';

const raiz = new URL('../', import.meta.url);
const leer = ruta => readFileSync(new URL(ruta, raiz), 'utf8');

// Cada partitura: su MusicXML y los datos que daba neopartitura.py.
const PARTITURAS = [
  ['sources/ElNoiDeLaMare_completa.musicxml', 'tests/referencia/ElNoiDeLaMare_completa.json'],
  ['sources/MuntanyesDelCanigo.musicxml', 'tests/referencia/MuntanyesDelCanigo.json'],
];

for (const [origen, referencia] of PARTITURAS) {
  test(`${origen} da los mismos datos que neopartitura.py`, () => {
    const obtenido = leerMusicXML(leer(origen), origen);
    // "oct" (octava a la que suena la voz) es nuevo, posterior a neopartitura.py: se prueba aparte, más abajo
    for (const p of obtenido.parts) delete p.oct;
    delete obtenido.tempo;   // también posterior (modo de canto): se prueba aparte, más abajo
    const esperado = JSON.parse(leer(referencia));
    assert.deepStrictEqual(obtenido, esperado,
      `El lector ya no lee ${origen} como neopartitura.py (${referencia}). Corrige js/lector-musicxml.js.`);
  });
}

const partitura = cuerpo => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">${cuerpo}</score-partwise>`;
const unaNota = nota => partitura(`<part-list><score-part id="P1"><part-name>Alto</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><divisions>2</divisions></attributes>${nota}</measure></part>`);

test('título: work-title, si no movement-title, si no el nombre del fichero', () => {
  const cuerpo = '<part-list/><part id="P1"><measure/></part>';
  assert.equal(leerMusicXML(partitura('<work><work-title>Canción</work-title></work><movement-title>Otro</movement-title>' + cuerpo)).title, 'Canción');
  assert.equal(leerMusicXML(partitura('<movement-title>Otro</movement-title>' + cuerpo)).title, 'Otro');
  assert.equal(leerMusicXML(partitura('<work><work-title></work-title></work>' + cuerpo), 'carpeta/Mi canción.musicxml').title, 'Mi canción');
});

test('nota con alteración, ligadura, sinalefa y guion', () => {
  const d = leerMusicXML(unaNota(`<note><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>3</duration>
    <tie type="stop"/><lyric><syllabic>begin</syllabic><text>na</text><elision>‿</elision><syllabic>middle</syllabic><text>en</text></lyric></note>`));
  assert.deepStrictEqual(d.parts[0], { name: 'Alto', measures: [{ e: [{ p: 70, d: 1.5, t: 'na‿en-', tie: 1 }] }] });
});

test('se saltan acordes y notas de adorno; los silencios cuentan', () => {
  const d = leerMusicXML(unaNota(`<note><rest/><duration>2</duration></note>
    <note><grace/><pitch><step>C</step><octave>4</octave></pitch></note>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
    <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration></note>`));
  assert.deepStrictEqual(d.parts[0].measures[0].e, [{ r: 1, d: 1 }, { p: 60, d: 2 }]);
});

test('indicaciones de texto y doble barra', () => {
  const d = leerMusicXML(unaNota(`<direction><direction-type><words> Estrofa 2 </words></direction-type></direction>
    <direction><direction-type><words>Andante</words></direction-type></direction>
    <barline location="right"><bar-style>light-heavy</bar-style></barline>`));
  assert.deepStrictEqual(d.parts[0].measures[0], { e: [], w: 'Estrofa 2 · Andante', end: 1 });
});

test('lector de XML: comentarios, CDATA, entidades y atributos', () => {
  const r = leerXML(`<?xml version="1.0"?><!-- hola --><a x='1' y="&amp;&#233;"><b>&lt;Do&gt; &#x266F;</b><c><![CDATA[<x>]]></c><d/></a>`);
  assert.deepStrictEqual(r.attrs, { x: '1', y: '&é' });
  assert.deepStrictEqual(r.children.map(c => [c.name, c.text]), [['b', '<Do> ♯'], ['c', '<x>'], ['d', '']]);
});

test('errores con explicación de cómo arreglarlo', () => {
  assert.throws(() => leerMusicXML('PK\x03\x04...'), /comprimido \(\.mxl\)/);
  assert.throws(() => leerMusicXML('<html><body></body></html>'), /no es una partitura MusicXML/);
  assert.throws(() => leerMusicXML('<score-partwise><part-list>'), /falta cerrar/);
});

test('oct: una voz en clave de sol con un 8 debajo (tenor) suena una octava más grave', () => {
  const datos = leerMusicXML(leer('sources/ElNoiDeLaMare_completa.musicxml'));
  assert.deepEqual(datos.parts.map(p => [p.name, p.oct]), [['Soprano', undefined], ['Alto', undefined], ['Tenor', -12], ['Bajo', undefined]]);
  const clave = cambio => leerMusicXML(partitura(`<part-list><score-part id="P1"><part-name>T</part-name></score-part></part-list>
    <part id="P1"><measure number="1"><attributes><divisions>1</divisions><clef><sign>G</sign><line>2</line>${cambio}</clef></attributes></measure></part>`)).parts[0];
  assert.equal(clave('<clef-octave-change>-1</clef-octave-change>').oct, -12);
  assert.equal(clave('<clef-octave-change>1</clef-octave-change>').oct, 12);
  assert.equal('oct' in clave(''), false);
  assert.equal('oct' in clave('<clef-octave-change>0</clef-octave-change>'), false);
});

test('tempo: el de la partitura en negras por minuto, si lo trae', () => {
  assert.equal(leerMusicXML(leer('sources/ElNoiDeLaMare_completa.musicxml')).tempo, 80);
  assert.equal('tempo' in leerMusicXML(leer('sources/MuntanyesDelCanigo.musicxml')), false);
  const con = dir => leerMusicXML(unaNota(`<direction><direction-type>${dir}</direction-type></direction>`));
  assert.equal(con('<metronome><beat-unit>quarter</beat-unit><per-minute>96</per-minute></metronome>').tempo, 96);
  assert.equal(con('<metronome><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome>').tempo, 120);
  assert.equal(con('<metronome><beat-unit>quarter</beat-unit><beat-unit-dot/><per-minute>60</per-minute></metronome>').tempo, 90);
  assert.equal(leerMusicXML(unaNota('<direction><direction-type><words>x</words></direction-type><sound tempo="72.5"/></direction>')).tempo, 73);
  assert.equal('tempo' in con('<words>Andante</words>'), false);
});
