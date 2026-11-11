"""Genera una neo-partitura HTML a partir de un MusicXML.

Uso: python neopartitura.py partitura.musicxml [salida.html] [--estrofas 1,2,5]
"""
import argparse
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

STEP = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def parse(path):
    root = ET.parse(path).getroot()
    title = root.findtext('work/work-title') or root.findtext('movement-title') or Path(path).stem
    names = {sp.get('id'): sp.findtext('part-name') for sp in root.find('part-list').findall('score-part')}
    parts = []
    for p in root.findall('part'):
        divisions = 1
        measures = []
        for m in p.findall('measure'):
            d = m.find('attributes/divisions')
            if d is not None:
                divisions = int(d.text)
            events = []
            for n in m.findall('note'):
                if n.find('chord') is not None or n.find('grace') is not None:
                    continue
                dur = int(n.findtext('duration') or 0) / divisions  # en negras
                if n.find('rest') is not None:
                    events.append({'r': 1, 'd': dur})
                    continue
                pt = n.find('pitch')
                midi = 12 * (int(pt.findtext('octave')) + 1) + STEP[pt.findtext('step')] + int(float(pt.findtext('alter') or 0))
                ev = {'p': midi, 'd': dur}
                ly = n.find('lyric')
                if ly is not None and ly.findtext('text'):
                    # varias sílabas en una nota (sinalefa): na‿en
                    texts = [t.text or '' for t in ly.findall('text')]
                    syls = [s.text for s in ly.findall('syllabic')]
                    syl = syls[-1] if syls else 'single'
                    ev['t'] = '‿'.join(texts) + ('-' if syl in ('begin', 'middle') else '')
                ties = {t.get('type') for t in n.findall('tie')}
                if 'stop' in ties:
                    ev['tie'] = 1
                events.append(ev)
            measure = {'e': events}
            # indicaciones de texto ("Estrofa 2", "rit.") y fin de sección (doble barra)
            words = [w.text.strip() for w in m.findall('direction/direction-type/words') if w.text and w.text.strip()]
            if words:
                measure['w'] = ' · '.join(words)
            style = m.findtext("barline[@location='right']/bar-style")
            if style in ('light-light', 'light-heavy', 'heavy-light', 'heavy-heavy'):
                measure['end'] = 1
            measures.append(measure)
        parts.append({'name': names.get(p.get('id'), p.get('id')), 'measures': measures})
    return {'title': title, 'parts': parts}


def main():
    ap = argparse.ArgumentParser(description='Genera una neo-partitura HTML a partir de un MusicXML.')
    ap.add_argument('entrada', help='archivo .musicxml')
    ap.add_argument('salida', nargs='?', help='archivo .html (por defecto <entrada>_neo.html)')
    ap.add_argument('--estrofas', help='estrofas visibles al abrir, p. ej. "1,2,5" (por defecto todas)')
    args = ap.parse_args()
    src = Path(args.entrada)
    out = Path(args.salida) if args.salida else src.with_name(src.stem + '_neo.html')
    data = parse(src)
    if args.estrofas:
        data['shown'] = [int(x) - 1 for x in args.estrofas.replace(' ', '').split(',') if x]
    template = (Path(__file__).parent / 'neopartitura_template.html').read_text(encoding='utf-8')
    html = template.replace('__TITLE__', data['title']).replace('__DATA__', json.dumps(data, ensure_ascii=False))
    out.write_text(html, encoding='utf-8')
    print(out)


if __name__ == '__main__':
    main()
