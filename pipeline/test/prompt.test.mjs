import { test } from 'node:test';
import assert from 'node:assert/strict';

import { systemPrompt, BLOQUES } from '../src/prompt.mjs';
import { esquemaFragmento } from '../src/esquema.mjs';

/**
 * El catálogo es permanente y el diario no. Los tres últimos campos del
 * esquema nacieron para el diario (`color_del_dia`, `puntuacion_energia`) y
 * arrastran su lectura en el nombre: sin corregirla, se le pide al modelo que
 * un fragmento sea atemporal y hable de hoy a la vez.
 */
test('el prompt del catálogo dice que el fragmento es permanente; el del diario no', () => {
  const catalogo = systemPrompt({ familia: 'catalogo' });
  const diario = systemPrompt({ familia: 'diario' });

  assert.ok(catalogo.includes(BLOQUES.CATALOGO_PERMANENTE));
  assert.ok(!diario.includes(BLOQUES.CATALOGO_PERMANENTE));
});

test('la corrección va al final: es lo último que el modelo lee', () => {
  // Si fuera antes de FORMA, FORMA volvería a instalar la lectura diaria.
  const catalogo = systemPrompt({ familia: 'catalogo' });
  assert.ok(catalogo.indexOf(BLOQUES.CATALOGO_PERMANENTE) > catalogo.indexOf(BLOQUES.FORMA));
});

test('ningún bloque del prompt pide "hoy" de forma incondicional', () => {
  // El guardarraíl y el tono valen para las dos familias; la forma, no.
  assert.ok(!BLOQUES.FORMA.includes('para hoy'));
  assert.ok(!BLOQUES.FORMA.includes('observable hoy'));
});

test('el esquema del catálogo reescribe los tres campos con nombre de diario', () => {
  const catalogo = esquemaFragmento('catalogo');
  const diario = esquemaFragmento('diario');

  for (const campo of ['consejo', 'puntuacion_energia', 'color_del_dia']) {
    assert.notEqual(catalogo.properties[campo].description, diario.properties[campo].description);
  }
  assert.ok(!catalogo.properties.consejo.description.includes('para hoy'));
  assert.ok(diario.properties.consejo.description.includes('para hoy'));
});

test('esquemaFragmento no comparte estado entre llamadas', () => {
  // Devuelve un clon: mutar uno no puede envenenar la siguiente petición.
  const uno = esquemaFragmento('catalogo');
  uno.properties.titular.description = 'tocado';
  assert.notEqual(esquemaFragmento('catalogo').properties.titular.description, 'tocado');
});

test('el guardarraíl de salud es idéntico en las dos familias', () => {
  // BRD §7.5: es la parte que no se relaja, y menos por cambiar de familia.
  assert.ok(systemPrompt({ familia: 'catalogo' }).includes(BLOQUES.PROHIBICIONES));
  assert.ok(systemPrompt({ familia: 'diario' }).includes(BLOQUES.PROHIBICIONES));
});
