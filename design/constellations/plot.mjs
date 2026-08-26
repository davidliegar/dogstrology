/**
 * plot.mjs — proyecta `catalog.json` a los 12 SVG.
 *
 *   node plot.mjs           # escribe svg/*.svg
 *   node plot.mjs --revisar # además, hoja de contacto para mirar las 12 juntas
 *
 * No hay decisiones de dibujo aquí: la geometría sale del catálogo y el radio del
 * punto sale de la magnitud. Lo único ajustable es el FRAMING de abajo, y se
 * aplica igual a las 12.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FRAMING = {
  canvas: 512,
  margin: 64,
  stroke: 2,
  // Radio del punto por magnitud: r = base - pendiente · mag, acotado.
  radio: { base: 10, pendiente: 1.4, min: 3, max: 10 },
  lineOpacity: 0.32, // colors.constellationLine va al 32%
};

/**
 * El icono acaba siendo un PNG cocido en el bundle, así que no puede leer tokens
 * en tiempo de ejecución: los colores hay que escribirlos aquí. Espejo de
 * `design/theme.ts`, que sigue siendo la fuente única de verdad — si cambian
 * allí, cambian aquí.
 */
const TOKENS = {
  background: '#0B1026', // colors.background
  accent: '#E8C87A', // colors.accent
  line: '#F2EFE6', // colors.star, al 55% para el icono
};

/**
 * Icono de app, desde Canis Major. Los valores no son gusto: salen de mirar el
 * resultado a 48 px, que es donde vive un icono en una lista de ajustes.
 *
 * - `margin` 96: la zona segura del icono adaptativo de Android es el ~62% central.
 * - `magCutoff` 3,6: quita las tres más débiles de las 11. Con las 11 puestas, a
 *   48 px se convierte en grumo. No es inventar: es lo que se ve desde una ciudad.
 * - `lineOpacity` 0,55 y `factorRadio` 1,45: a tamaño de icono, el 0,32 del
 *   asset de app desaparece.
 */
const ICON = {
  margin: 96,
  magCutoff: 3.6,
  lineOpacity: 0.55,
  factorRadio: 1.45,
  stroke: 3,
  halo: { anillo: 40, nucleo: 24 },
  // Con la figura tradicional puesta, el conjunto se reencaja con este margen: la
  // silueta puede permitirse llegar más al borde que un asterismo suelto.
  marginWithFigure: 28,
};

/**
 * Los nombres en español, solo para lo que lee una persona: el `aria-label` del
 * SVG y el pie de la hoja de contacto. El **identificador** de la constelación
 * (`aries`, `taurus`) es el que viene de `catalog.json`, y es también el
 * nombre del fichero — antes había una tabla de traducción aquí porque los
 * ficheros iban en español, y ya no hace falta.
 *
 * Espejo de `app/src/chart/ui/labels.ts`.
 */
const LABELS = {
  aries: 'Aries',
  taurus: 'Tauro',
  gemini: 'Géminis',
  cancer: 'Cáncer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Escorpio',
  sagittarius: 'Sagitario',
  capricorn: 'Capricornio',
  aquarius: 'Acuario',
  pisces: 'Piscis',
  'canis-major': 'Canis Major',
};

const labelOf = (id) => LABELS[id] ?? id;

const rad = (degrees) => (degrees * Math.PI) / 180;

/**
 * Proyecta las estrellas de una constelación al lienzo.
 *
 * Proyección plana con la ascensión recta corregida por cos(dec) en el centro del
 * campo. A tamaño de constelación la distorsión es invisible, y mantiene rectos
 * los segmentos del asterismo. Convención de carta estelar: RA creciente hacia la
 * izquierda, norte arriba.
 */
