#!/usr/bin/env node
/**
 * generateDaily.mjs — genera los 37 fragments del diario para una fecha.
 *
 * Uso:
 *   node src/generateDaily.mjs [--fecha YYYY-MM-DD]              # simula, no gasta nada
 *   node src/generateDaily.mjs [--fecha YYYY-MM-DD] --confirm  # llama a la Batch API de verdad
 *
 * Sin `--confirm` nunca se toca la red: solo imprime los 37 mensajes que se
 * enviarían. Es un gasto real (aunque pequeño, ~12,50 €/mes si corre cada
 * noche — BRD §7.4), así que exige la confirmación explícita en vez de
 * lanzarse sola.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

import { buildDailyFragments } from './dailyFragments.mjs';
import { sendBatch, awaitBatch, collectFragments } from './batch.mjs';
import { reviewRun, report } from './filter.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // pipeline/
const DAILY_CONTENT_DIR = path.join(ROOT, '..', 'contenido', 'daily');

function parseArgs(argv) {
  const args = { confirm: false, fecha: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirm') args.confirm = true;
    else if (argv[i] === '--fecha') args.fecha = argv[++i];
  }
  return args;
}

async function main() {
  const { confirm, fecha: fechaTexto } = parseArgs(process.argv.slice(2));
  const fecha = fechaTexto ? new Date(`${fechaTexto}T12:00:00Z`) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    console.error(`Fecha inválida: "${fechaTexto}". Usa YYYY-MM-DD.`);
    process.exitCode = 1;
    return;
  }

  const requested = buildDailyFragments(fecha);
  const fechaISO = fecha.toISOString().slice(0, 10);

  if (!confirm) {
    console.log(`Simulación: ${requested.length} peticiones para ${fechaISO} (sin llamar a la API).\n`);
    for (const f of requested) {
      console.log(`— ${f.key}\n  ${f.userMessage}\n`);
    }
    console.log('Añade --confirm para generarlo de verdad contra la Batch API.');
    return;
  }

  const client = new Anthropic();
  const items = requested.map((f, i) => ({
    customId: `diario-${i}`,
    key: f.key,
    userMessage: f.userMessage,
    family: 'daily',
  }));

  console.log(`Enviando lote de ${items.length} peticiones para ${fechaISO}...`);
  const { batchId, keyByCustomId } = await sendBatch(client, items);
  console.log(`Batch ${batchId} creado. Esperando a que termine (puede tardar hasta 1h)...`);
  await awaitBatch(client, batchId);

  const results = await collectFragments(client, batchId, keyByCustomId);
  const fragments = results.filter((r) => !r.error).map((r) => ({ key: r.key, ...r.fragment }));
  const errors = results.filter((r) => r.error);

  const run = reviewRun(fragments);
  const publishable = run.results.filter((r) => r.ok).map((r) => fragments[r.index]);

  await mkdir(DAILY_CONTENT_DIR, { recursive: true });
  await writeFile(path.join(DAILY_CONTENT_DIR, `${fechaISO}.json`), JSON.stringify(publishable, null, 2));

  const errorLines = errors.length
    ? ['', `Errores de la Batch API (${errors.length}):`, ...errors.map((e) => `  ${e.key}: ${e.error}`)]
    : [];
  await writeFile(
    path.join(DAILY_CONTENT_DIR, `${fechaISO}.report.md`),
    [report(run), ...errorLines].join('\n'),
  );

  console.log(`\n${report(run)}`);
  if (errors.length) console.log(`Errores de la API: ${errors.length}`);
  console.log(`\nEscrito contenido/diario/${fechaISO}.json (${publishable.length} fragments publishable).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
