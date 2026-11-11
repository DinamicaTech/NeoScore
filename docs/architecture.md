---
title: Arquitectura
depends_on: []
status: draft
---
## Summary
Cómo está construido NeoScore: una aplicación web estática que funciona entera en el navegador y se publica en GitHub Pages, sin servidor ni cuentas.
La página lee el MusicXML directamente (en JavaScript), lo dibuja como neo-partitura, hace sonar las notas con Tone.js y escucha el micrófono para comparar lo cantado con la nota que toca.

## Decisions
- 2026-11-11 14:14 · Tipo de aplicación: web estática en el navegador, publicada en GitHub Pages (https://dinamicatech.github.io/NeoScore). Motivo: el navegador ya trae Web Audio para sonido y micrófono, funciona en móvil y PC, y no hay servidor que mantener. GitHub Pages sirve por HTTPS, que el navegador exige para usar el micrófono.
- 2026-11-11 14:14 · Formato de partituras: el formato guardado es el propio MusicXML, sin formato intermedio. Leer un MusicXML cuesta milisegundos, así que no compensa guardar una versión procesada.
- 2026-11-11 14:14 · La lectura del MusicXML pasa a JavaScript, dentro de la página. Motivo: es la única forma de que el usuario cargue un MusicXML nuevo desde la web sin servidor (Python no corre en el navegador salvo con Pyodide, que pesa decenas de MB). El formato de datos actual ({title, shown?, parts:[…]}) se mantiene como modelo interno de la página.
- 2026-11-11 14:14 · Biblioteca de partituras: una carpeta del repositorio con los MusicXML y una lista (índice) que la página muestra en un selector. Además, el usuario puede abrir un MusicXML propio desde su equipo; ese queda solo en su navegador.
- 2026-11-11 14:14 · La página deja de ser un único HTML con los datos dentro: pasa a ser una pequeña web estática (HTML, JavaScript, la biblioteca de partituras y los sonidos), sin paso de compilación. Sustituye la idea de "una página HTML autónoma" del alcance inicial, a propuesta del propietario (formato intermedio y carga desde la web).
- 2026-11-11 14:14 · Reproducción de notas: Tone.js, con sonidos grabados (samples) elegibles en la página: piano y voz al principio, ampliable a más (Voz1, Voz2, Flauta…). Las librerías y los samples se copian dentro del repositorio, no se cargan de un CDN, para que la web no dependa de terceros.
- 2026-11-11 14:14 · Datos del usuario (resultados, preferencias y, en el futuro, puntos): solo en el navegador de cada cantante (localStorage o IndexedDB), sin cuentas ni datos personales en ningún servidor.
- 2026-11-11 14:14 · Pruebas automáticas con las herramientas que traen Node (node:test) y Python (unittest), sin instalar nada, en una acción de GitHub en cada pull request y de forma periódica.

## Requirements
- 2026-11-11 14:14 · Creo que haría falta un formato intermedio para no tener la partitura 'harcoded' en al HTML.
- 2026-11-11 14:14 · La idea sería poder seleccionar en la página HTML una partitura y que luego la cargue.
- 2026-11-11 14:14 · Lo ideal sería poder cargar desde la propia web una nueva partitura musicXML
- 2026-11-11 14:14 · Para la entonación, tone.js si es la más precisa (descartando CREPE).
- 2026-11-11 14:14 · Para la reproducción la que haya que ofrezca una buena calidad de reproducción (ya sea piano o voz).
- 2026-11-11 14:14 · La idea es poder escoger piano/voz (ampliable en un futuro a más 'samples', como Voz1, Voz2, Flauta...) en la web así el usuario escoge la que mejor le ayuda a afinar.
- 2026-11-11 14:14 · question: Detección de la nota cantada. Tone.js sirve para reproducir sonido pero no detecta qué nota se canta. Opciones: A) pitchy, librería pequeña (unos 10 KB, método McLeod) y precisa con la voz; B) un algoritmo YIN propio dentro de la página, sin librería; C) Tone.js con su analizador de frecuencias (FFT), poco preciso para la voz. Recomendación: A.
- 2026-11-11 14:14 · question: Qué hacer con neopartitura.py cuando la página lea el MusicXML. Opciones: A) retirarlo cuando la versión JavaScript dé el mismo resultado con los ejemplos (lo comprueban las pruebas); B) mantener los dos y que hagan lo mismo; C) dejar Python solo como herramienta para revisar MusicXML problemáticos. Recomendación: A.