function project(stars, margin = FRAMING.margin) {
  // La fuente da la RA como longitud en [-180, 180], así que la costura está en
  // las 12h, no en las 0h. Virgo la cruza (va de 176° a 220°): sin desenrollar,
  // el centro del campo cae al otro lado del cielo y la constelación sale
  // estirada en una línea. Se desenrolla llevando el tramo negativo a >180.
  const ras = stars.map((e) => e.ra);
  const cruzaCostura = Math.max(...ras) - Math.min(...ras) > 180;
  const raDesenrollada = ras.map((ra) => (cruzaCostura && ra < 0 ? ra + 360 : ra));

  const decs = stars.map((e) => e.dec);
  const ra0 = (Math.min(...raDesenrollada) + Math.max(...raDesenrollada)) / 2;
  const dec0 = (Math.min(...decs) + Math.max(...decs)) / 2;
  const cos0 = Math.cos(rad(dec0));

  const planas = stars.map((e, i) => ({
    x: -(raDesenrollada[i] - ra0) * cos0,
    y: -(e.dec - dec0),
  }));

  // Encuadre común: se escala al mayor de los dos ejes, así ninguna constelación
  // se deforma y todas comparten la misma caja.
  const anchos = planas.map((p) => p.x);
  const altos = planas.map((p) => p.y);
  const ancho = Math.max(...anchos) - Math.min(...anchos);
  const alto = Math.max(...altos) - Math.min(...altos);
  const util = FRAMING.canvas - 2 * margin;
  const escala = util / Math.max(ancho, alto, 1e-9);
  const cx = (Math.min(...anchos) + Math.max(...anchos)) / 2;
  const cy = (Math.min(...altos) + Math.max(...altos)) / 2;
  const centro = FRAMING.canvas / 2;

  return planas.map((p) => ({
    x: Number((centro + (p.x - cx) * escala).toFixed(1)),
    y: Number((centro + (p.y - cy) * escala).toFixed(1)),
  }));
}

const radiusOf = (mag) => {
  const { base, pendiente, min, max } = FRAMING.radio;
  return Number(Math.min(max, Math.max(min, base - pendiente * mag)).toFixed(1));
};

function svgOf(constellation) {
  const { id, stars, segments, dominant } = constellation;
  const puntos = project(stars);

  const paths = segments
    .map((cadena) => {
      const d = cadena.map((i, n) => `${n === 0 ? 'M' : 'L'}${puntos[i].x} ${puntos[i].y}`).join(' ');
      return `    <path d="${d}" />`;
    })
    .join('\n');

  const nodos = stars
    .map((e, i) => {
      const cssClass = e.hip === dominant ? ' class="dominant"' : '';
      const label = e.name ? ` <!-- ${e.name} -->` : '';
      return `    <circle${cssClass} cx="${puntos[i].x}" cy="${puntos[i].y}" r="${radiusOf(e.mag)}" />${label}`;
    })
    .join('\n');

  const dominantStar = stars.find((e) => e.hip === dominant);

  return `<!--
  ${labelOf(id)} — generado por plot.mjs desde catalog.json. NO editar a mano.

  ${stars.length} estrellas del asterismo convencional, en posición real
  (J2000). El radio de cada punto sale de su magnitud aparente.
  Estrella dominante: ${dominantStar.name ?? `HIP ${dominantStar.hip}`} (mag ${dominantStar.mag}).

  Color en dos ranuras: .lines → colors.constellationLine · .nodes → constellationNode.
  currentColor es solo el valor por defecto.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FRAMING.canvas} ${FRAMING.canvas}"
     fill="none" stroke="currentColor" stroke-width="${FRAMING.stroke}"
     stroke-linecap="round" stroke-linejoin="round"
     role="img" aria-label="Constelación de ${labelOf(id)}">

  <g class="lines" opacity="${FRAMING.lineOpacity}">
${paths}
  </g>

  <g class="nodes" fill="currentColor" stroke="none">
${nodos}
  </g>
</svg>
`;
}

/**
 * Icono de app desde una constelación de marca.
 *
 * Se diferencia del asset de app en tres cosas, y todas por el tamaño: background
 * opaco (un icono no puede ser transparente), corte por magnitud, y más
 * contraste. La geometría sigue siendo la real.
 */
/**
 * Contorno de la figura tradicional, si alguien lo ha dibujado.
 *
 * Es la única pieza **autorada** de todo esto, y va en su propio fichero para que
 * el arte definitivo entre sin tocar el plotter. Requisitos del fichero:
 * mismo canvas 512×512, solo `<path>`, sin `transform` y sin relleno.
 *
 * Que se dibuje la figura no rompe la regla de canon (BRD §11.2.0): los atlas
 * históricos dibujaban la figura mitológica sobre las estrellas reales, y en
 * Canis Major esa figura es un perro. Lo que no vale es inventarse otra.
 */
