---
title: Cantar con tempo
depends_on: [sonido, neo-partitura]
status: draft
---
## Summary
Con un tempo, la página marca qué sílaba toca cantar, escucha el micrófono, detecta la nota con pitchy y la dibuja superpuesta a la neo-partitura, indicando si está afinada, alta o baja.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.

## Requirements
- 2026-11-11 13:55 · A partir de un tempo, ir marcando qué nota/sílaba toca cantar, registrar la onda de sonido y mostrar la nota superpuesta a la de la neo-partitura, para saber si está afinada o si es demasiado alta o baja.
- 2026-11-11 14:20 · draft: Añadir un modo de práctica que, con un tempo, avanza sílaba a sílaba, escucha el micrófono, detecta la nota cantada con pitchy y la dibuja encima de la nota esperada con su desviación. Hecho cuando, cantando o tocando una melodía conocida, la nota detectada aparece en la fila correcta y lo desafinado se marca como alto o bajo.
- 2026-11-11 14:20 · question: De dónde sale el tempo. Opciones: A) del MusicXML, con un control para ir más lento o más rápido (recomendada); B) solo lo elige el usuario.
- 2026-11-11 14:20 · question: Margen para contar una nota como afinada. Opciones: A) ±25 cents, es decir, un cuarto de semitono; B) ±50 cents, medio semitono, más permisivo; C) que el usuario elija entre fácil, normal y difícil. Recomendación: C, con ±50 cents por defecto.
- 2026-11-11 14:20 · question: ¿Suena algo mientras se canta? Opciones: A) cuenta atrás y solo la nota de cada sílaba muy suave, con auriculares recomendados para que el micrófono no la capte; B) nada, solo la marca visual; C) la voz completa de fondo. Recomendación: A.
