import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { ASPECT_LABELS, AXES, label, MOON_PHASE_LABELS, PLANET_LABELS, SIGN_LABELS } from '../src/labels.mjs';
import { SIGNS } from '../../proto/astro.mjs';

/**
 * `pipeline/src/labels.mjs` y `app/src/chart/ui/labels.ts` son la misma tabla
 * escrita dos veces, en dos lenguajes que no se importan entre sí. Si divergen,
 * la app enseñaría "Sagitario" y el contenido hablaría de otra cosa — o peor,
 * el pipeline generaría `sign=sagitario` y la app buscaría `sign=sagittarius`,
 * que no falla: simplemente no encuentra nada y la tarjeta sale vacía.
 *
 * Se comprueba leyendo el fichero de la app como texto, que es feo pero es lo
 * único que no exige compilar TypeScript desde aquí.
 */
const APP_LABELS = readFileSync(new URL('../../app/src/chart/ui/labels.ts', import.meta.url), 'utf8');

test('los identificadores del pipeline son los mismos que los del motor', () => {
  assert.deepEqual(Object.keys(SIGN_LABELS).sort(), [...SIGNS].sort());
});

test('las etiquetas del pipeline coinciden con las de la app, una a una', () => {
  const tables = { SIGN_LABELS, PLANET_LABELS, ASPECT_LABELS, MOON_PHASE_LABELS };
  for (const [name, table] of Object.entries(tables)) {
    for (const [id, text] of Object.entries(table)) {
      const found = new RegExp(`\\b${id}:\\s*'${text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'`).test(APP_LABELS);
      assert.ok(found, `${name}.${id} = "${text}" no aparece igual en app/src/chart/ui/labels.ts`);
    }
  }
});

test('los tres ejes del diario llevan id en inglés y etiqueta en español', () => {
  assert.deepEqual(AXES.map((a) => a.id), ['sun', 'moon', 'ascendant']);
  assert.deepEqual(AXES.map((a) => a.label), ['Sol', 'Luna', 'Ascendente']);
});

test('label() revienta si falta una etiqueta, en vez de escribir "undefined" en el prompt', () => {
  assert.throws(() => label(SIGN_LABELS, 'sagitario'), /Sin etiqueta/);
  assert.equal(label(SIGN_LABELS, 'sagittarius'), 'Sagitario');
});
