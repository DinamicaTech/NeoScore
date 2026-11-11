---
title: Pruebas automáticas
depends_on: []
status: draft
---
## Summary
Pruebas automáticas que se ejecutan en GitHub en cada pull request y de forma periódica, con node:test y unittest, sin instalar nada.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.

## Requirements
- 2026-11-11 14:20 · Derived from architecture: pruebas automáticas con node:test y unittest en una acción de GitHub, en cada pull request y de forma periódica.
- 2026-11-11 14:20 · draft: Crear la acción de GitHub que ejecuta las pruebas en cada pull request y cada semana, con una primera prueba que convierte los ejemplos con neopartitura.py y compara el resultado con el guardado. Hecho cuando la acción aparece en una PR y falla si cambia el resultado de un ejemplo.
