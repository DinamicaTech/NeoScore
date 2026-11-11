---
title: Nota de referencia
depends_on: [architecture]
status: draft
---
## Summary
Tocar una nota o sílaba de la neo-partitura y oír su sonido como referencia, con el instrumento que el usuario elija (piano, voz y, más adelante, otros).

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.

## Requirements
- 2026-11-11 13:55 · Poder seleccionar una nota/sílaba y que se emita el sonido de esa nota como referencia auditiva. Este sonido puede ser emulando un piano o una persona cantando esa nota (falta ver con qué tipo de sonido es más fácil detectar la resonancia para saber si se está afinando)
- 2026-11-11 14:14 · La idea es poder escoger piano/voz (ampliable en un futuro a más 'samples', como Voz1, Voz2, Flauta...) en la web así el usuario escoge la que mejor le ayuda a afinar.
- 2026-11-11 14:14 · Para la reproducción la que haya que ofrezca una buena calidad de reproducción (ya sea piano o voz).
- 2026-11-11 14:20 · draft: Al tocar una sílaba, hacer sonar su nota con Tone.js y el sonido elegido en un selector (piano o voz, ampliable). Hecho cuando cada sílaba suena a su altura correcta con los dos sonidos, en móvil y en PC.
- 2026-11-11 14:20 · question: De dónde salen los sonidos. Opciones: A) piano grabado libre (por ejemplo Salamander, licencia CC-BY) y voz grabada por alguien del coro en vocal "a"; B) piano libre y una voz sintetizada; C) buscar un banco de voz libre ya grabado. Recomendación: A, porque los bancos de voz libres de buena calidad son escasos.
- 2026-11-11 14:20 · question: Qué sonido se ofrece por defecto. Opciones: A) voz, porque es más fácil imitar un timbre parecido al propio; B) piano, más limpio y conocido. Recomendación: A, a confirmar probándolo con el coro.
