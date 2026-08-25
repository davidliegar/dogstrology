/**
 * catalogo.mjs — construye `catalogo.json` desde fuentes públicas citadas.
 *
 * Regla de canon (BRD §11.2.0): ninguna coordenada se escribe a mano. Todo sale
 * de las fuentes de abajo, y lo que no esté en ellas no entra en la pieza.
 *
 *   node catalogo.mjs            # usa la caché si existe
 *   node catalogo.mjs --refresh  # vuelve a descargar
 *
 * Salida: catalogo.json (se versiona; es la entrada de plot.mjs).
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCES = {
  lineas: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json',
    cita: 'd3-celestial (Olaf Frohn), data/constellations.lines.json — licencia BSD-3-Clause',
    da: 'trazado convencional del asterismo, con las coordenadas de cada vértice',
  },
  estrellas: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json',
    cita: 'd3-celestial (Olaf Frohn), data/stars.6.json — derivado del catálogo Hipparcos',
    da: 'estrellas hasta magnitud ~6, con HIP, RA/Dec (J2000) y magnitud aparente',
  },
  nombres: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/starnames.json',
    cita: 'd3-celestial (Olaf Frohn), data/starnames.json — nomenclatura IAU',
    da: 'nombre propio y designación de Bayer por HIP',
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

async function obtener(id, { refresh }) {
  const destino = new URL(`${id}.json`, CACHE);
  if (!refresh && existsSync(destino)) {
    return JSON.parse(await readFile(destino, 'utf8'));
  }
  const { url } = SOURCES[id];
  process.stdout.write(`descargando ${id}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} devolvió ${res.status}`);
  const texto = await res.text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(destino, texto);
  console.log(`${(texto.length / 1024).toFixed(0)} KB`);
  return JSON.parse(texto);
}

/**
 * Separación angular aproximada, en grados. Vale para emparejar un vértice con
 * su estrella: a esta escala la aproximación plana no introduce error relevante.
 */
function separacion(ra1, dec1, ra2, dec2) {
  let dRa = Math.abs(ra1 - ra2);
  if (dRa > 180) dRa = 360 - dRa; // el meridiano 0h: Piscis lo cruza
  return Math.hypot(dRa * Math.cos((dec1 * Math.PI) / 180), dec1 - dec2);
}

const main = async () => {
  const refresh = process.argv.includes('--refresh');
  const [lineas, estrellas, nombres] = await Promise.all([
    obtener('lineas', { refresh }),
    obtener('estrellas', { refresh }),
    obtener('nombres', { refresh }),
  ]);

  const catalogo = estrellas.features.map((f) => ({
    hip: f.id,
    mag: f.properties.mag,
    ra: f.geometry.coordinates[0],
    dec: f.geometry.coordinates[1],
  }));

  const avisos = [];

  const construir = ([abrev, id]) => {
    const feature = lineas.features.find((f) => f.id === abrev);
    if (!feature) throw new Error(`sin trazado para ${abrev}`);

    // Los vértices del trazado SON las estrellas del asterismo. Se deduplican
    // por coordenada: un vértice compartido por dos segmentos es una estrella.
    const indicePorVertice = new Map();
    const usadas = [];

    const resolver = (vertice) => {
      const clave = vertice.join(',');
      if (indicePorVertice.has(clave)) return indicePorVertice.get(clave);

      let mejor = null;
      let distancia = Infinity;
      for (const estrella of catalogo) {
        const d = separacion(vertice[0], vertice[1], estrella.ra, estrella.dec);
        if (d < distancia) {
          distancia = d;
          mejor = estrella;
        }
      }
      if (distancia > TOLERANCIA) {
        avisos.push(`${abrev}: vértice ${clave} sin estrella a <${TOLERANCIA}° (${distancia.toFixed(4)}°)`);
        return null;
      }

      const meta = nombres[String(mejor.hip)] ?? {};
      const indice = usadas.length;
      usadas.push({
        hip: mejor.hip,
        nombre: meta.name || null,
        bayer: meta.desig || null,
        ra: mejor.ra,
        dec: mejor.dec,
        mag: mejor.mag,
        separacion: Number(distancia.toFixed(4)),
      });
      indicePorVertice.set(clave, indice);
      return indice;
    };

    const segmentos = [];
    for (const segmento of feature.geometry.coordinates) {
      const cadena = segmento.map(resolver);
      if (cadena.includes(null)) continue; // no se dibuja lo que no se pudo resolver
      segmentos.push(cadena);
    }

    // La dominante es la más brillante: sale de la magnitud, no se elige. Ojo, no
    // es la α en 7 de las 12 (Pollux es β, Alpherg es η…).
    const dominante = usadas.reduce((a, b) => (b.mag < a.mag ? b : a));

    return {
      abrev,
      id,
      estrellas: usadas,
      segmentos,
      dominante: dominante.hip,
    };
  };

  const constelaciones = ZODIAC.map(construir);
  const marca = BRAND.map(construir);

  const salida = {
    fuentes: Object.entries(SOURCES).map(([clave, s]) => ({ clave, url: s.url, cita: s.cita, da: s.da })),
    nota:
      'Derivado, no editar a mano: se regenera con `node catalogo.mjs`. Los vértices del ' +
      'trazado convencional se emparejan con su estrella del catálogo por proximidad ' +
      `(tolerancia ${TOLERANCIA}°) para recuperar HIP, nombre y magnitud.`,
    generado: new Date().toISOString().slice(0, 10),
    constelaciones,
    marca,
  };

  await writeFile(new URL('catalogo.json', import.meta.url), `${JSON.stringify(salida, null, 2)}\n`);

  console.log('\nconstelación  estrellas  segmentos    mag  dominante');
  for (const c of [...constelaciones, ...marca]) {
    const dominante = c.estrellas.find((e) => e.hip === c.dominante);
    console.log(
      `${c.nombre.padEnd(13)} ${String(c.estrellas.length).padStart(6)} ${String(c.segmentos.length).padStart(10)}` +
        ` ${String(dominante.mag).padStart(6)}  ${dominante.nombre ?? `HIP ${dominante.hip}`} (${dominante.bayer ?? '?'})`,
    );
  }
  if (avisos.length) {
    console.log(`\n${avisos.length} aviso(s):`);
    for (const a of avisos) console.log(`  ${a}`);
  }
};

await main();
