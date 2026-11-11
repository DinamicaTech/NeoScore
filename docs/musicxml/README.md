---
title: Lectura de MusicXML
depends_on: []
---
## Summary
Convierte una partitura MusicXML en los datos que dibuja la neo-partitura: notas, duraciones, silencios, ligaduras, letra (sílabas y sinalefas con ‿), indicaciones de texto y dobles barras.
Lo hace la página en JavaScript (js/lector-musicxml.js, ver lector-javascript); neopartitura.py, el conversor en Python que lo hacía antes, está retirado.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · [replaced by 2026-11-11 17:20] Formato de datos interno: {title, shown?, parts:[{name, measures:[{e:[{p:midi,d:negras,t?:sílaba,tie?:1}|{r:1,d}], w?:indicación, end?:1}]}]}. Cada estrofa termina en una doble barra y toma su nombre de la indicación de texto, buscada en cualquier voz.
- 2026-11-11 14:20 · [replaced by musicxml/lector-javascript 2026-11-11 17:41] Uso actual: python neopartitura.py entrada.musicxml [salida.html] [--estrofas 1,2,5].
- 2026-11-11 17:20 · Formato de datos interno: {title, shown?, parts:[{name, oct?, measures:[{e:[{p:midi,d:negras,t?:sílaba,tie?:1}|{r:1,d}], w?:indicación, end?:1}]}]}. p es la altura escrita; oct (solo si no es 0) son los semitonos que hay que sumarle para la que suena: -12 en una voz con clef-octave-change -1 (tenor en clave de sol con un 8). Cada estrofa termina en una doble barra y toma su nombre de la indicación de texto, buscada en cualquier voz.

## Requirements
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho: neopartitura.py lee el MusicXML (notas, duraciones, silencios, ligaduras, letra, indicaciones de texto, dobles barras), genera un JSON y lo inserta en la plantilla; formato de datos.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Limitaciones conocidas: los guiones entre sílabas solo aparecen si el MusicXML los indica; solo se lee la primera línea de letra y se ignoran los acordes dentro de una misma voz; no se despliegan las repeticiones (casillas 1ª/2ª, da capo).
- 2026-11-11 13:55 · Si una partitura sale mal, comprueba primero si el problema está en el MusicXML de origen (por ejemplo, estrofas que solo aparecen como texto en el PDF) antes de tocar el conversor.
- 2026-11-11 17:06 · Derived from sonido: indicar, por voz, si suena una octava distinta de como se escribe, para que la nota de referencia suene a su altura real.
