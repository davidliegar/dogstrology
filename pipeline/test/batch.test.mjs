import { test } from 'node:test';
import assert from 'node:assert/strict';

import { stripSchema, interpretResult, sendBatch } from '../src/batch.mjs';
import { FRAGMENT_SCHEMA } from '../src/schema.mjs';

// Regresión: la primera prueba real contra la Batch API (2026-08-25) falló las
// 37 peticiones con "output_config.format.schema: For 'integer' type,
// properties maximum, minimum are not supported" — minLength/maxLength en las
// propiedades de texto tienen el mismo problema. Ver PLAN.md.
test('stripSchema quita minLength/maxLength/minimum/maximum de todas las propiedades', () => {
  const limpio = stripSchema(FRAGMENT_SCHEMA);
  for (const propiedad of Object.values(limpio.properties)) {
    assert.equal(propiedad.minLength, undefined);
    assert.equal(propiedad.maxLength, undefined);
    assert.equal(propiedad.minimum, undefined);
    assert.equal(propiedad.maximum, undefined);
  }
});

test('stripSchema no toca el esquema original (schema.mjs sigue documentando los límites reales)', () => {
  stripSchema(FRAGMENT_SCHEMA);
  assert.equal(FRAGMENT_SCHEMA.properties.headline.minLength, 12);
  assert.equal(FRAGMENT_SCHEMA.properties.energyScore.maximum, 5);
});

test('stripSchema conserva el enum de colorOfDay y los campos required', () => {
  const limpio = stripSchema(FRAGMENT_SCHEMA);
  assert.deepEqual(limpio.properties.colorOfDay.enum, FRAGMENT_SCHEMA.properties.colorOfDay.enum);
  assert.deepEqual(limpio.required, FRAGMENT_SCHEMA.required);
});

// Regresión: la primera versión de interpretResult (entonces inline en
// collectFragments) leía `result.result.error.message`, pero la forma
// real de la API anida `error` dos veces.
test('interpretResult lee el mensaje real de un error de la Batch API (doble error anidado)', () => {
  const keyByCustomId = new Map([['diario-34', 'fecha=2026-08-25;eje=luna;sign=Aries']]);
  const result = {
    custom_id: 'diario-34',
    result: {
      type: 'errored',
      error: {
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: "output_config.shapet.schema: For 'integer' type, properties maximum, minimum are not supported",
        },
        request_id: null,
      },
    },
  };

  const interpretado = interpretResult(result, keyByCustomId);
  assert.equal(interpretado.key, 'fecha=2026-08-25;eje=luna;sign=Aries');
  assert.match(interpretado.error, /maximum, minimum are not supported/);
});

test('interpretResult parsea un éxito y adjunta la clave', () => {
  const keyByCustomId = new Map([['diario-0', 'fecha=2026-08-25']]);
  const fragment = { headline: 'x', body: 'y', advice: 'z', energyScore: 3, colorOfDay: 'gold' };
  const result = {
    custom_id: 'diario-0',
    result: {
      type: 'succeeded',
      message: { content: [{ type: 'text', text: JSON.stringify(fragment) }] },
    },
  };

  const interpretado = interpretResult(result, keyByCustomId);
  assert.equal(interpretado.key, 'fecha=2026-08-25');
  assert.deepEqual(interpretado.fragment, fragment);
});

test('interpretResult: expired/canceled se etiquetan con su propio tipo', () => {
  const keyByCustomId = new Map([['diario-1', 'fecha=2026-08-25']]);
  const result = { custom_id: 'diario-1', result: { type: 'expired' } };
  assert.equal(interpretResult(result, keyByCustomId).error, 'expired');
});

// Regresión del segundo fallo real contra la Batch API (2026-08-26): las 740
// peticiones del catálogo fallaron con "output_config.format.schema: Field
// required". La causa no fue la API: `SCHEMA_FOR_API` había quedado indexado
// por `diario`/`catalogo` tras la traducción al inglés, mientras el resto del
// pipeline ya pasaba `daily`/`catalog`. El lookup devolvía `undefined`, el
// `schema` desaparecía del JSON y el lote entero se mandaba mutilado.
//
// Se prueba por comportamiento, a través de `sendBatch` con un cliente falso:
// `requestParams` es interno a propósito y el fallo estaba justo ahí, en el
// único tramo que ningún test miraba.
function fakeClient() {
  const sent = [];
  return {
    sent,
    messages: {
      batches: {
        async create({ requests }) {
          sent.push(...requests);
          return { id: 'msgbatch_fake' };
        },
      },
    },
  };
}

const item = (family) => ({
  customId: `${family}-0`,
  key: 'planet=sun;sign=aries',
  userMessage: 'Escribe la interpretación…',
  family,
});

for (const family of ['daily', 'catalog']) {
  test(`sendBatch manda un schema real para la familia "${family}"`, async () => {
    const client = fakeClient();
    await sendBatch(client, [item(family)]);

    const format = client.sent[0].params.output_config.format;
    assert.equal(format.type, 'json_schema');
    assert.ok(format.schema, 'el schema no puede ser undefined: la API responde 400');
    assert.equal(format.schema.type, 'object');
    assert.ok(format.schema.properties.headline, 'el schema enviado no es el del fragmento');
  });
}

test('sendBatch revienta con una familia desconocida en vez de mandar el lote sin schema', async () => {
  const client = fakeClient();
  await assert.rejects(() => sendBatch(client, [item('diario')]), /Familia desconocida: "diario"/);
  assert.equal(client.sent.length, 0, 'no se debe haber enviado nada');
});
