# Pruebas automáticas

La acción de GitHub **Pruebas** (`.github/workflows/pruebas.yml`) las ejecuta en cada pull request, en cada cambio en `main` y cada lunes. No hace falta instalar nada.

| Tipo | Ficheros | Ejecutar en local |
| --- | --- | --- |
| Python (unittest) | `tests/test_*.py` | `python -m unittest discover -s tests -v` |
| JavaScript (node:test) | `tests/*.test.mjs` | `node --test tests/*.test.mjs` |

Para añadir pruebas basta con crear un fichero con ese nombre en esta carpeta: la acción lo encuentra sola.

## Pruebas actuales

- `lector.test.mjs`: comprueba que el lector de MusicXML (`js/lector-musicxml.js`) da, para cada partitura de su lista `PARTITURAS`, exactamente los mismos datos que daba `neopartitura.py`, el conversor en Python ya retirado. Esos datos se guardaron en `referencia/` con la última versión de `neopartitura.py` y no se regeneran: si un cambio querido del lector los altera, hay que revisarlo con el propietario. También prueba casos sueltos (la octava a la que suena el tenor, el tempo, alteraciones, ligaduras, sinalefas, acordes, dobles barras) y los mensajes de error.
- `biblioteca.test.mjs`: comprueba el índice de la biblioteca (`biblioteca/indice.json`): que cada partitura existe, se lee y sus estrofas existen, que todo MusicXML de la carpeta está en el índice, que el aviso de derechos del MusicXML está copiado en el índice (© A. Di Marco en El Noi de la Mare), que las direcciones antiguas de `examples/` llevan a la biblioteca, y la lectura del aviso de derechos de un fichero propio.
- `ejemplos.test.mjs`: comprueba que las direcciones antiguas de `examples/` llevan a una partitura que existe.
- `sonido.test.mjs`: comprueba la nota de referencia (`js/sonido.js`): los nombres de las notas, la lista de sonidos, que cada sonido grabado tiene sus ficheros y su licencia en `sonidos/`, y que sus grabaciones cubren todas las notas de las partituras de la biblioteca.
- `afinacion.test.mjs`: comprueba los cálculos de cantar con tempo (`js/afinacion.js`): de hercios a nota, afinada / alta / baja según el margen, que cantar una octava más grave cuenta como la misma nota, que la secuencia de notas sigue cada partitura de la biblioteca (con la octava del tenor y por estrofas), el resultado que se guarda para la revisión, el repaso al acabar (las sílabas fuera del margen, el desvío en palabras, el historial de los últimos intentos y el compás que se repite de cada nota de la biblioteca), y que pitchy (`js/vendor/pitchy.js`) reconoce notas conocidas de bajo a soprano.
- `reproduccion.test.mjs`: comprueba los cálculos del reproductor (`js/reproduccion.js`): el reloj que se pausa, sigue y cambia de tempo sin saltos, la cuenta atrás, qué nota suena en cada momento (también en silencios y tras reiniciar), que las notas ligadas no se vuelven a atacar, el acompañamiento y sus volúmenes, y que en cada partitura de la biblioteca todas las voces comparten reloj.
- `lineas.test.mjs`: comprueba que el reparto de compases en líneas (`js/lineas.js`) nunca pasa del ancho de la pantalla, partiendo en tramos los compases que no caben, y que con los ejemplos en un móvil de 320 y 360 px ninguna línea se sale y no se pierde ninguna nota.
