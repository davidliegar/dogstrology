import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildDailyFragments, skySummary } from '../src/dailyFragments.mjs';
import { SIGNS } from '../../proto/astro.mjs';

const DATE = new Date('2026-08-25T12:00:00Z');

test('skySummary da sign lunar, fase y lista de retrógrados', () => {
  const sky = skySummary(DATE);
  assert.equal(sky.date, '2026-08-25');
  assert.ok(SIGNS.includes(sky.moonSign));
  assert.equal(typeof sky.phase, 'string');
  assert.ok(Array.isArray(sky.retrograde));
});

test('buildDailyFragments da exactamente 37 fragments', () => {
  const fragments = buildDailyFragments(DATE);
  assert.equal(fragments.length, 37);
});

test('buildDailyFragments: 1 universal + 12 por cada uno de los 3 ejes', () => {
  const fragments = buildDailyFragments(DATE);
  const universal = fragments.filter((f) => f.key === 'date=2026-08-25');
  assert.equal(universal.length, 1);

  for (const axis of ['sun', 'moon', 'ascendant']) {
    const ofAxis = fragments.filter((f) => f.key.includes(`axis=${axis};`));
    assert.equal(ofAxis.length, 12, `axis ${axis} debería tener 12 fragments`);
    const coveredSigns = new Set(ofAxis.map((f) => f.key.split('sign=')[1]));
    assert.equal(coveredSigns.size, 12);
    for (const sign of SIGNS) assert.ok(coveredSigns.has(sign), `falta ${sign} en axis ${axis}`);
  }
});

test('buildDailyFragments: todas las claves son únicas', () => {
  const fragments = buildDailyFragments(DATE);
  const claves = new Set(fragments.map((f) => f.key));
  assert.equal(claves.size, fragments.length);
});

test('buildDailyFragments: el mensaje lleva el dato del día, no lo recalcula el prompt', () => {
  const [universal] = buildDailyFragments(DATE);
  assert.match(universal.userMessage, /Datos de hoy \(2026-08-25\)/);
});
