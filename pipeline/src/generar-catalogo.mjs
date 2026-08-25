#!/usr/bin/env node
/**
 * generar-catalogo.mjs — genera una o varias categorías del catálogo inmutable.
 *
 * Uso:
 *   node src/generar-catalogo.mjs                                        # lista categorías disponibles
 *   node src/generar-catalogo.mjs --categorias aspectos                  # simula esa categoría
 *   node src/generar-catalogo.mjs --categorias aspectos --confirmar      # la genera de verdad
 *   node src/generar-catalogo.mjs --categorias aspectos,planeta-signo-casa --confirmar
 *
 * El catálogo completo cuesta dinero real, una vez (~$15-25, BRD §7.3): por
 * eso nunca se lanza sin `--confirmar`, y cada categoría se genera en su
 * propio lote y su propio informe, para no mezclar 500 fragmentos con 240 en
 * un solo PR.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

import { CATEGORIAS, CATEGORIAS_PENDIENTES } from './fragmentos-catalogo.mjs';
import { enviarLote, esperarLote, recogerFragmentos } from './lote.mjs';
import { revisarTanda, informe } from './filtro.mjs';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // pipeline/
const CONTENIDO_CATALOGO = path.join(RAIZ, '..', 'contenido', 'catalogo');

// Precio Batch API de Opus 5 (50% del precio estándar, $5/$25 por millón de
// tokens): ~$1,25/M tokens de salida. Estimación con ~400 tokens de salida
// por fragmento (BRD §7.2) — orientativa, no sustituye el coste real del batch.
const PRECIO_SALIDA_POR_TOKEN_BATCH = 12.5 / 1_000_000;
const TOKENS_SALIDA_ESTIMADOS = 400;

function parsearArgs(argv) {
  const args = { confirmar: false, categorias: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--confirmar') args.confirmar = true;
    else if (argv[i] === '--categorias') args.categorias = argv[++i].split(',');
  }
  return args;
}

function listarCategorias() {
  console.log('Categorías disponibles:');
  for (const c of CATEGORIAS) console.log(`  ${c.id} — ${c.cantidad} fragmentos`);
  console.log('\nPendientes (ver comentario en fragmentos-catalogo.mjs):');
  for (const id of CATEGORIAS_PENDIENTES) console.log(`  ${id} — sin implementar`);
  console.log('\nUso: node src/generar-catalogo.mjs --categorias <id>[,<id>...] [--confirmar]');
}

async function generarCategoria(client, categoria, confirmar) {
  const fragmentosPedidos = categoria.generar();

  if (!confirmar) {
    const coste = fragmentosPedidos.length * TOKENS_SALIDA_ESTIMADOS * PRECIO_SALIDA_POR_TOKEN_BATCH;
    console.log(
      `Simulación: ${categoria.id} — ${fragmentosPedidos.length} peticiones, ` +
        `coste estimado de salida ~$${coste.toFixed(2)} (sin llamar a la API).`,
    );
    return;
  }

  const items = fragmentosPedidos.map((f, i) => ({
    customId: `${categoria.id}-${i}`,
    clave: f.clave,
    mensajeUsuario: f.mensajeUsuario,
    familia: 'catalogo',
  }));

  console.log(`Enviando lote de ${items.length} peticiones para "${categoria.id}"...`);
  const { batchId, claveDeCustomId } = await enviarLote(client, items);
  console.log(`Batch ${batchId} creado. Esperando a que termine (puede tardar hasta 1h)...`);
  await esperarLote(client, batchId);

  const resultados = await recogerFragmentos(client, batchId, claveDeCustomId);
  const fragmentos = resultados.filter((r) => !r.error).map((r) => ({ clave: r.clave, ...r.fragmento }));
  const errores = resultados.filter((r) => r.error);

  const tanda = revisarTanda(fragmentos);
  const publicables = tanda.resultados.filter((r) => r.ok).map((r) => fragmentos[r.indice]);

  await mkdir(CONTENIDO_CATALOGO, { recursive: true });
  await writeFile(path.join(CONTENIDO_CATALOGO, `${categoria.id}.json`), JSON.stringify(publicables, null, 2));

  const lineasErrores = errores.length
    ? ['', `Errores de la Batch API (${errores.length}):`, ...errores.map((e) => `  ${e.clave}: ${e.error}`)]
    : [];
  await writeFile(
    path.join(CONTENIDO_CATALOGO, `${categoria.id}.informe.md`),
    [informe(tanda), ...lineasErrores].join('\n'),
  );

  console.log(`\n${informe(tanda)}`);
  if (errores.length) console.log(`Errores de la API: ${errores.length}`);
  console.log(`Escrito contenido/catalogo/${categoria.id}.json (${publicables.length} fragmentos publicables).\n`);
}

async function main() {
  const { confirmar, categorias: idsPedidos } = parsearArgs(process.argv.slice(2));

  if (!idsPedidos) {
    listarCategorias();
    return;
  }

  const categorias = idsPedidos.map((id) => {
    const categoria = CATEGORIAS.find((c) => c.id === id);
    if (!categoria) {
      throw new Error(
        `Categoría desconocida: "${id}". Disponibles: ${CATEGORIAS.map((c) => c.id).join(', ')}` +
          (CATEGORIAS_PENDIENTES.includes(id) ? ' (esta está pendiente, ver fragmentos-catalogo.mjs)' : ''),
      );
    }
    return categoria;
  });

  const client = confirmar ? new Anthropic() : null;
  for (const categoria of categorias) {
    await generarCategoria(client, categoria, confirmar);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
