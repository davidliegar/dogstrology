/**
 * design/constellations/svg/*.svg  →  src/chart/ui/constellations.generated.ts
 *
 * Los SVG ya son derivados (`plot.mjs` los escribe desde `catalog.json`); esto
 * es un segundo derivado, no una copia editable. Se genera en lugar de
 * importarse porque:
 *
 *  - `react-native-svg` no lee ficheros .svg sin un transformer de Metro, y
 *    meter uno para 12 assets estáticos es más máquina de la que hace falta;
 *  - el contrato de `design/constellations/README.md` exige **dos ranuras de
 *    color** (`.lines` y `.nodes`) y halo en la dominante. Con los datos
 *    sueltos el componente las controla con tokens; con un `<SvgXml>` opaco
 *    habría que reteñir a base de reemplazos de cadena.
 *
 * Uso: npm run generate:constellations
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SVG_DIR = join(here, '..', '..', 'design', 'constellations', 'svg');
const OUT = join(here, '..', 'src', 'chart', 'ui', 'constellations.generated.ts');

/**
 * Los 12 signos, en el orden del zodiaco. El nombre del fichero **es** el
 * identificador (`aries.svg` → `'aries'`), así que aquí no hay tabla de
 * traducción: solo la lista que dice cuáles tienen que estar y en qué orden.
 */
const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

/**
 * Longitud del trazado, para poder animarlo con `strokeDasharray`: sin ella el
 * componente tendría que medir el path en tiempo de ejecución, y
 * `react-native-svg` no expone `getTotalLength()`.
 *
 * Los trazados de `plot.mjs` son polilíneas puras (`M x y L x y …`), así que
 * son sumas de segmentos rectos. Si algún día llevaran curvas, esto dejaría de
 * ser exacto — por eso se comprueba la forma y se rompe en vez de aproximar.
 */
function polylineLength(d, file) {
  if (!/^M[\d.\s]+(?:L[\d.\s]+)+$/.test(d.replace(/\s+/g, ' ').trim())) {
    fail(`${file}: trazado que no es una polilínea: ${d}. El cálculo de longitud dejaría de ser exacto.`);
  }
  const numbers = d.match(/[\d.]+/g).map(Number);
  let total = 0;
  for (let i = 2; i < numbers.length; i += 2) {
    total += Math.hypot(numbers[i] - numbers[i - 2], numbers[i + 1] - numbers[i - 1]);
  }
  return Math.round(total * 10) / 10;
}

function parse(svg, file) {
  const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!viewBox) fail(`${file}: sin viewBox reconocible`);
  if (viewBox[1] !== viewBox[2]) fail(`${file}: el lienzo no es cuadrado (${viewBox[1]}×${viewBox[2]})`);

  const lines = svg.match(/<g class="lines"[^>]*>([\s\S]*?)<\/g>/);
  const nodes = svg.match(/<g class="nodes"[^>]*>([\s\S]*?)<\/g>/);
  if (!lines || !nodes) fail(`${file}: faltan los grupos .lines / .nodes del contrato`);

  const paths = [...lines[1].matchAll(/<path\s+d="([^"]+)"/g)].map((m) => ({
    d: m[1],
    length: polylineLength(m[1], file),
  }));

  // El contrato del asset codifica la magnitud aparente en el radio:
  // r = clamp(10 − 1,4·mag, 3, 10). Se invierte aquí, que es donde vive la
  // fórmula, para que la app lea un dato y no deshaga un valor de dibujo.
  //
  // En los topes la magnitud **se ha perdido** y se emite `null`: con r=3 lo
  // único que se sabe es "de magnitud 5 o peor". Pasa en las estrellas más
  // débiles de Piscis y Sagitario, nunca en una dominante — de ahí que la
  // ficha de un signo, que solo cita la más brillante, siempre tenga número.
  const magnitudeOf = (r) => (r <= 3 || r >= 10 ? null : Math.round(((10 - r) / 1.4) * 10) / 10);

  const stars = [...nodes[1].matchAll(
    /<circle\s*(class="dominant")?\s*cx="([\d.]+)"\s*cy="([\d.]+)"\s*r="([\d.]+)"\s*\/>(?:\s*<!--\s*(.*?)\s*-->)?/g,
  )].map(([, dominant, cx, cy, r, name]) => ({
    cx: Number(cx), cy: Number(cy), r: Number(r),
    magnitude: magnitudeOf(Number(r)),
    name: name ?? null,
    dominant: Boolean(dominant),
  }));

  if (paths.length === 0) fail(`${file}: sin trazado`);
  if (stars.length === 0) fail(`${file}: sin estrellas`);
  // El halo de la dominante es un elemento de diseño, no un adorno opcional.
  if (stars.filter((s) => s.dominant).length !== 1) fail(`${file}: se esperaba exactamente una estrella dominante`);

  // La ficha del signo (artboard 18) cita a la dominante por su nombre y su
  // magnitud. Si le faltara cualquiera de las dos, la frase saldría a medias
  // en la app y nadie se enteraría hasta verla: mejor que reviente el build.
  const brightest = stars.find((s) => s.dominant);
  if (!brightest.name) fail(`${file}: la estrella dominante no tiene nombre en el comentario`);
  if (brightest.magnitude === null) fail(`${file}: la dominante está en el tope del clamp (r=${brightest.r}) y su magnitud no se puede recuperar`);

  return { size: Number(viewBox[1]), paths, stars };
}

