// Arranque de la página: el selector de la biblioteca, el botón para abrir un MusicXML propio (o un .txt de letra),
// el aviso de derechos y la carga de la partitura elegida.
//   index.html                                            abre la primera partitura de la biblioteca
//   index.html?partitura=<ruta .musicxml>&estrofas=1,2,5  una partitura de esta web
//   index.html?propia                                     la partitura propia guardada en este navegador
// Un .txt que se llama como una partitura (MiCancion.txt y MiCancion.musicxml, la propia o una de la biblioteca) es su
// letra: se guarda aparte y la usa la vista de letra de esa partitura. Si no se llama como ninguna, se abre solo.
import { leerMusicXML } from './lector-musicxml.js';
import { mostrarPartitura, mostrarLetra, ponerVista } from './controles.js';
import { leerTxt } from './letra.js';
import { PROMPT, enlaceClaude, pasos } from './convertir.js';
import { leerIndice, derechosDelFichero, estrofasVisibles, guardarPropia, leerPropia, olvidarPropia,
  nombreBase, guardarLetra, leerLetra, olvidarLetra } from './biblioteca.js';

const $ = id => document.getElementById(id);
const aviso = $('aviso'), derechos = $('derechos'), selector = $('selector'), fichero = $('fichero'), olvidar = $('olvidar'), olvidarLetraBtn = $('olvidar-letra');
const enlace = p => '?partitura=' + encodeURIComponent(p.ruta) + (p.estrofas ? '&estrofas=' + p.estrofas : '');
const base = r => r.replace(/^.*[\\/]/, '');
const esTxt = nombre => /\.txt$/i.test(nombre);   // un fichero de letra: se ve siempre en la vista de letra
const SIN_DERECHOS = 'Este fichero no trae aviso de derechos: respeta siempre los de su autor.';
let biblioteca = [];
let letraGuardadaDe = null;   // la partitura que se ve, si tiene una letra .txt guardada en este navegador

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

/** Lee el MusicXML (o, si el fichero es .txt, la letra) y lo dibuja con su aviso de derechos. Devuelve si ha podido.
 *  letra: el .txt unido a la partitura ({nombre, texto}), si tiene; guardada: si esa letra está en este navegador. */
function mostrar(texto, nombre, shown, autoria, textoDerechos, letra = null, guardada = false) {
  try {
    letraGuardadaDe = null;
    if (esTxt(nombre)) mostrarLetra(leerTxt(texto, nombre));
    else {
      let letraTxt = null, avisoLetra = '';
      if (letra) {
        try { letraTxt = leerTxt(letra.texto, letra.nombre); if (guardada) letraGuardadaDe = nombre; }
        catch (e) { avisoLetra = `La letra "${base(letra.nombre)}" no se ha podido leer (${e.message}); la vista Letra usa la de la partitura.`; if (guardada) letraGuardadaDe = nombre; }
      }
      mostrarPartitura(leerMusicXML(texto, nombre), shown, texto, letraTxt);
      nota(avisoLetra);
    }
    if (esTxt(nombre)) nota('');
    mostrarDerechos(autoria, textoDerechos);
    return true;
  } catch (e) {
    error(`No se ha podido leer "${base(nombre)}": ${e.message} Elige otra partitura en el desplegable o abre otro fichero.`);
    return false;
  } finally {
    olvidarLetraBtn.hidden = !letraGuardadaDe;
  }
}
async function mostrarPropia(p) {
  const letra = esTxt(p.nombre) ? null : await leerLetra(p.nombre);
  return mostrar(p.texto, p.nombre, null, '', (!esTxt(p.nombre) && derechosDelFichero(p.texto)) || SIN_DERECHOS, letra, !!letra);
}

/** Descarga un fichero de esta web y devuelve su texto. */
async function descargar(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(r.status === 404 ? 'no existe en la web' : `el servidor respondió ${r.status}`);
  return r.text();
}

/** Descarga y muestra el MusicXML de una dirección de esta web; entrada: su ficha del índice, si la tiene.
 *  Su letra: letraAbierta (un .txt recién abierto que no se ha podido guardar), la guardada en este navegador para ella
 *  o, si no hay, la que trae la biblioteca (entrada.letra). */
