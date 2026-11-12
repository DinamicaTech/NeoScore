---
title: Neo-partitura
depends_on: []
---
## Summary
La forma de ver la partitura para quien no lee música: la letra es lo principal y debajo de cada sílaba una cuadrícula compacta (filas = semitonos, columnas = tiempo) con un bloque de color por nota y una línea que dibuja el contorno de la melodía.
El cantante elige su cuerda (soprano, contralto, tenor, bajo…); lo importante es ver cuánto sube o baja cada nota respecto a la anterior.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · Ancho de cada bloque = max(duración × zoom, ancho del texto + 6 px). Solo se muestran las filas que usa la voz, de la nota más grave a la más aguda. Sin nombres de notas en las celdas, de momento.
- 2026-11-11 18:45 · Para el modo de canto (entonacion/cantar-con-tempo) y el reproductor (reproducir-partitura), el dibujo marca cada bloque tocable con su número de orden y su altura escrita (data-n, data-e), cada línea con su fila más aguda y más grave (data-hi, data-lo) y avisa con el evento "dibujada" cada vez que se redibuja. No cambia cómo se ve.
- 2026-11-12 12:45 · Además de la neo-score hay una vista de pentagrama clásico (neo-partitura/vista-pentagrama), que se elige en la cabecera. La neo-score sigue siendo la vista por defecto y no cambia.
- 2026-11-12 19:40 · Tercera vista, la de letra (neo-partitura/vista-letra): solo la letra, sin notas; también para ficheros .txt con solo la letra.

## Requirements
- 2026-11-11 18:45 · Derived from entonacion/cantar-con-tempo: que cada bloque sepa qué nota es y dónde está, para dibujar encima lo cantado.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Qué es una neo-partitura: letra principal, cuadrícula por sílaba, bloques de color con ancho según duración, línea de contorno, solo las filas que usa la voz, sin nombres de notas.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Limitaciones conocidas: las notas muy cortas se ensanchan para que quepa la sílaba, así que el ritmo es aproximado.
- 2026-11-11 13:55 · Ahora tenemos una forma de visualizar de forma 'amable' una partitura musicxml, el usuario selecciona su cuerda (barítono, tenor, etc.) y puede ver la letra y la nota musical (más que la nota musical, lo importante es el diferencial respecto la nota anterior).
- 2026-11-11 13:55 · Antes de cambiar una decisión de diseño ya tomada (colores, filas, disposición), proponlo y espera a que lo confirme.
