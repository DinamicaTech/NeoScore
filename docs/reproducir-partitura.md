---
title: Reproducir partitura
depends_on: [sonido, neo-partitura/controles, entonacion/cantar-con-tempo]
threads:
  - 2026-11-12 11:13 · Reproducir la partitura entera | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvWqkubtyBG1STVoRRX7YF7e
---
## Summary
Escuchar la partitura entera (la voz elegida, con las estrofas que se ven) al tempo y con el sonido elegidos, con botones para reproducir, pausar, continuar y volver al principio.
Se pueden sumar otras voces más suaves como acompañamiento, para oír la armonía, y activar el micrófono para cantar a la vez y ver la afinación de cada nota (lo que antes hacía el botón "Cantar").

## Decisions
- 2026-11-12 11:13 · Creado como hijo de NeoScore.
- 2026-11-12 11:45 · Reproductor en js/reproductor.js (navegador) y js/reproduccion.js (cálculos sin navegador, probados en tests/reproduccion.test.mjs). Controles en la cabecera (#reproductor): ▶ Reproducir / ⏸ Pausa / ▶ Continuar, ⏮ Reiniciar, Tempo, Acompañamiento y 🎤 Micrófono; la línea de estado fija arriba al desplazar (#estado-repro) repite ⏸/▶ y ⏮, porque la página se desplaza sola y la cabecera queda fuera de la vista.
- 2026-11-12 11:45 · Qué suena: la voz elegida (la que se dibuja), con las estrofas que se ven, en orden, con el sonido elegido en la cabecera (Voz o Piano; si se cambia mientras suena, cambia sobre la marcha). Las notas ligadas suenan como una sola; cada nota se suelta 60 ms antes de acabar para que dos notas iguales seguidas se oigan separadas.
- 2026-11-12 11:45 · Tempo: el mismo control que el canto (el de la partitura, o 80), de 30 a 200 negras por minuto; se puede cambiar mientras suena y sigue desde el mismo sitio.
- 2026-11-12 11:45 · Pausa para la música donde va; Continuar sigue desde ahí; ⏮ vuelve al principio (si estaba sonando, sigue sonando desde el principio; si no, se queda listo). Al acabar se puede volver a reproducir. Con otra voz u otras estrofas, la reproducción se descarta.
- 2026-11-12 11:45 · Mientras suena, la sílaba que toca se ilumina y la partitura se desplaza para mantener su línea a la vista; la línea de estado dice qué sílaba y compás suenan.
- 2026-11-12 11:45 · Acompañamiento: un desplegable con casillas para las demás voces (no cambia la voz principal; si la principal cambia, sale de la lista). Por defecto ninguna; lo elegido se recuerda por partitura en el navegador (localStorage "neo-acomp:<título>"). Se puede cambiar mientras suena. Todas las voces comparten reloj: el cero es la primera nota de cualquier voz (inicioComun en js/afinacion.js), para que sumar o quitar voces no mueva la música.
- 2026-11-12 11:45 · Volúmenes: tu voz a volumen normal; el acompañamiento 9 dB más suave. Con el micrófono, todo 16 dB más suave (tu voz como la antigua nota guía) para que el micrófono no confunda la música con tu voz. Cada voz usa su propio instrumento (instrumento(id, bajar, canal) de js/sonido.js).
- 2026-11-12 11:45 · Micrófono: con "🎤 Micrófono" activado (se recuerda en localStorage "neo-micro"), ▶ Reproducir y ▶ Continuar hacen un compás de cuenta atrás y la página escucha y marca cada nota como en entonacion/cantar-con-tempo, que deja de tener un modo aparte. Al reiniciar, al desactivar el micrófono o al acabar se guarda el resultado para la revisión.
- 2026-11-12 11:45 · Probado en el navegador: Muntanyes del Canigó con el Baix de acompañamiento suena entera hasta "¡Fin!"; pausa, continuar y reiniciar (desde la cabecera y desde la línea fija) funcionan; con un micrófono simulado que canta la melodía con algunas notas altas a propósito, las notas salen afinadas o altas; en móvil (375 px) los controles caben.
- 2026-11-12 11:45 · Hecho cuando: en PC y en móvil suena toda la voz elegida con el tempo y el sonido elegidos, la sílaba iluminada va a la par de la música, pausar, continuar y reiniciar funcionan, el acompañamiento suena más suave que la voz principal y, con el micrófono, se marca la afinación mientras suena; lo valida el propietario en la página de prueba.
- 2026-11-12 11:28 · Validado por el propietario: el nodo deja de ser borrador.

## Requirements
- 2026-11-12 10:57 · Opción para reproducir toda la partitura (no solo la nota seleccionada) con el tempo e instrumento seleccionado. Poder pausar, continuar y reiniciar.
- 2026-11-12 11:09 · Poder escuchar más de una voz también es interesante (seleccionables) para escuchar la harmonía, aunque no tengo claro cómo seleccionarlas por interfaz sin interferir la seleccionada como principal.
- 2026-11-12 11:09 · ... y poder afinar las notas mientras se reproducen ? Sería el cantar con tempo y ver la afinación mientras se va reproduciendo.
- 2026-11-12 11:09 · Ok a, tempo
- 2026-11-12 11:09 · Ok a iluminar y pasar página
- 2026-11-12 11:09 · Ok a los botones
- 2026-11-12 11:13 · answer: cómo elegir las voces de acompañamiento y afinar mientras se reproduce → Ok a 1 y 2: desplegable "Acompañamiento" con las demás voces, más suaves; un solo reproductor con botón 🎤 Micrófono, sin el botón "Cantar" aparte.
