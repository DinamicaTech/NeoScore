// Tamaño de la partitura con la pinza (nodo neo-partitura/controles): en el móvil o la tablet, dos dedos sobre la partitura
// o la letra la agrandan o la encogen sin hacer zoom en toda la página; en el PC, la pinza del panel táctil o Ctrl + rueda.
// Mientras dura el gesto se ve una vista previa (la partitura escalada); al soltar se vuelve a dibujar con el tamaño nuevo,
// cortando las líneas al ancho de la pantalla, y la zona donde se hizo la pinza sigue a la vista.

export const MIN = 12, MAX = 70, NORMAL = 40;
const GUARDADO = 'neo-tamano';   // el último tamaño, guardado en este navegador

/** El tamaño (ancho de una negra en px, de 12 a 70) tras escalar el inicial por factor; un valor no válido da el normal. */
export function tamanoTras(inicial, factor) {
  const t = Math.round(inicial * factor);
  return Number.isFinite(t) ? Math.min(MAX, Math.max(MIN, t)) : NORMAL;
}

/** Distancia entre los dos primeros dedos de un evento táctil. */
const distancia = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
const centro = t => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });

/** El tamaño guardado en este navegador, o el normal. */
export function tamanoGuardado() {
  try { const t = +localStorage.getItem(GUARDADO); if (t >= MIN && t <= MAX) return Math.round(t); } catch (e) {}
  return NORMAL;
}

/**
 * Activa la pinza sobre el elemento score. leer(): el tamaño actual; poner(t): guarda el tamaño t y vuelve a dibujar
 * (puede devolver una promesa que acaba cuando está dibujado).
 */
export function activarPinza(score, leer, poner) {
  let gesto = null;   // { inicial, factor, x, y }: tamaño al empezar, escala de la vista previa y punto de la pinza (en pantalla)

  const previa = () => {
    const r = score.getBoundingClientRect();
    score.style.transformOrigin = `${gesto.x - r.left}px ${gesto.y - r.top}px`;
    score.style.transform = `scale(${tamanoTras(gesto.inicial, gesto.factor) / gesto.inicial})`;
  };

  async function soltar() {
    if (!gesto) return;
    const g = gesto; gesto = null;
    const nuevo = tamanoTras(g.inicial, g.factor);
    score.style.transform = ''; score.style.transformOrigin = '';
    if (nuevo === g.inicial) return;
    // la proporción de alto de la partitura que queda por encima del punto de la pinza, para que siga a la vista al redibujar
    const antes = score.getBoundingClientRect(), fraccion = antes.height ? (g.y - antes.top) / antes.height : 0;
    try { localStorage.setItem(GUARDADO, nuevo); } catch (e) {}
    await poner(nuevo);
    await new Promise(r => setTimeout(r, 0));
    const despues = score.getBoundingClientRect();
    scrollBy(0, despues.top + fraccion * despues.height - g.y);
  }

  // Pantallas táctiles: con dos dedos sobre la partitura, el navegador no hace su zoom (touch-action en el CSS y preventDefault)
  score.addEventListener('touchstart', e => {
    if (e.touches.length !== 2) return;
    gesto = { inicial: leer(), factor: 1, d0: distancia(e.touches), ...centro(e.touches) };
  }, { passive: true });
  score.addEventListener('touchmove', e => {
    if (!gesto || e.touches.length !== 2) return;
    e.preventDefault();
    gesto.factor = gesto.d0 ? distancia(e.touches) / gesto.d0 : 1;
    Object.assign(gesto, centro(e.touches));
    previa();
  }, { passive: false });
  score.addEventListener('touchend', e => { if (e.touches.length < 2) soltar(); });
  score.addEventListener('touchcancel', () => soltar());
  // Safari (iPhone, iPad) hace su zoom con sus propios eventos "gesture": se cancelan sobre la partitura
  for (const tipo of ['gesturestart', 'gesturechange']) score.addEventListener(tipo, e => e.preventDefault(), { passive: false });

  // PC: la pinza del panel táctil llega como rueda con Ctrl, igual que Ctrl + rueda del ratón
  let espera = 0;
  score.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (!gesto) gesto = { inicial: leer(), factor: 1 };
    gesto.x = e.clientX; gesto.y = e.clientY;
    gesto.factor *= Math.exp(-Math.min(25, Math.max(-25, e.deltaY)) * 0.01);   // un golpe de rueda (100) no pasa de un 28 %
    gesto.factor = Math.min(MAX / gesto.inicial, Math.max(MIN / gesto.inicial, gesto.factor));   // no pasar de los límites
    previa();
    clearTimeout(espera);
    espera = setTimeout(soltar, 250);
  }, { passive: false });
}
