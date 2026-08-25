/**
 * plot.mjs — proyecta `catalogo.json` a los 12 SVG.
 *
 *   node plot.mjs           # escribe svg/*.svg
 *   node plot.mjs --revisar # además, hoja de contacto para mirar las 12 juntas
 *
 * No hay decisiones de dibujo aquí: la geometría sale del catálogo y el radio del
 * punto sale de la magnitud. Lo único ajustable es el ENCUADRE de abajo, y se
 * aplica igual a las 12.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ENCUADRE = {
  lienzo: 512,
  margen: 64,
  trazo: 2,
  // Radio del punto por magnitud: r = base - pendiente · mag, acotado.
  radio: { base: 10, pendiente: 1.4, min: 3, max: 10 },
  opacidadLineas: 0.32, // colors.constellationLine va al 32%
};

/**
 * El icono acaba siendo un PNG cocido en el bundle, así que no puede leer tokens
 * en tiempo de ejecución: los colores hay que escribirlos aquí. Espejo de
 * `design/theme.ts`, que sigue siendo la fuente única de verdad — si cambian
 * allí, cambian aquí.
 */
const TOKENS = {
  fondo: '#0B1026', // colors.background
  acento: '#E8C87A', // colors.accent
  linea: '#F2EFE6', // colors.star, al 55% para el icono
};

/**
 * Icono de app, desde Canis Major. Los valores no son gusto: salen de mirar el
 * resultado a 48 px, que es donde vive un icono en una lista de ajustes.
 *
 * - `margen` 96: la zona segura del icono adaptativo de Android es el ~62% central.
 * - `corteMag` 3,6: quita las tres más débiles de las 11. Con las 11 puestas, a
 *   48 px se convierte en grumo. No es inventar: es lo que se ve desde una ciudad.
 * - `opacidadLineas` 0,55 y `factorRadio` 1,45: a tamaño de icono, el 0,32 del
 *   asset de app desaparece.
 */
const ICONO = {
  margen: 96,
  corteMag: 3.6,
  opacidadLineas: 0.55,
  factorRadio: 1.45,
  trazo: 3,
  halo: { anillo: 40, nucleo: 24 },
  // Con la figura tradicional puesta, el conjunto se reencaja con este margen: la
  // silueta puede permitirse llegar más al borde que un asterismo suelto.
  margenConFigura: 28,
};

const SLUG = {
  Aries: 'aries',
  Tauro: 'tauro',
  'Géminis': 'geminis',
  'Cáncer': 'cancer',
  Leo: 'leo',
  Virgo: 'virgo',
  Libra: 'libra',
  Escorpio: 'escorpio',
  Sagitario: 'sagitario',
  Capricornio: 'capricornio',
  Acuario: 'acuario',
  Piscis: 'piscis',
};

const rad = (grados) => (grados * Math.PI) / 180;

/**
 * Proyecta las estrellas de una constelación al lienzo.
 *
 * Proyección plana con la ascensión recta corregida por cos(dec) en el centro del
 * campo. A tamaño de constelación la distorsión es invisible, y mantiene rectos
 * los segmentos del asterismo. Convención de carta estelar: RA creciente hacia la
 * izquierda, norte arriba.
 */
function proyectar(estrellas, margen = ENCUADRE.margen) {
  // La fuente da la RA como longitud en [-180, 180], así que la costura está en
  // las 12h, no en las 0h. Virgo la cruza (va de 176° a 220°): sin desenrollar,
  // el centro del campo cae al otro lado del cielo y la constelación sale
  // estirada en una línea. Se desenrolla llevando el tramo negativo a >180.
  const ras = estrellas.map((e) => e.ra);
  const cruzaCostura = Math.max(...ras) - Math.min(...ras) > 180;
  const raDesenrollada = ras.map((ra) => (cruzaCostura && ra < 0 ? ra + 360 : ra));

  const decs = estrellas.map((e) => e.dec);
  const ra0 = (Math.min(...raDesenrollada) + Math.max(...raDesenrollada)) / 2;
  const dec0 = (Math.min(...decs) + Math.max(...decs)) / 2;
  const cos0 = Math.cos(rad(dec0));

  const planas = estrellas.map((e, i) => ({
    x: -(raDesenrollada[i] - ra0) * cos0,
    y: -(e.dec - dec0),
  }));

  // Encuadre común: se escala al mayor de los dos ejes, así ninguna constelación
  // se deforma y todas comparten la misma caja.
  const anchos = planas.map((p) => p.x);
  const altos = planas.map((p) => p.y);
  const ancho = Math.max(...anchos) - Math.min(...anchos);
  const alto = Math.max(...altos) - Math.min(...altos);
  const util = ENCUADRE.lienzo - 2 * margen;
  const escala = util / Math.max(ancho, alto, 1e-9);
  const cx = (Math.min(...anchos) + Math.max(...anchos)) / 2;
  const cy = (Math.min(...altos) + Math.max(...altos)) / 2;
  const centro = ENCUADRE.lienzo / 2;

  return planas.map((p) => ({
    x: Number((centro + (p.x - cx) * escala).toFixed(1)),
    y: Number((centro + (p.y - cy) * escala).toFixed(1)),
  }));
}

