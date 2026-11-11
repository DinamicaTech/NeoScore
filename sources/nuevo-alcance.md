Nuevo alcance: Ahora tenemos una forma de visualizar de forma 'amable' una partitura musicxml, el usuario selecciona su cuerda (barítono, tenor, etc.) y puede ver la letra y la nota musical (más que la nota musical, lo importante es el diferencial respecto la nota anterior).
El siguiente paso es:

* Poder seleccionar una nota/sílaba y que se emita el sonido de esa nota como referencia auditiva. Este sonido puede ser emulando un piano o una persona cantando esa nota (falta ver con qué tipo de sonido es más fácil detectar la resonancia para saber si se está afinando)
* A partir de un tempo, ir marcando qué nota/sílaba toca cantar, registrar la onda de sonido y mostrar la nota superpuesta a la de la neo-partitura, para saber si está afinada o si es demasiado alta o baja. De esa forma, al acabar la canción se puede revisar los puntos en los que no se ha cantado de forma afinada para ir mejorando.
* Para un futuro: Algo de gamificación (puntos por cantar perfectamente, etc.)


Lo que hay hecho ahora es un módulo Python que genera un HTML.

No tengo claro si es la arquitectura adecuada para estos nuevos requerimientos, sobre todo porque harán falta librerías (de Github?) que permitan reproducir una nota con determinado instrumento y trasladar una onda de sonido a una nota.
