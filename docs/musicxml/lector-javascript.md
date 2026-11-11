---
title: Lector de MusicXML en JavaScript
depends_on: [architecture]
status: draft
---
## Summary
Pasar la lectura del MusicXML de neopartitura.py a JavaScript, dentro de la página, para que la web cargue cualquier MusicXML sin Python.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.

## Requirements
- 2026-11-11 14:20 · Derived from architecture: la página lee el MusicXML en JavaScript y produce el mismo formato de datos que hoy genera neopartitura.py.
- 2026-11-11 14:20 · draft: Escribir en JavaScript el lector de MusicXML que hoy está en neopartitura.py, con el mismo formato de datos. Hecho cuando las pruebas automáticas muestran que, para los ejemplos de la biblioteca, el resultado es igual al de neopartitura.py; entonces se retira neopartitura.py.
