import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mergeFragments } from '../src/generateCatalog.mjs';

/**
 * `--missing` regenera solo lo que falta y fusiona con lo ya publicado. Es la
 * operación que puede hacer daño de verdad: un fallo aquí no da error, se
 * lleva por delante fragmentos ya revisados (1.476 en la tanda del
 * 2026-08-26) y solo se notaría al abrir el PR.
 */
const all = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];

test('completa los huecos sin tocar lo ya publicado', () => {
  const merged = mergeFragments(all, [{ key: 'a', v: 1 }, { key: 'c', v: 3 }], [{ key: 'b', v: 2 }]);
  assert.deepEqual(merged, [{ key: 'a', v: 1 }, { key: 'b', v: 2 }, { key: 'c', v: 3 }]);
});

test('devuelve el orden canónico de build(), no el de llegada', () => {
  const merged = mergeFragments(all, [{ key: 'd' }], [{ key: 'b' }, { key: 'a' }]);
  assert.deepEqual(merged.map((f) => f.key), ['a', 'b', 'd']);
});

test('sin nada nuevo, no pierde ni uno', () => {
  const published = all.map((f) => ({ ...f, v: 1 }));
  assert.deepEqual(mergeFragments(all, published, []), published);
});

test('una regeneración sin --missing sustituye, que es lo que se le pide', () => {
  const merged = mergeFragments(all, [{ key: 'a', v: 'viejo' }], [{ key: 'a', v: 'nuevo' }]);
  assert.deepEqual(merged, [{ key: 'a', v: 'nuevo' }]);
});

test('ignora claves que ya no existen en la categoría', () => {
  // Si se quita una raza de `breeds.mjs`, su fragmento deja de formar parte del
  // catálogo en vez de quedarse colgado en el JSON para siempre.
  const merged = mergeFragments(all, [{ key: 'a' }, { key: 'zz-raza-retirada' }], []);
  assert.deepEqual(merged.map((f) => f.key), ['a']);
});
