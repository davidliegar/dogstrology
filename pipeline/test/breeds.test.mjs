import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { BREEDS, BREED_LABELS } from '../src/breeds.mjs';
import { breedSignFragments } from '../src/catalogFragments.mjs';
import { SIGNS } from '../../proto/astro.mjs';

/**
 * Mismo peligro que las etiquetas, y por la misma razón: `breeds.mjs` y
 * `app/src/pet/ui/breeds.ts` son la misma tabla escrita dos veces en dos
 * lenguajes que no se importan. Si un id diverge, el pipeline genera
 * `breed=pitbull;sign=aries` y la app busca `breed=american-pit-bull-terrier;
 * sign=aries`: no hay error, la ficha de raza sale vacía (BRD §7.3.1).
 */
const APP_BREEDS = readFileSync(new URL('../../app/src/pet/ui/breeds.ts', import.meta.url), 'utf8');

test('cada raza del pipeline existe igual en el catálogo de la app', () => {
  for (const { id, label, fci } of BREEDS) {
    const line = `{ id: '${id}', label: '${label}', fci: ${fci} },`;
    assert.ok(APP_BREEDS.includes(line), `no aparece igual en app/src/pet/ui/breeds.ts: ${line}`);
  }
});

test('la app no tiene razas de más', () => {
  const appIds = [...APP_BREEDS.matchAll(/\{ id: '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(appIds.sort(), BREEDS.map((b) => b.id).sort());
});

test('los ids son únicos, en minúscula y sin caracteres fuera de [a-z0-9-]', () => {
  const ids = BREEDS.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, 'hay ids duplicados');
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, `id no válido como clave: "${id}"`);
});

test('los 10 grupos FCI están representados', () => {
  const groups = new Set(BREEDS.map((b) => b.fci).filter((g) => g !== null));
  assert.deepEqual([...groups].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('los mestizos no pueden faltar: son ~la mitad de los perros de España', () => {
  const mixed = BREEDS.filter((b) => b.id.startsWith('mixed-breed-'));
  assert.equal(mixed.length, 3, 'mestizo va partido por tamaño (pequeño/mediano/grande)');
});

test('breedSignFragments cubre cada raza por cada signo, sin claves repetidas', () => {
  const fragments = breedSignFragments();
  assert.equal(fragments.length, BREEDS.length * SIGNS.length);

  const keys = fragments.map((f) => f.key);
  assert.equal(new Set(keys).size, keys.length, 'hay claves repetidas');
  assert.ok(keys.includes('breed=french-bulldog;sign=aries'));
});

test('el mensaje al modelo va en español aunque la clave sea inglesa (D15)', () => {
  const fragment = breedSignFragments().find((f) => f.key === 'breed=pug;sign=scorpio');
  assert.match(fragment.userMessage, /Carlino/, 'debe usar la etiqueta de raza, no el id');
  assert.match(fragment.userMessage, /Escorpio/);
  assert.doesNotMatch(fragment.userMessage, /\bpug\b/, 'el id de la raza no debe llegar al modelo');

  // Ojo: aquí no se puede comprobar lo mismo con el signo. La etiqueta
  // española contiene el id como subcadena ("E-scorpio"), así que cualquier
  // aserción de ese tipo salta sola. Lo que ata signos es `labels.test.mjs`.
});

test('BREED_LABELS indexa por id', () => {
  assert.equal(BREED_LABELS['spanish-greyhound'], 'Galgo español');
  assert.equal(Object.keys(BREED_LABELS).length, BREEDS.length);
});
