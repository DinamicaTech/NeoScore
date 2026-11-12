---
title: Vista de letra
status: draft
depends_on: [neo-partitura/controles, biblioteca/selector-y-carga, musicxml/lector-javascript]
threads:
  - 2026-11-12 19:40 · Vista de letra y ficheros .txt | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDv7y1RtXhucqaqinUsEan1vz
---
## Summary
Una tercera forma de ver la partitura: el botón "Vista: Neo-score / Pentagrama / Letra" muestra solo la letra de tu voz, por estrofas y en versos, sin notas ni tiempos; ahí no se toca ninguna nota, no se reproduce y no se canta (js/letra.js).
También se puede abrir con "Abrir fichero…" un .txt con solo la letra (un verso por línea, una línea en blanco entre estrofas): se ve siempre en vista de letra, sin botón de vista, sin voces y sin controles musicales.

## Decisions
- 2026-11-12 19:40 · Creado como borrador a petición del propietario, junto a la vista de pentagrama.
- 2026-11-12 19:40 · Letra de una partitura MusicXML: la de tu voz, en las estrofas que se ven. Las sílabas se juntan en palabras (una sílaba que el MusicXML marca como principio o medio de palabra se pega a la siguiente) y una sinalefa (‿) se lee como espacio. Cada estrofa va en su bloque con su nombre, y el verso se corta en cada silencio de la voz, tras un punto, ?, !, ; o :, y tras una coma si el verso ya tiene 5 palabras o más.
- 2026-11-12 19:40 · En vista de letra se quedan Voz (cada voz puede tener su letra), Estrofas y Tamaño (aquí, el tamaño de la letra: de 16 a 32 px). Se ocultan el reproductor, el micrófono, el sonido, el repaso y la leyenda de colores; si algo sonaba, se para.
- 2026-11-12 19:40 · Fichero .txt: cada línea es un verso y una o más líneas en blanco separan las estrofas ("Estrofa 1", "Estrofa 2"…; con una sola, sin nombre). El título es el nombre del fichero sin ".txt" (los _ se leen como espacios). Con varias estrofas sale el desplegable de Estrofas, que se recuerda en el navegador ("neo-secs:letra:<título>"). Un .txt vacío, o que en realidad es un MusicXML, da un error que dice cómo arreglarlo.
- 2026-11-12 19:40 · El .txt se guarda en el navegador como la partitura propia, en su mismo hueco "Mi partitura" (abrir un .txt sustituye al MusicXML guardado y al revés), y "Olvidar la mía" lo borra. Como no trae aviso de derechos, se muestra "Este fichero no trae aviso de derechos: respeta siempre los de su autor.".
- 2026-11-12 19:40 · La vista de letra se recuerda en el navegador ("neo-vista") como las otras: las siguientes partituras se abren en Letra hasta que se cambie. Un .txt no cambia la vista elegida.
- 2026-11-12 19:40 · Muntanyes del Canigó trae en su MusicXML todas las sílabas como sueltas (sin marcar qué sílabas forman una palabra), sin puntuación y con vocales repetidas en las notas largas ("ge la a des"), así que su letra sale como sílabas separadas; es un problema del MusicXML de origen, no de la vista. El Noi de la Mare sale bien, en sus cinco estrofas de cuatro versos.
- 2026-11-12 19:40 · Hecho cuando: con una partitura de la biblioteca se puede pasar a Letra y leerla por estrofas, sin notas y sin poder tocar nada; al abrir un .txt se ve su letra en Letra sin botón de vista ni controles musicales; las pruebas automáticas pasan (tests/letra.test.mjs) y el propietario lo valida en la página de prueba.

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
- 2026-11-12 19:30 · question: Unir un .txt con su MusicXML del mismo nombre: ¿con qué partituras se une? A) con la propia guardada y con las de la biblioteca (y la biblioteca puede llevar el .txt de una canción a su lado); B) solo con la propia. ¿Se oculta Voz en vista de letra con un .txt unido? A) sí; B) no. ¿Y las estrofas? A) misma elección si coinciden en número, si no todas; B) siempre todas. Recomendación: A en las tres.
