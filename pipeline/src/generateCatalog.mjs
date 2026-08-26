#!/usr/bin/env node
/**
 * generateCatalog.mjs — genera una o varias categorías del catálogo inmutable.
 *
 * Uso:
 *   node src/generateCatalog.mjs                                        # lista categorías disponibles
 *   node src/generateCatalog.mjs --categories aspects                  # simula esa categoría
 *   node src/generateCatalog.mjs --categories aspects --confirm      # la genera de verdad
 *   node src/generateCatalog.mjs --categories aspects,planeta-sign-casa --confirm
 *
 * El catálogo completo cuesta dinero real, una vez (~$15-25, BRD §7.3): por
 * eso nunca se lanza sin `--confirm`, y cada categoría se genera en su
 * propio lote y su propio informe, para no mezclar 500 fragmentos con 240 en
 * un solo PR.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

import { CATEGORIES, PENDING_CATEGORIES } from './catalogFragments.mjs';
import { sendBatch, awaitBatch, collectFragments } from './batch.mjs';
import { reviewRun, report } from './filter.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // pipeline/
const CATALOG_CONTENT_DIR = path.join(ROOT, '..', 'content', 'catalog');

// Precio Batch API de Opus 5 (50% del precio estándar, $5/$25 por millón de
// tokens): ~$1,25/M tokens de salida. Estimación con ~400 tokens de salida
// por fragmento (BRD §7.2) — orientativa, no sustituye el coste real del batch.
const PRECIO_SALIDA_POR_TOKEN_BATCH = 12.5 / 1_000_000;
const TOKENS_SALIDA_ESTIMADOS = 400;

function parseArgs(argv) {
  const args = { confirm: false, categories: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirm') args.confirm = true;
    else if (argv[i] === '--categories') args.categories = argv[++i].split(',');
  }
  return args;
}

function listCategories() {
  console.log('Categorías disponibles:');
  for (const c of CATEGORIES) console.log(`  ${c.id} — ${c.count} fragmentos`);
  console.log('\nPendientes (ver comentario en catalogFragments.mjs):');
  for (const id of PENDING_CATEGORIES) console.log(`  ${id} — sin implementar`);
  console.log('\nUso: node src/generateCatalog.mjs --categories <id>[,<id>...] [--confirm]');
}

async function generateCategory(client, category, confirm) {
  const requested = category.build();

  if (!confirm) {
    const coste = requested.length * TOKENS_SALIDA_ESTIMADOS * PRECIO_SALIDA_POR_TOKEN_BATCH;
    console.log(
      `Simulación: ${category.id} — ${requested.length} peticiones, ` +
        `coste estimado de salida ~$${coste.toFixed(2)} (sin llamar a la API).`,
    );
    return;
  }

  const items = requested.map((f, i) => ({
    customId: `${category.id}-${i}`,
    key: f.key,
    userMessage: f.userMessage,
    family: 'catalog',
  }));

  console.log(`Enviando lote de ${items.length} peticiones para "${category.id}"...`);
  const { batchId, keyByCustomId } = await sendBatch(client, items);
  console.log(`Batch ${batchId} creado. Esperando a que termine (puede tardar hasta 1h)...`);
  await awaitBatch(client, batchId);

  const results = await collectFragments(client, batchId, keyByCustomId);
  const fragments = results.filter((r) => !r.error).map((r) => ({ key: r.key, ...r.fragment }));
  const errors = results.filter((r) => r.error);

  const run = reviewRun(fragments);
  const publishable = run.results.filter((r) => r.ok).map((r) => fragments[r.index]);

  await mkdir(CATALOG_CONTENT_DIR, { recursive: true });
  await writeFile(path.join(CATALOG_CONTENT_DIR, `${category.id}.json`), JSON.stringify(publishable, null, 2));

  const errorLines = errors.length
    ? ['', `Errores de la Batch API (${errors.length}):`, ...errors.map((e) => `  ${e.key}: ${e.error}`)]
    : [];
  await writeFile(
    path.join(CATALOG_CONTENT_DIR, `${category.id}.report.md`),
    [report(run), ...errorLines].join('\n'),
  );

  console.log(`\n${report(run)}`);
  if (errors.length) console.log(`Errores de la API: ${errors.length}`);
  console.log(`Escrito content/catalog/${category.id}.json (${publishable.length} fragments publishable).\n`);
}

async function main() {
  const { confirm, categories: requestedIds } = parseArgs(process.argv.slice(2));

  if (!requestedIds) {
    listCategories();
    return;
  }

  const categories = requestedIds.map((id) => {
    const category = CATEGORIES.find((c) => c.id === id);
    if (!category) {
      throw new Error(
        `Categoría desconocida: "${id}". Disponibles: ${CATEGORIES.map((c) => c.id).join(', ')}` +
          (PENDING_CATEGORIES.includes(id) ? ' (esta está pendiente, ver catalogFragments.mjs)' : ''),
      );
    }
    return category;
  });

  const client = confirm ? new Anthropic() : null;
  for (const category of categories) {
    await generateCategory(client, category, confirm);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
