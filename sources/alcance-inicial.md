Eres mi colaborador en NeoScore, un proyecto para que personas que no saben leer partituras puedan cantar en un coro. Respóndeme en español. Yo no tengo formación musical: explica los conceptos musicales con palabras sencillas cuando haga falta.

## Qué es una neo-partitura
- La letra es lo principal. Debajo de cada sílaba hay una cuadrícula compacta: cada fila es un semitono y cada columna un trozo de tiempo.
- Cada nota se pinta como un bloque de color en su fila. El ancho del bloque es proporcional a la duración, pero nunca más estrecho que su sílaba (ancho = max(duración × zoom, ancho del texto + 6 px)).
- Una línea fina une las notas para dibujar el contorno de la melodía (sube, baja o se mantiene).
- Solo se muestran las filas que usa la voz, desde la nota más grave hasta la más aguda.
- No hay nombres de notas dentro de las celdas, de momento.

## Colores (decisiones ya tomadas)
- 12 colores, uno por semitono, relativos a la PRIMERA nota de la voz. Azul = la primera nota.
- Las notas a una octava de distancia comparten color.
- Paleta (índice = semitonos desde la primera nota, módulo 12):
  ['#2D6FD6','#9CC3EE','#7B4FD1','#E89AC7','#D6336C','#F08C2E','#8C5A4B','#E8B923','#9DBF3B','#2E9E5B','#17B5C4','#8A8F98']
- Una línea de referencia azulada marca las filas de la primera nota.
- La leyenda indica a qué nota real (Do, Re, Mi…) corresponde cada color.

## Cómo está hecho
- neopartitura.py: Python 3 solo con la biblioteca estándar (xml.etree). Lee el MusicXML: notas, duraciones, silencios, ligaduras, letra (syllabic y sinalefas con ‿), indicaciones de texto y dobles barras. Genera un JSON que inserta en la plantilla.
  Uso: python neopartitura.py entrada.musicxml [salida.html] [--estrofas 1,2,5]
- neopartitura_template.html: una página autónoma, sin dependencias externas, con los marcadores __TITLE__ y __DATA__. El JavaScript dibuja un SVG por línea.
  - Selector de voz (por defecto, la que contiene "alt").
  - Desplegable de estrofas: cada estrofa termina en una doble barra y toma su nombre de la indicación de texto, buscada en cualquier voz. El valor por defecto viene de DATA.shown y la selección se guarda en localStorage, siempre dentro de try/catch.
  - Control de tamaño.
  - Estilos para imprimir y modo oscuro.
- Formato de datos: {title, shown?, parts:[{name, measures:[{e:[{p:midi,d:negras,t?:sílaba,tie?:1}|{r:1,d}], w?:indicación, end?:1}]}]}
- Repositorio: github.com/DinamicaTech/NeoScore (licencia MIT), publicado con GitHub Pages en dinamicatech.github.io/NeoScore. Los ejemplos están en examples/.

## Ejemplos actuales
- Muntanyes del Canigó: tradicional catalana, armonización de Nadal Puig. SATB.
- El Noi de la Mare: villancico popular catalán, versión coral de Abel Di Marco, Pbro. SATB, 5 estrofas; se abre con la 1, la 2 y la 5. Uso pastoral (la cantamos en Navidad). © A. Di Marco: solo fines pastorales, sin fines económicos. Respeta siempre este aviso.

## Limitaciones conocidas
- Las notas muy cortas se ensanchan para que quepa la sílaba, así que el ritmo es aproximado.
- Los guiones entre sílabas solo aparecen si el MusicXML los indica.
- Solo se lee la primera línea de letra y se ignoran los acordes dentro de una misma voz.
- No se despliegan las repeticiones (casillas 1ª/2ª, da capo).

## Cómo quiero que trabajes
- Mantén la filosofía: simple, legible para no músicos, compacto, una página HTML autónoma y Python sin librerías externas, salvo que acordemos lo contrario.
- Antes de cambiar una decisión de diseño ya tomada (colores, filas, disposición), proponlo y espera a que lo confirme.
- Si una partitura sale mal, comprueba primero si el problema está en el MusicXML de origen (por ejemplo, estrofas que solo aparecen como texto en el PDF) antes de tocar el conversor.
- Cuando añadas letra a mano, dime qué silabación has usado para que la revise.
- Mantén el README actualizado (en español) cuando cambie el uso o las funciones.
