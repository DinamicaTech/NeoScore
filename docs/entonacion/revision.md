---
title: Revisión al acabar
depends_on: [entonacion/cantar-con-tempo, reproducir-partitura]
threads:
  - 2026-11-12 11:00 · Repasar las sílabas desafinadas al acabar | https://claude.ai/code/project/chan_01KVLuMPf5x5gSm2uLfB6SDv?thread=cmsg_01KVLuMPf5x5gSm2uLfB6SDvWDTEbhXfvrB1mdUeepfBik
---
## Summary
Al terminar la canción con el micrófono, un panel de repaso lista las sílabas que salieron altas o bajas y cuánto; al tocar una suena su nota y la partitura va hasta ella, y 🔁 repite su compás para volver a cantarlo.
El botón 📋 Repaso muestra el último intento aunque se recargue la página, con cuántas notas se afinaron en los últimos 10 intentos; ⏹ Terminar acaba antes y abre el repaso de lo cantado hasta ahí. Código: js/revision.js, con los cálculos en js/afinacion.js.

## Decisions
- 2026-11-11 14:20 · Creado en la carga de requisitos inicial.
- 2026-11-12 11:00 · Ya no hay un modo de práctica aparte: se canta con el reproductor y 🎤 Micrófono (reproducir-partitura). El repaso aparece al acabar la canción con el micrófono, en un panel (#repaso) entre la línea de estado y la partitura; js/revision.js lo dibuja y los cálculos están en js/afinacion.js (fueraDeMargen, desvioEnPalabras, tramoDeCompas, anadirIntento, textoHistorial, coincide), probados en tests/afinacion.test.mjs.
- 2026-11-12 11:00 · El panel dice cuántas notas salieron afinadas, altas y bajas y lista, en orden, las sílabas altas o bajas con su compás y el desvío en cents y en palabras ("un poco alta (+35 cents, un tercio de semitono)"). Se calcula con el margen elegido ahora, así que cambiar el margen cambia la lista. Las notas en las que no se oyó nada no salen en la lista.
- 2026-11-12 11:00 · Tocar una sílaba de la lista: la partitura va hasta ella, se resalta un momento y suena su nota con el sonido elegido.
- 2026-11-12 11:00 · 🔁 repite el compás de esa sílaba: un compás de cuenta atrás y suena ese compás (tu voz suave y el acompañamiento elegido) mientras el micrófono escucha solo sus notas, aunque 🎤 Micrófono esté desactivado. Lo demás de lo cantado se conserva; las notas del compás se vuelven a marcar y el último resultado guardado se actualiza (las que no se lleguen a cantar se quedan como estaban). Mientras se repite, pausa y continuar valen y ⏮ vuelve a empezar el compás. Lo hace repetir() de js/reproductor.js.
- 2026-11-12 11:00 · Botón 📋 Repaso en la cabecera, visible si hay un resultado guardado de la partitura y voz que se ven: abre o cierra el panel y, si lo cantado no está ya dibujado (por ejemplo tras recargar), lo dibuja en la partitura. Si el resultado es de otras estrofas, la lista se ve pero no se puede tocar, y el panel dice qué estrofas elegir.
- 2026-11-12 11:00 · [replaced by 2026-11-12 11:50] Historial: cada intento que llega al final de la canción se suma, en localStorage "neo-canto-historial:<título>:<voz>", a los últimos 10 (fecha, tempo, margen y cuántas afinadas, altas, bajas y sin oír de cuántas notas). El panel lo muestra en una línea: "Tus últimos intentos: 28 · 33 · 37 afinadas de 42". Repetir un compás no cuenta como intento. El último resultado sigue en "neo-canto:<título>:<voz>" y ahora guarda también las estrofas que se veían.
- 2026-11-12 11:50 · Botón ⏹ Terminar en la cabecera y en la línea fija de arriba (⏹), visible solo mientras se canta con el micrófono (sonando o en pausa; no al repetir un compás): para la música y el micrófono, guarda lo cantado hasta ahí y abre el repaso, que solo lista las notas ya cantadas. Lo hace terminar() de js/reproductor.js.
- 2026-11-12 11:50 · Historial: cada intento que llega al final de la canción o se termina con ⏹ Terminar se suma, en localStorage "neo-canto-historial:<título>:<voz>", a los últimos 10 (fecha, tempo, margen, completa y cuántas afinadas, altas, bajas y sin oír de cuántas notas; un intento terminado antes cuenta solo las notas que dio tiempo a cantar, "alcanzadas" en el resultado). Así se puede practicar solo un trozo varias veces. El panel lo muestra en una línea: "Tus últimos intentos: 28 · 33 · 37 afinadas de 42" o, si los totales son distintos, "12/20 · 33/42 afinadas". Repetir un compás, pausar, reiniciar o desactivar el micrófono no cuentan como intento. El último resultado sigue en "neo-canto:<título>:<voz>" y ahora guarda también las estrofas que se veían.
- 2026-11-12 11:00 · Probado en el navegador con un sonido de prueba en lugar del micrófono: Muntanyes del Canigó (Alto) a tempo 200 con notas desviadas a propósito da un repaso con exactamente las altas y bajas tocadas; 🔁 en el compás 2 cantándolo bien lo marca afinado y quita sus dos sílabas de la lista sin tocar el resto ni el historial; tras recargar, 📋 Repaso vuelve a mostrar la lista y las marcas. En móvil (375 px) el panel cabe sin desplazar de lado.
- 2026-11-12 11:00 · [replaced by 2026-11-12 11:50] Hecho cuando: al acabar la canción con el micrófono, la lista muestra las sílabas fuera del margen; al tocar una suena su nota; 🔁 vuelve a tocar su compás y lo vuelve a marcar; y 📋 Repaso con el historial funciona tras recargar. Lo valida el propietario en la página de prueba, en PC y en móvil.

- 2026-11-12 11:50 · Hecho cuando: al acabar la canción con el micrófono, o al pulsar ⏹ Terminar antes, la lista muestra las sílabas fuera del margen (de lo cantado hasta ahí); al tocar una suena su nota; 🔁 vuelve a tocar su compás y lo vuelve a marcar; y 📋 Repaso con el historial (también de los intentos terminados antes) funciona tras recargar. Lo valida el propietario en la página de prueba, en PC y en móvil.
- 2026-11-12 11:50 · Validado por el propietario: el nodo deja de ser borrador.
- 2026-11-12 12:45 · En la vista de pentagrama, tocar una sílaba del repaso lleva la página hasta su nota en el pentagrama y la resalta.

## Requirements
- 2026-11-11 13:55 · De esa forma, al acabar la canción se puede revisar los puntos en los que no se ha cantado de forma afinada para ir mejorando.
- 2026-11-11 14:20 · draft: Al acabar un modo de práctica, mostrar un resumen con las sílabas desafinadas (alta o baja y cuánto) y poder volver a practicar cada una con su nota de referencia. Hecho cuando el resumen lista las sílabas fuera del margen y al tocar una suena su nota y se puede repetir ese tramo.
- 2026-11-11 14:20 · [answered 2026-11-12 10:45] question: ¿Se guarda el historial de intentos en el navegador para ver la mejora? Opciones: A) sí, los últimos intentos por partitura y voz; B) no, solo el último. Recomendación: A.
- 2026-11-12 10:45 · 1. A
- 2026-11-12 10:45 · 2. A
- 2026-11-12 10:45 · 3. A
- 2026-11-12 10:45 · 4. B
- 2026-11-12 10:45 · answer: ¿se guarda el historial de intentos? → A, los últimos 10 intentos completos por partitura y voz, con una línea que muestra cuántas notas se afinaron en cada uno.
- 2026-11-12 10:45 · answer: qué tramo se repite → A, el compás de esa sílaba, con cuenta atrás.
- 2026-11-12 10:45 · answer: cuándo se ve el repaso → A, al acabar y también desde un botón 📋 Repaso con el último intento, aunque se recargue la página.
- 2026-11-12 10:45 · answer: sílabas en las que no se oyó nada → B, no salen en la lista.
- 2026-11-12 11:50 · Faltaría un botón para parar el 'afinamiento' y ver el resultado, para no tener que esperar hasta el final de la partitura
- 2026-11-12 11:50 · La opción B, eso permite repasar solo una parte de la partitura varias veces para mejorarla y no tener que cantarla toda.
- 2026-11-12 11:50 · answer: ¿cuenta en el historial un intento terminado antes con ⏹ Terminar? → B, sí, con las notas que dio tiempo a cantar, para poder practicar solo una parte varias veces.
- 2026-11-12 11:50 · Ok, ya puedes publicar y, si no hay nada más, cerrar este hilo y PR
- 2026-11-12 12:09 · Derived from neo-partitura/vista-pentagrama: que el repaso funcione igual en la vista de pentagrama.
