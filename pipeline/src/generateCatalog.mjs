#!/usr/bin/env node
/**
 * generateCatalog.mjs — genera una o varias categorías del catálogo inmutable.
 *
 * Uso:
 *   node src/generateCatalog.mjs                                        # lista categorías disponibles
 *   node src/generateCatalog.mjs --categories aspects                  # simula esa categoría
 *   node src/generateCatalog.mjs --categories aspects --confirm      # la genera de verdad
 *   node src/generateCatalog.mjs --categories aspects,planet-sign-house --confirm
 *   node src/generateCatalog.mjs --categories aspects --missing --confirm
 *
 * El catálogo completo cuesta dinero real, una vez (~$15-25, BRD §7.3): por
 * eso nunca se lanza sin `--confirm`, y cada categoría se genera en su
 * propio lote y su propio informe, para no mezclar 500 fragmentos con 240 en
 * un solo PR.
 *
 * `--missing` pide **solo las claves que aún no están** en el JSON de la
 * categoría, y fusiona el resultado con lo que ya había. Existe porque una
 * tanda nunca sale completa: siempre caen algunos por longitud, por el
 * guardarraíl o por un error de la API, y regenerar los 780 para recuperar 26
 * es tirar el dinero. La fusión **nunca sustituye** un fragmento ya publicado.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

// Medido sobre la tanda real de `aspects` (2026-08-26), no estimado: 498 tokens
// de salida de media, de los que **291 eran pensamiento**. Opus 5 razona por
// defecto y ese razonamiento se paga como salida; el 400 de antes solo contaba
// el texto y hacía aprobar la mitad del gasto real.
const TOKENS_SALIDA_ESTIMADOS = 500;

// El system prompt son ~3,4k tokens por petición. Se cachea (TTL 1h) y dentro
// del mismo lote el ahorro **sí** se materializó: 680k escritos contra 1.003k
// leídos en `aspects`. Aun así el prompt se paga, y omitirlo de la estimación
// era la mitad del error: en `aspects` fueron $2,38 de $5,55 totales.
const TOKENS_PROMPT_POR_PETICION = 3400;
const PRECIO_ENTRADA_CACHE_MIXTO = 1.4 / 1_000_000; // ~40% escritura (1,25x), ~60% lectura (0,1x)

function parseArgs(argv) {
  const args = { confirm: false, categories: null, missing: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirm') args.confirm = true;
    else if (argv[i] === '--missing') args.missing = true;
    else if (argv[i] === '--categories') args.categories = argv[++i].split(',');
  }
  return args;
}

/** Los fragmentos ya publicados de una categoría, o [] si aún no hay fichero. */
async function readPublished(categoryId) {
  try {
    return JSON.parse(await readFile(path.join(CATALOG_CONTENT_DIR, `${categoryId}.json`), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function listCategories() {
  console.log('Categorías disponibles:');
  for (const c of CATEGORIES) console.log(`  ${c.id} — ${c.count} fragmentos`);
  console.log('\nPendientes (ver comentario en catalogFragments.mjs):');
  for (const id of PENDING_CATEGORIES) console.log(`  ${id} — sin implementar`);
  console.log('\nUso: node src/generateCatalog.mjs --categories <id>[,<id>...] [--missing] [--confirm]');
}

/**
 * Fusiona lo recién generado con lo ya publicado, en el orden canónico de
 * `build()` — así el fichero no depende de en cuántas tandas se completó y el
 * diff del PR se lee.
 *
 * Función aparte y exportada porque es la que puede hacer daño: si se
 * equivoca, se lleva por delante fragmentos ya revisados y pagados. Nunca
 * descarta un publicado, y en un empate de clave gana el nuevo (que solo puede
 * darse si se regenera sin `--missing`, y ahí sustituir es lo que se pide).
 */
export function mergeFragments(all, published, fresh) {
  const byKey = new Map([...published, ...fresh].map((f) => [f.key, f]));
  return all.map((f) => byKey.get(f.key)).filter(Boolean);
}

async function generateCategory(client, category, confirm, missing) {
  const all = category.build();
  const published = missing ? await readPublished(category.id) : [];
  const alreadyThere = new Set(published.map((f) => f.key));
  const requested = missing ? all.filter((f) => !alreadyThere.has(f.key)) : all;

  if (missing) {
    console.log(`${category.id}: ${alreadyThere.size} ya publicados, faltan ${requested.length} de ${all.length}.`);
    if (requested.length === 0) return;
  }

  if (!confirm) {
    const coste =
      requested.length * TOKENS_SALIDA_ESTIMADOS * PRECIO_SALIDA_POR_TOKEN_BATCH +
      requested.length * TOKENS_PROMPT_POR_PETICION * PRECIO_ENTRADA_CACHE_MIXTO;
    console.log(
      `Simulación: ${category.id} — ${requested.length} peticiones, ` +
        `coste estimado ~$${coste.toFixed(2)} (sin llamar a la API).`,
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

  const merged = mergeFragments(all, published, publishable);

  await mkdir(CATALOG_CONTENT_DIR, { recursive: true });
  await writeFile(path.join(CATALOG_CONTENT_DIR, `${category.id}.json`), JSON.stringify(merged, null, 2));

  const errorLines = errors.length
    ? ['', `Errores de la Batch API (${errors.length}):`, ...errors.map((e) => `  ${e.key}: ${e.error}`)]
    : [];
  await writeFile(
    path.join(CATALOG_CONTENT_DIR, `${category.id}.report.md`),
    [report(run), ...errorLines].join('\n'),
  );

  console.log(`\n${report(run)}`);
  if (errors.length) console.log(`Errores de la API: ${errors.length}`);
  console.log(
    `Escrito content/catalog/${category.id}.json — ${merged.length}/${all.length} en total` +
      (missing ? ` (+${publishable.length} de esta tanda)` : ` (${publishable.length} publicables)`) +
      '.\n',
  );
}

async function main() {
  const { confirm, categories: requestedIds, missing } = parseArgs(process.argv.slice(2));

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
    await generateCategory(client, category, confirm, missing);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
