// Arranque de la página: decide qué partitura abrir, la lee con el lector de MusicXML y la muestra.
//   index.html?partitura=<ruta del .musicxml dentro de la web>&estrofas=1,2,5
// Sin ?partitura= muestra una lista provisional de partituras (la sustituirá el selector de la biblioteca).
import { leerMusicXML } from './lector-musicxml.js';
import { mostrarPartitura } from './controles.js';

// Lista provisional hasta que exista la biblioteca con su índice.
const PROVISIONAL = [
  { titulo: 'Muntanyes del Canigó', partitura: 'sources/MuntanyesDelCanigo.musicxml' },
  { titulo: 'El Noi de la Mare', partitura: 'sources/ElNoiDeLaMare_completa.musicxml', estrofas: '1,2,5' },
];

const aviso = document.getElementById('aviso');
const enlace = p => '?partitura=' + encodeURIComponent(p.partitura) + (p.estrofas ? '&estrofas=' + p.estrofas : '');
const lista = () => PROVISIONAL.map(p => `<a href="${enlace(p)}">${p.titulo}</a>`).join(' · ');

function error(msg) {
  aviso.className = 'error';
  aviso.innerHTML = '';
  aviso.append(msg);
  aviso.insertAdjacentHTML('beforeend', `<br>Partituras disponibles: ${lista()}`);
}

/** Lee y muestra el MusicXML de la dirección dada (relativa a la web). */
export async function abrirPartitura(ruta, shown = null) {
  let texto;
  try {
    const r = await fetch(ruta);
    if (!r.ok) throw new Error(r.status === 404 ? 'no existe en la web' : `el servidor respondió ${r.status}`);
    texto = await r.text();
  } catch (e) {
    const local = location.protocol === 'file:'
      ? ' La página se ha abierto como fichero local y el navegador no le deja leer otros ficheros: ábrela desde su dirección web (https://dinamicatech.github.io/NeoScore) o, en el equipo, con "python -m http.server" en la carpeta del proyecto y http://localhost:8000.'
      : '';
    return error(`No se ha podido cargar la partitura "${ruta}" (${e.message}).${local} Elige otra de la lista.`);
  }
  try {
    mostrarPartitura(leerMusicXML(texto, ruta), shown);
    aviso.className = ''; aviso.textContent = '';
  } catch (e) {
    error(`No se ha podido leer "${ruta}": ${e.message}`);
  }
}

const q = new URLSearchParams(location.search);
const ruta = q.get('partitura');
const shown = q.get('estrofas') ? q.get('estrofas').split(',').map(x => parseInt(x, 10) - 1).filter(k => k >= 0) : null;
if (ruta && !/^[a-z]+:|^\/\//i.test(ruta)) abrirPartitura(ruta, shown);
else {
  document.getElementById('titulo').textContent = 'NeoScore · neo-partituras';
  if (ruta) error('Solo se pueden abrir partituras de esta web, no direcciones de otros sitios.');
  else aviso.innerHTML = `Elige una partitura: ${lista()}`;
}
