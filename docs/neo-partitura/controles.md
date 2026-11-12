---
title: Controles de la página
depends_on: []
---
## Summary
Los controles de la neo-partitura: selector de voz (por defecto la que contiene "alt"), desplegable de estrofas, selector de sonido de la nota de referencia, reproductor (▶ Reproducir / ⏸ Pausa, ⏮, tempo, Acompañamiento, 🎤 Micrófono; ver reproducir-partitura), control de tamaño (de 12 a 70), estilos para imprimir y modo oscuro.
Cada sílaba (con su bloque de color) se puede pulsar para oír su nota (ver sonido).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 14:20 · El valor por defecto de las estrofas viene de DATA.shown y la selección se guarda en localStorage, siempre dentro de try/catch.
- 2026-11-11 18:03 · El control de tamaño va de 12 a 70 (ancho de una negra en píxeles; antes de 24 a 70), para poder hacer la partitura la mitad de estrecha. Las notas cortas no bajan del ancho de su sílaba.
- 2026-11-11 18:20 · Botones "Sonido: Voz / Piano" en la cabecera, visibles solo cuando hay una partitura con notas; los crea js/sonido.js en el recuadro #sonido de index.html.
- 2026-11-11 18:20 · Cada nota dibuja encima una zona tocable transparente (rect.toque, de la sílaba hasta el fondo de la cuadrícula) con la altura que suena (data-p) y un tooltip "Toca para oír esta nota (…)"; al pasar el ratón o al sonar se ilumina.
- 2026-11-12 11:45 · Reproductor en la cabecera (#reproductor, lo maneja js/reproductor.js): ▶ Reproducir / ⏸ Pausa / ▶ Continuar, ⏮ Reiniciar, Tempo, desplegable Acompañamiento (casillas con las demás voces, como el de estrofas; solo si hay más de una voz), botón 🎤 Micrófono y, solo con el micrófono, el margen. Debajo de la leyenda, la línea de estado fija arriba al desplazar (#estado-repro) con su propio ⏸/▶ y ⏮. Sustituye a los controles de canto (#canto).
- 2026-11-12 12:45 · Botones "Vista: Neo-score / Pentagrama" (#vista) a la izquierda de la voz, visibles cuando hay partitura; la vista se recuerda en el navegador. En la vista de pentagrama los botones de voz llevan el color de su voz y muestran u ocultan cada voz (la tuya se ve siempre), y el desplegable "Tu voz" elige la que cantas (ver neo-partitura/vista-pentagrama).
- 2026-11-12 14:10 · En la vista de pentagrama, con dos o más voces visibles, botones "Pentagramas: Separados / Juntos" detrás de "Tu voz"; la elección se recuerda en el navegador.
- 2026-11-12 19:15 · El modo oscuro sigue la configuración del móvil solo en la neo-score; en la vista de pentagrama la página se ve siempre en claro (ver neo-partitura/vista-pentagrama).

## Requirements
- 2026-11-12 11:45 · Derived from reproducir-partitura: botones ▶ Reproducir / ⏸ Pausa / ⏮ Reiniciar en la cabecera, y elegir voces de acompañamiento sin cambiar la voz principal.
- 2026-11-11 13:55 · From sources/alcance-inicial.md § Cómo está hecho (neopartitura_template.html): selector de voz, desplegable de estrofas, control de tamaño, estilos para imprimir y modo oscuro.
- 2026-11-11 18:06 · Derived from sonido: un selector de sonido en la cabecera (Voz / Piano) y que cada sílaba, con su bloque de color, se pueda pulsar para oír su nota, mientras se mantenga pulsada.
- 2026-11-11 18:03 · También hacer que el tamaño pueda ser más pequeño (el slider a la izquierda del todo, un 50% más pequeño que ahora)
- 2026-11-12 12:09 · Derived from neo-partitura/vista-pentagrama: un botón para elegir la vista (Neo-score o Pentagrama) y, en el pentagrama, botones de voz de colores que se pueden activar varios a la vez, más la elección de tu voz.
- 2026-11-12 13:35 · Derived from neo-partitura/vista-pentagrama: en el pentagrama, poder elegir ver las voces separadas o juntas en un solo pentagrama.
- 2026-11-12 19:12 · Derived from neo-partitura/vista-pentagrama: que el modo oscuro solo se aplique en la neo-score.
