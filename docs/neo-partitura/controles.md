---
title: Controles de la página
depends_on: []
---
## Summary
Los controles de la neo-partitura: selector de voz (por defecto la que contiene "alt"), desplegable de estrofas, selector de sonido de la nota de referencia, control de tamaño, estilos para imprimir y modo oscuro.
Cada sílaba (con su bloque de color) se puede pulsar para oír su nota (ver sonido).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · El valor por defecto de las estrofas viene de DATA.shown y la selección se guarda en localStorage, siempre dentro de try/catch.
- 2026-11-11 17:20 · Botones "Sonido: Voz / Piano" en la cabecera, visibles solo cuando hay una partitura con notas; los crea js/sonido.js en el recuadro #sonido de index.html.
- 2026-11-11 17:20 · Cada nota dibuja encima una zona tocable transparente (rect.toque, de la sílaba hasta el fondo de la cuadrícula) con la altura que suena (data-p) y un tooltip "Toca para oír esta nota (…)"; al pasar el ratón o al sonar se ilumina.

## Requirements
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho (neopartitura_template.html): selector de voz, desplegable de estrofas, control de tamaño, estilos para imprimir y modo oscuro.
- 2026-11-11 17:06 · Derived from sonido: un selector de sonido en la cabecera (Voz / Piano) y que cada sílaba, con su bloque de color, se pueda pulsar para oír su nota, mientras se mantenga pulsada.
