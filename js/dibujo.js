// Dibujo de la neo-partitura: la letra arriba y, debajo de cada sílaba, la cuadrícula (filas = semitonos,
// columnas = tiempo) con un bloque de color por nota, la línea del contorno de la melodía y la leyenda de colores.

import { repartirEnLineas } from './lineas.js';

const ROW = 5;            // alto de cada semitono (px)
const TEXT_H = 20;        // franja de la letra
const IZQ = 1;            // margen izquierdo del dibujo: lo justo para que se vea la primera barra
const NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
// 12 colores bien distintos, por semitonos desde la primera nota (0 = azul)
const PALETTE = ['#2D6FD6', '#9CC3EE', '#7B4FD1', '#E89AC7', '#D6336C', '#F08C2E',
                 '#8C5A4B', '#E8B923', '#9DBF3B', '#2E9E5B', '#17B5C4', '#8A8F98'];
const color = k => PALETTE[k];

const canvas = document.createElement('canvas').getContext('2d');
const textW = t => { canvas.font = '14px system-ui, sans-serif'; return canvas.measureText(t).width; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const poly = pts => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--muted)" stroke-width="0.7" opacity="0.7"/>`;

/**
 * Dibuja una voz de la partitura.
 * data: datos del lector; part: índice de la voz; zoom: ancho de una negra (px); shown: Set de estrofas visibles;
 * secs: resultado de estrofas(data); score y legend: elementos donde se dibujan la partitura y la leyenda.
 */
export function dibujar({ data, part, zoom, shown, secs, score, legend }) {
  const P = data.parts[part], Q = zoom;
  const oct = P.oct || 0;   // voces escritas una octava más alta de lo que suenan (tenor en clave de sol con un 8)
  const notes = P.measures.flatMap(m => m.e).filter(e => !e.r);
  if (!notes.length) { score.innerHTML = '<p>Esta voz no tiene notas. Elige otra voz arriba.</p>'; legend.innerHTML = ''; return; }
  const lo = Math.min(...notes.map(e => e.p)), hi = Math.max(...notes.map(e => e.p));
  const first = notes[0].p, rows = hi - lo + 1, GH = rows * ROW;
  // ancho de cada evento: proporcional a la duración, pero sin pisar la sílaba
  const measures = P.measures.map((m, i) => {
    const evs = m.e.map(e => ({ ...e, w: Math.max(e.d * Q, e.t ? textW(e.t) + 6 : 6) }));
    // las indicaciones ("Estrofa 2"...) suelen estar solo en la voz de arriba: se toman de cualquier voz
    const label = m.w || data.parts.map(q => q.measures[i] && q.measures[i].w).find(Boolean);
    return { i, evs, w: evs.reduce((s, e) => s + e.w, 0) + 4, label, end: m.end || secs.finEn(i) };
  }).filter(m => shown.has(secs.de[m.i]));   // solo las estrofas elegidas
  // ancho para los compases: el de la partitura sin su padding, el margen izquierdo y la última barra
  const cs = getComputedStyle(score);
  const maxW = score.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - IZQ - 2;
  // reparte los compases en líneas; tras una doble barra (fin de estrofa) empieza línea nueva,
  // y un compás que no cabe solo en la pantalla (móvil en vertical) se parte en tramos
  const lines = repartirEnLineas(measures, maxW);

  const LBL_H = lines.some(l => l.some(m => m.label)) ? 14 : 0;   // franja para "Estrofa 2", "rit."...
  const y = p => TEXT_H + (hi - p) * ROW;
  score.innerHTML = lines.map(line => {
    const W = IZQ + 1 + line.reduce((s, m) => s + m.w, 0);
    let s = `<svg width="${W}" height="${LBL_H + TEXT_H + GH + 4}" role="img"><g transform="translate(0 ${LBL_H})">`;
    let lx = IZQ;
    for (const m of line) { if (m.label) s += `<text class="lbl" x="${lx + 3}" y="-3">${esc(m.label)}</text>`; lx += m.w; }
    for (let p = lo; p <= hi; p++) {
      const ref = (p - first) % 12 === 0;
      s += `<line x1="${IZQ}" x2="${W}" y1="${y(p) + ROW / 2}" y2="${y(p) + ROW / 2}" stroke="var(${ref ? '--ref' : '--grid'})" stroke-width="${ref ? 1.2 : 0.6}"/>`;
    }
    let x = IZQ, pts = [], prev = null;
    for (const m of line) {
      // barra del compás; discontinua si es un tramo que sigue el compás de la línea anterior
      s += `<line x1="${x}" x2="${x}" y1="${TEXT_H - 4}" y2="${TEXT_H + GH}" stroke="var(--bar)" stroke-width="1"${m.cont ? ' stroke-dasharray="3 3"' : ''}/>`;
      if (!m.cont) s += `<text class="mnum" x="${x + 2}" y="${TEXT_H + GH + 11}">${m.i + 1}</text>`;   // los tramos siguientes no repiten el número
      x += 2;
      for (const e of m.evs) {
        if (e.r) { if (pts.length) { s += poly(pts); pts = []; } prev = null; x += e.w; continue; }
        if (e.t) s += `<text class="syl" x="${x + 1}" y="${TEXT_H - 6}">${esc(e.t)}</text>`;
        const k = ((e.p - first) % 12 + 12) % 12, yy = y(e.p);
        const join = (e.tie || !e.t) && prev === e.p;   // ligadura o melisma en la misma nota
        s += `<rect x="${x + (join ? -1 : 1)}" y="${yy}" width="${e.w - (join ? 1 : 2)}" height="${ROW}" rx="1.5" fill="${color(k)}"/>`;
        // zona tocable (sílaba y bloque): js/sonido.js hace sonar la altura real (data-p)
        s += `<rect class="toque" x="${x}" y="0" width="${e.w}" height="${TEXT_H + GH}" data-p="${e.p + oct}"><title>Toca para oír esta nota (${NAMES[e.p % 12]})</title></rect>`;
        pts.push([x + 1, yy + ROW / 2], [x + e.w - 1, yy + ROW / 2]);
        prev = e.p; x += e.w;
      }
      x += 2;
    }
    if (pts.length) s += poly(pts);
    return s + `<line x1="${x}" x2="${x}" y1="${TEXT_H - 4}" y2="${TEXT_H + GH}" stroke="var(--bar)"/></g></svg>`;
  }).join('');

  const used = new Set(notes.map(e => ((e.p - first) % 12 + 12) % 12));
  legend.innerHTML =
    [...Array(12).keys()].filter(k => used.has(k)).map(k =>
      `<span><i style="background:${color(k)}"></i>${k === 0 ? 'primera nota' : '+' + k}<small>&nbsp;(${NAMES[(first + k) % 12]})</small></span>`).join('');
}
