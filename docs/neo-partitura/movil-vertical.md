---
title: Móvil en vertical
depends_on: [neo-partitura/controles]
threads:
  - 2026-11-11 17:58 · Móvil en vertical | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvU5iqVmHenUfYXUSRmpy87F
---
## Summary
Que la neo-partitura se lea bien en un móvil en vertical, sin tener que girarlo ni reducir el zoom al mínimo.
Las líneas se cortan según el ancho de la pantalla y un compás que no cabe sigue en la línea siguiente, con la misma cuadrícula.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 17:54 · [replaced by 2026-11-11 18:03] Las líneas se cortan según el ancho de la pantalla (ya lo hacía la página nueva) y la cuadrícula no cambia de alto. Un compás que no cabe entero se parte en tramos que siguen en la línea siguiente: el tramo que sigue empieza con una barra discontinua y no repite el número de compás; la indicación ("Estrofa 2"...) va en el primer tramo y la doble barra en el último. Una nota sola más ancha que la línea se estrecha hasta caber. En PC no cambia nada. Código: js/lineas.js; prueba: tests/lineas.test.mjs.
- 2026-11-11 18:03 · Las líneas se cortan según el ancho de la pantalla y la cuadrícula no cambia de alto. Un compás que no cabe entero se parte en tramos que siguen en la línea siguiente: el tramo que sigue empieza con una barra discontinua y no repite el número de compás; la indicación ("Estrofa 2"...) va en el primer tramo y la doble barra en el último. Una nota sola más ancha que la línea se estrecha hasta caber. El dibujo ya no deja margen a la izquierda (antes 30 px vacíos): la primera barra va pegada al borde. En pantallas de hasta 600 px de ancho la cabecera, la leyenda y la partitura dejan 8 px a cada lado en lugar de 16. Al girar el móvil la partitura se vuelve a repartir al nuevo ancho (en apaisado caben más compases por línea) y el navegador no agranda el texto por su cuenta. En PC el único cambio es que caben unos 40 px más de compases por línea. Código: js/lineas.js y js/dibujo.js; prueba: tests/lineas.test.mjs.
- 2026-11-11 18:07 · Validado por el propietario en el móvil: el nodo deja de ser borrador.

## Requirements
- 2026-11-11 14:14 · También hay que ver si la visualización es suficientemente operativa en vertical en un móvil (el HTML generado actualmente no es cómo de leer en vertical, hay que ponerlo en horizontal y zoom al mínimo)
- 2026-11-11 14:20 · draft: Adaptar la neo-partitura para leerse en un móvil en vertical. Hecho cuando, en un móvil de unos 360 px de ancho en vertical, se leen la letra y los bloques sin girarlo, sin zoom y sin desplazamiento horizontal.
- 2026-11-11 14:20 · [answered 2026-11-11 17:54] question: Cómo encajarla en vertical. Opciones: A) cortar las líneas en tramos más cortos según el ancho de pantalla, manteniendo la cuadrícula (recomendada); B) cuadrícula más baja (menos alto por semitono) en móvil; C) A y B a la vez. Recomendación: A.
- 2026-11-11 17:54 · answer: cómo encajarla en vertical → A, cortar las líneas en tramos más cortos según el ancho de pantalla, manteniendo la cuadrícula.
- 2026-11-11 18:03 · Podemos eliminar el margen izquierdo para ganar algo de espacio en la pantalla ?
- 2026-11-11 18:03 · Igualmente, la pantalla debe soportar rotación automática ya que en apaisado seguirá siendo más cómoda
