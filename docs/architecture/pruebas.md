---
title: Pruebas automáticas
depends_on: []
threads:
  - 2026-11-11 15:45 · Base de pruebas automáticas | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvUdPSZNqG2DywAdZoVLxmYn
---
## Summary
Pruebas automáticas que se ejecutan en GitHub (acción "Pruebas") en cada pull request, en cada cambio en main y cada lunes, con node:test y unittest, sin instalar nada.
Viven en tests/ (tests/test_*.py y tests/*.test.mjs); la principal comprueba que el lector de MusicXML en JavaScript da con los ejemplos exactamente los mismos datos que daba neopartitura.py.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 15:45 · [replaced by 2026-11-11 17:41] Acción de GitHub .github/workflows/pruebas.yml: en cada pull request, en cada push a main, cada lunes a las 6:00 UTC y a mano. Ejecuta `python3 -m unittest discover -s tests -p 'test_*.py'` y, si existen, `node --test tests/*.test.mjs`. Para añadir pruebas basta con crear un fichero con ese nombre en tests/ (explicado en tests/README.md).
- 2026-11-11 15:45 · [replaced by musicxml/lector-javascript 2026-11-11 17:41] Prueba de los ejemplos (tests/test_ejemplos.py): convierte cada ejemplo de la lista EJEMPLOS con neopartitura.py y lo compara con la página guardada, ignorando los fines de línea. Si un cambio querido altera los ejemplos, se regeneran con `python tests/test_ejemplos.py --actualizar`.
- 2026-11-11 15:45 · El MusicXML de Muntanyes del Canigó (el mismo con el que se generó el ejemplo: mismas notas y letra) se guarda en sources/MuntanyesDelCanigo.musicxml y su página de ejemplo se regenera con la versión actual del conversor, con lo que gana los controles nuevos (desplegable de estrofas, indicaciones de texto). Opción A del propietario.
- 2026-11-11 15:55 · Validado por el propietario: el nodo deja de ser borrador.
- 2026-11-11 17:41 · Acción de GitHub .github/workflows/pruebas.yml: en cada pull request, en cada push a main, cada lunes a las 6:00 UTC y a mano. Ejecuta, si existen, `python3 -m unittest discover -s tests -p 'test_*.py'` y `node --test tests/*.test.mjs`. Para añadir pruebas basta con crear un fichero con ese nombre en tests/ (explicado en tests/README.md).

## Requirements
- 2026-11-11 14:20 · Derived from architecture: pruebas automáticas con node:test y unittest en una acción de GitHub, en cada pull request y de forma periódica.
- 2026-11-11 14:20 · draft: Crear la acción de GitHub que ejecuta las pruebas en cada pull request y cada semana, con una primera prueba que convierte los ejemplos con neopartitura.py y compara el resultado con el guardado. Hecho cuando la acción aparece en una PR y falla si cambia el resultado de un ejemplo.
- 2026-11-11 15:39 · answer: qué hacer con Muntanyes del Canigó, que no tenía su MusicXML en el repositorio → A, guardar su MusicXML en sources/ y regenerar su página de ejemplo con la versión actual.
- 2026-11-11 17:41 · Derived from musicxml/lector-javascript: la acción no falla cuando no hay pruebas de Python, porque neopartitura.py y su prueba se retiran.