const files = readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg')).sort();
const parsed = {};
let sizes = new Set();

for (const file of files) {
  const sign = file.replace('.svg', '');
  if (!SIGNS.includes(sign)) fail(`${file}: "${sign}" no es un signo. ¿Se ha añadido una constelación?`);
  const data = parse(readFileSync(join(SVG_DIR, file), 'utf8'), file);
  sizes.add(data.size);
  parsed[sign] = data;
}

const missing = SIGNS.filter((s) => !(s in parsed));
if (missing.length) fail(`faltan constelaciones: ${missing.join(', ')}`);
if (sizes.size !== 1) fail(`los lienzos no coinciden: ${[...sizes].join(', ')}`);

// Se emite en el orden del zodiaco, no en el alfabético de `readdir`.
const ordered = SIGNS.map((sign) => [sign, parsed[sign]]);
const canvas = [...sizes][0];

const body = ordered.map(([sign, { paths, stars }]) => {
  const starLines = stars.map(({ cx, cy, r, magnitude, name, dominant }) =>
    `      { cx: ${cx}, cy: ${cy}, r: ${r}, magnitude: ${magnitude}, name: ${name ? JSON.stringify(name) : 'null'}, dominant: ${dominant} },`,
  ).join('\n');
  return `  '${sign}': {
    paths: [
${paths.map(({ d, length }) => `      { d: ${JSON.stringify(d)}, length: ${length} },`).join('\n')}
    ],
    stars: [
${starLines}
    ],
  },`;
}).join('\n');

writeFileSync(OUT, `// GENERADO por scripts/generateConstellations.mjs desde
// design/constellations/svg/*.svg. NO editar a mano: \`npm run generate:constellations\`.
//
// Las 12 constelaciones **reales**, ploteadas desde coordenadas de estrellas
// (BRD §11.2.0, regla de canon). No son siluetas de perro y no se rediseñan.
import type { Sign } from '../domain/PlanetPosition';

/** Lienzo cuadrado del contrato de \`design/constellations/README.md\`. */
export const CONSTELLATION_CANVAS = ${canvas};

export interface ConstellationStar {
  cx: number;
  cy: number;
  /** Sale de la magnitud aparente real, no del gusto: clamp(10 − 1,4·mag, 3, 10). */
  r: number;
  /**
   * Magnitud aparente, deshaciendo el radio. Es **null** en los topes del
   * clamp, donde el dato se perdió: con r=3 solo se sabe "magnitud 5 o peor".
   * Una estrella dominante nunca lo es — el generador falla si lo fuera.
   */
  magnitude: number | null;
  name: string | null;
  /** La **más brillante**, no la α: en 7 de las 12 no coinciden. Lleva halo. */
  dominant: boolean;
}

export interface ConstellationPath {
  d: string;
  /** Longitud exacta de la polilínea: la usa \`strokeDasharray\` para trazarla. */
  length: number;
}

export interface ConstellationArt {
  paths: ConstellationPath[];
  stars: ConstellationStar[];
}

export const CONSTELLATIONS: Record<Sign, ConstellationArt> = {
${body}
};
`);

const totalStars = ordered.reduce((n, [, c]) => n + c.stars.length, 0);
console.log(`✓ ${ordered.length} constelaciones, ${totalStars} estrellas → src/chart/ui/constellations.generated.ts`);
