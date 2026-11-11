// Biblioteca de partituras: el índice biblioteca/indice.json, el aviso de derechos de cada partitura
// y la partitura propia del usuario, que se guarda solo en su navegador (IndexedDB).
import { leerXML } from './lector-musicxml.js';

export const CARPETA = 'biblioteca/';

/** Comprueba el índice y devuelve su lista de partituras, cada una con su ruta dentro de la web. */
export function leerIndice(json) {
  const lista = json && json.partituras;
  if (!Array.isArray(lista) || !lista.length) throw new Error('el índice no tiene ninguna partitura ("partituras" vacío)');
  return lista.map((p, i) => {
    if (!p.titulo || !p.fichero) throw new Error(`a la partitura n.º ${i + 1} del índice le falta el título o el fichero`);
    if (/[\/]|^\./.test(p.fichero)) throw new Error(`el fichero "${p.fichero}" debe estar dentro de la carpeta biblioteca/, sin subcarpetas`);
    if (p.estrofas && !/^\d+(,\d+)*$/.test(p.estrofas)) throw new Error(`las estrofas de "${p.titulo}" deben ser números separados por comas, como 1,2,5`);
    return { titulo: p.titulo, ruta: CARPETA + p.fichero, estrofas: p.estrofas || '', autoria: p.autoria || '', derechos: p.derechos || '' };
  });
}

/** Aviso de derechos que trae el propio MusicXML (<identification><rights>), o '' si no trae. */
export function derechosDelFichero(texto) {
  try {
    const id = leerXML(texto).children.find(c => c.name === 'identification');
    return (id ? id.children.filter(c => c.name === 'rights').map(r => r.text.trim()).filter(Boolean) : []).join(' · ');
  } catch (e) { return ''; }
}

/** Estrofas "1,2,5" → índices desde 0, o null para todas. */
export const estrofasVisibles = s => s ? s.split(',').map(x => parseInt(x, 10) - 1).filter(k => k >= 0) : null;

// ---- Partitura propia guardada en el navegador ----
const BD = 'neoscore', ALMACEN = 'partitura-propia';
function abrirBD() {
  return new Promise((ok, mal) => {
    if (typeof indexedDB === 'undefined') return mal(new Error('este navegador no permite guardar datos'));
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
}
async function operacion(modo, hacer) {
  const bd = await abrirBD();
  return new Promise((ok, mal) => {
    const tx = bd.transaction(ALMACEN, modo), r = hacer(tx.objectStore(ALMACEN));
    tx.oncomplete = () => { bd.close(); ok(r && r.result); };
    tx.onerror = tx.onabort = () => { bd.close(); mal(tx.error); };
  });
}
/** Guarda la partitura propia: {nombre, texto}. */
export const guardarPropia = p => operacion('readwrite', s => s.put(p, 'actual'));
/** Devuelve la partitura propia guardada ({nombre, texto}) o undefined. */
export const leerPropia = () => operacion('readonly', s => s.get('actual')).catch(() => undefined);
/** Olvida la partitura propia. */
export const olvidarPropia = () => operacion('readwrite', s => s.delete('actual'));
