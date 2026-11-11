---
title: Biblioteca de partituras
depends_on: []
---
## Summary
Las partituras disponibles en la web: la carpeta biblioteca/ con sus MusicXML y su índice indice.json, que la página ofrece en un desplegable (ver biblioteca/selector-y-carga). Hoy son Muntanyes del Canigó y El Noi de la Mare; sus direcciones antiguas de examples/ llevan a la página con su partitura de la biblioteca.
El aviso de derechos de cada partitura se respeta siempre.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · El Noi de la Mare (versión coral de Abel Di Marco, Pbro., SATB, 5 estrofas) se abre con las estrofas 1, 2 y 5. Su aviso © A. Di Marco (solo fines pastorales, sin fines económicos) se respeta siempre.
- 2026-11-11 17:41 · [replaced by biblioteca/selector-y-carga 2026-11-11 17:55] Mientras no exista la carpeta de la biblioteca, la página abre los MusicXML de sources/ y las direcciones antiguas examples/*_neo.html llevan a ella con su partitura (ver musicxml/lector-javascript). Si las partituras se mueven, hay que actualizar esas direcciones y la lista provisional de js/pagina.js.
- 2026-11-11 17:55 · Las partituras viven en biblioteca/ (copiadas de sources/, que no cambia) con su índice biblioteca/indice.json: título, fichero, estrofas al abrir, autoría y aviso de derechos. Las direcciones antiguas examples/*_neo.html llevan a index.html?partitura=biblioteca/… con sus estrofas. Para añadir una partitura: copiar su .musicxml a biblioteca/ y añadirla al índice (una prueba exige que estén las dos cosas).

## Requirements
- 2026-11-11 17:55 · Derived from biblioteca/selector-y-carga: la biblioteca es la carpeta biblioteca/ con sus MusicXML y su índice, que da el título, las estrofas al abrir, la autoría y el aviso de derechos de cada partitura.
- 2026-11-11 17:41 · Derived from musicxml/lector-javascript: las direcciones antiguas de los ejemplos (examples/*_neo.html) siguen llevando a su partitura.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Ejemplos actuales: Muntanyes del Canigó (tradicional catalana, armonización de Nadal Puig, SATB) y El Noi de la Mare (villancico popular catalán, versión coral de Abel Di Marco, Pbro., SATB, 5 estrofas; se abre con la 1, la 2 y la 5; uso pastoral).
- 2026-11-11 13:55 · © A. Di Marco: solo fines pastorales, sin fines económicos. Respeta siempre este aviso.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho: los ejemplos están en examples/, publicados con GitHub Pages en dinamicatech.github.io/NeoScore.
- 2026-11-11 13:55 · MusicXML completo de referencia: sources/ElNoiDeLaMare_completa.musicxml.