async function authoredOutline(fichero) {
  if (!existsSync(fichero)) return null;
  const text = await readFile(fichero, 'utf8');
  const paths = [...text.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  return paths.length ? paths : null;
}

function iconSvg(constellation, { background, outline }) {
  const { id, stars, segments, dominant } = constellation;
  const puntos = project(stars, ICON.margin);

  const visible = new Set(stars.map((e, i) => (e.mag < ICON.magCutoff ? i : null)).filter((i) => i !== null));

  // Al quitar stars, un segmento se parte. Se conservan los runs que sigan
  // uniendo dos stars visible consecutivas; los cabos sueltos se caen.
  const runs = [];
  for (const cadena of segments) {
    let actual = [];
    for (const i of cadena) {
      if (visible.has(i)) {
        actual.push(i);
      } else {
        if (actual.length > 1) runs.push(actual);
        actual = [];
      }
    }
    if (actual.length > 1) runs.push(actual);
  }

  const iDominante = stars.findIndex((e) => e.hip === dominant);
  const d = puntos[iDominante];

  // La figura tradicional es más grande que el asterismo —cubre la constelación
  // entera, con estrellas que el icono no dibuja—, así que al añadirla hay que
  // reencajar el conjunto. Se hace con un `transform` sobre todo el contenido:
  // así escalan de una vez posiciones, radios y grosores, y las estrellas siguen
  // registradas sobre la figura.
  let ajuste = '';
  if (outline) {
    const numeros = outline.join(' ').match(/-?[\d.]+/g)?.map(Number) ?? [];
    const xs = [...puntos.map((p) => p.x), ...numeros.filter((_, i) => i % 2 === 0)];
    const ys = [...puntos.map((p) => p.y), ...numeros.filter((_, i) => i % 2 === 1)];
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const k = (FRAMING.canvas - 2 * ICON.marginWithFigure) / Math.max(x1 - x0, y1 - y0);
    const tx = (FRAMING.canvas - (x1 - x0) * k) / 2 - x0 * k;
    const ty = (FRAMING.canvas - (y1 - y0) * k) / 2 - y0 * k;
    ajuste = ` transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(4)})"`;
  }

  const paths = runs
    .map((cadena) => `    <path d="${cadena.map((i, n) => `${n === 0 ? 'M' : 'L'}${puntos[i].x} ${puntos[i].y}`).join(' ')}" />`)
    .join('\n');

  const nodos = [...visible]
    .map((i) => {
      const r = (radiusOf(stars[i].mag) * ICON.factorRadio).toFixed(1);
      const label = stars[i].name ? ` <!-- ${stars[i].name} -->` : '';
      return `    <circle cx="${puntos[i].x}" cy="${puntos[i].y}" r="${r}" />${label}`;
    })
    .join('\n');

  const dominantStar = stars[iDominante];

  return `<!--
  Icono de app — generado por plot.mjs. NO editar a mano.

  ${labelOf(id)} en posición real, recortada a magnitud < ${ICON.magCutoff}
  (${visible.size} de ${stars.length} stars) y con más contraste, porque
  a 48 px el asset de app no se lee. Halo sobre ${dominantStar.name}, mag ${dominantStar.mag}.

  Contenido dentro del ${Math.round(((512 - 2 * ICON.margin) / 512) * 100)}% central: zona segura del icono
  adaptativo de Android.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FRAMING.canvas} ${FRAMING.canvas}"
     role="img" aria-label="Dogstrology — la constelación de ${labelOf(id)} con Sirio">

  <rect width="${FRAMING.canvas}" height="${FRAMING.canvas}" fill="${background.background}" />

  <g${ajuste}>
${
  outline
    ? `
  <g class="outline" fill="none" stroke="${background.line}" stroke-width="2.5"
     stroke-linecap="round" stroke-linejoin="round" opacity="0.22">
${outline.map((d) => `    <path d="${d}" />`).join('\n')}
  </g>
`
    : ''
}
  <g class="lines" fill="none" stroke="${background.line}" stroke-width="${ICON.stroke}"
     stroke-linecap="round" stroke-linejoin="round" opacity="${ICON.lineOpacity}">
${paths}
  </g>

  <g class="halo" fill="none">
    <circle cx="${d.x}" cy="${d.y}" r="${ICON.halo.anillo}" stroke="${background.accent}" stroke-width="2" opacity="0.28" />
    <circle cx="${d.x}" cy="${d.y}" r="${ICON.halo.nucleo}" fill="${background.accent}" opacity="0.20" />
  </g>

  <g class="nodes" fill="${background.accent}">
${nodos}
  </g>

  </g>
</svg>
`;
}

/** Hoja de contacto: artefacto de revisión, no un asset de la app. */
function contactSheet(constellations) {
  const L = FRAMING.canvas;
  const cols = 4;
  const rows = Math.ceil(constellations.length / cols);
  // Lienzo cuadrado con las filas centradas: los previsualizadores del sistema
  // encajan el render en un cuadrado y recortarían la última columna.
  const lado = cols * L;
  const sangria = (lado - rows * L) / 2;
  const pieces = constellations
    .map((c, i) => {
      const puntos = project(c.stars);
      const dx = (i % cols) * L;
      const dy = sangria + Math.floor(i / cols) * L;
      const paths = c.segments
        .map((cadena) => cadena.map((n, k) => `${k === 0 ? 'M' : 'L'}${puntos[n].x} ${puntos[n].y}`).join(' '))
        .map((d) => `<path d="${d}" />`)
        .join('');
      const nodos = c.stars
        .map((e, n) => `<circle cx="${puntos[n].x}" cy="${puntos[n].y}" r="${radiusOf(e.mag)}" />`)
        .join('');
      return `  <g transform="translate(${dx} ${dy})">
    <g fill="none" stroke="#F2EFE6" stroke-width="${FRAMING.stroke}" stroke-linecap="round" opacity="${FRAMING.lineOpacity}">${paths}</g>
    <g fill="#E8C87A">${nodos}</g>
    <text x="${L / 2}" y="${L - 28}" fill="#8E96B4" font-size="20" text-anchor="middle" font-family="sans-serif">${labelOf(c.id)} · ${c.stars.length}</text>
    <rect x="0.5" y="0.5" width="${L - 1}" height="${L - 1}" fill="none" stroke="#2B3566" />
  </g>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}">
  <rect width="100%" height="100%" fill="#0B1026" />
${pieces}
</svg>
`;
}

const catalog = JSON.parse(await readFile(new URL('catalog.json', import.meta.url), 'utf8'));
const target = new URL('svg/', import.meta.url);
await mkdir(target, { recursive: true });

for (const constellation of catalog.constellations) {
  // El id **es** el nombre del fichero: `aries` → `aries.svg`.
  const slug = constellation.id;
  await writeFile(new URL(`${slug}.svg`, target), svgOf(constellation));
  const puntos = project(constellation.stars);
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const dentro =
    Math.min(...xs) >= FRAMING.margin &&
    Math.min(...ys) >= FRAMING.margin &&
    Math.max(...xs) <= FRAMING.canvas - FRAMING.margin &&
    Math.max(...ys) <= FRAMING.canvas - FRAMING.margin;
  console.log(
    `${slug.padEnd(12)} ${String(constellation.stars.length).padStart(2)} stars  ` +
      `margin ${dentro ? 'ok' : '¡FUERA!'}`,
  );
}

// Marca: fuera del zodiaco, y va a design/brand/ porque es identidad, no signo.
const brand = new URL('../brand/', import.meta.url);
await mkdir(brand, { recursive: true });
const outline = await authoredOutline(new URL('outline.svg', brand));
for (const constellation of catalog.brand ?? []) {
  await writeFile(new URL('canis-major.svg', brand), svgOf(constellation));
  await writeFile(new URL('icon.svg', brand), iconSvg(constellation, { background: TOKENS, outline }));
  const visible = constellation.stars.filter((e) => e.mag < ICON.magCutoff).length;
  console.log(
    `\nbrand/canis-major.svg  ${constellation.stars.length} stars\n` +
      `brand/icon.svg        ${visible} estrellas (mag < ${ICON.magCutoff})` +
      `${outline ? `, con outline (${outline.length} stroke(s))` : ', sin contorno'}`,
  );
}

if (process.argv.includes('--revisar')) {
  await writeFile(new URL('review.svg', import.meta.url), contactSheet(catalog.constellations));
  console.log('\nreview.svg escrito');
}
