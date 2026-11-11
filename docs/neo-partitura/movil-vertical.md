---
title: Móvil en vertical
depends_on: []
status: draft
threads:
  - 2026-11-11 17:58 · Móvil en vertical | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvU5iqVmHenUfYXUSRmpy87F
---
## Summary
Que la neo-partitura se lea bien en un móvil en vertical, sin tener que girarlo ni reducir el zoom al mínimo.
Las líneas se cortan según el ancho de la pantalla y un compás que no cabe sigue en la línea siguiente, con la misma cuadrícula.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 17:54 · Las líneas se cortan según el ancho de la pantalla (ya lo hacía la página nueva) y la cuadrícula no cambia de alto. Un compás que no cabe entero se parte en tramos que siguen en la línea siguiente: el tramo que sigue empieza con una barra discontinua y no repite el número de compás; la indicación ("Estrofa 2"...) va en el primer tramo y la doble barra en el último. Una nota sola más ancha que la línea se estrecha hasta caber. En PC no cambia nada. Código: js/lineas.js; prueba: tests/lineas.test.mjs.

## Requirements
- 2026-11-11 14:14 · También hay que ver si la visualización es suficientemente operativa en vertical en un móvil (el HTML generado actualmente no es cómo de leer en vertical, hay que ponerlo en horizontal y zoom al mínimo)
- 2026-11-11 14:20 · draft: Adaptar la neo-partitura para leerse en un móvil en vertical. Hecho cuando, en un móvil de unos 360 px de ancho en vertical, se leen la letra y los bloques sin girarlo, sin zoom y sin desplazamiento horizontal.
- 2026-11-11 14:20 · [answered 2026-11-11 17:54] question: Cómo encajarla en vertical. Opciones: A) cortar las líneas en tramos más cortos según el ancho de pantalla, manteniendo la cuadrícula (recomendada); B) cuadrícula más baja (menos alto por semitono) en móvil; C) A y B a la vez. Recomendación: A.
- 2026-11-11 17:54 · answer: cómo encajarla en vertical → A, cortar las líneas en tramos más cortos según el ancho de pantalla, manteniendo la cuadrícula.

## Estado del trabajo
Rama movil-vertical, PR #6 (borrador). Hecho: js/lineas.js parte en tramos los compases que no caben en la pantalla (barra discontinua, sin repetir el número) y estrecha una nota sola más ancha que la línea; js/dibujo.js lo usa; prueba tests/lineas.test.mjs; README actualizado. Pregunta resuelta (A). Falta: su validación en el móvil, y después escribir las decisiones, quitar status: draft y fusionar.
