/**
 * lote.mjs — plumbing de la Message Batches API (BRD §7.4).
 *
 * No decide qué se genera (eso es `fragmentos-diario.mjs` / `fragmentos-catalogo.mjs`),
 * solo cómo se envía: construir los `params` de cada petición, mandar el lote,
 * esperar a que termine y recoger los resultados ya emparejados con su clave.
 *
 * Los resultados de un batch llegan en orden no garantizado y no llevan más
 * metadata que `custom_id` — por eso todo aquí gira en torno a un mapa
 * `customId → clave`, nunca al índice de un array.
 */

import { systemPrompt } from './prompt.mjs';
import { esquemaFragmento, ESQUEMA_FRAGMENTO } from './esquema.mjs';

const MODELO = 'claude-opus-5';
const MAX_TOKENS = 1024; // ~400 tokens de salida típicos (BRD §7.2); margen de sobra

// `output_config.format.schema` no soporta minLength/maxLength/minimum/maximum
// (la API los rechaza con 400, "properties maximum, minimum are not supported").
// Los SDK los quitan solos cuando se pasa por el helper `.parse()`/Zod, pero
// aquí se construye la petición a mano para la Batch API, así que hay que
// quitarlos nosotros. `esquema.mjs` los conserva a propósito — documentan el
// contrato real y `revisarLongitudes()` los re-verifica después de recibir
// la respuesta — así que se limpia una copia, nunca el original.
const CLAVES_NO_SOPORTADAS = ['minLength', 'maxLength', 'minimum', 'maximum'];

export function limpiarEsquema(schema) {
  const limpio = structuredClone(schema);
  for (const propiedad of Object.values(limpio.properties ?? {})) {
    for (const clave of CLAVES_NO_SOPORTADAS) delete propiedad[clave];
  }
  return limpio;
}

// Uno por familia: las descripciones que lee el modelo cambian entre el
// diario y el catálogo (`esquema.mjs`), la forma no.
const ESQUEMA_PARA_API = {
  diario: limpiarEsquema(esquemaFragmento('diario')),
  catalogo: limpiarEsquema(esquemaFragmento('catalogo')),
};

/**
 * @param {{customId: string, clave: string, mensajeUsuario: string, familia: 'diario'|'catalogo'}} item
 */
function paramsDePeticion({ mensajeUsuario, familia }) {
  return {
    model: MODELO,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: systemPrompt({ familia }),
        // TTL de 1h en vez del default de 5 min: el batch puede tardar hasta una
        // hora y las peticiones no son estrictamente concurrentes en el tiempo.
        // Dentro de un mismo batch el ahorro no está garantizado (prompt.mjs lo
        // documenta), pero no cuesta nada dejarlo puesto.
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],
    messages: [{ role: 'user', content: mensajeUsuario }],
    output_config: { format: { type: 'json_schema', schema: ESQUEMA_PARA_API[familia] } },
  };
}

/**
 * Envía un lote. Devuelve el id del batch y el mapa para recomponer las claves
 * al leer los resultados.
 * @param {import('@anthropic-ai/sdk').default} client
 * @param {Array<{customId: string, clave: string, mensajeUsuario: string, familia: 'diario'|'catalogo'}>} items
 */
export async function enviarLote(client, items) {
  const claveDeCustomId = new Map(items.map((it) => [it.customId, it.clave]));

  const batch = await client.messages.batches.create({
    requests: items.map((it) => ({
      custom_id: it.customId,
      params: paramsDePeticion(it),
    })),
  });

  return { batchId: batch.id, claveDeCustomId };
}

/** Hace poll hasta que el batch termina. Un batch típico acaba en <1h (BRD §7.4). */
export async function esperarLote(client, batchId, { intervaloMs = 60_000 } = {}) {
  let batch = await client.messages.batches.retrieve(batchId);
  while (batch.processing_status !== 'ended') {
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
    batch = await client.messages.batches.retrieve(batchId);
  }
  return batch;
}

/**
 * Interpreta un único resultado crudo del batch. Función pura, sin red — es
 * lo que se testea; `recogerFragmentos` solo la aplica al iterador del SDK.
 *
 * La forma real de un error es `{result: {type:'errored', error: {type:'error',
 * error: {type, message}, request_id}}}` — doble `error` anidado, no uno solo
 * (confirmado contra la API real: ver PLAN.md, registro de sesión).
 *
 * @returns {{clave: string, fragmento: object}|{clave: string, error: string}}
 */
export function interpretarResultado(resultado, claveDeCustomId) {
  const clave = claveDeCustomId.get(resultado.custom_id) ?? resultado.custom_id;

  if (resultado.result.type === 'succeeded') {
    const bloqueTexto = resultado.result.message.content.find((b) => b.type === 'text');
    try {
      return { clave, fragmento: JSON.parse(bloqueTexto?.text ?? '') };
    } catch {
      return { clave, error: 'La respuesta no es JSON válido' };
    }
  }

  const motivo =
    resultado.result.type === 'errored'
      ? (resultado.result.error?.error?.message ?? resultado.result.error?.error?.type ?? 'error desconocido')
      : resultado.result.type; // 'expired' | 'canceled'
  return { clave, error: motivo };
}

/**
 * Recoge los resultados y los empareja con su clave. No tira la ejecución si
 * una petición falla: la devuelve como registro de error para que el informe
 * del filtro la señale igual que un bloqueo de contenido.
 * @returns {Promise<Array<{clave: string, fragmento: object}|{clave: string, error: string}>>}
 */
export async function recogerFragmentos(client, batchId, claveDeCustomId) {
  const salida = [];
  for await (const resultado of await client.messages.batches.results(batchId)) {
    salida.push(interpretarResultado(resultado, claveDeCustomId));
  }
  return salida;
}
