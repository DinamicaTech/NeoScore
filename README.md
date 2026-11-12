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

NeoScore es una pequeña web que funciona entera en el navegador: lee directamente la partitura en **MusicXML** y la dibuja. Está publicada en **https://dinamicatech.github.io/NeoScore**.

Arriba a la izquierda hay un **desplegable con las partituras de la biblioteca**: al elegir una, se abre. Con **Abrir fichero…** puedes abrir un MusicXML de tu equipo: se queda solo en tu navegador (no se sube a ningún sitio), el navegador lo recuerda y aparece en el desplegable como "Mi partitura"; **Olvidar la mía** lo borra. Bajo el título se muestra siempre la autoría y el aviso de derechos de la partitura.

También se puede abrir una partitura concreta con su dirección dentro de la web, y opcionalmente qué estrofas se ven al abrir:

```
https://dinamicatech.github.io/NeoScore/?partitura=biblioteca/ElNoiDeLaMare_completa.musicxml&estrofas=1,2,5
```

Para añadir una canción a la biblioteca, expórtala a MusicXML sin comprimir (por ejemplo, desde MuseScore: *Archivo → Exportar → MusicXML*, fichero `.musicxml`), guárdala en la carpeta `biblioteca/` y añádela a la lista `biblioteca/indice.json` con su título, las estrofas que se ven al abrir (vacío = todas), su autoría y su aviso de derechos.

Para probar la web en tu equipo hace falta servirla (el navegador no deja leer la partitura si se abre `index.html` con doble clic). Con Python 3 instalado, en la carpeta del proyecto:

```bash
python -m http.server 8000
```

y abre http://localhost:8000 en el navegador.

En la página puedes:

- Elegir la **voz** (Soprano, Alto, Tenor, Baix…) si la partitura tiene varias.
- Elegir qué **estrofas** ver en el desplegable. Cada estrofa termina donde la partitura tiene una doble barra y toma su nombre de la indicación de texto del primer compás ("Estrofa 2"…). El navegador recuerda la última selección.
- Ajustar el **tamaño** con el control deslizante.
- **Oír una nota**: al tocar una sílaba (o su bloque de color) suena su nota, como referencia para afinar; si se mantiene pulsada, sigue sonando hasta soltarla. En **Sonido** se elige con qué se oye: **Voz** (una voz sintética que canta "a") o **Piano** (un piano de cola grabado). El navegador recuerda la elección. En iPhone, si no se oye nada, quita el interruptor de silencio.
- **Cantar con tempo**: pulsa **🎤 Cantar** y permite el micrófono. Tras un compás de cuenta atrás, la sílaba que toca se ilumina al ritmo de la canción y, encima de cada bloque, una línea dibuja la nota que cantas; al pasar la nota, el bloque se rodea de verde (✓ afinada), rojo (▲ demasiado alta) o azul (▼ demasiado baja). Al lado se elige el **tempo** (la velocidad, en negras por minuto: el de la partitura o 80), el **margen** (Fácil, Normal o Difícil: cuánto te puedes desviar) y si suena muy suave la **nota guía** de cada sílaba (mejor con auriculares, para que el micrófono no la oiga). Cantar la misma nota una octava más grave o más aguda cuenta como buena. El resultado se queda solo en tu navegador.
- Leerla en el **móvil en vertical**: las líneas se cortan según el ancho de la pantalla, y si un compás no cabe entero sigue en la línea siguiente (esa barra se dibuja discontinua y no repite el número del compás).
- **Imprimir**: los controles se ocultan y cada línea se mantiene entera en la página.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página. |
| `js/lector-musicxml.js` | Lee el MusicXML (notas, duraciones, silencios, ligaduras, letra, indicaciones y dobles barras). |
| `js/dibujo.js` | Dibuja la cuadrícula, los colores y la leyenda. |
| `js/lineas.js` | Reparte los compases en líneas según el ancho de la pantalla. |
| `js/controles.js`, `js/estrofas.js` | Controles de voz, estrofas y tamaño. |
| `js/pagina.js` | Selector de partituras, botón para abrir un fichero propio, aviso de derechos y carga de la partitura. |
| `js/biblioteca.js` | Lee el índice de la biblioteca y guarda en el navegador la partitura propia. |
| `js/sonido.js` | Nota de referencia: hace sonar la nota de la sílaba tocada, con el sonido elegido. |
| `js/canto.js` | Cantar con tempo: marca la sílaba que toca, escucha el micrófono y dibuja lo cantado. |
| `js/afinacion.js` | Cálculos de cantar con tempo: orden y momento de las notas, y si lo cantado está afinado, alto o bajo. |
| `js/vendor/` | Librerías copiadas en el proyecto, con su licencia MIT: Tone.js (reproduce el sonido) y pitchy con fft.js (reconoce la nota que se canta). |
| `sonidos/` | Sonidos grabados, una carpeta por sonido con su licencia (`sonidos/piano/`: Salamander Grand Piano, CC BY 3.0, de Alexander Holm). Para añadir otro, ver el comentario al principio de `js/sonido.js`. |
| `css/neopartitura.css` | Estilos de la página. |
| `examples/` | Direcciones antiguas de los ejemplos: llevan a la página con su partitura. |
| `biblioteca/` | Las partituras de la biblioteca (MusicXML) y su lista, `indice.json`. |
| `sources/` | Ficheros originales de requisitos (documentos y MusicXML de partida), sin cambios. |
| `tests/` | Pruebas automáticas. |

## Ejemplos

- **[Muntanyes del Canigó](https://dinamicatech.github.io/NeoScore/?partitura=biblioteca/MuntanyesDelCanigo.musicxml)** · [MusicXML](biblioteca/MuntanyesDelCanigo.musicxml): tradicional catalana, harmonización de Nadal Puig. Cuatro voces.
- **[El Noi de la Mare](https://dinamicatech.github.io/NeoScore/?partitura=biblioteca/ElNoiDeLaMare_completa.musicxml&estrofas=1,2,5)** · [MusicXML](biblioteca/ElNoiDeLaMare_completa.musicxml): villancico popular catalán, versión coral de Abel Di Marco, Pbro. Cuatro voces y cinco estrofas; se abre con las estrofas 1, 2 y 5. © A. Di Marco: uso y duplicación permitidos solo con fines pastorales, prohibido su uso con fines económicos.

## Pruebas

Cada cambio propuesto en GitHub pasa por unas pruebas automáticas (acción **Pruebas**), que también se ejecutan cada lunes. Entre otras cosas comprueban que el lector sigue leyendo los ejemplos exactamente igual. Para ejecutarlas en tu equipo hace falta Node:

```bash
node --test tests/*.test.mjs
```

Más detalles en [tests/README.md](tests/README.md).

## Limitaciones conocidas

- Las notas muy cortas se ensanchan lo justo para que quepa la sílaba, así que en esos puntos el ritmo es aproximado.
- Los guiones entre sílabas solo aparecen si el MusicXML los indica.
- Solo se leen ficheros MusicXML sin comprimir (`.musicxml`), no los comprimidos (`.mxl`).
- Se lee solo la primera línea de letra y se ignoran los acordes dentro de una misma voz.
- Las repeticiones (casillas 1ª/2ª, *da capo*) no se despliegan.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
