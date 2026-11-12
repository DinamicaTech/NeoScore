// Convertir con Claude: el enlace a claude.ai lleva el prompt completo y el prompt pide lo que NeoScore necesita.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROMPT, enlaceClaude, pasos } from '../js/convertir.js';

test('el enlace abre una conversación nueva de claude.ai con el prompt entero', () => {
  const u = new URL(enlaceClaude());
  assert.equal(u.origin + u.pathname, 'https://claude.ai/new');
  assert.equal(u.searchParams.get('q'), PROMPT);
});

test('el enlace no es tan largo como para que el navegador lo corte', () => {
  assert.ok(enlaceClaude().length < 8000, `el enlace mide ${enlaceClaude().length} caracteres: acorta el prompt`);
});

test('el prompt pide lo que NeoScore necesita para dibujar y respetar los derechos', () => {
  for (const pide of ['MusicXML', 'score-partwise', '<lyric number="N">', '<syllabic>', '<rights>', '<work-title>', '<creator>', '.musicxml', 'No inventes'])
    assert.ok(PROMPT.includes(pide), `el prompt ya no pide ${pide}`);
});

test('los pasos dicen cómo seguir, con o sin portapapeles', () => {
  assert.match(pasos(true), /Ctrl\+V/);
  assert.doesNotMatch(pasos(false), /Ctrl\+V/);
  for (const t of [pasos(true), pasos(false)]) assert.match(t, /Abrir fichero…/);
});

test('la página tiene el botón y el selector de ficheros acepta lo que entrega Claude', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<button id="convertir" title="[^"]+">Convertir con Claude<\/button>/);
  assert.match(html, /accept="[^"]*\.musicxml/);
});
