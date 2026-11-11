---
title: Elegir o abrir una partitura
depends_on: [musicxml/lector-javascript]
threads:
  - 2026-11-11 17:55 · Selector de partituras y abrir fichero propio | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDv8gDiqytrKfg72LkEKxEUoY
---
## Summary
En la cabecera de la web, un desplegable con las partituras de la biblioteca (biblioteca/indice.json) y un botón "Abrir fichero…" para abrir un MusicXML propio, que queda solo en el navegador del usuario y este recuerda.
Bajo el título se muestran siempre la autoría y el aviso de derechos de la partitura. Código: js/pagina.js y js/biblioteca.js; pruebas en tests/biblioteca.test.mjs.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 17:55 · La biblioteca es la carpeta biblioteca/ de la raíz del repositorio: los MusicXML y su índice indice.json, con, para cada partitura y en el orden del desplegable, titulo, fichero (dentro de biblioteca/, sin subcarpetas), estrofas que se ven al abrir ("1,2,5"; vacío = todas), autoria y derechos. Los MusicXML se copian desde sources/, que se queda sin cambios como archivo de los ficheros originales.
- 2026-11-11 17:55 · Direcciones: index.html abre la primera partitura de la biblioteca; ?partitura=<ruta>&estrofas=1,2,5 abre una partitura de la propia web, nunca de otros sitios, con esas estrofas visibles al abrir (si es de la biblioteca, el desplegable la marca; las rutas antiguas sources/… se reconocen por el nombre del fichero); ?propia abre la partitura propia guardada. Elegir en el desplegable cambia la dirección, para que se pueda guardar o compartir.
- 2026-11-11 17:55 · Partitura propia: "Abrir fichero…" lee un .musicxml del equipo sin subirlo a ningún sitio. Si se lee bien, se guarda en el navegador (IndexedDB, base "neoscore"), sustituye a la anterior y aparece en el desplegable como "Mi partitura: <fichero>"; "Olvidar la mía" la borra. Un fichero que no se puede leer da el mensaje del lector y no sustituye a la guardada. Si el navegador no deja guardar, se abre igual y se avisa de que habrá que volver a abrirla.
- 2026-11-11 17:55 · Aviso de derechos: bajo el título, la autoría y, en negrita, el aviso de derechos. En la biblioteca salen del índice; en una partitura propia, del propio MusicXML (<identification><rights>), y si no trae ninguno se muestra "Este fichero no trae aviso de derechos: respeta siempre los de su autor.". Una prueba exige que el índice copie el aviso que trae cada MusicXML.
- 2026-11-11 17:58 · Validado por el propietario: el nodo deja de ser borrador.

## Requirements
- 2026-11-11 14:14 · La idea sería poder seleccionar en la página HTML una partitura y que luego la cargue.
- 2026-11-11 14:14 · Lo ideal sería poder cargar desde la propia web una nueva partitura musicXML
- 2026-11-11 14:20 · draft: Crear en la web un selector con las partituras de la biblioteca (una carpeta de MusicXML con su índice en el repositorio) y un botón para abrir un MusicXML propio. Hecho cuando se puede elegir cualquier partitura de la biblioteca o abrir un fichero propio y se dibuja su neo-partitura, y el aviso de derechos de cada partitura se muestra.
- 2026-11-11 14:20 · [answered 2026-11-11 17:53] question: ¿Se recuerda en el navegador la partitura propia abierta, para no tener que volver a abrirla? Opciones: A) sí, guardada en el navegador (IndexedDB); B) no, hay que abrirla cada vez. Recomendación: A.
- 2026-11-11 17:53 · answer: ¿se recuerda en el navegador la partitura propia abierta? → A, sí, guardada en el navegador (IndexedDB).
