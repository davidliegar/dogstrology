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
 *   node src/generateCatalog.mjs --keys ../pre-review.keys --confirm   # rehace esas
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
 *
 * `--keys <fichero>` hace lo contrario, y por eso es el peligroso: pide **esas
 * claves concretas y sustituye las que había**. Existe porque un fragmento
 * puede estar publicado y ser malo —la primera tanda dejó 162 de 780 que no
 * nombraban ni la raza ni el signo, y eso vacía justo lo que hace diferencial
 * al cruce— y arreglarlos a mano cuesta más que regenerarlos con el prompt
 * corregido.
 *
 * ⚠️ **Sustituye sin preguntar, incluido lo ya revisado por una persona.** El
 * fichero es una clave por línea y lo escribe `scripts/pre-review.mjs`; se
 * revisa antes de lanzarlo, porque lo que se pierde ahí no lo devuelve el
 * dinero. No hace falta `--categories`: cada categoría coge las claves suyas.
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
  const args = { confirm: false, categories: null, missing: false, keysFile: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirm') args.confirm = true;
    else if (argv[i] === '--missing') args.missing = true;
    else if (argv[i] === '--keys') args.keysFile = argv[++i];
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
  if (PENDING_CATEGORIES.length) {
    console.log('\nPendientes (ver comentario en catalogFragments.mjs):');
    for (const id of PENDING_CATEGORIES) console.log(`  ${id} — sin implementar`);
  }
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

/** Una clave por línea; se ignoran vacías y comentarios. */
async function readKeys(file) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  return new Set(lines.map((line) => line.trim()).filter((line) => line && !line.startsWith('#')));
}

async function generateCategory(client, category, confirm, missing, keys) {
  const all = category.build();
  // Con `--keys` también se leen los publicados, pero para **sustituirlos**:
  // `mergeFragments` da la victoria al nuevo en un empate de clave, que es
  // justo lo que se pide aquí y lo contrario de lo que hace `--missing`.
  const published = missing || keys ? await readPublished(category.id) : [];
  const alreadyThere = new Set(published.map((f) => f.key));
  const requested = keys
    ? all.filter((f) => keys.has(f.key))
    : missing
      ? all.filter((f) => !alreadyThere.has(f.key))
      : all;

  if (keys) {
    if (requested.length === 0) return;
    const nuevas = requested.filter((f) => !alreadyThere.has(f.key)).length;
    console.log(
      `${category.id}: ${requested.length} claves pedidas — ` +
        `${requested.length - nuevas} se **sustituyen** y ${nuevas} son nuevas.`,
    );
  } else if (missing) {
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
  const { confirm, categories: requestedIds, missing, keysFile } = parseArgs(process.argv.slice(2));

  if (!requestedIds && !keysFile) {
    listCategories();
    return;
  }

  const keys = keysFile ? await readKeys(keysFile) : null;

  // Con un fichero de claves no hace falta decir la categoría: cada una coge
  // las suyas y las que no tienen ninguna se saltan solas.
  const categories = (requestedIds ?? CATEGORIES.map((c) => c.id)).map((id) => {
    const category = CATEGORIES.find((c) => c.id === id);
    if (!category) {
      throw new Error(
        `Categoría desconocida: "${id}". Disponibles: ${CATEGORIES.map((c) => c.id).join(', ')}` +
          (PENDING_CATEGORIES.includes(id) ? ' (esta está pendiente, ver catalogFragments.mjs)' : ''),
      );
    }
    return category;
  });

  if (keys) {
    // Una clave mal escrita no da error: simplemente no se regenera, y el
    // fragmento malo se queda publicado sin que nadie se entere.
    const known = new Set(categories.flatMap((category) => category.build().map((f) => f.key)));
    const unknown = [...keys].filter((key) => !known.has(key));
    if (unknown.length) {
      console.warn(`⚠️  ${unknown.length} claves del fichero no existen en ninguna categoría:`);
      for (const key of unknown.slice(0, 10)) console.warn(`     ${key}`);
    }
    console.log(`${keys.size - unknown.length} claves a regenerar.`);
  }

  const client = confirm ? new Anthropic() : null;
  for (const category of categories) {
    await generateCategory(client, category, confirm, missing, keys);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
