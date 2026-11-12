---
title: Visualización en pentagrama
depends_on: [neo-partitura/controles, sonido, entonacion/cantar-con-tempo]
status: idea
threads:
  - 2026-11-12 10:20 · Visualización en pentagrama | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvVLr4y4r8Jr8e3GADXdRtct
---
## Summary
Idea: elegir entre ver la partitura como neo-score (la vista actual) o como pentagrama clásico, las cinco líneas de la partitura tradicional.
En el pentagrama se pueden ver varias cuerdas a la vez, cada una en su pentagrama o todas en uno, con las notas de cada cuerda del color de su botón del selector (colores solo en este modo).
Se mantienen las funciones de la neo-score: elegir un tempo y reproducir o cantar, y pulsar una nota para oír la de referencia. Lo dibujaría OpenSheetMusicDisplay, con la letra de "mi cuerda".

## Decisions
- 2026-11-12 10:20 · Creado en el laboratorio como idea; no se construye nada mientras se debate.
- 2026-11-12 10:20 · Las cuerdas solo se colorean en el modo pentagrama, para no mezclar sus colores con los 12 colores de las notas de la neo-score.
- 2026-11-12 10:20 · [replaced by 2026-11-12 10:26] El pentagrama lo dibuja una librería externa (cuál, por decidir), con el OK del propietario a usar una.
- 2026-11-12 10:20 · El pentagrama mantiene el mismo uso que la neo-score: elegir un tempo y reproducir o cantar, o pulsar una nota para oír la de referencia.
- 2026-11-12 10:26 · El pentagrama lo dibuja la librería OpenSheetMusicDisplay, que lee el MusicXML directamente, con el OK del propietario.
- 2026-11-12 10:26 · Bajo el pentagrama se muestra solo la letra de la cuerda elegida ("mi cuerda").
- 2026-11-12 10:26 · "Todas en un solo pentagrama" usa un único pentagrama; solo si alguna nota necesita más de tres líneas adicionales por encima o por debajo se pasa a dos pentagramas unidos (agudo para soprano y contralto, grave para tenor y bajo).
- 2026-11-12 10:26 · Con varias cuerdas visibles, al cantar se compara solo "mi cuerda"; al reproducir suenan todas las cuerdas visibles (enlaza con reproducir-partitura).
- 2026-11-12 10:26 · Un botón "Vista: Neo-score / Pentagrama" en la cabecera elige la vista; en el pentagrama los botones de cuerda se pueden activar varios a la vez y se colorean con el color de sus notas.

## Requirements
- 2026-11-12 10:15 · idea: Poder ver la partitura en modo neo-score o en modo pentagrama clásico; en el modo pentagrama, ver varias cuerdas a la vez, cada una en su propio pentagrama o todas en un solo pentagrama con las notas de cada cuerda del color de su botón del selector de cuerda, manteniendo las mismas funciones que la neo-score.
- 2026-11-12 10:15 · Debatir la idea de poder visualizar en modo neo-score o en modo pentagrama clásico. En modo pentagrama clásico, poder ver varias cuerdas de forma simultánea, cada una en su propio pentagrama o verlas todas en un solo pentagrama (las notas de cada cuerda en un color diferente, coincidente con el color del botón del selector de la cuerda). Se mantienen las mismas funcionalidades que en visualización neo-score
- 2026-11-12 10:20 · Sí, habrá que 'colorear' las cuerdas, se puede hacer solo en modo partitura para no generar un festival de colores en la pantalla
- 2026-11-12 10:20 · Ok a una librería
- 2026-11-12 10:20 · Sí, pero la idea sigue siendo la misma, seleccionar un tempo y reproducir o nota de referencia
- 2026-11-12 10:25 · [answered 2026-11-12 10:26] question: ¿Qué librería dibuja el pentagrama? A) OpenSheetMusicDisplay: lee el MusicXML directamente y ya dibuja varias cuerdas, letra y colores por nota; pesa más (~1 MB) y duplica la lectura del MusicXML. B) VexFlow: dibuja a partir de los datos de nuestro lector, más ligera y controlable, pero hay que programar la maquetación (líneas, saltos, letra). C) abcjs: pensada para otro formato (ABC), habría que convertir. Recomendación: A, porque ahorra casi todo el dibujo.
- 2026-11-12 10:25 · [answered 2026-11-12 10:26] question: ¿Se muestra la letra bajo las notas del pentagrama? A) Sí, la letra de la cuerda elegida. B) Sí, la de todas las cuerdas visibles (más alta y cargada). C) No. Recomendación: A, porque la letra es lo principal del proyecto.
- 2026-11-12 10:25 · [answered 2026-11-12 10:26] question: ¿Cómo es "todas en un solo pentagrama"? Las voces de hombre (tenor, bajo) quedan muy bajas para el pentagrama de las mujeres y saldrían llenas de rayitas extra. A) Un solo pentagrama de verdad para todas. B) Dos pentagramas unidos (agudo para soprano y contralto, grave para tenor y bajo), como en una partitura de piano. C) Un solo pentagrama solo para voces del mismo registro. Recomendación: B.
- 2026-11-12 10:25 · [answered 2026-11-12 10:26] question: Con varias cuerdas visibles, ¿cuál se compara al cantar y cuál suena al reproducir? A) Al cantar se compara solo "mi cuerda" (la que se marca como propia) y al reproducir suenan todas las visibles. B) Solo mi cuerda en las dos cosas. C) Todas en las dos cosas. Recomendación: A; reproducir varias a la vez enlaza con reproducir-partitura.
- 2026-11-12 10:25 · [answered 2026-11-12 10:26] question: ¿Cómo se elige la vista y las cuerdas? A) Un botón "Vista: Neo-score / Pentagrama" en la cabecera; en el pentagrama los botones de cuerda se pueden activar varios a la vez y se colorean. B) Igual, pero el pentagrama siempre muestra todas las cuerdas. Recomendación: A.
- 2026-11-12 10:26 · answer: librería → A, OpenSheetMusicDisplay.
- 2026-11-12 10:26 · answer: letra bajo el pentagrama → A, solo la de la cuerda elegida.
- 2026-11-12 10:26 · answer: todas en un solo pentagrama → B solo si es necesario (más de tres 'rayitas' por debajo o por arriba)
- 2026-11-12 10:26 · answer: qué se compara y qué suena con varias cuerdas → A, al cantar solo "mi cuerda"; al reproducir, todas las visibles.
- 2026-11-12 10:26 · answer: cómo se elige → A, botón "Vista: Neo-score / Pentagrama" y botones de cuerda que se activan varios a la vez y se colorean.
