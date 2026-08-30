#!/usr/bin/env node
/**
 * splash.mjs — el asset del splash (artboard 28), en SVG y en PNG.
 *
 *   node design/brand/splash.mjs
 *
 * **Por qué se genera y no se dibuja a mano**: el logotipo va horneado en el
 * píxel, y el nombre comercial es renombrable a Zoodiac sin coste técnico
 * (CLAUDE.md). Con generador, ese cambio cuesta una constante; con un PNG
 * suelto, cuesta encontrar a quien lo dibujó.
 *
 * **Por qué una sola imagen y no tres capas.** El splash no es una pantalla de
 * la app: es el asset nativo que el sistema pinta antes de que arranque nada, y
 * desde Android 12 la API solo admite **color de fondo + una imagen centrada**.
 * Así que el campo de estrellas del artboard no puede viajar —se pierde una
 * fracción de segundo sobre el mismo `#0B1026`, y la app lo pinta en cuanto
 * monta— y la marca y el logotipo se hornean juntos en el mismo PNG.
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

const FONT = join(ROOT, 'app/node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf');
const SVG_OUT = join(here, 'splash.svg');
const PNG_OUT = join(ROOT, 'app/assets/splash-icon.png');

/** El nombre comercial. Lo único que cambia si Dogstrology pasa a Zoodiac. */
const WORDMARK = 'Dogstrology';

/**
 * Lienzo cuadrado: `qlmanage` devuelve siempre un cuadrado, así que componer
 * en cuadrado evita que el relleno cuente como parte de la imagen y encoja la
 * marca respecto al `imageWidth` que se declara en `app.json`.
 */
const CANVAS = 240;
/** Salida a 3x del `imageWidth` de 200 dp. */
const EXPORT = 720;

/**
 * La marca del artboard 28, en su lienzo de 120. **Es el asterismo, no el
 * perro**: cinco estrellas y su trazado, con el lenguaje de los pozos de cielo
 * del 18 y el 23. Por eso el splash no espera al contorno del perro — y cuando
 * exista, entra dentro de estos dos anillos sin tocar nada más.
 */
const MARK = 120;
const RINGS = [
  { r: 47, opacity: 0.35 },
  { r: 33, opacity: 0.18 },
];
const TRACE = ['M38 78 L52 52 L74 44 L88 26', 'M52 52 L46 30'];
const STARS = [
  { cx: 38, cy: 78, r: 3.2 },
  { cx: 52, cy: 52, r: 4 },
  { cx: 74, cy: 44, r: 2.8 },
  { cx: 46, cy: 30, r: 2.6 },
  { cx: 88, cy: 26, r: 4.6 },
];

/** Del tema. No se escriben colores aquí que no estén en `design/theme.ts`. */
const INK = { accent: '#E8C87A', text: '#F2EFE6' };

/** Aire entre la marca y el logotipo, y caja del texto (artboard 28). */
const GAP = 24;
const WORDMARK_SIZE = 28;
const WORDMARK_LINE = 34;

function buildSvg() {
  const font = readFileSync(FONT).toString('base64');

  const blockHeight = MARK + GAP + WORDMARK_LINE;
  const top = (CANVAS - blockHeight) / 2;
  const markLeft = (CANVAS - MARK) / 2;
  // Línea base del texto: su caja empieza bajo la marca y el hueco.
  const baseline = top + MARK + GAP + WORDMARK_SIZE;

  // Ancho y alto **al tamaño de exportación**, no al del lienzo lógico: si el
  // SVG declara 240 y se le piden 720, Quick Look escala y ancla arriba a la
  // izquierda, y un splash descentrado no vale. Con el tamaño natural igual al
  // pedido, renderiza 1:1 y llena el cuadrado.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT}" height="${EXPORT}" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
  <!-- GENERADO por design/brand/splash.mjs. No editar a mano. -->
  <style>@font-face{font-family:"Fraunces";src:url(data:font/ttf;base64,${font});}</style>
  <g transform="translate(${markLeft} ${top})">
${RINGS.map((ring) => `    <circle cx="${MARK / 2}" cy="${MARK / 2}" r="${ring.r}" stroke="${INK.accent}" stroke-width="1" opacity="${ring.opacity}"/>`).join('\n')}
    <g stroke="${INK.text}" stroke-width="1.75" opacity="0.32" stroke-linecap="round" stroke-linejoin="round">
${TRACE.map((d) => `      <path d="${d}"/>`).join('\n')}
    </g>
    <g fill="${INK.accent}">
${STARS.map((s) => `      <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"/>`).join('\n')}
    </g>
  </g>
  <text x="${CANVAS / 2}" y="${baseline}" text-anchor="middle" font-family="Fraunces" font-size="${WORDMARK_SIZE}" letter-spacing="-0.3" fill="${INK.text}">${WORDMARK}</text>
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

console.log(`✓ ${WORDMARK} · marca ${MARK} + logotipo ${WORDMARK_SIZE} en ${CANVAS}²`);
console.log(`  design/brand/splash.svg`);
console.log(`  app/assets/splash-icon.png (${EXPORT}×${EXPORT})`);
