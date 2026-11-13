// Biblioteca de partituras: el índice biblioteca/indice.json, que cada partitura existe y se puede leer,
// que su aviso de derechos se muestra, y la lectura del aviso de un MusicXML propio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { leerIndice, derechosDelFichero, estrofasVisibles } from '../js/biblioteca.js';
import { leerMusicXML } from '../js/lector-musicxml.js';
import { estrofas } from '../js/estrofas.js';

const raiz = new URL('../', import.meta.url);
const leer = r => readFileSync(new URL(r, raiz), 'utf8');
const indice = leerIndice(JSON.parse(leer('biblioteca/indice.json')));

test('el índice tiene las partituras de la biblioteca', () => {
  assert.deepEqual(indice.map(p => p.titulo), ['Muntanyes del Canigó', 'El Noi de la Mare', 'A Montserrat']);
});

test('todos los MusicXML de la carpeta biblioteca/ están en el índice', () => {
  const ficheros = readdirSync(new URL('biblioteca/', raiz)).filter(f => /\.(musicxml|xml)$/.test(f)).sort();
  assert.deepEqual(indice.map(p => p.ruta.slice('biblioteca/'.length)).sort(), ficheros,
    'Hay un MusicXML en biblioteca/ que no está en indice.json (o al revés): añádelo o quítalo del índice.');
});

for (const p of indice) {
  test(`${p.titulo}: existe, se lee y sus estrofas existen`, () => {
    assert.ok(existsSync(new URL(p.ruta, raiz)), `${p.ruta} no existe`);
    const data = leerMusicXML(leer(p.ruta), p.ruta);
    assert.ok(data.parts.length > 0);
    const n = estrofas(data).lista.length;
    for (const k of estrofasVisibles(p.estrofas) || []) assert.ok(k < n, `${p.titulo} solo tiene ${n} estrofas y el índice pide la ${k + 1}`);
  });
  test(`${p.titulo}: si el MusicXML trae aviso de derechos, el índice también`, () => {
    const delFichero = derechosDelFichero(leer(p.ruta));
    if (delFichero) assert.equal(p.derechos, delFichero, `Copia en indice.json el aviso de derechos del MusicXML: "${delFichero}"`);
    assert.ok(p.autoria || p.derechos, `${p.titulo} no tiene autoría ni aviso de derechos en el índice`);
  });
}

test('El Noi de la Mare se abre con las estrofas 1, 2 y 5 y lleva el aviso © A. Di Marco', () => {
  const p = indice.find(x => x.titulo === 'El Noi de la Mare');
  assert.deepEqual(estrofasVisibles(p.estrofas), [0, 1, 4]);
  assert.match(p.derechos, /© A\. Di Marco/);
  assert.match(p.derechos, /fines Pastorales/);
});

test('las direcciones antiguas de examples/ llevan a partituras de la biblioteca', () => {
  for (const f of readdirSync(new URL('examples/', raiz)).filter(f => f.endsWith('.html'))) {
    const m = leer('examples/' + f).match(/index\.html\?partitura=([^&"']+)/);
    assert.ok(indice.some(p => p.ruta === decodeURIComponent(m[1])), `examples/${f} lleva a ${m[1]}, que no está en la biblioteca`);
  }
});

test('aviso de derechos de un MusicXML propio', () => {
  const xml = r => `<?xml version="1.0"?><score-partwise><identification>${r}</identification><part-list/></score-partwise>`;
  assert.equal(derechosDelFichero(xml('<rights>© Yo</rights>')), '© Yo');
  assert.equal(derechosDelFichero(xml('<rights>© A</rights><rights>© B</rights>')), '© A · © B');
  assert.equal(derechosDelFichero(xml('')), '');
  assert.equal(derechosDelFichero('esto no es XML <'), '');
});

test('el índice mal escrito da un mensaje que explica qué arreglar', () => {
  assert.throws(() => leerIndice({}), /ninguna partitura/);
  assert.throws(() => leerIndice({ partituras: [{ titulo: 'X' }] }), /falta el título o el fichero/);
  assert.throws(() => leerIndice({ partituras: [{ titulo: 'X', fichero: '../x.musicxml' }] }), /dentro de la carpeta biblioteca/);
  assert.throws(() => leerIndice({ partituras: [{ titulo: 'X', fichero: 'x.musicxml', estrofas: 'uno' }] }), /números separados por comas/);
});

test('la letra .txt de una partitura de la biblioteca existe y se lee (vista Letra, nodo neo-partitura/vista-letra)', async () => {
  const { leerTxt } = await import('../js/letra.js');
  const conLetra = indice.filter(p => p.letra);
  assert.ok(conLetra.some(p => p.titulo === 'Muntanyes del Canigó'));
  for (const p of conLetra) {
    assert.ok(existsSync(new URL(p.letra, raiz)), `${p.letra} no existe`);
    assert.ok(leerTxt(leer(p.letra), p.letra).estrofas.length >= 1);
  }
});

test('el índice rechaza una letra que no es un .txt de la carpeta biblioteca/', () => {
  const una = letra => ({ partituras: [{ titulo: 'X', fichero: 'x.musicxml', letra }] });
  assert.throws(() => leerIndice(una('otra/x.txt')), /sin subcarpetas/);
  assert.throws(() => leerIndice(una('x.musicxml')), /\.txt/);
  assert.equal(leerIndice(una('x.txt'))[0].letra, 'biblioteca/x.txt');
  assert.equal(leerIndice(una(''))[0].letra, undefined);
});
