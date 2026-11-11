---
title: Controles de la página
depends_on: []
---
## Summary
Los controles de la neo-partitura: selector de voz (por defecto la que contiene "alt"), desplegable de estrofas, control de tamaño, estilos para imprimir y modo oscuro.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · El valor por defecto de las estrofas viene de DATA.shown y la selección se guarda en localStorage, siempre dentro de try/catch.

## Requirements
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho (neopartitura_template.html): selector de voz, desplegable de estrofas, control de tamaño, estilos para imprimir y modo oscuro.
