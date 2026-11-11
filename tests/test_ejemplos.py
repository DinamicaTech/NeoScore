"""Comprueba que neopartitura.py sigue generando exactamente los ejemplos guardados en examples/.

Ejecutar todas las pruebas de Python:   python -m unittest discover -s tests -v
Regenerar los ejemplos (solo si el cambio del resultado es querido):
    python tests/test_ejemplos.py --actualizar
"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# Cada ejemplo: MusicXML de origen, página guardada y opciones del conversor.
EJEMPLOS = [
    ('sources/ElNoiDeLaMare_completa.musicxml', 'examples/ElNoiDeLaMare_neo.html', ['--estrofas', '1,2,5']),
    ('sources/MuntanyesDelCanigo.musicxml', 'examples/MuntanyesDelCanigo_neo.html', []),
]


def convertir(origen, salida, opciones):
    subprocess.run([sys.executable, str(RAIZ / 'neopartitura.py'), str(RAIZ / origen), str(salida), *opciones],
                   check=True, capture_output=True)


def leer(path):
    # Se ignoran las diferencias de fin de línea (Windows CRLF frente a Linux LF).
    return Path(path).read_text(encoding='utf-8').replace('\r\n', '\n')


class Ejemplos(unittest.TestCase):
    def test_los_ejemplos_no_cambian(self):
        with tempfile.TemporaryDirectory() as tmp:
            for origen, guardado, opciones in EJEMPLOS:
                with self.subTest(ejemplo=guardado):
                    nuevo = Path(tmp) / Path(guardado).name
                    convertir(origen, nuevo, opciones)
                    esperado, obtenido = leer(RAIZ / guardado), leer(nuevo)
                    if esperado != obtenido:
                        linea = next((i + 1 for i, (a, b) in enumerate(zip(esperado.split('\n'), obtenido.split('\n')))
                                      if a != b), min(esperado.count('\n'), obtenido.count('\n')) + 1)
                        self.fail(f'{guardado} ya no sale igual al convertir {origen} (primera diferencia en la línea '
                                  f'{linea}). Si el cambio es un error, corrige neopartitura.py o la plantilla; si es '
                                  f'querido, regenera los ejemplos con "python tests/test_ejemplos.py --actualizar" '
                                  f'y revisa las páginas antes de subirlas.')


if __name__ == '__main__':
    if '--actualizar' in sys.argv:
        for origen, guardado, opciones in EJEMPLOS:
            convertir(origen, RAIZ / guardado, opciones)
            print('Regenerado', guardado)
    else:
        unittest.main()
