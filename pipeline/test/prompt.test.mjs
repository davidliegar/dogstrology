import { test } from 'node:test';
import assert from 'node:assert/strict';

import { systemPrompt, BLOCKS } from '../src/prompt.mjs';
import { fragmentSchema } from '../src/schema.mjs';

/**
 * El catálogo es permanente y el daily no. Los tres últimos campos del
 * esquema nacieron para el daily (`colorOfDay`, `energyScore`) y
 * arrastran su lectura en el nombre: sin corregirla, se le pide al modelo que
 * un fragmento sea atemporal y hable de hoy a la vez.
 */
test('el prompt del catálogo dice que el fragmento es permanente; el del daily no', () => {
  const catalog = systemPrompt({ family: 'catalog' });
  const daily = systemPrompt({ family: 'daily' });

  assert.ok(catalog.includes(BLOCKS.PERMANENT_CATALOG));
  assert.ok(!daily.includes(BLOCKS.PERMANENT_CATALOG));
});

test('la corrección va al final: es lo último que el modelo lee', () => {
  // Si fuera antes de SHAPE, SHAPE volvería a instalar la lectura diaria.
  const catalog = systemPrompt({ family: 'catalog' });
  assert.ok(catalog.indexOf(BLOCKS.PERMANENT_CATALOG) > catalog.indexOf(BLOCKS.SHAPE));
});

test('ningún bloque del prompt pide "hoy" de forma incondicional', () => {
  // El guardarraíl y el tono valen para las dos familias; la forma, no.
  assert.ok(!BLOCKS.SHAPE.includes('para hoy'));
  assert.ok(!BLOCKS.SHAPE.includes('observable hoy'));
});

test('el esquema del catálogo reescribe los tres campos con nombre de daily', () => {
  const catalog = fragmentSchema('catalog');
  const daily = fragmentSchema('daily');

  for (const campo of ['advice', 'energyScore', 'colorOfDay']) {
    assert.notEqual(catalog.properties[campo].description, daily.properties[campo].description);
  }
  assert.ok(!catalog.properties.advice.description.includes('para hoy'));
  assert.ok(daily.properties.advice.description.includes('para hoy'));
});

test('fragmentSchema no comparte estado entre llamadas', () => {
  // Devuelve un clon: mutar uno no puede envenenar la siguiente petición.
  const uno = fragmentSchema('catalog');
  uno.properties.headline.description = 'tocado';
  assert.notEqual(fragmentSchema('catalog').properties.headline.description, 'tocado');
});

test('el guardarraíl de salud es idéntico en las dos familias', () => {
  // BRD §7.5: es la parte que no se relaja, y menos por cambiar de familia.
  assert.ok(systemPrompt({ family: 'catalog' }).includes(BLOCKS.BANNED));
  assert.ok(systemPrompt({ family: 'daily' }).includes(BLOCKS.BANNED));
});
