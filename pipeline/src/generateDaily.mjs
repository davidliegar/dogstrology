#!/usr/bin/env node
/**
 * generateDaily.mjs — genera los 37 fragmentos del diario para una fecha, o
 * para una tira de días consecutivos.
 *
 * Uso:
 *   node src/generateDaily.mjs [--date YYYY-MM-DD] [--days N]            # simula, no gasta nada
 *   node src/generateDaily.mjs [--date YYYY-MM-DD] [--days N] --confirm  # llama a la Batch API
 *
 * Sin `--confirm` nunca se toca la red: solo imprime los mensajes que se
 * enviarían. Es un gasto real (aunque pequeño, ~12,50 €/mes si corre cada
 * noche — BRD §7.4), así que exige la confirmación explícita en vez de
 * lanzarse sola.
 *
 * **`--days` manda un solo lote, no N lotes.** Un batch tarda lo que tarda
 * —hasta una hora— así que ocho días en uno cuestan una espera y no ocho, y
 * 296 peticiones no son nada al lado de las 780 que ya mandó de golpe la tanda
 * de `breed-sign`. Cada día se escribe en su propio fichero y con su propio
 * informe del filtro, porque la unidad que publica el CDN es el día.
 *
 * Para qué sirve: el cron nocturno genera **un** día (hoy + 7) y mantiene el
 * colchón rodando. `--days` es para **llenarlo la primera vez**, cuando no hay
 * ninguna edición futura publicada.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

import { buildDailyFragments } from './dailyFragments.mjs';
import { sendBatch, awaitBatch, collectFragments } from './batch.mjs';
import { reviewRun, report } from './filter.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // pipeline/
const DAILY_CONTENT_DIR = path.join(ROOT, '..', 'content', 'daily');

/**
 * Tope de días por tirada. No es una limitación técnica —la Batch API admite
 * mucho más— sino un cortafuegos contra la errata: `--days 70` en vez de `7`
 * serían 2.590 peticiones y ~28 €, y el error no se vería hasta la factura.
 */
const MAX_DAYS = 31;

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  const args = { confirm: false, date: null, days: 1 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirm') args.confirm = true;
    else if (argv[i] === '--date') args.date = argv[++i];
    else if (argv[i] === '--days') args.days = Number(argv[++i]);
  }
  return args;
}

/** La fecha de una clave del diario: `date=2026-08-25;axis=sun;…` → `2026-08-25`. */
const dateOfKey = (key) => key.match(/^date=(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;

async function main() {
  const { confirm, date: dateText, days } = parseArgs(process.argv.slice(2));
  const date = dateText ? new Date(`${dateText}T12:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    console.error(`Fecha inválida: "${dateText}". Usa YYYY-MM-DD.`);
    process.exitCode = 1;
    return;
  }
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    console.error(`--days tiene que ser un entero entre 1 y ${MAX_DAYS}. Recibido: "${days}".`);
    process.exitCode = 1;
    return;
  }

  // Mediodía UTC y suma de días enteros: la fecha nace en `T12:00:00Z`, así que
  // sumar 24 h no puede cruzar de día por un cambio de horario.
  const dates = Array.from({ length: days }, (_, i) => new Date(date.getTime() + i * MILLIS_PER_DAY));
  const isoDates = dates.map((d) => d.toISOString().slice(0, 10));
  const requested = dates.flatMap((d) => buildDailyFragments(d));
  const span = days === 1 ? isoDates[0] : `${isoDates[0]} … ${isoDates[days - 1]} (${days} días)`;

  if (!confirm) {
    console.log(`Simulación: ${requested.length} peticiones para ${span} (sin llamar a la API).\n`);
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

  // **Un solo lote para todos los días.** Los resultados llegan sin orden y sin
  // más metadata que el `custom_id`, así que se reparten por día leyendo la
  // fecha de la propia clave — no hay un segundo mapa que mantener.
  console.log(`Enviando lote de ${items.length} peticiones para ${span}...`);
  const { batchId, keyByCustomId } = await sendBatch(client, items);
  console.log(`Batch ${batchId} creado. Esperando a que termine (puede tardar hasta 1h)...`);
  await awaitBatch(client, batchId);

  const results = await collectFragments(client, batchId, keyByCustomId);
  await mkdir(DAILY_CONTENT_DIR, { recursive: true });

  for (const isoDate of isoDates) {
    const ofDay = results.filter((r) => dateOfKey(r.key) === isoDate);
    const fragments = ofDay.filter((r) => !r.error).map((r) => ({ key: r.key, ...r.fragment }));
    const errors = ofDay.filter((r) => r.error);

    const run = reviewRun(fragments);
    const publishable = run.results.filter((r) => r.ok).map((r) => fragments[r.index]);

    // Un fichero y un informe por día, porque el día es la unidad que publica
    // el CDN y la que revisa una persona.
    await writeFile(path.join(DAILY_CONTENT_DIR, `${isoDate}.json`), JSON.stringify(publishable, null, 2));

    const errorLines = errors.length
      ? ['', `Errores de la Batch API (${errors.length}):`, ...errors.map((e) => `  ${e.key}: ${e.error}`)]
      : [];
    await writeFile(path.join(DAILY_CONTENT_DIR, `${isoDate}.report.md`), [report(run), ...errorLines].join('\n'));

    console.log(`\n${isoDate} — ${publishable.length} publicables de ${ofDay.length}${errors.length ? `, ${errors.length} errores de la API` : ''}`);
  }

  // Un resultado con una fecha que no se pidió no se escribiría en ningún
  // sitio: sería contenido pagado y tirado en silencio, así que se dice.
  const orphans = results.filter((r) => !isoDates.includes(dateOfKey(r.key)));
  if (orphans.length) {
    console.error(`\n⚠️  ${orphans.length} resultados con una fecha que no se pidió: ${orphans.map((r) => r.key).join(', ')}`);
  }

  console.log(`\nEscritos ${isoDates.length} ficheros en content/daily/.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
