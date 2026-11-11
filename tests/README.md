# Pruebas automáticas

La acción de GitHub **Pruebas** (`.github/workflows/pruebas.yml`) las ejecuta en cada pull request, en cada cambio en `main` y cada lunes. No hace falta instalar nada.

| Tipo | Ficheros | Ejecutar en local |
| --- | --- | --- |
| Python (unittest) | `tests/test_*.py` | `python -m unittest discover -s tests -v` |
| JavaScript (node:test) | `tests/*.test.mjs` | `node --test tests/*.test.mjs` |

Para añadir pruebas basta con crear un fichero con ese nombre en esta carpeta: la acción lo encuentra sola.

## Pruebas actuales

- `test_ejemplos.py`: convierte cada ejemplo de `examples/` desde su MusicXML de `sources/` con `neopartitura.py` y comprueba que sale exactamente igual que la página guardada. Si un cambio querido altera los ejemplos, regenéralos con `python tests/test_ejemplos.py --actualizar` y revísalos antes de subirlos. Para añadir un ejemplo, añádelo a la lista `EJEMPLOS` del fichero.
