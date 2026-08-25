#!/usr/bin/env node
/**
 * generar-diario.mjs — genera los 37 fragmentos del diario para una fecha.
 *
 * Uso:
 *   node src/generar-diario.mjs [--fecha YYYY-MM-DD]              # simula, no gasta nada
 *   node src/generar-diario.mjs [--fecha YYYY-MM-DD] --confirmar  # llama a la Batch API de verdad
 *
 * Sin `--confirmar` nunca se toca la red: solo imprime los 37 mensajes que se
 * enviarían. Es un gasto real (aunque pequeño, ~12,50 €/mes si corre cada
 * noche — BRD §7.4), así que exige la confirmación explícita en vez de
 * lanzarse sola.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

import { construirFragmentosDiarios } from './fragmentos-diario.mjs';
import { enviarLote, esperarLote, recogerFragmentos } from './lote.mjs';
import { revisarTanda, informe } from './filtro.mjs';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // pipeline/
const CONTENIDO_DIARIO = path.join(RAIZ, '..', 'contenido', 'diario');

function parsearArgs(argv) {
  const args = { confirmar: false, fecha: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirmar') args.confirmar = true;
    else if (argv[i] === '--fecha') args.fecha = argv[++i];
  }
  return args;
}

async function main() {
  const { confirmar, fecha: fechaTexto } = parsearArgs(process.argv.slice(2));
  const fecha = fechaTexto ? new Date(`${fechaTexto}T12:00:00Z`) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    console.error(`Fecha inválida: "${fechaTexto}". Usa YYYY-MM-DD.`);
    process.exitCode = 1;
    return;
  }

  const fragmentosPedidos = construirFragmentosDiarios(fecha);
  const fechaISO = fecha.toISOString().slice(0, 10);

  if (!confirmar) {
    console.log(`Simulación: ${fragmentosPedidos.length} peticiones para ${fechaISO} (sin llamar a la API).\n`);
    for (const f of fragmentosPedidos) {
      console.log(`— ${f.clave}\n  ${f.mensajeUsuario}\n`);
    }
    console.log('Añade --confirmar para generarlo de verdad contra la Batch API.');
    return;
  }

  const client = new Anthropic();
  const items = fragmentosPedidos.map((f, i) => ({
    customId: `diario-${i}`,
    clave: f.clave,
    mensajeUsuario: f.mensajeUsuario,
    familia: 'diario',
  }));

  console.log(`Enviando lote de ${items.length} peticiones para ${fechaISO}...`);
  const { batchId, claveDeCustomId } = await enviarLote(client, items);
  console.log(`Batch ${batchId} creado. Esperando a que termine (puede tardar hasta 1h)...`);
  await esperarLote(client, batchId);

  const resultados = await recogerFragmentos(client, batchId, claveDeCustomId);
  const fragmentos = resultados.filter((r) => !r.error).map((r) => ({ clave: r.clave, ...r.fragmento }));
  const errores = resultados.filter((r) => r.error);

  const tanda = revisarTanda(fragmentos);
  const publicables = tanda.resultados.filter((r) => r.ok).map((r) => fragmentos[r.indice]);

  await mkdir(CONTENIDO_DIARIO, { recursive: true });
  await writeFile(path.join(CONTENIDO_DIARIO, `${fechaISO}.json`), JSON.stringify(publicables, null, 2));

  const lineasErrores = errores.length
    ? ['', `Errores de la Batch API (${errores.length}):`, ...errores.map((e) => `  ${e.clave}: ${e.error}`)]
    : [];
  await writeFile(
    path.join(CONTENIDO_DIARIO, `${fechaISO}.informe.md`),
    [informe(tanda), ...lineasErrores].join('\n'),
  );

  console.log(`\n${informe(tanda)}`);
  if (errores.length) console.log(`Errores de la API: ${errores.length}`);
  console.log(`\nEscrito contenido/diario/${fechaISO}.json (${publicables.length} fragmentos publicables).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
