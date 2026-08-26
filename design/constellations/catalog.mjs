/**
 * catalog.mjs — construye `catalog.json` desde fuentes públicas citadas.
 *
 * Regla de canon (BRD §11.2.0): ninguna coordenada se escribe a mano. Todo sale
 * de las fuentes de abajo, y lo que no esté en ellas no entra en la pieza.
 *
 *   node catalog.mjs            # usa la caché si existe
 *   node catalog.mjs --refresh  # vuelve a download
 *
 * Salida: catalog.json (se versiona; es la entrada de plot.mjs).
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCES = {
  lines: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json',
    cite: 'd3-celestial (Olaf Frohn), data/constellations.lines.json — licencia BSD-3-Clause',
    gives: 'trazado convencional del asterismo, con las coordenadas de cada vértice',
  },
  stars: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json',
    cite: 'd3-celestial (Olaf Frohn), data/stars.6.json — derivado del catálogo Hipparcos',
    gives: 'stars hasta magnitud ~6, con HIP, RA/Dec (J2000) y magnitud aparente',
  },
  starNames: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/starnames.json',
    cite: 'd3-celestial (Olaf Frohn), data/starnames.json — nomenclatura IAU',
    gives: 'nombre propio y designación de Bayer por HIP',
  },
};

/** Los 12 signos y la constelación que les da nombre. Ver la nota de README.md. */
/**
 * Abreviatura IAU → **identificador** de la constelación. En inglés y en
 * minúscula, porque es lo que acaba siendo el nombre del fichero SVG y la clave
 * con la que la app la busca. El nombre en español que lee el usuario vive en
 * `plot.mjs` (`LABELS`) y en `app/src/chart/ui/labels.ts`.
 */
const ZODIAC = [
  ['Ari', 'aries'],
  ['Tau', 'taurus'],
  ['Gem', 'gemini'],
  ['Cnc', 'cancer'],
  ['Leo', 'leo'],
  ['Vir', 'virgo'],
  ['Lib', 'libra'],
  ['Sco', 'scorpio'],
  ['Sgr', 'sagittarius'],
  ['Cap', 'capricorn'],
  ['Aqr', 'aquarius'],
  ['Psc', 'pisces'],
];

/**
 * Constelaciones de marca, fuera del zodiaco.
 *
 * Canis Major es el hook de marca del BRD §11.1 y no es una licencia poética:
 * es el Can Mayor, contiene a Sirio —la estrella más brillante del cielo
 * nocturno, mag −1,44— y **es un perro de verdad en el cielo**. Con esto, la app
 * tiene su perro celeste sin inventar ni una sola estrella.
 */
const BRAND = [['CMa', 'canis-major']];

/** Tolerancia de emparejamiento vértice→estrella, en grados. */
const TOLERANCIA = 0.05;

const CACHE = new URL('.cache/', import.meta.url);

async function fetchSource(id, { refresh }) {
  const target = new URL(`${id}.json`, CACHE);
  if (!refresh && existsSync(target)) {
    return JSON.parse(await readFile(target, 'utf8'));
  }
  const { url } = SOURCES[id];
  process.stdout.write(`descargando ${id}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} devolvió ${res.status}`);
  const texto = await res.text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(target, texto);
  console.log(`${(texto.length / 1024).toFixed(0)} KB`);
  return JSON.parse(texto);
}

/**
 * Separación angular aproximada, en grados. Vale para matchStar un vértice con
 * su estrella: a esta escala la aproximación plana no introduce error relevante.
 */
function separation(ra1, dec1, ra2, dec2) {
  let dRa = Math.abs(ra1 - ra2);
  if (dRa > 180) dRa = 360 - dRa; // el meridiano 0h: Piscis lo cruza
  return Math.hypot(dRa * Math.cos((dec1 * Math.PI) / 180), dec1 - dec2);
}

const main = async () => {
  const refresh = process.argv.includes('--refresh');
  const [lines, stars, starNames] = await Promise.all([
    fetchSource('lines', { refresh }),
    fetchSource('stars', { refresh }),
    fetchSource('starNames', { refresh }),
  ]);

  const catalog = stars.features.map((f) => ({
    hip: f.id,
    mag: f.properties.mag,
    ra: f.geometry.coordinates[0],
    dec: f.geometry.coordinates[1],
  }));

  const warnings = [];

  const construir = ([iau, id]) => {
    const feature = lines.features.find((f) => f.id === iau);
    if (!feature) throw new Error(`sin trazado para ${iau}`);

    // Los vértices del trazado SON las estrellas del asterismo. Se deduplican
    // por coordenada: un vértice compartido por dos segments es una estrella.
    const indexByVertex = new Map();
    const usadas = [];

    const resolver = (vertex) => {
      const key = vertex.join(',');
      if (indexByVertex.has(key)) return indexByVertex.get(key);

      let mejor = null;
      let distancia = Infinity;
      for (const estrella of catalog) {
        const d = separation(vertex[0], vertex[1], estrella.ra, estrella.dec);
        if (d < distancia) {
          distancia = d;
          mejor = estrella;
        }
      }
      if (distancia > TOLERANCIA) {
        warnings.push(`${iau}: vértice ${key} sin estrella a <${TOLERANCIA}° (${distancia.toFixed(4)}°)`);
        return null;
      }

      const meta = starNames[String(mejor.hip)] ?? {};
      const indice = usadas.length;
      usadas.push({
        hip: mejor.hip,
        name: meta.name || null,
        bayer: meta.desig || null,
        ra: mejor.ra,
        dec: mejor.dec,
        mag: mejor.mag,
        separation: Number(distancia.toFixed(4)),
      });
      indexByVertex.set(key, indice);
      return indice;
    };

    const segments = [];
    for (const segmento of feature.geometry.coordinates) {
      const cadena = segmento.map(resolver);
      if (cadena.includes(null)) continue; // no se dibuja lo que no se pudo resolver
      segments.push(cadena);
    }

    // La dominant es la más brillante: sale de la magnitud, no se elige. Ojo, no
    // es la α en 7 de las 12 (Pollux es β, Alpherg es η…).
    const dominant = usadas.reduce((a, b) => (b.mag < a.mag ? b : a));

    return {
      iau,
      id,
      stars: usadas,
      segments,
      dominant: dominant.hip,
    };
  };

  const constellations = ZODIAC.map(construir);
  const brand = BRAND.map(construir);

  const out = {
    sources: Object.entries(SOURCES).map(([key, s]) => ({ key, url: s.url, cite: s.cite, gives: s.gives })),
    note:
      'Derivado, no editar a mano: se regenera con `node catalog.mjs`. Los vértices del ' +
      'trazado convencional se emparejan con su estrella del catálogo por proximidad ' +
      `(tolerance ${TOLERANCIA}°) para recuperar HIP, nombre y magnitud.`,
    generated: new Date().toISOString().slice(0, 10),
    constellations,
    brand,
  };

  await writeFile(new URL('catalog.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);

  console.log('\nconstelación   estrellas  segmentos    mag  dominante');
  for (const c of [...constellations, ...brand]) {
    const dominant = c.stars.find((e) => e.hip === c.dominant);
    console.log(
      `${c.id.padEnd(13)} ${String(c.stars.length).padStart(6)} ${String(c.segments.length).padStart(10)}` +
        ` ${String(dominant.mag).padStart(6)}  ${dominant.name ?? `HIP ${dominant.hip}`} (${dominant.bayer ?? '?'})`,
    );
  }
  if (warnings.length) {
    console.log(`\n${warnings.length} aviso(s):`);
    for (const a of warnings) console.log(`  ${a}`);
  }
};

await main();
