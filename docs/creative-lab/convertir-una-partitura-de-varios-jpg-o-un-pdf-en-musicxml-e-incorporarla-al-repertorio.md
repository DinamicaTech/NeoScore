---
title: Convertir una partitura de varios JPG o un PDF en musicxml e incorporarla al repertorio
depends_on: [biblioteca/selector-y-carga]
status: idea
threads:
  - 2026-11-12 16:16 · Convertir fotos o PDF en partitura | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvW795Nb5Ai8gUfqbCiAtr9x
---
## Summary
Idea para cerrar el círculo: incorporar una partitura que no está en MusicXML (fotos JPG del móvil, o un PDF nativo o escaneado).
Camino preferido en el debate: un botón de NeoScore abre Claude en otra pestaña con un prompt preparado; allí el usuario adjunta las fotos o el PDF con su propia cuenta, y Claude devuelve un fichero que NeoScore abre y comprueba. Así no hace falta clave ni servidor.
Ningún reconocedor es perfecto (la letra y los ritmos fallan a veces), así que hace falta un paso para revisar y corregir, y otro para pasar la partitura de "abierta en mi navegador" a la biblioteca de todos.

## Decisions
- 2026-11-12 16:16 · Creado en el laboratorio como idea; no se construye nada hasta que el propietario lo decida.

## Debate
Lo que se ha hablado hasta ahora, para quien siga el debate sin leer el hilo.
- Convertir una imagen de partitura en MusicXML se llama reconocimiento óptico de música (como el OCR de textos, pero con notas). Siempre comete errores, y la letra, que en NeoScore es lo principal, suele ser lo que peor reconocen los programas clásicos.
- Caminos vistos:
  1. Herramienta externa a mano (por ejemplo Audiveris, gratuito, o una app de móvil de pago) y abrir el resultado con "Abrir fichero…", que ya existe. Coste casi nulo para NeoScore.
  2. Conversión automática en GitHub: se dejan las fotos o el PDF en una carpeta y una acción los convierte con Audiveris. La web sigue estática.
  3. Reconocimiento dentro de la propia web: hoy no hay un reconocedor fiable que funcione solo en el navegador; poco realista.
  4. Claude como conversor desde el proyecto de Claude: el propietario adjunta las fotos en un hilo y Claude convierte, compara con el original, pregunta lo dudoso (silabación, autoría, derechos) y la añade a la biblioteca con su PR. La web no cambia.
  5. Claude llamado desde la web con una clave: descartado de momento, porque la clave no puede ir en una web estática y obligaría a tener un servidor.
  6. (Preferido) Claude en otra pestaña: el botón "Convertir con Claude" abre claude.ai con un prompt preparado (o lo copia, si el enlace no puede rellenarlo); el usuario adjunta los ficheros, que un enlace no puede llevar; Claude devuelve un fichero descargable (mejor que texto para copiar, porque un MusicXML ocupa miles de líneas) y NeoScore lo abre con "Abrir fichero…" o un recuadro "Pegar", lo comprueba y explica cualquier fallo.
- Corregir notas mal leídas sin construir un editor: pedírselo a Claude en la misma conversación ("en el compás 5 la tercera nota es un sol"), o abrir el MusicXML en MuseScore Studio (gratuito, en el PC) y guardarlo otra vez. Los editores web incrustables (Flat.io, Noteflight) son de pago y piden cuenta. Más adelante, si hiciera falta, un mini corrector en NeoScore.
- NeoScore no depende de GitHub: cualquier servidor web puede servir la carpeta tal cual. Con doble clic en index.html no funciona (el navegador bloquea la carga de partituras y sonidos) y el micrófono exige https o localhost.
- Claude lee muy bien la letra, pero con notas y ritmos exactos puede fallar: la revisión sigue haciendo falta.

## Requirements
- 2026-11-12 16:10 · Venga, vamos a cerrar el círculo. ¿Cómo podemos hacer para incorporar una nueva partitura que no esté en formato musicxml ? (pueden ser varios jpg de la cámara del móvil o un PDF nativo o escaneado)
- 2026-11-12 16:10 · idea: Incorporar al repertorio una partitura que no está en MusicXML (varias fotos JPG del móvil, o un PDF nativo o escaneado), convirtiéndola a MusicXML y añadiéndola a la biblioteca con su autoría y su aviso de derechos.
- 2026-11-12 16:12 · .... y enlazarlo con Claude ?
- 2026-11-12 16:15 · Y si la opción B abre Claude en otra pestaña de forma que la autenticación se gestione por ahí ? Lo único es cómo comunicar a este claude en la otra pestaña con neoscore. Quizá un prompt en concreto o que lo que genere claude se pueda copiar tal cual en neoscore ....
- 2026-11-12 16:16 · [answered 2026-11-12 16:23] question: ¿Qué formato pedimos a Claude? A) MusicXML directamente: NeoScore ya lo lee, pero es largo y fácil de estropear. B) Un formato propio sencillo (letra, notas y duraciones) que NeoScore convierte: más corto y fácil de escribir bien para Claude, pero hay que crearlo y mantenerlo. Recomendación: A, para no inventar un formato, con una comprobación clara al abrirlo.
- 2026-11-12 16:16 · question: ¿Cómo se revisan las notas mal leídas? A) Con lo que ya existe: comparar a ojo la vista de pentagrama con el original y escucharla. B) Una pantalla nueva con el original al lado para marcar y corregir notas. Recomendación: A primero; B solo si los errores son frecuentes.
- 2026-11-12 16:16 · question: ¿Cómo entra una partitura convertida en la biblioteca de todos? A) Solo el propietario, pidiéndoselo a un hilo de Claude, que la añade con su PR. B) Cualquier corista, con un botón que la envía para revisión. Recomendación: A, porque respeta la revisión de autoría y derechos.
- 2026-11-12 16:23 · answer: formato que se pide a Claude → MusicXML
- 2026-11-12 16:23 · 2. El tema es cómo se puede corregir una nota mal leída .... ¿hemos de añadir un editor de partituras? (existe alguno que podamos usar tal cual?)
- 2026-11-12 16:23 · 3. Depende. NeoScore funcionará solo en github o si me bajo el HTML puedo ejecutarlo en local o en un servidor propio ?
