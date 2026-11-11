---
title: Cantar con tempo
depends_on: [sonido, neo-partitura, musicxml/lector-javascript]
status: draft
threads:
  - 2026-11-11 18:45 · Cantar con tempo | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDv2hUHRG9aHNHqtkWmRZtK3q
---
## Summary
Con un tempo, la página marca qué sílaba toca cantar, escucha el micrófono, detecta la nota con pitchy y la dibuja superpuesta a la neo-partitura, indicando si está afinada, alta o baja.
Lo hace el botón "🎤 Cantar" de la cabecera (js/canto.js, con los cálculos en js/afinacion.js): tempo, margen (Fácil, Normal, Difícil) y nota guía suave; al acabar guarda en el navegador, por sílaba, la nota esperada y la cantada para la revisión (entonacion/revision).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-11 18:45 · Modo de canto en js/canto.js (navegador) y js/afinacion.js (cálculos sin navegador, probados en tests/afinacion.test.mjs). Controles en la cabecera (#canto): botón Cantar/Parar, tempo (número), margen y casilla "Nota guía"; debajo de la leyenda, una línea de estado fija arriba al desplazar (#canto-estado) que dice qué sílaba cantar, qué nota se oye y el resumen final.
- 2026-11-11 18:45 · Pendiente de confirmar por el propietario (preguntas abiertas). Tempo: el de la partitura (el lector lo lee), o 80 negras por minuto si no lo trae, y el usuario lo cambia en la cabecera (de 30 a 200).
- 2026-11-11 18:45 · Pendiente de confirmar. Margen de afinación elegible: Fácil ±50 cents (por defecto), Normal ±35, Difícil ±25. El margen y la nota guía se recuerdan en el navegador (localStorage "neo-canto-ajustes").
- 2026-11-11 18:45 · Pendiente de confirmar. Sonido durante el canto: un compás de cuenta atrás con golpes de metrónomo y, si "Nota guía" está marcada (por defecto), la nota de cada sílaba con el sonido elegido en la cabecera, 16 dB más suave; se recomiendan auriculares.
- 2026-11-11 18:45 · Pendiente de confirmar. Cantar la misma nota una o más octavas más grave o más aguda cuenta como esa nota (lo natural si un hombre canta una voz de mujer); se dibuja en la fila de la nota y la sílaba lo dice al pasar el ratón ("una octava más grave").
- 2026-11-11 18:45 · Detección: el micrófono sin cancelación de eco, supresión de ruido ni control de volumen del navegador (deforman la voz); pitchy analiza 2048 muestras unas 50 veces por segundo y solo cuenta lo que reconoce como nota (claridad ≥ 0,88, entre 60 y 1300 Hz, más fuerte que -45 dB). La nota cantada de cada sílaba es la mediana de lo oído, sin el primer cuarto de la nota (el arranque) salvo en notas de menos de medio segundo.
- 2026-11-11 18:45 · Dibujo: encima de cada bloque, una línea oscura con la altura que se va cantando (llevada a la octava de la nota) y, al pasar la nota, el bloque se rodea de verde (✓ afinada), rojo (▲ alta) o azul (▼ baja); un punto gris si no se ha oído nada. Se repinta al cambiar el tamaño o girar el móvil; con otra voz u otras estrofas se para y se borra. La sílaba que toca se ilumina y la partitura se desplaza para mantenerla a la vista.
- 2026-11-11 18:45 · Resultado para la revisión: al acabar o al parar se guarda en localStorage, clave "neo-canto:<título>:<voz>", solo el último intento: {version: 1, titulo, voz, fecha, tempo, margen, cents, completa, notas: [{n, compas, silaba, esperada (MIDI que suena), cantada (MIDI con decimales o null), cents, octava, estado: afinada | alta | baja | sin-oir}]}. Lo crea resultado() de js/afinacion.js. Guardar varios intentos queda para entonacion/revision (su pregunta del historial).
- 2026-11-11 18:45 · Cada bloque tocable de la neo-partitura lleva su número de orden (data-n) y su altura escrita (data-e), y cada línea la fila más aguda y la más grave (data-hi, data-lo en g.lienzo); secuencia() de js/afinacion.js da las notas en ese mismo orden, con su momento en negras.
- 2026-11-11 18:45 · Probado en el navegador con un sonido de prueba en lugar del micrófono, tocando la melodía con notas desviadas a propósito: las 42 notas de la estrofa 1 de El Noi de la Mare salen afinadas, altas, bajas o una octava más grave exactamente como se tocaron, en PC y en móvil (375 px).
- 2026-11-11 18:45 · Hecho cuando: cantando o tocando una melodía conocida, la nota detectada aparece en la fila correcta y lo desafinado se marca como alto o bajo; lo valida el propietario en la página de prueba, en PC y en móvil.

## Requirements
- 2026-11-11 13:55 · A partir de un tempo, ir marcando qué nota/sílaba toca cantar, registrar la onda de sonido y mostrar la nota superpuesta a la de la neo-partitura, para saber si está afinada o si es demasiado alta o baja.
- 2026-11-11 14:20 · draft: Añadir un modo de práctica que, con un tempo, avanza sílaba a sílaba, escucha el micrófono, detecta la nota cantada con pitchy y la dibuja encima de la nota esperada con su desviación. Hecho cuando, cantando o tocando una melodía conocida, la nota detectada aparece en la fila correcta y lo desafinado se marca como alto o bajo.
- 2026-11-11 14:20 · question: De dónde sale el tempo. Opciones: A) del MusicXML, con un control para ir más lento o más rápido (recomendada); B) solo lo elige el usuario.
- 2026-11-11 14:20 · question: Margen para contar una nota como afinada. Opciones: A) ±25 cents, es decir, un cuarto de semitono; B) ±50 cents, medio semitono, más permisivo; C) que el usuario elija entre fácil, normal y difícil. Recomendación: C, con ±50 cents por defecto.
- 2026-11-11 14:20 · question: ¿Suena algo mientras se canta? Opciones: A) cuenta atrás y solo la nota de cada sílaba muy suave, con auriculares recomendados para que el micrófono no la capte; B) nada, solo la marca visual; C) la voz completa de fondo. Recomendación: A.
