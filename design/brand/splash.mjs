#!/usr/bin/env node
/**
 * splash.mjs — el asset del splash (artboard 28), en SVG y en PNG.
 *
 *   node design/brand/splash.mjs
 *
 * **Canis Major entero, no un asterismo de adorno.** Las once estrellas reales
 * en su posición (J2000), leídas de `canis-major.svg` — que a su vez lo genera
 * `plot.mjs` desde el catálogo—, así que si el catálogo se corrige, el splash
 * se corrige con él. Es la regla de canon (BRD §11.2.0): lo que existe se
 * representa como es.
 *
 * **Sin logotipo.** El artboard lo lleva debajo, pero un splash nativo no es
 * una pantalla: desde Android 12 el sistema pinta **color de fondo + una
 * imagen centrada**, y esa imagen es el icono. Poner ahí el nombre es hornear
 * en píxel lo que ya dice la tienda, y ata el asset a un nombre comercial que
 * es renombrable a Zoodiac sin coste técnico (CLAUDE.md). Sin texto, el splash
 * sobrevive al cambio de nombre sin tocarse.
 *
 * Por lo mismo, **el campo de estrellas del artboard tampoco viaja**: no cabe
 * como capa aparte. Se pierde una fracción de segundo sobre el mismo `#0B1026`
 * y la app lo pinta en cuanto monta.
 *
 * **Por qué se genera y no se dibuja**: es geometría del artboard, igual que
 * las doce constelaciones. Un PNG suelto es un dibujo del que nadie sabe ya de
 * dónde salió.
 *
 * El rasterizado usa `qlmanage`, que es WebKit y **solo existe en macOS**. Es
 * la única dependencia de plataforma del proyecto y se acepta porque esto se
 * ejecuta una vez cada muchos meses.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');

const SOURCE = join(here, 'canis-major.svg');
const SVG_OUT = join(here, 'splash.svg');
const PNG_OUT = join(ROOT, 'app/assets/splash-icon.png');

/**
 * El lienzo de `canis-major.svg`, que se conserva: así las coordenadas de las
 * estrellas se usan tal cual y no hay una segunda proyección que pueda
 * desviarse de la del catálogo.
 */
const CANVAS = 512;
/** 4x sobre los 120 dp a los que se pinta la marca (xxxhdpi de Android). */
const EXPORT = 480;

/**
 * Los dos anillos del artboard 28, en su proporción: r=47 y r=33 sobre un
 * lienzo de 120, o sea el 39% y el 27,5% del lado.
 */
const RINGS = [
  { ratio: 47 / 120, opacity: 0.35 },
  { ratio: 33 / 120, opacity: 0.18 },
];

/**
 * Cuánto ocupa la constelación dentro del anillo exterior. En el artboard las
 * cinco estrellas llegan a 44 de un anillo de 47, así que rozan el borde sin
 * tocarlo — es lo que hace que el anillo se lea como encuadre y no como marco.
 */
const FILL = 44 / 47;

/**
 * Todo se escala **a los 120 dp de pantalla**, no al lienzo: un trazo de 2
 * sobre 512 se queda en 0,47 dp y desaparece. `K` lleva las medidas del
 * artboard —que están en 120— a este lienzo.
 */
const K = CANVAS / 120;
const RING_STROKE = 1 * K;
const TRACE_STROKE = 1.75 * K;

/**
 * Los radios del catálogo salen de la magnitud aparente y a 120 dp se quedan
 * cortos: Sirio mide 10 sobre 512, que son 2,3 dp. El factor lo lleva a los
 * 4,6 del artboard **conservando la proporción entre magnitudes**, que es lo
 * que no se puede tocar — el tamaño de cada punto es un dato, no un gusto.
 */
const NODE_FACTOR = 1.9;

/** Del tema. No se escriben colores aquí que no estén en `design/theme.ts`. */
const INK = { accent: '#E8C87A', text: '#F2EFE6' };

/** Lee la geometría de `canis-major.svg`: es la única fuente de las posiciones. */
function readAsterism() {
  const svg = readFileSync(SOURCE, 'utf8');
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  const stars = [...svg.matchAll(/<circle[^>]*cx="([\d.]+)"\s+cy="([\d.]+)"\s+r="([\d.]+)"/g)].map(
    (m) => ({ cx: Number(m[1]), cy: Number(m[2]), r: Number(m[3]) }),
  );
  if (paths.length === 0 || stars.length === 0) {
    throw new Error(`[splash] no se pudo leer la geometría de ${SOURCE}`);
  }
  return { paths, stars };
}

/**
 * Escala la constelación **sobre el centro del lienzo** para que su estrella
 * más lejana quede justo dentro del anillo exterior. Se calcula en vez de
 * fijarse a mano: si el catálogo cambia una posición, el encuadre se ajusta
 * solo.
 */
function fitToRing(stars) {
  const c = CANVAS / 2;
  const reach = Math.max(...stars.map((s) => Math.hypot(s.cx - c, s.cy - c)));
  return (RINGS[0].ratio * CANVAS * FILL) / reach;
}

function buildSvg() {
  const { paths, stars } = readAsterism();
  const c = CANVAS / 2;
  const scale = fitToRing(stars);

  // Ancho y alto **al tamaño de exportación**, no al del lienzo lógico: si el
  // SVG declara 512 y se le piden 480, Quick Look escala y ancla arriba a la
  // izquierda, y un splash descentrado no vale.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT}" height="${EXPORT}" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
  <!-- GENERADO por design/brand/splash.mjs desde canis-major.svg. No editar a mano. -->
${RINGS.map((ring) => `  <circle cx="${c}" cy="${c}" r="${(ring.ratio * CANVAS).toFixed(1)}" stroke="${INK.accent}" stroke-width="${RING_STROKE}" opacity="${ring.opacity}"/>`).join('\n')}
  <g transform="translate(${(c * (1 - scale)).toFixed(2)} ${(c * (1 - scale)).toFixed(2)}) scale(${scale.toFixed(4)})">
    <g stroke="${INK.text}" stroke-width="${(TRACE_STROKE / scale).toFixed(2)}" opacity="0.32" stroke-linecap="round" stroke-linejoin="round">
${paths.map((d) => `      <path d="${d}"/>`).join('\n')}
    </g>
    <g fill="${INK.accent}">
${stars.map((s) => `      <circle cx="${s.cx}" cy="${s.cy}" r="${(s.r * NODE_FACTOR).toFixed(1)}"/>`).join('\n')}
    </g>
  </g>
</svg>
`;
}

const svg = buildSvg();
writeFileSync(SVG_OUT, svg);

// `qlmanage` escribe `<nombre>.png` dentro del directorio de salida, así que se
// renderiza en uno temporal y se mueve al sitio con el nombre que toca.
const scratch = mkdtempSync(join(tmpdir(), 'splash-'));
execFileSync('qlmanage', ['-t', '-s', String(EXPORT), '-o', scratch, SVG_OUT], { stdio: 'ignore' });
renameSync(join(scratch, 'splash.svg.png'), PNG_OUT);

console.log(`✓ Canis Major entero, ${readAsterism().stars.length} estrellas, sin logotipo`);
console.log(`  design/brand/splash.svg`);
console.log(`  app/assets/splash-icon.png (${EXPORT}×${EXPORT})`);
