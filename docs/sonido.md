---
title: Nota de referencia
depends_on: [architecture, neo-partitura/controles, musicxml]
status: draft
threads:
  - 2026-11-11 18:20 · Nota de referencia | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvTPcUTg41TPZRYhy5A9zUJK
---
## Summary
Tocar una nota o sílaba de la neo-partitura y oír su sonido como referencia, con el instrumento que el usuario elija (piano, voz y, más adelante, otros).
Lo hace js/sonido.js con Tone.js: suena mientras se mantiene pulsada (como mínimo 1,2 s), con Voz (sintética, en "a", por defecto) o Piano (Salamander Grand Piano grabado, en sonidos/piano/).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 18:20 · Reproducción con Tone.js 15.1.22, copiado en js/vendor/Tone.js (licencia MIT) y cargado al abrir la página, para que la primera nota suene al momento.
- 2026-11-11 18:20 · Sonidos: Voz, sintetizada por la propia página (onda en diente de sierra con vibrato suave y tres filtros con los formantes de la vocal "a": 800, 1150 y 2900 Hz), y Piano, con las grabaciones del Salamander Grand Piano V3 de Alexander Holm (CC BY 3.0) en MP3, de A1 a C6, una cada tres semitonos, en sonidos/piano/ con su LICENCIA.md. Una voz grabada por el coro se podrá añadir más adelante como "Voz 2".
- 2026-11-11 18:20 · Sonido por defecto: Voz. La elección se guarda en el navegador (localStorage "neo-sonido").
- 2026-11-11 18:20 · Añadir un sonido grabado: una carpeta sonidos/<nombre>/ con un MP3 por nota (C4.mp3, Ds4.mp3…, "s" = sostenido), su LICENCIA.md y una entrada en la lista SONIDOS de js/sonido.js. Tone.js afina la grabación más cercana para las notas que falten.
- 2026-11-11 18:20 · Pulsación: la nota empieza al pulsar y sigue sonando mientras se mantiene pulsada, como mínimo 1,2 s y como mucho 30 s. En pantallas táctiles espera 120 ms antes de sonar y se calla si el dedo se desplaza, para no sonar al mover la página. La pulsación larga no abre el menú del navegador.
- 2026-11-11 18:20 · Suena la altura real: la de la nota escrita más la octava de la voz (campo oct del lector), para que el tenor suene una octava más grave de como se escribe.
- 2026-11-11 18:20 · Pruebas: tests/sonido.test.mjs comprueba los nombres de las notas, la lista de sonidos, que cada sonido grabado tiene sus ficheros y su licencia, y que las grabaciones cubren todas las notas de las partituras de ejemplo.
- 2026-11-11 18:20 · Hecho cuando: cada sílaba suena a su altura correcta con los dos sonidos, en móvil y en PC, y sigue sonando mientras se mantiene pulsada; lo valida el propietario en la página de prueba.

## Requirements
- 2026-11-11 13:55 · Poder seleccionar una nota/sílaba y que se emita el sonido de esa nota como referencia auditiva. Este sonido puede ser emulando un piano o una persona cantando esa nota (falta ver con qué tipo de sonido es más fácil detectar la resonancia para saber si se está afinando)
- 2026-11-11 14:14 · La idea es poder escoger piano/voz (ampliable en un futuro a más 'samples', como Voz1, Voz2, Flauta...) en la web así el usuario escoge la que mejor le ayuda a afinar.
- 2026-11-11 14:14 · Para la reproducción la que haya que ofrezca una buena calidad de reproducción (ya sea piano o voz).
- 2026-11-11 14:20 · draft: Al tocar una sílaba, hacer sonar su nota con Tone.js y el sonido elegido en un selector (piano o voz, ampliable). Hecho cuando cada sílaba suena a su altura correcta con los dos sonidos, en móvil y en PC.
- 2026-11-11 14:20 · [answered 2026-11-11 18:06] question: De dónde salen los sonidos. Opciones: A) piano grabado libre (por ejemplo Salamander, licencia CC-BY) y voz grabada por alguien del coro en vocal "a"; B) piano libre y una voz sintetizada; C) buscar un banco de voz libre ya grabado. Recomendación: A, porque los bancos de voz libres de buena calidad son escasos.
- 2026-11-11 14:20 · [answered 2026-11-11 18:06] question: Qué sonido se ofrece por defecto. Opciones: A) voz, porque es más fácil imitar un timbre parecido al propio; B) piano, más limpio y conocido. Recomendación: A, a confirmar probándolo con el coro.
- 2026-11-11 18:06 · Si se mantiene pulsado, que siga sonando la referencia.
- 2026-11-11 18:06 · answer: de dónde salen los sonidos → Ok a los samples: piano grabado Salamander (CC BY 3.0) y, de momento, una voz sintética; una voz grabada por el coro se añadirá más adelante.
- 2026-11-11 18:06 · answer: qué sonido se ofrece por defecto → Ok a voz.
