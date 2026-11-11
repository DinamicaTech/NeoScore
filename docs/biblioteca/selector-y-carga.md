---
title: Elegir o abrir una partitura
depends_on: [musicxml/lector-javascript]
status: draft
---
## Summary
En la web, elegir una partitura de la biblioteca en un selector, o abrir un MusicXML propio desde el equipo del usuario, que queda solo en su navegador.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.

## Requirements
- 2026-11-11 14:14 · La idea sería poder seleccionar en la página HTML una partitura y que luego la cargue.
- 2026-11-11 14:14 · Lo ideal sería poder cargar desde la propia web una nueva partitura musicXML
- 2026-11-11 14:20 · draft: Crear en la web un selector con las partituras de la biblioteca (una carpeta de MusicXML con su índice en el repositorio) y un botón para abrir un MusicXML propio. Hecho cuando se puede elegir cualquier partitura de la biblioteca o abrir un fichero propio y se dibuja su neo-partitura, y el aviso de derechos de cada partitura se muestra.
- 2026-11-11 14:20 · question: ¿Se recuerda en el navegador la partitura propia abierta, para no tener que volver a abrirla? Opciones: A) sí, guardada en el navegador (IndexedDB); B) no, hay que abrirla cada vez. Recomendación: A.
