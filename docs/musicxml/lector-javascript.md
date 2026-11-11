---
title: Lector de MusicXML en JavaScript
depends_on: [architecture, architecture/pruebas, biblioteca]
threads:
  - 2026-11-11 17:41 · Lector de MusicXML en JavaScript | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDv64KQEZ9AHMdT7SPXHwoxzi
---
## Summary
La página lee el MusicXML en JavaScript (js/lector-musicxml.js), sin Python ni librerías, con el mismo formato de datos que daba neopartitura.py, que queda retirado.
La web es index.html?partitura=<ruta>&estrofas=1,2,5, repartida en piezas para que se puedan cambiar por separado: lector, estrofas, controles, dibujo, carga (js/pagina.js) y estilos (css/).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 17:41 · Lector propio en js/lector-musicxml.js: trae su propio lector de XML mínimo (sin DOMParser ni librerías), para que funcione igual en el navegador y en las pruebas con Node. Lee solo MusicXML sin comprimir (.musicxml); con un .mxl, un fichero que no es MusicXML o un XML roto da un mensaje que explica cómo arreglarlo.
- 2026-11-11 17:41 · La página es index.html y abre la partitura indicada en la dirección: ?partitura=<ruta dentro de la web>&estrofas=1,2,5 (estrofas visibles al abrir, como el antiguo --estrofas). Solo abre rutas de la propia web. Sin ?partitura= muestra una lista provisional de las dos partituras de ejemplo, que sustituirá el selector de biblioteca/selector-y-carga.
- 2026-11-11 17:41 · La página se reparte en piezas: js/pagina.js (qué partitura se abre y su carga: biblioteca/selector-y-carga), js/lector-musicxml.js (lectura), js/estrofas.js, js/controles.js (voz, estrofas, tamaño), js/dibujo.js (cuadrícula, colores y leyenda: neo-partitura/movil-vertical y la reacción al tocar una sílaba de sonido) y css/neopartitura.css. Los ficheros .js son módulos (package.json solo lo indica, sin dependencias); la web hay que servirla (GitHub Pages, o python -m http.server en local), no abrirla con doble clic.
- 2026-11-11 17:41 · Dibuja exactamente igual que la plantilla antigua (comprobado comparando la partitura y la leyenda dibujadas de los dos ejemplos). Cambios menores: los textos de la partitura se escapan antes de dibujarlos y un control con hidden queda oculto de verdad.
- 2026-11-11 17:41 · Retirados neopartitura.py, neopartitura_template.html y tests/test_ejemplos.py. Los datos que daba neopartitura.py con los dos ejemplos se guardan en tests/referencia/ y tests/lector.test.mjs comprueba que el lector da exactamente los mismos.
- 2026-11-11 17:41 · Las direcciones antiguas examples/*_neo.html pasan a ser páginas que llevan a index.html con su partitura y sus estrofas (El Noi de la Mare con la 1, la 2 y la 5); tests/ejemplos.test.mjs comprueba que esa partitura existe.

- 2026-11-11 17:49 · Validado por el propietario: el nodo deja de ser borrador.
## Requirements
- 2026-11-11 14:20 · Derived from architecture: la página lee el MusicXML en JavaScript y produce el mismo formato de datos que hoy genera neopartitura.py.
- 2026-11-11 14:20 · draft: Escribir en JavaScript el lector de MusicXML que hoy está en neopartitura.py, con el mismo formato de datos. Hecho cuando las pruebas automáticas muestran que, para los ejemplos de la biblioteca, el resultado es igual al de neopartitura.py; entonces se retira neopartitura.py.
- 2026-11-11 17:49 · answer: cuánto se hace en este hilo y qué pasa con las direcciones antiguas de los ejemplos → A y A: lector, prueba, página repartida en piezas y retirada de neopartitura.py; las direcciones antiguas llevan a la página nueva (visualización validada).
