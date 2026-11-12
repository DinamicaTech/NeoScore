// Arranque de la página: el selector de la biblioteca, el botón para abrir un MusicXML propio,
// el aviso de derechos y la carga de la partitura elegida.
//   index.html                                            abre la primera partitura de la biblioteca
//   index.html?partitura=<ruta .musicxml>&estrofas=1,2,5  una partitura de esta web
//   index.html?propia                                     la partitura propia guardada en este navegador
import { leerMusicXML } from './lector-musicxml.js';
import { mostrarPartitura, mostrarLetra } from './controles.js';
import { leerTxt } from './letra.js';
import { PROMPT, enlaceClaude, pasos } from './convertir.js';
import { leerIndice, derechosDelFichero, estrofasVisibles, guardarPropia, leerPropia, olvidarPropia } from './biblioteca.js';

const $ = id => document.getElementById(id);
const aviso = $('aviso'), derechos = $('derechos'), selector = $('selector'), fichero = $('fichero'), olvidar = $('olvidar');
const enlace = p => '?partitura=' + encodeURIComponent(p.ruta) + (p.estrofas ? '&estrofas=' + p.estrofas : '');
const base = r => r.replace(/^.*[\\/]/, '');
const esTxt = nombre => /\.txt$/i.test(nombre);   // un fichero de letra: se ve siempre en la vista de letra
const SIN_DERECHOS = 'Este fichero no trae aviso de derechos: respeta siempre los de su autor.';
let biblioteca = [];

function error(msg) { aviso.className = 'error'; aviso.textContent = msg; }
function nota(msg) { aviso.className = ''; aviso.textContent = msg; }

function mostrarDerechos(autoria, texto) {
  derechos.innerHTML = '';
  if (autoria) derechos.append(autoria);
  if (autoria && texto) derechos.append(document.createElement('br'));
  if (texto) { const b = document.createElement('b'); b.textContent = texto; derechos.append(b); }
  derechos.hidden = !autoria && !texto;
}

/** Rellena el desplegable: las partituras de la biblioteca y, si hay, la propia guardada. */
function rellenarSelector(propia, elegido) {
  selector.innerHTML = '';
  const opcion = (valor, texto) => { const o = document.createElement('option'); o.value = valor; o.textContent = texto; return o; };
  if (!elegido) selector.append(opcion('', 'Elige una partitura…'));
  if (biblioteca.length) {
    const g = document.createElement('optgroup'); g.label = 'Biblioteca';
    biblioteca.forEach((p, i) => g.append(opcion('b' + i, p.titulo)));
    selector.append(g);
  }
  if (propia) {
    const g = document.createElement('optgroup'); g.label = 'Guardada en este navegador';
    g.append(opcion('propia', 'Mi partitura: ' + propia.nombre));
    selector.append(g);
  }
  if (elegido && elegido.startsWith('otra:')) selector.append(opcion(elegido, base(elegido.slice(5))));
  selector.value = elegido || '';
  olvidar.hidden = !propia;
}

/** Lee el MusicXML (o, si el fichero es .txt, la letra) y lo dibuja con su aviso de derechos. Devuelve si ha podido. */
function mostrar(texto, nombre, shown, autoria, textoDerechos) {
  try {
    if (esTxt(nombre)) mostrarLetra(leerTxt(texto, nombre));
    else mostrarPartitura(leerMusicXML(texto, nombre), shown, texto);
    nota('');
    mostrarDerechos(autoria, textoDerechos);
    return true;
  } catch (e) {
    error(`No se ha podido leer "${base(nombre)}": ${e.message} Elige otra partitura en el desplegable o abre otro fichero.`);
    return false;
  }
}
const mostrarPropia = p => mostrar(p.texto, p.nombre, null, '', (!esTxt(p.nombre) && derechosDelFichero(p.texto)) || SIN_DERECHOS);

