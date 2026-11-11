---
title: Móvil en vertical
depends_on: []
status: draft
---
## Summary
Que la neo-partitura se lea bien en un móvil en vertical, sin tener que girarlo ni reducir el zoom al mínimo.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.

## Requirements
- 2026-11-11 14:14 · También hay que ver si la visualización es suficientemente operativa en vertical en un móvil (el HTML generado actualmente no es cómo de leer en vertical, hay que ponerlo en horizontal y zoom al mínimo)
- 2026-11-11 14:20 · draft: Adaptar la neo-partitura para leerse en un móvil en vertical. Hecho cuando, en un móvil de unos 360 px de ancho en vertical, se leen la letra y los bloques sin girarlo, sin zoom y sin desplazamiento horizontal.
- 2026-11-11 14:20 · question: Cómo encajarla en vertical. Opciones: A) cortar las líneas en tramos más cortos según el ancho de pantalla, manteniendo la cuadrícula (recomendada); B) cuadrícula más baja (menos alto por semitono) en móvil; C) A y B a la vez. Recomendación: A.
