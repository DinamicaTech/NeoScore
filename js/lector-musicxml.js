// Lector de MusicXML: convierte el texto de una partitura MusicXML en los datos que dibuja la neo-partitura.
// Formato de salida (el mismo que generaba neopartitura.py):
//   {title, tempo?, parts:[{name, oct?:semitonos, measures:[{e:[{p:midi, d:negras, t?:sílaba, tie?:1} | {r:1, d}], w?:indicación, end?:1}]}]}
// p es la altura escrita. oct (solo si no es 0) es lo que hay que sumarle para la altura que suena: -12 en una voz
// escrita en clave de sol con un 8 debajo (tenor), que suena una octava más grave. Lo usa la nota de referencia (sonido).
// tempo (solo si la partitura lo trae) es la velocidad al empezar, en negras por minuto; lo usa el modo de canto.
// Funciona igual en el navegador y en Node (pruebas): no usa DOMParser ni librerías, trae su propio lector de XML.

const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DOBLE_BARRA = ['light-light', 'light-heavy', 'heavy-light', 'heavy-heavy'];

/** Lee una partitura MusicXML (texto) y devuelve sus datos. `nombre` es el nombre del fichero, para el título por defecto. */
export function leerMusicXML(texto, nombre = 'partitura') {
  const root = leerXML(texto);
  if (root.name !== 'score-partwise') {
    throw new Error(root.name === 'score-timewise'
      ? 'La partitura está en MusicXML "timewise", que no se puede leer. Expórtala de nuevo desde MuseScore (Archivo → Exportar → MusicXML).'
      : `El fichero no es una partitura MusicXML (empieza por <${root.name}>). Exporta la partitura desde MuseScore con Archivo → Exportar → MusicXML.`);
  }
  const title = findtext(root, 'work/work-title') || findtext(root, 'movement-title') || nombre.replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, '');
  const names = {};
  for (const sp of findall(find(root, 'part-list') || hoja(), 'score-part')) names[sp.attrs.id] = findtext(sp, 'part-name');
  const parts = [];
  for (const p of findall(root, 'part')) {
    let divisions = 1;
    const measures = [];
    for (const m of findall(p, 'measure')) {
      const d = find(m, 'attributes/divisions');
      if (d) divisions = entero(d.text);
      const events = [];
      for (const n of findall(m, 'note')) {
        if (find(n, 'chord') || find(n, 'grace')) continue;
        const dur = entero(findtext(n, 'duration') || '0') / divisions;   // en negras
        if (find(n, 'rest')) { events.push({ r: 1, d: dur }); continue; }
        const pt = find(n, 'pitch');
        if (!pt) throw new Error(`Una nota del compás ${m.attrs.number || '?'} no tiene altura (¿percusión o nota sin afinar?). Revisa la partitura en MuseScore.`);
        const midi = 12 * (entero(findtext(pt, 'octave')) + 1) + STEP[findtext(pt, 'step').trim()] + Math.trunc(Number(findtext(pt, 'alter') || 0));
        const ev = { p: midi, d: dur };
        const ly = find(n, 'lyric');
        if (ly && findtext(ly, 'text')) {
          // varias sílabas en una nota (sinalefa): na‿en
          const texts = findall(ly, 'text').map(t => t.text);
          const syls = findall(ly, 'syllabic').map(s => s.text);
          const syl = syls.length ? syls[syls.length - 1] : 'single';
          ev.t = texts.join('‿') + (syl === 'begin' || syl === 'middle' ? '-' : '');
        }
        if (findall(n, 'tie').some(t => t.attrs.type === 'stop')) ev.tie = 1;
        events.push(ev);
      }
      const measure = { e: events };
      // indicaciones de texto ("Estrofa 2", "rit.") y fin de sección (doble barra)
      const words = findall(m, 'direction/direction-type/words').map(w => w.text.trim()).filter(Boolean);
      if (words.length) measure.w = words.join(' · ');
      const barra = findall(m, 'barline').filter(b => b.attrs.location === 'right').map(b => find(b, 'bar-style')).find(Boolean);
      if (barra && DOBLE_BARRA.includes(barra.text)) measure.end = 1;
      measures.push(measure);
    }
    const id = p.attrs.id;
    const part = { name: id in names ? names[id] : id, measures };
    const octava = findall(p, 'measure/attributes/clef/clef-octave-change')[0];
    if (octava && entero(octava.text)) part.oct = 12 * entero(octava.text);
    parts.push(part);
  }
  if (!parts.length) throw new Error('La partitura no tiene ninguna voz (parte). Revisa que se haya exportado entera.');
  const tempo = leerTempo(root);
  return tempo ? { title, tempo, parts } : { title, parts };
}

// Negras por la unidad de la indicación de metrónomo (♩ = 80, ♪ = 120, 𝅗𝅥 = 60…).
const UNIDAD = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 };
/** Tempo con el que empieza la partitura, en negras por minuto: el primer <sound tempo>, si no la primera
 *  indicación de metrónomo. null si no trae ninguno (o no es un número razonable). */