/** Descarga y muestra el MusicXML de una dirección de esta web; entrada: su ficha del índice, si la tiene. */
async function abrirRuta(ruta, shown, entrada) {
  let texto;
  try {
    const r = await fetch(ruta);
    if (!r.ok) throw new Error(r.status === 404 ? 'no existe en la web' : `el servidor respondió ${r.status}`);
    texto = await r.text();
  } catch (e) {
    const local = location.protocol === 'file:'
      ? ' La página se ha abierto como fichero local y el navegador no le deja leer otros ficheros: ábrela desde su dirección web (https://dinamicatech.github.io/NeoScore) o, en el equipo, con "python -m http.server" en la carpeta del proyecto y http://localhost:8000.'
      : '';
    return error(`No se ha podido cargar la partitura "${ruta}" (${e.message}).${local} Elige otra en el desplegable de arriba.`);
  }
  const textoDerechos = (entrada && entrada.derechos) || derechosDelFichero(texto);
  mostrar(texto, ruta, shown, entrada ? entrada.autoria : '', textoDerechos || (entrada ? '' : SIN_DERECHOS));
}

// ---- Controles ----
selector.onchange = () => {
  const v = selector.value;
  if (v === 'propia') location.search = '?propia';
  else if (v[0] === 'b') location.search = enlace(biblioteca[+v.slice(1)]);
};
$('abrir').onclick = () => fichero.click();
$('convertir').onclick = async () => {
  const pestana = window.open(enlaceClaude(), '_blank');
  if (pestana) pestana.opener = null;
  let copiado = false;
  try { await navigator.clipboard.writeText(PROMPT); copiado = true; } catch (e) { /* sin portapapeles: el enlace ya lleva el prompt */ }
  if (!pestana) return error(copiado
    ? 'El navegador no ha dejado abrir otra pestaña, pero las instrucciones están copiadas: abre claude.ai en otra pestaña, pégalas con Ctrl+V y sigue allí. Para la próxima vez, permite las ventanas emergentes de esta página.'
    : 'El navegador no ha dejado abrir otra pestaña ni copiar las instrucciones. Permite las ventanas emergentes de esta página y vuelve a pulsar "Convertir con Claude".');
  nota(pasos(copiado));
};
fichero.onchange = async () => {
  const f = fichero.files[0];
  fichero.value = '';
  if (!f) return;
  const p = { nombre: f.name, texto: await f.text() };
  if (!mostrarPropia(p)) return;
  history.replaceState(null, '', '?propia');
  try {
    await guardarPropia(p);
    rellenarSelector(p, 'propia');
  } catch (e) {
    rellenarSelector(null, 'otra:' + f.name);
    nota(`Abierta "${f.name}", pero este navegador no deja guardarla (${e.message}): la próxima vez tendrás que abrirla de nuevo con "Abrir fichero…".`);
  }
};
olvidar.onclick = async () => {
  try { await olvidarPropia(); } catch (e) { /* si no se puede borrar, no había nada guardado */ }
  location.search = biblioteca.length ? enlace(biblioteca[0]) : '';
};

// ---- Arranque ----
async function arrancar() {
  try {
    const r = await fetch('biblioteca/indice.json');
    if (!r.ok) throw new Error(`el servidor respondió ${r.status}`);
    biblioteca = leerIndice(await r.json());
  } catch (e) {
    error(`No se ha podido cargar la lista de la biblioteca (${e.message}). Puedes abrir un MusicXML propio con "Abrir fichero…".`);
  }
  const propia = await leerPropia();
  const q = new URLSearchParams(location.search);
  const ruta = q.get('partitura');
  if (q.has('propia')) {
    if (propia) { rellenarSelector(propia, 'propia'); mostrarPropia(propia); }
    else { rellenarSelector(null, ''); error('No hay ninguna partitura propia guardada en este navegador. Ábrela con "Abrir fichero…" o elige una de la biblioteca.'); }
  } else if (ruta) {
    if (/^[a-z]+:|^\/\//i.test(ruta)) {
      rellenarSelector(propia, '');
      return error('Solo se pueden abrir partituras de esta web, no direcciones de otros sitios. Elige una en el desplegable de arriba.');
    }
    // reconoce también las direcciones antiguas (sources/...) por el nombre del fichero
    const i = biblioteca.findIndex(p => p.ruta === ruta || base(p.ruta) === base(ruta));
    rellenarSelector(propia, i >= 0 ? 'b' + i : 'otra:' + ruta);
    abrirRuta(ruta, estrofasVisibles(q.get('estrofas')), biblioteca[i]);
  } else if (biblioteca.length) {
    rellenarSelector(propia, 'b0');
    abrirRuta(biblioteca[0].ruta, estrofasVisibles(biblioteca[0].estrofas), biblioteca[0]);
  } else {
    rellenarSelector(propia, '');
    $('titulo').textContent = 'NeoScore · neo-partituras';
  }
}
arrancar();
