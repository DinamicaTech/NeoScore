// Vista de pentagrama (neo-partitura/vista-pentagrama): la partitura en pentagrama clásico, dibujada por
// OpenSheetMusicDisplay (js/vendor/opensheetmusicdisplay.min.js, que se carga solo la primera vez que hace falta).
// Cada voz que se ve va en su propio pentagrama (o todas juntas en uno, o en dos unidos si no caben), con sus notas
// del color de su botón; la letra es solo la de tu voz.
// Encima de cada nota pone la misma zona tocable que la neo-partitura (rect.toque, con data-p, data-e y, en tu voz,
// data-n): así la nota de referencia (js/sonido.js), el reproductor, el micrófono y el repaso funcionan igual.

import { prepararPentagrama } from './pentagrama-xml.js';
import { secuencia } from './afinacion.js';

// Un color por voz (por su orden en la partitura), lejos del verde, rosa y azul de afinada / alta / baja:
// violeta, naranja, cian, granate, oliva, morado, ocre y gris. Sobre fondo claro, oscuros (la mitad de luminosidad
// de los originales), para que se lean bien en el móvil; en modo oscuro, más claros (un 25% menos que los originales).
export const COLORES_VOZ = ['#2E1187', '#742C06', '#06434C', '#530F26', '#2E4A07', '#43174E', '#584400', '#24282C'];
export const COLORES_VOZ_OSCURO = ['#4619CB', '#AE4309', '#096473', '#7D173A', '#456F0A', '#642375', '#846700', '#373C41'];
// La vista de pentagrama fuerza el modo claro (clase claro-forzado, ver js/controles.js): los colores oscuros quedan
// para si algún día se quita ese forzado.
const modoOscuro = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches &&
  !(typeof document !== 'undefined' && document.documentElement.classList.contains('claro-forzado'));
export const colorVoz = i => (modoOscuro() ? COLORES_VOZ_OSCURO : COLORES_VOZ)[i % COLORES_VOZ.length];
const NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const SVG = 'http://www.w3.org/2000/svg';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let cargando = null;
function cargarOSMD() {
  if (globalThis.opensheetmusicdisplay) return Promise.resolve(globalThis.opensheetmusicdisplay);
  return cargando || (cargando = new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'js/vendor/opensheetmusicdisplay.min.js';
    s.onload = () => ok(globalThis.opensheetmusicdisplay);
    s.onerror = () => { cargando = null; s.remove(); mal(new Error('no se ha podido descargar el dibujo del pentagrama')); };
    document.head.append(s);
  }));
}

let turno = 0;          // cada dibujo nuevo deja sin efecto el anterior que aún se esté preparando
let previo = null;      // { clave, osmd, caja }: con la misma partitura, voces y estrofas solo se vuelve a maquetar

/**
 * Dibuja la vista de pentagrama. texto: el MusicXML original; part: tu voz; visibles: las otras voces que se ven;
 * zoom: el control de tamaño (40 = tamaño normal); juntos: todas las voces en un solo pentagrama;
 * el resto, como dibujar() de js/dibujo.js.
 */
export async function dibujarPentagrama({ data, texto, part, visibles, zoom, shown, secs, score, legend, juntos = false }) {
  const yo = ++turno;
  const partes = [...new Set([part, ...visibles])].filter(i => i >= 0 && i < data.parts.length).sort((a, b) => a - b);
  legend.innerHTML = partes.map(i => `<span><i style="background:${colorVoz(i)}"></i>${esc(data.parts[i].name)}${i === part ? ' <small>(tu voz, con su letra)</small>' : ''}</span>`).join('');
  juntos = juntos && partes.length > 1;
  const clave = JSON.stringify([data.title, partes, part, [...shown].sort((a, b) => a - b), juntos]);
  try {
    let o, caja;
    if (previo && previo.clave === clave && score.contains(previo.caja)) ({ osmd: o, caja } = previo);
    else {
      if (!previo || !score.querySelector('.pentagrama')) score.innerHTML = '<p class="preparando">Preparando el pentagrama…</p>';
      const lib = await cargarOSMD();
      if (yo !== turno) return;
      const colores = Object.fromEntries(partes.map(i => [i, colorVoz(i)]));
      const xml = prepararPentagrama(texto, { partes, mia: part, compases: i => shown.has(secs.de[i]), colores, juntos });
      caja = document.createElement('div'); caja.className = 'pentagrama';
      score.innerHTML = ''; score.append(caja);
      o = new lib.OpenSheetMusicDisplay(caja, {
        backend: 'svg', autoResize: false, pageFormat: 'Endless', drawTitle: false, drawSubtitle: false, drawComposer: false,
        drawLyricist: false, drawCredits: false, drawPartNames: true, drawMeasureNumbers: true, newSystemFromXML: false,
        newPageFromXML: false, defaultColorMusic: getComputedStyle(score).color,
      });
      await o.load(xml);
      if (yo !== turno) return;
      previo = { clave, osmd: o, caja };
    }
    o.zoom = Math.max(0.35, zoom / 40);
    o.render();
    enganchar(o, { data, partes, part, shown, secs, juntos });
  } catch (e) {
    if (yo !== turno) return;
    previo = null;
    score.innerHTML = `<p class="error">No se ha podido dibujar el pentagrama (${esc(e.message || e)}). Comprueba la conexión y recarga la página, o vuelve a la vista <b>Neo-score</b>, que sí funciona sin él.</p>`;
  }
  if (yo === turno) score.dispatchEvent(new CustomEvent('dibujada'));
}

