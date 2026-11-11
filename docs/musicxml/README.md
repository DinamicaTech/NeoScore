---
title: Lectura de MusicXML
depends_on: []
---
## Summary
Convierte una partitura MusicXML en los datos que dibuja la neo-partitura: notas, duraciones, silencios, ligaduras, letra (sílabas y sinalefas con ‿), indicaciones de texto y dobles barras.
Hoy lo hace neopartitura.py (Python 3, solo biblioteca estándar), que genera un HTML a partir de la plantilla; pasará a hacerse en JavaScript dentro de la página (ver lector-javascript).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · Formato de datos interno: {title, shown?, parts:[{name, measures:[{e:[{p:midi,d:negras,t?:sílaba,tie?:1}|{r:1,d}], w?:indicación, end?:1}]}]}. Cada estrofa termina en una doble barra y toma su nombre de la indicación de texto, buscada en cualquier voz.
- 2026-11-11 14:20 · Uso actual: python neopartitura.py entrada.musicxml [salida.html] [--estrofas 1,2,5].

## Requirements
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho: neopartitura.py lee el MusicXML (notas, duraciones, silencios, ligaduras, letra, indicaciones de texto, dobles barras), genera un JSON y lo inserta en la plantilla; formato de datos.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Limitaciones conocidas: los guiones entre sílabas solo aparecen si el MusicXML los indica; solo se lee la primera línea de letra y se ignoran los acordes dentro de una misma voz; no se despliegan las repeticiones (casillas 1ª/2ª, da capo).
- 2026-11-11 13:55 · Si una partitura sale mal, comprueba primero si el problema está en el MusicXML de origen (por ejemplo, estrofas que solo aparecen como texto en el PDF) antes de tocar el conversor.