const radioDe = (mag) => {
  const { base, pendiente, min, max } = ENCUADRE.radio;
  return Number(Math.min(max, Math.max(min, base - pendiente * mag)).toFixed(1));
};

function svgDe(constelacion) {
  const { nombre, estrellas, segmentos, dominante } = constelacion;
  const puntos = proyectar(estrellas);

  const trazos = segmentos
    .map((cadena) => {
      const d = cadena.map((i, n) => `${n === 0 ? 'M' : 'L'}${puntos[i].x} ${puntos[i].y}`).join(' ');
      return `    <path d="${d}" />`;
    })
    .join('\n');

  const nodos = estrellas
    .map((e, i) => {
      const clase = e.hip === dominante ? ' class="dominante"' : '';
      const etiqueta = e.nombre ? ` <!-- ${e.nombre} -->` : '';
      return `    <circle${clase} cx="${puntos[i].x}" cy="${puntos[i].y}" r="${radioDe(e.mag)}" />${etiqueta}`;
    })
    .join('\n');

  const estrellaDominante = estrellas.find((e) => e.hip === dominante);

  return `<!--
  ${nombre} — generado por plot.mjs desde catalogo.json. NO editar a mano.

  ${estrellas.length} estrellas del asterismo convencional, en posición real
  (J2000). El radio de cada punto sale de su magnitud aparente.
  Estrella dominante: ${estrellaDominante.nombre ?? `HIP ${estrellaDominante.hip}`} (mag ${estrellaDominante.mag}).

  Color en dos ranuras: .lineas → colors.constellationLine · .nodos → constellationNode.
  currentColor es solo el valor por defecto.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENCUADRE.lienzo} ${ENCUADRE.lienzo}"
     fill="none" stroke="currentColor" stroke-width="${ENCUADRE.trazo}"
     stroke-linecap="round" stroke-linejoin="round"
     role="img" aria-label="Constelación de ${nombre}">

  <g class="lineas" opacity="${ENCUADRE.opacidadLineas}">
${trazos}
  </g>

  <g class="nodos" fill="currentColor" stroke="none">
${nodos}
  </g>
</svg>
`;
}

/**
 * Icono de app desde una constelación de marca.
 *
 * Se diferencia del asset de app en tres cosas, y todas por el tamaño: fondo
 * opaco (un icono no puede ser transparente), corte por magnitud, y más
 * contraste. La geometría sigue siendo la real.
 */
/**
 * Contorno de la figura tradicional, si alguien lo ha dibujado.
 *
 * Es la única pieza **autorada** de todo esto, y va en su propio fichero para que
 * el arte definitivo entre sin tocar el plotter. Requisitos del fichero:
 * mismo lienzo 512×512, solo `<path>`, sin `transform` y sin relleno.
 *
 * Que se dibuje la figura no rompe la regla de canon (BRD §11.2.0): los atlas
 * históricos dibujaban la figura mitológica sobre las estrellas reales, y en
 * Canis Major esa figura es un perro. Lo que no vale es inventarse otra.
 */
