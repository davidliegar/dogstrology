#!/usr/bin/env node
/**
 * splash.mjs — el asset del splash (artboard 28), en SVG y en PNG.
 *
 *   node design/brand/splash.mjs
 *
 * **Solo la marca, sin logotipo.** El artboard lo lleva debajo, pero un splash
 * nativo no es una pantalla: desde Android 12 el sistema pinta **color de fondo
 * + una imagen centrada**, y esa imagen es el icono. Poner ahí el nombre es
 * horneado en píxel lo que ya dice la tienda, y ata el asset a un nombre
 * comercial que es renombrable a Zoodiac sin coste técnico (CLAUDE.md). Sin
 * texto, el splash sobrevive al cambio de nombre sin tocarse.
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
import { mkdtempSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');

const SVG_OUT = join(here, 'splash.svg');
const PNG_OUT = join(ROOT, 'app/assets/splash-icon.png');

/**
 * El lienzo **es** la marca: 120, el mismo del artboard. Así el `imageWidth`
 * que declara `app.json` es el ancho real de la marca en pantalla y no hay que
 * descontar relleno. El aire que se ve alrededor del anillo exterior es del
 * dibujo —r=47 sobre un centro en 60—, no del lienzo.
 */
const CANVAS = 120;
/** 4x, que es la densidad xxxhdpi de Android. */
const EXPORT = 480;

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

function buildSvg() {
  // Ancho y alto **al tamaño de exportación**, no al del lienzo lógico: si el
  // SVG declara 120 y se le piden 480, Quick Look escala y ancla arriba a la
  // izquierda, y un splash descentrado no vale. Con el tamaño natural igual al
  // pedido, renderiza 1:1 y llena el cuadrado.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT}" height="${EXPORT}" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
  <!-- GENERADO por design/brand/splash.mjs. No editar a mano. -->
${RINGS.map((ring) => `  <circle cx="${MARK / 2}" cy="${MARK / 2}" r="${ring.r}" stroke="${INK.accent}" stroke-width="1" opacity="${ring.opacity}"/>`).join('\n')}
  <g stroke="${INK.text}" stroke-width="1.75" opacity="0.32" stroke-linecap="round" stroke-linejoin="round">
${TRACE.map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
  <g fill="${INK.accent}">
${STARS.map((s) => `    <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"/>`).join('\n')}
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

console.log(`✓ marca de ${MARK} en lienzo de ${CANVAS}, sin logotipo`);
console.log(`  design/brand/splash.svg`);
console.log(`  app/assets/splash-icon.png (${EXPORT}×${EXPORT})`);
