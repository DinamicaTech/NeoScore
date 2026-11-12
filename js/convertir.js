// Convertir con Claude: el prompt que NeoScore prepara para convertir fotos o un PDF de una partitura
// en MusicXML con la cuenta de Claude del propio usuario, y el enlace que abre claude.ai con él.
// No usa claves ni servidor: el usuario adjunta los ficheros en claude.ai y abre el resultado con "Abrir fichero…".

export const PROMPT = `Convierte la partitura de los ficheros que te adjunto (fotos o un PDF; las páginas van en orden) en un fichero MusicXML para abrirlo en NeoScore, una web que enseña a cantar en coro a personas que no leen música.

Cómo debe ser el MusicXML:
- MusicXML 3.1, formato score-partwise, sin comprimir.
- Copia exactamente lo que se ve: notas, alteraciones, duraciones, puntillos, silencios, ligaduras, armadura, compás, tempo, repeticiones y dobles barras. No añadas ni simplifiques nada.
- Una <part> por cada voz, con su nombre (Soprano, Contralto, Tenor, Bajo…). Si dos voces comparten pentagrama, sepáralas en dos partes.
- La letra bajo cada nota, con un <lyric number="N"> por estrofa y su <syllabic> (single, begin, middle o end). Si hay estrofas escritas como texto aparte, ponlas también bajo las notas como estrofas siguientes.
- En <work-title> el título, en <creator> la autoría (composición, letra, armonización) y en <rights> el aviso de derechos copiado tal como aparece en la partitura. No inventes ninguno de los tres: si no aparece, déjalo vacío.

Entrégamelo como un fichero descargable con extensión .musicxml, no como texto en el chat.

Después, en una lista corta, dime qué partes has leído con dudas (voz, compás y qué dudas), para que las revise. Si te digo que algo está mal, corrígelo y dame otra vez el fichero completo.`;

/** Dirección de claude.ai que abre una conversación nueva con el prompt ya escrito. */
export function enlaceClaude(prompt = PROMPT) {
  return 'https://claude.ai/new?q=' + encodeURIComponent(prompt);
}

/** Los pasos que se le muestran al usuario al pulsar el botón. */
export function pasos(copiado) {
  return 'Se ha abierto Claude en otra pestaña con las instrucciones'
    + (copiado ? ' (también están copiadas: si no aparecen escritas, pégalas con Ctrl+V)' : '')
    + '. 1) Adjunta allí las fotos o el PDF de la partitura y envía. 2) Descarga el fichero .musicxml que te dé Claude. '
    + '3) Ábrelo aquí con "Abrir fichero…". Si alguna nota o sílaba sale mal, díselo a Claude en la misma conversación y abre el fichero corregido. '
    + 'Hace falta una cuenta de Claude (claude.ai).';
}