async function contornoAutorado(fichero) {
  if (!existsSync(fichero)) return null;
  const texto = await readFile(fichero, 'utf8');
  const trazos = [...texto.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  return trazos.length ? trazos : null;
}

function svgIcono(constelacion, { fondo, contorno }) {
  const { nombre, estrellas, segmentos, dominante } = constelacion;
  const puntos = proyectar(estrellas, ICONO.margen);

  const visibles = new Set(estrellas.map((e, i) => (e.mag < ICONO.corteMag ? i : null)).filter((i) => i !== null));

  // Al quitar estrellas, un segmento se parte. Se conservan los tramos que sigan
  // uniendo dos estrellas visibles consecutivas; los cabos sueltos se caen.
  const tramos = [];
  for (const cadena of segmentos) {
    let actual = [];
    for (const i of cadena) {
      if (visibles.has(i)) {
        actual.push(i);
      } else {
        if (actual.length > 1) tramos.push(actual);
        actual = [];
      }
    }
    if (actual.length > 1) tramos.push(actual);
  }

  const iDominante = estrellas.findIndex((e) => e.hip === dominante);
  const d = puntos[iDominante];

  // La figura tradicional es más grande que el asterismo —cubre la constelación
  // entera, con estrellas que el icono no dibuja—, así que al añadirla hay que
  // reencajar el conjunto. Se hace con un `transform` sobre todo el contenido:
  // así escalan de una vez posiciones, radios y grosores, y las estrellas siguen
  // registradas sobre la figura.
  let ajuste = '';
  if (contorno) {
    const numeros = contorno.join(' ').match(/-?[\d.]+/g)?.map(Number) ?? [];
    const xs = [...puntos.map((p) => p.x), ...numeros.filter((_, i) => i % 2 === 0)];
    const ys = [...puntos.map((p) => p.y), ...numeros.filter((_, i) => i % 2 === 1)];
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const k = (ENCUADRE.lienzo - 2 * ICONO.margenConFigura) / Math.max(x1 - x0, y1 - y0);
    const tx = (ENCUADRE.lienzo - (x1 - x0) * k) / 2 - x0 * k;
    const ty = (ENCUADRE.lienzo - (y1 - y0) * k) / 2 - y0 * k;
    ajuste = ` transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(4)})"`;
  }

  const trazos = tramos
    .map((cadena) => `    <path d="${cadena.map((i, n) => `${n === 0 ? 'M' : 'L'}${puntos[i].x} ${puntos[i].y}`).join(' ')}" />`)
    .join('\n');

  const nodos = [...visibles]
    .map((i) => {
      const r = (radioDe(estrellas[i].mag) * ICONO.factorRadio).toFixed(1);
      const etiqueta = estrellas[i].nombre ? ` <!-- ${estrellas[i].nombre} -->` : '';
      return `    <circle cx="${puntos[i].x}" cy="${puntos[i].y}" r="${r}" />${etiqueta}`;
    })
    .join('\n');

  const estrellaDominante = estrellas[iDominante];

  return `<!--
  Icono de app — generado por plot.mjs. NO editar a mano.

  ${nombre} en posición real, recortada a magnitud < ${ICONO.corteMag}
  (${visibles.size} de ${estrellas.length} estrellas) y con más contraste, porque
  a 48 px el asset de app no se lee. Halo sobre ${estrellaDominante.nombre}, mag ${estrellaDominante.mag}.

  Contenido dentro del ${Math.round(((512 - 2 * ICONO.margen) / 512) * 100)}% central: zona segura del icono
  adaptativo de Android.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENCUADRE.lienzo} ${ENCUADRE.lienzo}"
     role="img" aria-label="Dogstrology — la constelación de ${nombre} con Sirio">

  <rect width="${ENCUADRE.lienzo}" height="${ENCUADRE.lienzo}" fill="${fondo.fondo}" />

  <g${ajuste}>
${
  contorno
    ? `
  <g class="contorno" fill="none" stroke="${fondo.linea}" stroke-width="2.5"
     stroke-linecap="round" stroke-linejoin="round" opacity="0.22">
${contorno.map((d) => `    <path d="${d}" />`).join('\n')}
  </g>
`
    : ''
}
  <g class="lineas" fill="none" stroke="${fondo.linea}" stroke-width="${ICONO.trazo}"
     stroke-linecap="round" stroke-linejoin="round" opacity="${ICONO.opacidadLineas}">
${trazos}
  </g>

  <g class="halo" fill="none">
    <circle cx="${d.x}" cy="${d.y}" r="${ICONO.halo.anillo}" stroke="${fondo.acento}" stroke-width="2" opacity="0.28" />
    <circle cx="${d.x}" cy="${d.y}" r="${ICONO.halo.nucleo}" fill="${fondo.acento}" opacity="0.20" />
  </g>

  <g class="nodos" fill="${fondo.acento}">
${nodos}
  </g>

  </g>
</svg>
`;
}

/** Hoja de contacto: artefacto de revisión, no un asset de la app. */
function hojaDeContacto(constelaciones) {
  const L = ENCUADRE.lienzo;
  const cols = 4;
  const filas = Math.ceil(constelaciones.length / cols);
  // Lienzo cuadrado con las filas centradas: los previsualizadores del sistema
  // encajan el render en un cuadrado y recortarían la última columna.
  const lado = cols * L;
  const sangria = (lado - filas * L) / 2;
  const piezas = constelaciones
    .map((c, i) => {
      const puntos = proyectar(c.estrellas);
      const dx = (i % cols) * L;
      const dy = sangria + Math.floor(i / cols) * L;
      const trazos = c.segmentos
        .map((cadena) => cadena.map((n, k) => `${k === 0 ? 'M' : 'L'}${puntos[n].x} ${puntos[n].y}`).join(' '))
        .map((d) => `<path d="${d}" />`)
        .join('');
      const nodos = c.estrellas
        .map((e, n) => `<circle cx="${puntos[n].x}" cy="${puntos[n].y}" r="${radioDe(e.mag)}" />`)
        .join('');
      return `  <g transform="translate(${dx} ${dy})">
    <g fill="none" stroke="#F2EFE6" stroke-width="${ENCUADRE.trazo}" stroke-linecap="round" opacity="${ENCUADRE.opacidadLineas}">${trazos}</g>
    <g fill="#E8C87A">${nodos}</g>
    <text x="${L / 2}" y="${L - 28}" fill="#8E96B4" font-size="20" text-anchor="middle" font-family="sans-serif">${c.nombre} · ${c.estrellas.length}</text>
    <rect x="0.5" y="0.5" width="${L - 1}" height="${L - 1}" fill="none" stroke="#2B3566" />
  </g>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}">
  <rect width="100%" height="100%" fill="#0B1026" />
${piezas}
</svg>
`;
}

const catalogo = JSON.parse(await readFile(new URL('catalogo.json', import.meta.url), 'utf8'));
const destino = new URL('svg/', import.meta.url);
await mkdir(destino, { recursive: true });

for (const constelacion of catalogo.constelaciones) {
  const slug = SLUG[constelacion.nombre];
  if (!slug) throw new Error(`sin slug para ${constelacion.nombre}`);
  await writeFile(new URL(`${slug}.svg`, destino), svgDe(constelacion));
  const puntos = proyectar(constelacion.estrellas);
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const dentro =
    Math.min(...xs) >= ENCUADRE.margen &&
    Math.min(...ys) >= ENCUADRE.margen &&
    Math.max(...xs) <= ENCUADRE.lienzo - ENCUADRE.margen &&
    Math.max(...ys) <= ENCUADRE.lienzo - ENCUADRE.margen;
  console.log(
    `${slug.padEnd(12)} ${String(constelacion.estrellas.length).padStart(2)} estrellas  ` +
      `margen ${dentro ? 'ok' : '¡FUERA!'}`,
  );
}

// Marca: fuera del zodiaco, y va a design/marca/ porque es identidad, no signo.
const marca = new URL('../marca/', import.meta.url);
await mkdir(marca, { recursive: true });
const contorno = await contornoAutorado(new URL('contorno.svg', marca));
for (const constelacion of catalogo.marca ?? []) {
  await writeFile(new URL('canis-major.svg', marca), svgDe(constelacion));
  await writeFile(new URL('icono.svg', marca), svgIcono(constelacion, { fondo: TOKENS, contorno }));
  const visibles = constelacion.estrellas.filter((e) => e.mag < ICONO.corteMag).length;
  console.log(
    `\nmarca/canis-major.svg  ${constelacion.estrellas.length} estrellas\n` +
      `marca/icono.svg        ${visibles} estrellas (mag < ${ICONO.corteMag})` +
      `${contorno ? `, con contorno (${contorno.length} trazo(s))` : ', sin contorno'}`,
  );
}

if (process.argv.includes('--revisar')) {
  await writeFile(new URL('revision.svg', import.meta.url), hojaDeContacto(catalogo.constelaciones));
  console.log('\nrevision.svg escrito');
}
