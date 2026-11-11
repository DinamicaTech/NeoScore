# NeoScore · neo-partitura

Una forma de leer música pensada para quien **no sabe leer partituras** y quiere cantar.

La letra es lo principal. Debajo de cada sílaba hay una pequeña cuadrícula: cada **fila** es un semitono y cada **columna** es un trozo de tiempo. La nota que hay que cantar se pinta como un bloque de color en su fila.

Así, de un vistazo se ve:

- **Si hay que subir, bajar o mantener la nota.** La posición vertical del bloque y una línea fina que une las notas dibujan el contorno de la melodía.
- **Cuánto dura cada nota.** El ancho del bloque es proporcional a la duración.
- **Cuándo se repite una nota.** Cada nota tiene su color: si dos bloques tienen el mismo color, son la misma nota, aunque estén lejos.

## Cómo funcionan los colores

- **Azul es siempre la primera nota de la voz.** El resto de colores se asignan según la distancia en semitonos a esa primera nota (12 colores, uno por semitono).
- Las notas a una octava de distancia comparten color, porque son "la misma nota" más aguda o más grave. Su posición en la cuadrícula indica cuál es.
- Una línea azulada en la cuadrícula marca la altura de la primera nota, como referencia.
- La leyenda de arriba indica a qué nota real (Do, Re, Mi…) corresponde cada color.

Como los colores son relativos a la primera nota, si se cambia el tono de la canción los colores no cambian.

## Uso

Hace falta Python 3 sin librerías adicionales. Exporta la partitura a **MusicXML** (por ejemplo, desde MuseScore: *Archivo → Exportar → MusicXML*) y ejecuta:

```bash
python neopartitura.py mi_cancion.musicxml
```

Esto genera `mi_cancion_neo.html`, una página autónoma que se abre con cualquier navegador. También puedes indicar el nombre de salida:

```bash
python neopartitura.py mi_cancion.musicxml salida.html
```

Si la canción tiene varias estrofas, puedes decidir cuáles se ven al abrir la página:

```bash
python neopartitura.py mi_cancion.musicxml --estrofas 1,2,5
```

En la página puedes:

- Elegir la **voz** (Soprano, Alto, Tenor, Baix…) si la partitura tiene varias.
- Elegir qué **estrofas** ver en el desplegable. Cada estrofa termina donde la partitura tiene una doble barra y toma su nombre de la indicación de texto del primer compás ("Estrofa 2"…). El navegador recuerda la última selección.
- Ajustar el **tamaño** con el control deslizante.
- **Imprimir**: los controles se ocultan y cada línea se mantiene entera en la página.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `neopartitura.py` | Lee el MusicXML (notas, duraciones, silencios, ligaduras y letra) y genera el HTML. |
| `neopartitura_template.html` | Plantilla de la página: dibuja la cuadrícula, los colores y la leyenda. |
| `examples/` | Neo-partituras de ejemplo. |
| `sources/` | MusicXML de los ejemplos y documentos de requisitos. |
| `tests/` | Pruebas automáticas. |

## Ejemplos

- **[Muntanyes del Canigó](https://dinamicatech.github.io/NeoScore/examples/MuntanyesDelCanigo_neo.html)** · [código](examples/MuntanyesDelCanigo_neo.html): tradicional catalana, harmonización de Nadal Puig. Cuatro voces.
- **[El Noi de la Mare](https://dinamicatech.github.io/NeoScore/examples/ElNoiDeLaMare_neo.html)** · [código](examples/ElNoiDeLaMare_neo.html): villancico popular catalán, versión coral de Abel Di Marco, Pbro. Cuatro voces y cinco estrofas; se abre con las estrofas 1, 2 y 5. © A. Di Marco: uso y duplicación permitidos solo con fines pastorales, prohibido su uso con fines económicos.

## Pruebas

Cada cambio propuesto en GitHub pasa por unas pruebas automáticas (acción **Pruebas**), que también se ejecutan cada lunes. La primera comprueba que los ejemplos siguen saliendo exactamente igual. Para ejecutarlas en tu equipo:

```bash
python -m unittest discover -s tests -v
```

Más detalles en [tests/README.md](tests/README.md).

## Limitaciones conocidas

- Las notas muy cortas se ensanchan lo justo para que quepa la sílaba, así que en esos puntos el ritmo es aproximado.
- Los guiones entre sílabas solo aparecen si el MusicXML los indica.
- Se lee solo la primera línea de letra y se ignoran los acordes dentro de una misma voz.
- Las repeticiones (casillas 1ª/2ª, *da capo*) no se despliegan.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
