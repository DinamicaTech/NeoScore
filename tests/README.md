# Pruebas automáticas

La acción de GitHub **Pruebas** (`.github/workflows/pruebas.yml`) las ejecuta en cada pull request, en cada cambio en `main` y cada lunes. No hace falta instalar nada.

| Tipo | Ficheros | Ejecutar en local |
| --- | --- | --- |
| Python (unittest) | `tests/test_*.py` | `python -m unittest discover -s tests -v` |
| JavaScript (node:test) | `tests/*.test.mjs` | `node --test tests/*.test.mjs` |

Para añadir pruebas basta con crear un fichero con ese nombre en esta carpeta: la acción lo encuentra sola.

## Pruebas actuales

- `lector.test.mjs`: comprueba que el lector de MusicXML (`js/lector-musicxml.js`) da, para cada partitura de su lista `PARTITURAS`, exactamente los mismos datos que daba `neopartitura.py`, el conversor en Python ya retirado. Esos datos se guardaron en `referencia/` con la última versión de `neopartitura.py` y no se regeneran: si un cambio querido del lector los altera, hay que revisarlo con el propietario. También prueba casos sueltos (alteraciones, ligaduras, sinalefas, acordes, dobles barras) y los mensajes de error.
- `ejemplos.test.mjs`: comprueba que las direcciones antiguas de `examples/` llevan a una partitura que existe.
