// Nota de referencia: al tocar una sílaba (o su bloque de color) suena su nota con el sonido elegido en la cabecera.
// Reproduce con Tone.js (js/vendor/Tone.js, copiado en el repositorio), que se carga al abrir la página.
// Se activa solo: busca en la página el recuadro #sonido (los botones) y la partitura #score, cuyas notas
// tocables dibuja dibujo.js como <rect class="toque" data-p="altura MIDI que suena">.
//
// Para añadir un sonido grabado (por ejemplo, "Flauta"): crea la carpeta sonidos/<nombre>/ con un .mp3 por nota,
// llamados como en el piano (C4.mp3, Ds4.mp3, Fs4.mp3, A4.mp3…; "s" = sostenido), y añade su entrada a SONIDOS.
// Tone.js rellena las notas que falten afinando la grabación más cercana.

export const SONIDOS = [
  { id: 'voz', nombre: 'Voz', tipo: 'voz',
    titulo: 'Oír cada nota cantada por una voz (sintética, en "a"): un timbre parecido al tuyo, fácil de imitar' },
  { id: 'piano', nombre: 'Piano', tipo: 'grabado', carpeta: 'sonidos/piano/',
    notas: ['A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6'],
    titulo: 'Oír cada nota con un piano de cola grabado: un sonido limpio y conocido' },
];
export const POR_DEFECTO = 'voz';
export const DURACION = 1.2;   // segundos que suena cada nota
const GUARDADO = 'neo-sonido';  // sonido elegido, guardado en este navegador

const NOMBRES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
/** Nombre de fichero de una altura MIDI: 60 → "C4", 63 → "Ds4". */
export const nombreFichero = midi => NOMBRES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
/** Nombre que entiende Tone.js: 63 → "D#4". */
export const nombreTone = midi => nombreFichero(midi).replace('s', '#');
/** Las grabaciones de un sonido, como las pide Tone.Sampler: {"D#4": "Ds4.mp3", …}. */
export const grabaciones = s => Object.fromEntries(s.notas.map(n => [n.replace('s', '#'), n + '.mp3']));

// ---- reproducción (solo en el navegador) ----

let tone = null;
function cargarTone() {
  if (!tone) tone = new Promise((ok, mal) => {
    if (globalThis.Tone) return ok(globalThis.Tone);
    const s = document.createElement('script');
    s.src = new URL('./vendor/Tone.js', import.meta.url).href;
    s.onload = () => ok(globalThis.Tone);
    s.onerror = () => { tone = null; mal(new Error('no se ha podido cargar el reproductor (js/vendor/Tone.js)')); };
    document.head.append(s);
  });
  return tone;
}

const instrumentos = {};
function instrumento(id) {
  if (!instrumentos[id]) instrumentos[id] = crear(SONIDOS.find(s => s.id === id)).catch(e => { delete instrumentos[id]; throw e; });
  return instrumentos[id];
}

async function crear(s) {
  const T = await cargarTone();
  if (s.tipo === 'grabado') {
    return new Promise((ok, mal) => {
      const sampler = new T.Sampler({
        urls: grabaciones(s), baseUrl: new URL('../' + s.carpeta, import.meta.url).href, release: 0.8,
        onload: () => ok((midi, dur) => sampler.triggerAttackRelease(nombreTone(midi), dur)),
        onerror: () => mal(new Error(`no se han podido descargar las grabaciones de "${s.nombre}" (${s.carpeta})`)),
      }).toDestination();
    });
  }
  // Voz sintética: una onda rica en armónicos, con un vibrato suave, pasada por tres filtros que imitan
  // las resonancias de la boca al cantar "a" (formantes a 800, 1150 y 2900 Hz).
  const salida = new T.Gain(2.2).toDestination();
  const vibrato = new T.Vibrato({ frequency: 5, depth: 0.08 });
  for (const [f, q, g] of [[800, 8, 1], [1150, 10, 0.5], [2900, 20, 0.12]]) {
    vibrato.chain(new T.Filter({ type: 'bandpass', frequency: f, Q: q }), new T.Gain(g), salida);
  }
  const voz = new T.PolySynth(T.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.12, decay: 0.2, sustain: 0.85, release: 0.35 },
  }).connect(vibrato);
  voz.volume.value = -6;
  return (midi, dur) => voz.triggerAttackRelease(T.Frequency(midi, 'midi').toFrequency(), dur);
}

function iniciar() {
  const caja = document.getElementById('sonido'), score = document.getElementById('score');
  if (!caja || !score) return;
  let elegido = POR_DEFECTO;
  try { const g = localStorage.getItem(GUARDADO); if (SONIDOS.some(s => s.id === g)) elegido = g; } catch (e) {}
  const aviso = document.getElementById('aviso');
  const fallo = e => {
    aviso.className = 'error';
    aviso.textContent = `No suena la nota: ${e.message}. Comprueba la conexión y vuelve a tocar la sílaba; si sigue igual, recarga la página.`;
  };

  caja.insertAdjacentHTML('beforeend', SONIDOS.map(s => `<button data-s="${s.id}" title="${s.titulo}">${s.nombre}</button>`).join(''));
  const marcar = () => caja.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.s === elegido));
  caja.onclick = e => {
    const id = e.target.dataset && e.target.dataset.s;
    if (!id) return;
    elegido = id; marcar();
    try { localStorage.setItem(GUARDADO, id); } catch (err) {}
    instrumento(id).catch(fallo);   // lo prepara ya, para que la primera nota no espere
  };
  marcar();
  // los botones solo se ven cuando hay una partitura con notas que tocar
  const ver = () => { caja.hidden = !score.querySelector('.toque'); };
  new MutationObserver(ver).observe(score, { childList: true });
  ver();

  score.addEventListener('click', async e => {
    const t = e.target.closest && e.target.closest('.toque');
    if (!t) return;
    t.classList.add('sonando');
    setTimeout(() => t.classList.remove('sonando'), DURACION * 1000);
    try {
      const T = await cargarTone();
      await T.start();   // el navegador solo deja sonar después de un toque del usuario
      (await instrumento(elegido))(+t.dataset.p, DURACION);
      if (aviso.className === 'error' && aviso.textContent.startsWith('No suena')) { aviso.className = ''; aviso.textContent = ''; }
    } catch (err) { fallo(err); }
  });

  // se prepara en cuanto se abre la página: así la primera nota suena al momento
  instrumento(elegido).catch(() => {});   // si falla, el aviso sale al tocar una sílaba
}

if (typeof document !== 'undefined') iniciar();