async function abrirRuta(ruta, shown, entrada, letraAbierta = null) {
  let texto;
  try {
    texto = await descargar(ruta);
  } catch (e) {
    const local = location.protocol === 'file:'
      ? ' La página se ha abierto como fichero local y el navegador no le deja leer otros ficheros: ábrela desde su dirección web (https://dinamicatech.github.io/NeoScore) o, en el equipo, con "python -m http.server" en la carpeta del proyecto y http://localhost:8000.'
      : '';
    return error(`No se ha podido cargar la partitura "${ruta}" (${e.message}).${local} Elige otra en el desplegable de arriba.`);
  }
  let letra = letraAbierta || await leerLetra(ruta), guardada = !letraAbierta && !!letra, sinLetra = '';
  if (!letra && entrada && entrada.letra) {
    try { letra = { nombre: entrada.letra, texto: await descargar(entrada.letra) }; }
    catch (e) { sinLetra = `No se ha podido cargar la letra "${entrada.letra}" (${e.message}); la vista Letra usa la de la partitura. Recarga la página para volver a intentarlo.`; }
  }
  const textoDerechos = (entrada && entrada.derechos) || derechosDelFichero(texto);
  mostrar(texto, ruta, shown, entrada ? entrada.autoria : '', textoDerechos || (entrada ? '' : SIN_DERECHOS), letra, guardada);
  if (sinLetra) nota(sinLetra);
}

/** Un .txt que se llama como la partitura propia o como una de la biblioteca: se guarda como su letra y se abre
 *  esa partitura en la vista de letra. Devuelve false si no se llama como ninguna. */
async function unirLetra(p, propia) {
  const b = nombreBase(p.nombre);
  const conPropia = propia && !esTxt(propia.nombre) && nombreBase(propia.nombre) === b;
  const i = conPropia ? -1 : biblioteca.findIndex(e => nombreBase(e.ruta) === b);
  if (!conPropia && i < 0) return false;
  try { leerTxt(p.texto, p.nombre); }
  catch (e) { error(`No se ha podido leer "${p.nombre}": ${e.message}`); return true; }
  const destino = conPropia ? propia.nombre : biblioteca[i].ruta;
  let noGuardada = '';
  try { await guardarLetra({ nombre: destino.replace(/\.[^.\/\\]*$/, '') + '.txt', texto: p.texto }); }
  catch (e) { noGuardada = ` Este navegador no deja guardarla (${e.message}): la próxima vez tendrás que volver a abrirla.`; }
  ponerVista('letra');
  const titulo = conPropia ? propia.nombre : biblioteca[i].titulo;
  if (conPropia) {
    rellenarSelector(propia, 'propia');
    history.replaceState(null, '', '?propia');
    if (noGuardada) mostrar(propia.texto, propia.nombre, null, '', derechosDelFichero(propia.texto) || SIN_DERECHOS, p, false);
    else await mostrarPropia(propia);
  } else {
    const e = biblioteca[i];
    rellenarSelector(propia, 'b' + i);
    history.replaceState(null, '', enlace(e));
    await abrirRuta(e.ruta, estrofasVisibles(e.estrofas), e, noGuardada ? p : null);   // sin guardar: con la letra recién abierta
  }
  nota(`"${p.nombre}" es la letra de "${titulo}": se ve en la vista Letra, y la neo-score y el pentagrama siguen igual.${noGuardada}`);
  return true;
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
  const guardadaAntes = await leerPropia();
  if (esTxt(f.name) && await unirLetra(p, guardadaAntes)) return;
  if (!(await mostrarPropia(p))) return;
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
  try { const p = await leerPropia(); if (p) await olvidarLetra(p.nombre); await olvidarPropia(); } catch (e) { /* si no se puede borrar, no había nada guardado */ }
  location.search = biblioteca.length ? enlace(biblioteca[0]) : '';
};
olvidarLetraBtn.onclick = async () => {
  try { if (letraGuardadaDe) await olvidarLetra(letraGuardadaDe); } catch (e) { /* si no se puede borrar, no había nada guardado */ }
  location.reload();
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
