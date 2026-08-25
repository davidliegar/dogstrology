import { test } from 'node:test';
import assert from 'node:assert/strict';

import { limpiarEsquema, interpretarResultado } from '../src/lote.mjs';
import { ESQUEMA_FRAGMENTO } from '../src/esquema.mjs';

// Regresión: la primera prueba real contra la Batch API (2026-08-25) falló las
// 37 peticiones con "output_config.format.schema: For 'integer' type,
// properties maximum, minimum are not supported" — minLength/maxLength en las
// propiedades de texto tienen el mismo problema. Ver PLAN.md.
test('limpiarEsquema quita minLength/maxLength/minimum/maximum de todas las propiedades', () => {
  const limpio = limpiarEsquema(ESQUEMA_FRAGMENTO);
  for (const propiedad of Object.values(limpio.properties)) {
    assert.equal(propiedad.minLength, undefined);
    assert.equal(propiedad.maxLength, undefined);
    assert.equal(propiedad.minimum, undefined);
    assert.equal(propiedad.maximum, undefined);
  }
});

test('limpiarEsquema no toca el esquema original (esquema.mjs sigue documentando los límites reales)', () => {
  limpiarEsquema(ESQUEMA_FRAGMENTO);
  assert.equal(ESQUEMA_FRAGMENTO.properties.titular.minLength, 12);
  assert.equal(ESQUEMA_FRAGMENTO.properties.puntuacion_energia.maximum, 5);
});

test('limpiarEsquema conserva el enum de color_del_dia y los campos required', () => {
  const limpio = limpiarEsquema(ESQUEMA_FRAGMENTO);
  assert.deepEqual(limpio.properties.color_del_dia.enum, ESQUEMA_FRAGMENTO.properties.color_del_dia.enum);
  assert.deepEqual(limpio.required, ESQUEMA_FRAGMENTO.required);
});

// Regresión: la primera versión de interpretarResultado (entonces inline en
// recogerFragmentos) leía `resultado.result.error.message`, pero la forma
// real de la API anida `error` dos veces.
test('interpretarResultado lee el mensaje real de un error de la Batch API (doble error anidado)', () => {
  const claveDeCustomId = new Map([['diario-34', 'fecha=2026-08-25;eje=luna;signo=Aries']]);
  const resultado = {
    custom_id: 'diario-34',
    result: {
      type: 'errored',
      error: {
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: "output_config.format.schema: For 'integer' type, properties maximum, minimum are not supported",
        },
        request_id: null,
      },
    },
  };

  const interpretado = interpretarResultado(resultado, claveDeCustomId);
  assert.equal(interpretado.clave, 'fecha=2026-08-25;eje=luna;signo=Aries');
  assert.match(interpretado.error, /maximum, minimum are not supported/);
});

test('interpretarResultado parsea un éxito y adjunta la clave', () => {
  const claveDeCustomId = new Map([['diario-0', 'fecha=2026-08-25']]);
  const fragmento = { titular: 'x', cuerpo: 'y', consejo: 'z', puntuacion_energia: 3, color_del_dia: 'oro' };
  const resultado = {
    custom_id: 'diario-0',
    result: {
      type: 'succeeded',
      message: { content: [{ type: 'text', text: JSON.stringify(fragmento) }] },
    },
  };

  const interpretado = interpretarResultado(resultado, claveDeCustomId);
  assert.equal(interpretado.clave, 'fecha=2026-08-25');
  assert.deepEqual(interpretado.fragmento, fragmento);
});

test('interpretarResultado: expired/canceled se etiquetan con su propio tipo', () => {
  const claveDeCustomId = new Map([['diario-1', 'fecha=2026-08-25']]);
  const resultado = { custom_id: 'diario-1', result: { type: 'expired' } };
  assert.equal(interpretarResultado(resultado, claveDeCustomId).error, 'expired');
});