function leerTempo(root) {
  const medidas = findall(root, 'part/measure');
  for (const m of medidas) {
    for (const s of [...findall(m, 'sound'), ...findall(m, 'direction/sound')]) {
      const t = parseFloat(s.attrs.tempo);
      if (t >= 20 && t <= 400) return Math.round(t);
    }
  }
  for (const met of findall(root, 'part/measure/direction/direction-type/metronome')) {
    const pm = parseFloat(findtext(met, 'per-minute')), u = UNIDAD[(findtext(met, 'beat-unit') || '').trim()];
    const punto = find(met, 'beat-unit-dot') ? 1.5 : 1;
    if (pm > 0 && u) { const t = Math.round(pm * u * punto); if (t >= 20 && t <= 400) return t; }
  }
  return null;
}

function entero(s) {
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) throw new Error(`Valor numérico no válido en la partitura: "${s}".`);
  return n;
}

// ---- Búsqueda en el árbol, como ElementTree de Python: rutas de hijos directos separados por "/" ----
const hoja = () => ({ name: '', attrs: {}, children: [], text: '' });
function findall(el, ruta) {
  let nivel = [el];
  for (const nombre of ruta.split('/')) nivel = nivel.flatMap(e => e.children.filter(c => c.name === nombre));
  return nivel;
}
const find = (el, ruta) => findall(el, ruta)[0] || null;
const findtext = (el, ruta) => { const e = find(el, ruta); return e ? e.text : null; };

// ---- Lector de XML mínimo ----
// Cada elemento: {name, attrs, children, text}; `text` es el texto anterior a su primer hijo (como .text en ElementTree).
const ENTIDADES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
const desescapar = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    : ENTIDADES[e] ?? m);

export function leerXML(xml) {
  const pila = [], error = msg => new Error(`El fichero no es un XML válido (${msg}). Vuelve a exportar la partitura como MusicXML sin comprimir (.musicxml).`);
  if (xml.startsWith('PK')) throw new Error('El fichero es un MusicXML comprimido (.mxl). Expórtalo sin comprimir: en MuseScore, Archivo → Exportar → MusicXML (.musicxml).');
  let raiz = null, i = 0;
  const texto = t => {
    const actual = pila[pila.length - 1];
    if (actual && !actual.children.length) actual.text += t;
  };
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    if (lt < 0) { texto(desescapar(xml.slice(i))); break; }
    if (lt > i) texto(desescapar(xml.slice(i, lt)));
    if (xml.startsWith('<!--', lt)) { i = cerrar(xml, '-->', lt); continue; }
    if (xml.startsWith('<?', lt)) { i = cerrar(xml, '?>', lt); continue; }
    if (xml.startsWith('<![CDATA[', lt)) { const f = cerrar(xml, ']]>', lt); texto(xml.slice(lt + 9, f - 3)); i = f; continue; }
    if (xml.startsWith('<!', lt)) {   // <!DOCTYPE ...>, con posible bloque [ ... ]
      let j = lt + 2, prof = 0;
      while (j < xml.length && !(xml[j] === '>' && prof === 0)) { if (xml[j] === '[') prof++; else if (xml[j] === ']') prof--; j++; }
      i = j + 1; continue;
    }
    if (xml[lt + 1] === '/') {
      const gt = xml.indexOf('>', lt);
      const nombre = xml.slice(lt + 2, gt).trim();
      const el = pila.pop();
      if (!el || el.name !== nombre) throw error(`cierre </${nombre}> inesperado`);
      i = gt + 1; continue;
    }
    // etiqueta de apertura: nombre, atributos y posible cierre "/>"
    const re = /\s*([^\s=\/>]+)\s*=\s*("([^"]*)"|'([^']*)')|\s*(\/?)>/y;
    const m0 = /<([^\s\/>]+)/y; m0.lastIndex = lt;
    const mn = m0.exec(xml); if (!mn) throw error('etiqueta mal formada');
    const el = { name: mn[1], attrs: {}, children: [], text: '' };
    re.lastIndex = m0.lastIndex;
    let cerrada = false, mm;
    for (;;) {
      mm = re.exec(xml);
      if (!mm) throw error(`etiqueta <${el.name}> mal formada`);
      if (mm[1]) el.attrs[mm[1]] = desescapar(mm[3] ?? mm[4]);
      else { cerrada = mm[5] === '/'; break; }
    }
    i = re.lastIndex;
    if (pila.length) pila[pila.length - 1].children.push(el);
    else if (!raiz) raiz = el;
    else throw error('hay más de un elemento raíz');
    if (!cerrada) pila.push(el);
  }
  if (pila.length) throw error(`falta cerrar <${pila[pila.length - 1].name}>; ¿el fichero está incompleto?`);
  if (!raiz) throw error(xml.trim() ? 'no contiene ninguna etiqueta XML' : 'está vacío');
  return raiz;
}
function cerrar(xml, fin, desde) {
  const j = xml.indexOf(fin, desde);
  if (j < 0) throw new Error('El fichero no es un XML válido (está cortado). Vuelve a exportar la partitura como MusicXML.');
  return j + fin.length;
}
