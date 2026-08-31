#!/usr/bin/env node
/**
 * icon.mjs — el icono de la app, **en sus tres variantes y sus cinco piezas**.
 *
 *   node design/brand/icon.mjs
 *
 * **El icono es Canis Major, no un dibujo** (artboard 30). La geometría sale
 * de `icon.svg`, que genera `plot.mjs` desde el catálogo: las ocho estrellas
 * de magnitud < 3,6 en posición real, que son las que se leen a 48 px. Si el
 * catálogo se corrige, el icono se corrige con él — es la regla de canon
 * (BRD §11.2.0).
 *
 * **Un color heredado, no tres assets.** Lo único que cambia entre variantes
 * es el color de las estrellas y del halo de Sirio; el trazado del asterismo
 * se queda en hueso en las tres, que es lo que las hace la misma marca y no
 * tres marcas. Oro para producción, agua para pruebas, fuego para desarrollo.
 *
 * | Salida | Quién la usa | Contenido |
 * |---|---|---|
 * | `icon.png` | iOS, y Android como heredado | 84% del lado, opaco |
 * | `android-icon-background.png` | capa de fondo del adaptativo | color plano |
 * | `android-icon-foreground.png` | capa de dibujo del adaptativo | 66%, con alfa |
 * | `android-icon-monochrome.png` | iconos con tema de Android 13+ | 66%, solo alfa |
 * | `favicon.png` | web | 48², del heredado |
 *
 * **No es un fichero, son cinco**: si solo se actualiza `icon.png`, Android
 * enseña el viejo, porque el adaptativo tiene prioridad sobre el heredado.
 *
 * **El 66% del adaptativo no es el mismo margen que el 84% del heredado.** Las
 * capas del adaptativo miden 108 dp y solo se ve el centro de 72 —el sistema
 * las recorta con la máscara del lanzador y las mueve con el parallax—, así
 * que ahí el margen es obligatorio. En `icon.png` no lo es, y encogerlo
 * regalaría un tercio del lado a un margen que nadie recorta.
 *
 * **El alfa se despeja, no se estima.** `qlmanage` compone siempre sobre
 * blanco —lo hace incluso con un SVG sin fondo—, así que cada capa se
 * rasteriza **dos veces**, sobre el azul noche y sobre blanco, y de las dos se
 * despeja la ecuación de composición: con `c₁ = a·tinta + (1-a)·fondo₁` y su
 * gemela, `a` y la tinta salen exactos. La versión anterior lo aproximaba por
 * distancia al fondo y dejaba las estrellas un punto más oscuras al componer.
 *
 * El rasterizado usa `qlmanage`, que es WebKit y **solo existe en macOS**. Es
 * la única dependencia de plataforma del proyecto y se acepta porque esto se
 * ejecuta una vez cada muchos meses.
 */

import { execFileSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');
const SOURCE = join(here, 'icon.svg');
const ASSETS = join(ROOT, 'app/assets/icons');

/** El lienzo de `icon.svg`: las coordenadas se usan tal cual. */
const CANVAS = 512;
/** Lado del icono que piden las tiendas. */
const SIZE = 1024;
/** Lado de las capas del adaptativo. 4x sobre los 108 dp. */
const LAYER = 432;
/** Qué fracción del lado ocupa el asterismo en cada pieza. */
const CONTENT = { legacy: 0.84, adaptive: 0.66 };

/** Del tema. No se escribe aquí ningún color que no esté en `design/theme.ts`. */
const NIGHT = '#0B1026';
const BONE = '#F2EFE6';

/**
 * El color de las estrellas por variante (artboard 30). Los tres salen de la
 * paleta: acento, agua y fuego. El trazado no está aquí porque no cambia.
 */
const VARIANTS = {
  production: '#E8C87A',
  preview: '#5FB3B8',
  development: '#E86A50',
};

/**
 * El tratamiento del artboard 30, en las unidades del lienzo. Es el mismo
 * asterismo con más contraste que en pantalla: a 48 px un trazo de 3 y una
 * estrella de 10 desaparecen.
 *
 * `NODE_FACTOR` es **uno solo para las ocho**: el tamaño de cada punto sale de
 * su magnitud aparente y la proporción entre ellos es un dato, no un gusto
 * (misma regla que `splash.mjs`). El artboard le da a Sirio un pelo más que a
 * las demás; quien la señala aquí es el halo, que ya es suyo y de nadie más.
 */
const LINES = { stroke: 14, opacity: 0.4 };
const HALO = { r: 40, stroke: 8, opacity: 0.3 };
const NODE_FACTOR = 1.55;

/** Segundo fondo del par de rasterizados. Cualquiera vale mientras contraste. */
const PROBE = '#FFFFFF';

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * La geometría de `icon.svg`: los trazos, las estrellas y dónde está Sirio.
 * Es la única fuente de las posiciones — aquí no se coloca nada a mano.
 */
function readAsterism() {
  const svg = readFileSync(SOURCE, 'utf8');
  const group = (name) => svg.match(new RegExp(`<g class="${name}"[^>]*>([\\s\\S]*?)</g>`))?.[1] ?? '';
  const circles = (source) =>
    [...source.matchAll(/<circle[^>]*cx="([\d.]+)"\s+cy="([\d.]+)"\s+r="([\d.]+)"/g)].map((m) => ({
      cx: Number(m[1]),
      cy: Number(m[2]),
      r: Number(m[3]),
    }));

  const paths = [...group('lines').matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  const stars = circles(group('nodes'));
  const [sirius] = circles(group('halo'));

  if (paths.length === 0 || stars.length === 0 || sirius === undefined) {
    throw new Error(`[icon] no se pudo leer la geometría de ${SOURCE}`);
  }
  return { paths, stars, sirius };
}

/**
 * La caja que ocupa todo lo que se pinta, halo incluido. Se calcula en vez de
 * fijarse a mano por lo mismo que en `splash.mjs`: si el catálogo mueve una
 * estrella, el encuadre se ajusta solo.
 */
function contentBox({ paths, stars, sirius }) {
  const xs = [];
  const ys = [];
  const add = (x, y, pad) => {
    xs.push(x - pad, x + pad);
    ys.push(y - pad, y + pad);
  };

  for (const star of stars) add(star.cx, star.cy, star.r * NODE_FACTOR);
  add(sirius.cx, sirius.cy, HALO.r + HALO.stroke / 2);
  for (const d of paths) {
    const numbers = d.match(/[\d.]+/g).map(Number);
    for (let i = 0; i + 1 < numbers.length; i += 2) add(numbers[i], numbers[i + 1], LINES.stroke / 2);
  }

  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x0, y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

/** El asterismo teñido, encuadrado al `fraction` del lado sobre `background`. */
function buildSvg({ geometry, box, color, fraction, background, side }) {
  const scale = (CANVAS * fraction) / Math.max(box.w, box.h);
  const dx = (CANVAS - box.w * scale) / 2 - box.x0 * scale;
  const dy = (CANVAS - box.h * scale) / 2 - box.y0 * scale;

  // Ancho y alto **al tamaño de exportación** y no al del lienzo lógico: si el
  // SVG declara 512 y se le piden 432, Quick Look escala y ancla arriba a la
  // izquierda (lección de `splash.mjs`).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
  <rect width="${CANVAS}" height="${CANVAS}" fill="${background}"/>
  <g transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)}) scale(${scale.toFixed(4)})">
    <g stroke="${BONE}" stroke-width="${LINES.stroke}" opacity="${LINES.opacity}" stroke-linecap="round" stroke-linejoin="round">
${geometry.paths.map((d) => `      <path d="${d}"/>`).join('\n')}
    </g>
    <circle cx="${geometry.sirius.cx}" cy="${geometry.sirius.cy}" r="${HALO.r}" stroke="${color}" stroke-width="${HALO.stroke}" opacity="${HALO.opacity}"/>
    <g fill="${color}">
${geometry.stars.map((s) => `      <circle cx="${s.cx}" cy="${s.cy}" r="${(s.r * NODE_FACTOR).toFixed(1)}"/>`).join('\n')}
    </g>
  </g>
</svg>
`;
}

/** BMP de 24 bits: lo que `sips` escribe y Node lee sin librerías. */
function readBmp(path) {
  const b = readFileSync(path);
  const offset = b.readUInt32LE(10);
  const width = b.readInt32LE(18);
  const raw = b.readInt32LE(22);
  const topDown = raw < 0;
  const height = Math.abs(raw);
  const bpp = b.readUInt16LE(28);
  const stride = Math.ceil((width * bpp) / 8 / 4) * 4;

  const at = (x, y) => {
    const row = topDown ? y : height - 1 - y;
    const i = offset + row * stride + x * (bpp / 8);
    return [b[i + 2], b[i + 1], b[i]];
  };
  return { width, height, at };
}

const scratch = mkdtempSync(join(tmpdir(), 'icon-'));
let rendered = 0;

/** SVG → píxeles, pasando por `qlmanage` y por `sips`. */
function rasterize(svg, side) {
  const name = `p${rendered++}`;
  const svgPath = join(scratch, `${name}.svg`);
  writeFileSync(svgPath, svg);
  execFileSync('qlmanage', ['-t', '-s', String(side), '-o', scratch, svgPath], { stdio: 'ignore' });
  const png = join(scratch, `${name}.svg.png`);
  const bmp = join(scratch, `${name}.bmp`);
  execFileSync('sips', ['-s', 'format', 'bmp', png, '--out', bmp], { stdio: 'ignore' });
  return { png, image: readBmp(bmp) };
}

/* --- PNG escrito a mano: `sips` convierte formatos pero no sabe llevar alfa. */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function writePng(path, side, pixels) {
  // Una línea de filtro 0 por fila: sin predicción. El PNG sale algo más
  // grande y el código, mucho más corto — son cinco iconos, no un vídeo.
  const raw = Buffer.alloc(side * (1 + side * 4));
  for (let y = 0; y < side; y++) {
    const row = y * (1 + side * 4);
    for (let x = 0; x < side; x++) {
      const [r, g, b, a] = pixels(x, y);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(side, 0);
  ihdr.writeUInt32BE(side, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // RGBA
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

const night = hexToRgb(NIGHT);
const probe = hexToRgb(PROBE);

/**
 * Despeja alfa y tinta de los dos rasterizados. Con `c₁ = a·tinta + (1-a)·f₁`
 * y `c₂ = a·tinta + (1-a)·f₂`, la resta deja `(1-a)` sola. Se promedian los
 * tres canales porque cada uno da la misma `a` con su propio ruido de
 * rasterizado.
 */
function unmix(c1, c2) {
  let sum = 0;
  for (let i = 0; i < 3; i++) sum += 1 - (c1[i] - c2[i]) / (night[i] - probe[i]);
  const a = Math.min(1, Math.max(0, sum / 3));
  if (a < 1 / 255) return [0, 0, 0, 0];
  const ink = c1.map((v, i) => Math.round(Math.min(255, Math.max(0, (v - (1 - a) * night[i]) / a))));
  return [ink[0], ink[1], ink[2], Math.round(a * 255)];
}

const geometry = readAsterism();
const box = contentBox(geometry);

for (const [variant, color] of Object.entries(VARIANTS)) {
  const out = join(ASSETS, variant);
  mkdirSync(out, { recursive: true });
  const draw = (fraction, background, side) =>
    buildSvg({ geometry, box, color, fraction, background, side });

  // --- 1. El heredado: opaco, así que basta con el rasterizado sobre la noche.
  const legacy = join(out, 'icon.png');
  const { png: legacyPng } = rasterize(draw(CONTENT.legacy, NIGHT, SIZE), SIZE);
  execFileSync('sips', ['-s', 'format', 'png', legacyPng, '--out', legacy], { stdio: 'ignore' });
  execFileSync('sips', ['-z', '48', '48', legacy, '--out', join(out, 'favicon.png')], { stdio: 'ignore' });

  // --- 2. Las tres capas del adaptativo, con el asterismo en su zona segura.
  const onNight = rasterize(draw(CONTENT.adaptive, NIGHT, LAYER), LAYER).image;
  const onProbe = rasterize(draw(CONTENT.adaptive, PROBE, LAYER), LAYER).image;
  const ink = (x, y) => unmix(onNight.at(x, y), onProbe.at(x, y));

  writePng(join(out, 'android-icon-background.png'), LAYER, () => [...night, 255]);
  writePng(join(out, 'android-icon-foreground.png'), LAYER, ink);
  // El de tema lo tiñe el sistema con el color del fondo de pantalla, así que
  // solo viaja la forma: el color se ignora y lo único que se lee es el alfa.
  writePng(join(out, 'android-icon-monochrome.png'), LAYER, (x, y) => [255, 255, 255, ink(x, y)[3]]);

  console.log(`✓ ${variant.padEnd(12)} ${color}  →  app/assets/icons/${variant}/`);
}

console.log(`  ${geometry.stars.length} estrellas · trazado en hueso · fondo ${NIGHT}`);
console.log(`  icon.png ${SIZE}² al ${Math.round(CONTENT.legacy * 100)}% · capas ${LAYER}² al ${Math.round(CONTENT.adaptive * 100)}%`);
