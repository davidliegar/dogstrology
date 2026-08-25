#!/usr/bin/env node
/**
 * depurar-batch.mjs — vuelca el JSON crudo de los resultados de un batch.
 *
 * Herramienta de diagnóstico puntual, no parte del pipeline normal: sirve
 * para ver la forma exacta de un error de la Batch API cuando `batch.mjs`
 * no la interpreta bien. Los results se conservan 29 días, así que no
 * hace falta volver a lanzar el lote para depurarlo.
 *
 * Uso: node src/depurar-batch.mjs <batchId> [--todos]
 */

import Anthropic from '@anthropic-ai/sdk';

const [batchId, flag] = process.argv.slice(2);
if (!batchId) {
  console.error('Uso: node src/depurar-batch.mjs <batchId> [--todos]');
  process.exit(1);
}

const client = new Anthropic();
const batch = await client.messages.batches.retrieve(batchId);
console.log('Estado del batch:', JSON.stringify(batch, null, 2));

let mostrados = 0;
for await (const result of await client.messages.batches.results(batchId)) {
  if (result.result.type === 'succeeded' && flag !== '--todos') continue;
  console.log('\n---', result.custom_id, '---');
  console.log(JSON.stringify(result, null, 2));
  mostrados++;
  if (flag !== '--todos' && mostrados >= 3) break;
}
