"""Genera una neo-partitura HTML a partir de un MusicXML.

Uso: python neopartitura.py partitura.musicxml [salida.html]
"""
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
                    syl = ly.findtext('syllabic') or 'single'
                    ev['t'] = ly.findtext('text') + ('-' if syl in ('begin', 'middle') else '')
                ties = {t.get('type') for t in n.findall('tie')}
                if 'stop' in ties:
                    ev['tie'] = 1
                events.append(ev)
            measures.append(events)
        parts.append({'name': names.get(p.get('id'), p.get('id')), 'measures': measures})
    return {'title': title, 'parts': parts}


def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_name(src.stem + '_neo.html')
    data = parse(src)
    template = (Path(__file__).parent / 'neopartitura_template.html').read_text(encoding='utf-8')
    html = template.replace('__TITLE__', data['title']).replace('__DATA__', json.dumps(data, ensure_ascii=False))
    out.write_text(html, encoding='utf-8')
    print(out)


if __name__ == '__main__':
    main()
