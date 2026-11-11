// Las direcciones antiguas de los ejemplos (examples/*.html) siguen llevando a una partitura que existe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);

for (const f of readdirSync(new URL('examples/', raiz)).filter(f => f.endsWith('.html'))) {
  test(`examples/${f} lleva a una partitura que existe`, () => {
    const html = readFileSync(new URL('examples/' + f, raiz), 'utf8');
    const m = html.match(/index\.html\?partitura=([^&"']+)/);
    assert.ok(m, `examples/${f} no lleva a index.html?partitura=...`);
    assert.ok(existsSync(new URL(decodeURIComponent(m[1]), raiz)),
      `examples/${f} lleva a ${m[1]}, que no existe. Si la partitura se ha movido, actualiza la dirección en examples/${f}.`);
  });
}
