import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  aspectFragments,
  planetSignHouseFragments,
  MAJOR_ASPECTS,
  BODIES,
} from '../src/catalogFragments.mjs';
import { aspects, SIGNS } from '../../proto/astro.mjs';

test('BODIES tiene los 10 cuerpos del motor', () => {
  assert.equal(BODIES.length, 10);
  assert.ok(BODIES.includes('sun'));
  assert.ok(BODIES.includes('moon'));
});

test('MAJOR_ASPECTS coincide con los nombres reales de aspects() del motor', () => {
  // Sintetiza dos cuerpos a cada separación exacta (0/60/90/120/180°) y
  // comprueba que el nombre que devuelve aspects() es el que tenemos aquí
  // hardcodeado — sin exportar la constante interna del motor.
  const angles = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };
  assert.deepEqual(new Set(Object.keys(angles)), new Set(MAJOR_ASPECTS));

  for (const [nombre, angulo] of Object.entries(angles)) {
    const planetas = [
      { id: 'A', lon: 10 },
      { id: 'B', lon: 10 + angulo },
    ];
    const [result] = aspects(planetas);
    assert.equal(result.aspect, nombre, `separación de ${angulo}° debería dar "${nombre}"`);
  }
});

test('aspectFragments da exactamente 500 (10×10×5)', () => {
  const fragments = aspectFragments();
  assert.equal(fragments.length, 500);
  const claves = new Set(fragments.map((f) => f.key));
  assert.equal(claves.size, 500);
});

test('aspectFragments: la clave tiene la misma forma que devuelve transits()', () => {
  const [f] = aspectFragments();
  assert.match(f.key, /^transit=.+;aspect=.+;natal=.+$/);
});

test('planetSignHouseFragments da exactamente 240 (10×12 signs + 10×12 casas)', () => {
  const fragments = planetSignHouseFragments();
  assert.equal(fragments.length, 240);
  const claves = new Set(fragments.map((f) => f.key));
  assert.equal(claves.size, 240);

  const porSigno = fragments.filter((f) => f.key.includes(';sign='));
  const byHouse = fragments.filter((f) => f.key.includes(';house='));
  assert.equal(porSigno.length, 120);
  assert.equal(byHouse.length, 120);
});

test('planetSignHouseFragments cubre los 12 signs para cada uno de los 10 cuerpos', () => {
  const fragments = planetSignHouseFragments();
  for (const planet of BODIES) {
    const signs = fragments
      .filter((f) => f.key.startsWith(`planet=${planet};sign=`))
      .map((f) => f.key.split('sign=')[1]);
    assert.equal(new Set(signs).size, 12);
    for (const sign of SIGNS) assert.ok(signs.includes(sign));
  }
});
