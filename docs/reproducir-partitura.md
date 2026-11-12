---
title: Reproducir partitura
depends_on: [sonido, neo-partitura/controles, entonacion/cantar-con-tempo]
status: draft
threads:
  - 2026-11-12 11:13 · Reproducir la partitura entera | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvWqkubtyBG1STVoRRX7YF7e
---
## Summary
Escuchar la partitura entera (la voz elegida, con las estrofas que se ven) al tempo y con el sonido elegidos, con botones para reproducir, pausar, continuar y volver al principio.
Se pueden sumar otras voces más suaves como acompañamiento, para oír la armonía, y activar el micrófono para cantar a la vez y ver la afinación de cada nota (lo que antes hacía el botón "Cantar").

## Decisions
- 2026-11-12 11:13 · Creado como hijo de NeoScore. Trabajo en curso (rama reproducir-partitura).

## Requirements
- 2026-11-12 10:57 · Opción para reproducir toda la partitura (no solo la nota seleccionada) con el tempo e instrumento seleccionado. Poder pausar, continuar y reiniciar.
- 2026-11-12 11:09 · Poder escuchar más de una voz también es interesante (seleccionables) para escuchar la harmonía, aunque no tengo claro cómo seleccionarlas por interfaz sin interferir la seleccionada como principal.
- 2026-11-12 11:09 · ... y poder afinar las notas mientras se reproducen ? Sería el cantar con tempo y ver la afinación mientras se va reproduciendo.
