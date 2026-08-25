/**
 * batch.mjs — plumbing de la Message Batches API (BRD §7.4).
 *
 * No decide qué se genera (eso es `dailyFragments.mjs` / `catalogFragments.mjs`),
 * solo cómo se envía: construir los `params` de cada petición, mandar el lote,
 * esperar a que termine y recoger los resultados ya emparejados con su clave.
 *
 * Los results de un batch llegan en orden no garantizado y no llevan más
 * metadata que `custom_id` — por eso todo aquí gira en torno a un mapa
 * `customId → key`, nunca al índice de un array.
 */

import { systemPrompt } from './prompt.mjs';
import { fragmentSchema, FRAGMENT_SCHEMA } from './schema.mjs';

const MODEL = 'claude-opus-5';
const MAX_TOKENS = 1024; // ~400 tokens de salida típicos (BRD §7.2); margen de sobra

// `output_config.shapet.schema` no soporta minLength/maxLength/minimum/maximum
// (la API los rechaza con 400, "properties maximum, minimum are not supported").
// Los SDK los quitan solos cuando se pasa por el helper `.parse()`/Zod, pero
// aquí se construye la petición a mano para la Batch API, así que hay que
// quitarlos nosotros. `schema.mjs` los conserva a propósito — documentan el
// contrato real y `checkLengths()` los re-verifica después de recibir
// la respuesta — así que se limpia una copia, nunca el original.
const UNSUPPORTED_KEYS = ['minLength', 'maxLength', 'minimum', 'maximum'];

export function stripSchema(schema) {
  const limpio = structuredClone(schema);
  for (const propiedad of Object.values(limpio.properties ?? {})) {
    for (const key of UNSUPPORTED_KEYS) delete propiedad[key];
  }
  return limpio;
}

// Uno por familia: las descripciones que lee el modelo cambian entre el
// diario y el catálogo (`schema.mjs`), la forma no.
const SCHEMA_FOR_API = {
  diario: stripSchema(fragmentSchema('daily')),
  catalogo: stripSchema(fragmentSchema('catalog')),
};

/**
 * @param {{customId: string, key: string, userMessage: string, family: 'daily'|'catalog'}} item
 */
function requestParams({ userMessage, family }) {
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: systemPrompt({ family }),
        // TTL de 1h en vez del default de 5 min: el batch puede tardar hasta una
        // hora y las peticiones no son estrictamente concurrentes en el tiempo.
        // Dentro de un mismo batch el ahorro no está garantizado (prompt.mjs lo
        // documenta), pero no cuesta nada dejarlo puesto.
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA_FOR_API[family] } },
  };
}

/**
 * Envía un lote. Devuelve el id del batch y el mapa para recomponer las claves
 * al leer los resultados.
 * @param {import('@anthropic-ai/sdk').default} client
 * @param {Array<{customId: string, key: string, userMessage: string, family: 'daily'|'catalog'}>} items
 */
export async function sendBatch(client, items) {
  const keyByCustomId = new Map(items.map((it) => [it.customId, it.key]));

  const batch = await client.messages.batches.create({
    requests: items.map((it) => ({
      custom_id: it.customId,
      params: requestParams(it),
    })),
  });

  return { batchId: batch.id, keyByCustomId };
}

/** Hace poll hasta que el batch termina. Un batch típico acaba en <1h (BRD §7.4). */
export async function awaitBatch(client, batchId, { intervalMs = 60_000 } = {}) {
  let batch = await client.messages.batches.retrieve(batchId);
  while (batch.processing_status !== 'ended') {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    batch = await client.messages.batches.retrieve(batchId);
  }
  return batch;
}

/**
 * Interpreta un único result crudo del batch. Función pura, sin red — es
 * lo que se testea; `collectFragments` solo la aplica al iterador del SDK.
 *
 * La forma real de un error es `{result: {type:'errored', error: {type:'error',
 * error: {type, message}, request_id}}}` — doble `error` anidado, no uno solo
 * (confirmado contra la API real: ver PLAN.md, registro de sesión).
 *
 * @returns {{key: string, fragment: object}|{key: string, error: string}}
 */
export function interpretResult(result, keyByCustomId) {
  const key = keyByCustomId.get(result.custom_id) ?? result.custom_id;

  if (result.result.type === 'succeeded') {
    const bloqueTexto = result.result.message.content.find((b) => b.type === 'text');
    try {
      return { key, fragment: JSON.parse(bloqueTexto?.text ?? '') };
    } catch {
      return { key, error: 'La respuesta no es JSON válido' };
    }
  }

  const motivo =
    result.result.type === 'errored'
      ? (result.result.error?.error?.message ?? result.result.error?.error?.type ?? 'error desconocido')
      : result.result.type; // 'expired' | 'canceled'
  return { key, error: motivo };
}

/**
 * Recoge los resultados y los empareja con su clave. No tira la ejecución si
 * una petición falla: la devuelve como registro de error para que el informe
 * del filtro la señale igual que un bloqueo de contenido.
 * @returns {Promise<Array<{key: string, fragment: object}|{key: string, error: string}>>}
 */
export async function collectFragments(client, batchId, keyByCustomId) {
  const out = [];
  for await (const result of await client.messages.batches.results(batchId)) {
    out.push(interpretResult(result, keyByCustomId));
  }
  return out;
}
