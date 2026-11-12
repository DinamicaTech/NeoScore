// Vista de letra (neo-partitura/vista-letra): solo la letra de la canción, por estrofas y en versos, para leerla
// sin notas ni tiempos. No tiene zonas tocables: no suena ninguna nota, no se reproduce y no se canta.
// La letra sale de una voz del MusicXML (las sílabas se juntan en palabras y cada silencio de la voz corta el verso)
// o de un fichero .txt (cada línea es un verso y una línea en blanco separa las estrofas).
// Las funciones de cálculo no tocan la página, para que se puedan probar en Node.

const VERSO_LARGO = 5;   // palabras a partir de las cuales una coma también acaba el verso
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Letra de una voz del MusicXML: [{name, versos:[texto]}], una entrada por estrofa visible (shown) con letra.
 *  secs: resultado de estrofas(data). Las sílabas terminadas en "-" se pegan a la siguiente; una sinalefa (‿) se lee
 *  como espacio; cada silencio de la voz, el fin de la estrofa, un punto (o ?, !, ;, :) y una coma tras un verso
 *  de 5 palabras o más acaban el verso. */
export function letraDeVoz(data, part, shown, secs) {
  const res = [];
  let estrofa = null, verso = '';
  const cerrarVerso = () => { const v = verso.replace(/\s+/g, ' ').trim(); if (v && estrofa) estrofa.versos.push(v); verso = ''; };
  data.parts[part].measures.forEach((m, i) => {
    const k = secs.de[i];
    if (!shown.has(k)) return;
    if (!estrofa || estrofa.k !== k) {
      cerrarVerso();
      estrofa = { k, name: secs.lista[k].name, versos: [] };
      res.push(estrofa);
    }
    for (const e of m.e) {
      if (e.r) { cerrarVerso(); continue; }
      if (!e.t) continue;   // melisma o nota ligada: sin sílaba nueva
      const t = e.t.replace(/‿/g, ' ');
      if (t.endsWith('-')) { verso += t.slice(0, -1); continue; }
      verso += t + ' ';
      // fin de palabra con puntuación: un punto, ?, !, ; o : acaba el verso; una coma, solo si el verso ya es largo
      const palabras = verso.trim().split(/\s+/).length;
      if (/[.?!;:…»"]$/.test(t) || (/,$/.test(t) && palabras >= VERSO_LARGO)) cerrarVerso();
    }
  });
  cerrarVerso();
  return res.filter(e => e.versos.length).map(({ name, versos }) => ({ name, versos }));
}

/** Lee un fichero .txt de letra: {title, estrofas:[{name, versos}]}. El título es el nombre del fichero sin ".txt". */
export function leerTxt(texto, nombre = 'letra.txt') {
  const title = nombre.replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, '').replace(/_+/g, ' ').trim() || 'Letra';
  const bloques = String(texto).replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/);
  const versos = bloques.map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(v => v.length);
  if (!versos.length) throw new Error('El fichero de texto está vacío: escribe la letra con un verso en cada línea y una línea en blanco entre estrofas, guárdalo y vuelve a abrirlo con "Abrir fichero…".');
  if (/^\s*</.test(texto) && /<\/?[a-z-]+[\s>]/i.test(texto)) throw new Error('El fichero parece una partitura MusicXML con extensión .txt. Cámbiale la extensión a .musicxml y vuelve a abrirlo.');
  return { title, estrofas: versos.map((v, k) => ({ name: versos.length > 1 ? `Estrofa ${k + 1}` : '', versos: v })) };
}

/** Tamaño de la letra (px) según el control de Tamaño (12 a 70): de 16 a 32 px. */
export const tamanoLetra = zoom => Math.round(16 + (Math.min(70, Math.max(12, zoom)) - 12) * 16 / 58);

/** Dibuja la letra en score. estrofas: [{name, versos}]. Vacía la leyenda de colores, que aquí no hace falta. */
export function dibujarLetra({ estrofas, zoom, score, legend }) {
  legend.innerHTML = '';
  score.innerHTML = estrofas.length
    ? `<div class="letra" style="font-size:${tamanoLetra(zoom)}px">` + estrofas.map(e =>
        `<section>${e.name ? `<h2>${esc(e.name)}</h2>` : ''}<p>${e.versos.map(esc).join('<br>')}</p></section>`).join('') + '</div>'
    : '<p>No hay letra que mostrar: elige otra voz o más estrofas arriba.</p>';
  score.dispatchEvent(new CustomEvent('dibujada'));
}
