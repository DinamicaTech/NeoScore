---
title: Biblioteca de partituras
depends_on: []
---
## Summary
Las partituras disponibles en la web: la carpeta biblioteca/ con sus MusicXML (y, si hace falta, su letra en .txt) y su índice indice.json, que la página ofrece en un desplegable (ver biblioteca/selector-y-carga). Hoy son Muntanyes del Canigó, El Noi de la Mare y A Montserrat; sus direcciones antiguas de examples/ llevan a la página con su partitura de la biblioteca.
El aviso de derechos de cada partitura se respeta siempre.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · El Noi de la Mare (versión coral de Abel Di Marco, Pbro., SATB, 5 estrofas) se abre con las estrofas 1, 2 y 5. Su aviso © A. Di Marco (solo fines pastorales, sin fines económicos) se respeta siempre.
- 2026-11-11 17:41 · [replaced by biblioteca/selector-y-carga 2026-11-11 17:55] Mientras no exista la carpeta de la biblioteca, la página abre los MusicXML de sources/ y las direcciones antiguas examples/*_neo.html llevan a ella con su partitura (ver musicxml/lector-javascript). Si las partituras se mueven, hay que actualizar esas direcciones y la lista provisional de js/pagina.js.
- 2026-11-11 17:55 · Las partituras viven en biblioteca/ (copiadas de sources/, que no cambia) con su índice biblioteca/indice.json: título, fichero, estrofas al abrir, autoría y aviso de derechos. Las direcciones antiguas examples/*_neo.html llevan a index.html?partitura=biblioteca/… con sus estrofas. Para añadir una partitura: copiar su .musicxml a biblioteca/ y añadirla al índice (una prueba exige que estén las dos cosas).
- 2026-11-12 16:51 · En el GitHub del propietario solo él añade partituras a la biblioteca pública, pidiéndoselo a un hilo de Claude con el MusicXML (por ejemplo, el que le dio "Convertir con Claude", ver biblioteca/convertir-con-claude). El hilo guarda el original en sources/, lo copia a biblioteca/, lo añade al índice con su autoría y aviso de derechos, le pregunta lo que no aparezca en la partitura y abre la PR. Quien tenga NeoScore en su propio servidor gestiona su propia biblioteca.
- 2026-11-12 20:05 · Cada ficha del índice puede llevar el campo opcional "letra": un .txt de biblioteca/ con solo la letra de la canción, que usa la vista Letra (ver neo-partitura/vista-letra). Muntanyes del Canigó lleva MuntanyesDelCanigo.txt. Una prueba exige que exista y se lea.
- 2026-11-13 07:40 · Se añade A Montserrat (tradicional, sin aviso de derechos, 3 voces: Soprano, Alto y Tenor; se abre con todas las estrofas). Su MusicXML lo transcribió el propietario y viene sin título: sources/AMontserrat.musicxml es el original y la copia de biblioteca/ lleva el título "A Montserrat". Sus sílabas vienen mal marcadas (muchas palabras pegadas y sin apóstrofos: "dun", "loes- pai"), así que su letra para la vista Letra va aparte en biblioteca/AMontserrat.txt, escrita a mano, con cada estrofa una sola vez, sin sus repeticiones.

## Requirements
- 2026-11-13 07:34 · A Montserrat. Sí, tradicional. Sin aviso de derechos. Todas.
- 2026-11-12 20:05 · Derived from neo-partitura/vista-letra: que una canción de la biblioteca pueda llevar su letra en un .txt al lado de su MusicXML.
- 2026-11-12 16:51 · Derived from biblioteca/convertir-con-claude: en el GitHub del propietario solo él añade partituras a la biblioteca, a través de un hilo de Claude.
- 2026-11-11 17:55 · Derived from biblioteca/selector-y-carga: la biblioteca es la carpeta biblioteca/ con sus MusicXML y su índice, que da el título, las estrofas al abrir, la autoría y el aviso de derechos de cada partitura.
- 2026-11-11 17:41 · Derived from musicxml/lector-javascript: las direcciones antiguas de los ejemplos (examples/*_neo.html) siguen llevando a su partitura.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Ejemplos actuales: Muntanyes del Canigó (tradicional catalana, armonización de Nadal Puig, SATB) y El Noi de la Mare (villancico popular catalán, versión coral de Abel Di Marco, Pbro., SATB, 5 estrofas; se abre con la 1, la 2 y la 5; uso pastoral).
- 2026-11-11 13:55 · © A. Di Marco: solo fines pastorales, sin fines económicos. Respeta siempre este aviso.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho: los ejemplos están en examples/, publicados con GitHub Pages en dinamicatech.github.io/NeoScore.
- 2026-11-11 13:55 · MusicXML completo de referencia: sources/ElNoiDeLaMare_completa.musicxml.
