---
title: Vista de letra
depends_on: [neo-partitura/controles, biblioteca/selector-y-carga, musicxml/lector-javascript]
threads:
  - 2026-11-12 19:40 · Vista de letra y ficheros .txt | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDv7y1RtXhucqaqinUsEan1vz
---
## Summary
Una tercera forma de ver la partitura: el botón "Vista: Neo-score / Pentagrama / Letra" muestra solo la letra de tu voz, por estrofas y en versos, sin notas ni tiempos; ahí no se toca ninguna nota, no se reproduce y no se canta (js/letra.js).
También se puede abrir con "Abrir fichero…" un .txt con solo la letra (un verso por línea, una línea en blanco entre estrofas): se ve siempre en vista de letra, sin botón de vista, sin voces y sin controles musicales. Si el .txt se llama como una partitura (la propia o una de la biblioteca), es su letra: la vista Letra de esa partitura la usa en lugar de la de las voces.

## Decisions
- 2026-11-12 19:40 · Creado como borrador a petición del propietario, junto a la vista de pentagrama.
- 2026-11-12 19:40 · Letra de una partitura MusicXML: la de tu voz, en las estrofas que se ven. Las sílabas se juntan en palabras (una sílaba que el MusicXML marca como principio o medio de palabra se pega a la siguiente) y una sinalefa (‿) se lee como espacio. Cada estrofa va en su bloque con su nombre, y el verso se corta en cada silencio de la voz, tras un punto, ?, !, ; o :, y tras una coma si el verso ya tiene 5 palabras o más.
- 2026-11-12 19:40 · En vista de letra se quedan Voz (cada voz puede tener su letra), Estrofas y Tamaño (aquí, el tamaño de la letra: de 16 a 32 px). Se ocultan el reproductor, el micrófono, el sonido, el repaso y la leyenda de colores; si algo sonaba, se para.
- 2026-11-12 19:40 · Fichero .txt: cada línea es un verso y una o más líneas en blanco separan las estrofas ("Estrofa 1", "Estrofa 2"…; con una sola, sin nombre). El título es el nombre del fichero sin ".txt" (los _ se leen como espacios). Con varias estrofas sale el desplegable de Estrofas, que se recuerda en el navegador ("neo-secs:letra:<título>"). Un .txt vacío, o que en realidad es un MusicXML, da un error que dice cómo arreglarlo.
- 2026-11-12 19:40 · [replaced by 2026-11-12 20:05] El .txt se guarda en el navegador como la partitura propia, en su mismo hueco "Mi partitura" (abrir un .txt sustituye al MusicXML guardado y al revés), y "Olvidar la mía" lo borra. Como no trae aviso de derechos, se muestra "Este fichero no trae aviso de derechos: respeta siempre los de su autor.".
- 2026-11-12 19:40 · La vista de letra se recuerda en el navegador ("neo-vista") como las otras: las siguientes partituras se abren en Letra hasta que se cambie. Un .txt no cambia la vista elegida.
- 2026-11-12 19:40 · Muntanyes del Canigó trae en su MusicXML todas las sílabas como sueltas (sin marcar qué sílabas forman una palabra), sin puntuación y con vocales repetidas en las notas largas ("ge la a des"), así que su letra sale como sílabas separadas; es un problema del MusicXML de origen, no de la vista. El Noi de la Mare sale bien, en sus cinco estrofas de cuatro versos.
- 2026-11-12 20:05 · No se mete la letra dentro del MusicXML (sus textos libres no tienen reglas y habría que modificar el fichero del usuario): la partitura y su letra van en ficheros separados que se unen por el nombre, sin carpeta, extensión ni mayúsculas (MiCancion.musicxml y MiCancion.txt).
- 2026-11-12 20:05 · Al abrir con "Abrir fichero…" un .txt que se llama como la partitura propia guardada o como una de la biblioteca, se guarda en el navegador como su letra (IndexedDB, clave "letra:<nombre>"), sin sustituir a la partitura propia, y se abre esa partitura en la vista Letra con un aviso que lo dice. Si no se llama como ninguna, es un .txt suelto: se guarda en el mismo hueco que la partitura propia, "Mi partitura" (la sustituye, y abrir después un MusicXML lo sustituye a él), y como no trae aviso de derechos se muestra "Este fichero no trae aviso de derechos: respeta siempre los de su autor.". "Olvidar mi letra" (visible cuando la partitura que se ve tiene una letra guardada) la borra; "Olvidar la mía" borra también la letra de la partitura propia.
- 2026-11-12 20:05 · La biblioteca puede llevar la letra de una canción para todos: el campo opcional "letra" de su ficha en biblioteca/indice.json, un .txt de la carpeta biblioteca/. La letra guardada en el navegador manda sobre la de la biblioteca.
- 2026-11-12 20:05 · Con una letra .txt unida, la vista Letra no tiene botones de voz (la letra es la misma para todas). Si el .txt tiene tantas estrofas como la partitura, se usa la misma elección de estrofas y sus nombres (con las estrofas 1, 2 y 5 se leen la 1, la 2 y la 5); si no, se ven todas las del .txt y no sale el desplegable de estrofas.
- 2026-11-12 20:05 · Muntanyes del Canigó lleva su letra en biblioteca/MuntanyesDelCanigo.txt, escrita a partir de las sílabas de la voz de soprano de su MusicXML: cuatro estrofas de cinco versos (el último se repite, como se canta), con la puntuación añadida a mano; "ara-a l'estiu" se escribe "ara a l'estiu".
- 2026-11-12 19:40 · Hecho cuando: con una partitura de la biblioteca se puede pasar a Letra y leerla por estrofas, sin notas y sin poder tocar nada; al abrir un .txt se ve su letra en Letra sin botón de vista ni controles musicales; las pruebas automáticas pasan (tests/letra.test.mjs) y el propietario lo valida en la página de prueba. Además, un .txt con el nombre de una partitura se ve en la vista Letra de esa partitura, y Muntanyes del Canigó se lee en Letra con su letra en versos.