/** Pone sobre cada nota dibujada su zona tocable, con los mismos datos que en la neo-partitura. */
function enganchar(o, { data, partes, part, shown, secs, juntos }) {
  const porVoz = partes.map(() => []);                 // notas dibujadas de cada voz, en orden
  for (const compas of o.GraphicSheet.MeasureList) {
    compas.forEach((gm, k) => {
      if (!gm) return;
      for (const se of gm.staffEntries) for (const gve of se.graphicalVoiceEntries) {
        const gn = gve.notes.find(n => !n.sourceNote.isRest());
        if (!gn) continue;
        // separadas: cada pentagrama es una voz; juntas: cada nota lleva su voz como número de <voice> (voz + 1)
        const p = juntos ? gve.parentVoiceEntry.ParentVoice.VoiceId - 1 : partes[k];
        const kk = partes.indexOf(p);
        if (kk >= 0) porVoz[kk].push({ gn, gm, linea: gm.ParentMusicSystem ? gm.ParentMusicSystem.Id : 0 });
      }
    });
  }
  partes.forEach((p, k) => {
    const notas = secuencia(data, p, shown, secs);   // las mismas notas, en el mismo orden, que suenan y se cantan
    const dibujadas = porVoz[k];
    for (let j = 0; j < Math.min(notas.length, dibujadas.length); j++) {
      const { gn, gm, linea } = dibujadas[j], x = notas[j];
      const g = gn.getSVGGElement && gn.getSVGGElement();
      if (!g || !g.ownerSVGElement) continue;
      const b = g.getBBox();
      const cabeza = g.querySelector('.vf-notehead') || g, bc = cabeza.getBBox();
      const r = document.createElementNS(SVG, 'rect');
      const abajo = p === part ? 34 : 10;               // tu voz: la zona llega hasta su sílaba
      r.setAttribute('class', 'toque');
      r.setAttribute('x', (b.x - 3).toFixed(1)); r.setAttribute('width', (b.width + 6).toFixed(1));
      r.setAttribute('y', (b.y - 8).toFixed(1)); r.setAttribute('height', (b.height + 8 + abajo).toFixed(1));
      r.dataset.p = x.midi; r.dataset.e = x.p; r.dataset.linea = linea; r.dataset.vista = 'pentagrama';
      if (p === part) {
        r.dataset.n = x.n; g.classList.add('nota-mia'); r.dataset.g = g.id || '';
        // para dibujar lo cantado (js/canto.js): el centro de la cabeza de la nota, el alto de un semitono y hasta
        // dónde llega la nota (la siguiente nota de tu voz en el mismo sistema, o un poco más allá de la cabeza)
        const sig = dibujadas[j + 1];
        const g2 = sig && sig.linea === linea && sig.gn.getSVGGElement && sig.gn.getSVGGElement();
        const fin = g2 ? (g2.querySelector('.vf-notehead') || g2).getBBox().x - 2 : bc.x + bc.width + 14;
        r.dataset.y = (bc.y + bc.height / 2).toFixed(1);
        r.dataset.semitono = (interlineado(gm) * 3.5 / 12).toFixed(2);   // 12 semitonos = 7 notas = 3,5 espacios
        r.dataset.x0 = bc.x.toFixed(1); r.dataset.x1 = Math.max(fin, bc.x + bc.width + 4).toFixed(1);
      }
      const t = document.createElementNS(SVG, 'title');
      t.textContent = `Toca para oír esta nota (${NAMES[x.p % 12]}${p === part ? '' : ', voz ' + data.parts[p].name})`;
      r.append(t);
      g.ownerSVGElement.append(r);
    }
  });
}

/** Distancia entre dos líneas del pentagrama del compás gm, en las unidades del dibujo (10 por defecto). */
function interlineado(gm) {
  const g = gm.getSVGGElement && gm.getSVGGElement();
  const ys = g ? [...g.querySelectorAll('.vf-stave path')].map(l => l.getBBox()).filter(b => b.height < 1 && b.width > 5).map(b => b.y).sort((a, b) => a - b) : [];
  const unicas = ys.filter((y, k) => !k || y - ys[k - 1] > 1);
  return unicas.length >= 2 ? (unicas[unicas.length - 1] - unicas[0]) / (unicas.length - 1) : 10;
}