- 2026-11-12 20:57 · Validado por el propietario: el nodo deja de ser borrador.

## Requirements
- 2026-11-12 19:15 · Vamos a añadir un nuevo modo a 'neo-score' y 'pentragrama': 'letra'.
- 2026-11-12 19:15 · Mostrará solo la letra de la canción (sin notas) de forma legible (sin tiempos). No se podrá reproducir una nota ni seleccionar un compás.
- 2026-11-12 19:15 · Esto permitirá cargar ficheros txt que solo tendrán la letra (la vista será 'letra' de forma fija y no aparecerán las opciones de vista)
- 2026-11-12 19:20 · answer: cómo se corta la letra de un MusicXML en versos → A, cada estrofa en su párrafo con un salto de línea en cada respiración, y las sílabas juntas en palabras.
- 2026-11-12 19:20 · Si se sube un fichero con el mismo nombre que el musicxml pero con extensión txt, se unificará para tener por un lado la partitura y por otro la letra (no sé si musicxml permite añadir una sección con solo la letra, sería lo ideal)
- 2026-11-12 19:20 · answer: qué controles se quedan en vista de letra → A, Voz, Estrofas y Tamaño; se ocultan el reproductor, el micrófono, el sonido, el repaso y la leyenda.
- 2026-11-12 19:20 · answer: cómo se escribe un .txt → A, un verso por línea, una línea en blanco entre estrofas y el título es el nombre del fichero.
- 2026-11-12 19:20 · answer: si se guarda el .txt en el navegador → A, en el mismo hueco "Mi partitura", con "Olvidar la mía".
- 2026-11-12 19:20 · answer: si se recuerda la vista de letra → A, sí; un .txt no cambia la vista elegida.
- 2026-11-12 19:30 · [answered 2026-11-12 20:05] question: Unir un .txt con su MusicXML del mismo nombre: ¿con qué partituras se une? A) con la propia guardada y con las de la biblioteca (y la biblioteca puede llevar el .txt de una canción a su lado); B) solo con la propia. ¿Se oculta Voz en vista de letra con un .txt unido? A) sí; B) no. ¿Y las estrofas? A) misma elección si coinciden en número, si no todas; B) siempre todas. Recomendación: A en las tres.
- 2026-11-12 20:05 · Ok a ficheros separados
- 2026-11-12 20:05 · answer: con qué partituras se une un .txt → A, con la propia guardada y con las de la biblioteca (que puede llevar el .txt de una canción); en vista Letra con un .txt unido se oculta Voz → A; estrofas → A, la misma elección si coinciden en número, si no todas.
- 2026-11-12 20:57 · Ok, puedes actualizar todo en GitHub?
