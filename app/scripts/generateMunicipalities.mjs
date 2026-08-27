/**
 * data/geonames-ES.txt  →  src/pet/ui/municipalities.generated.json
 *
 * El listado de municipios que ofrece el selector de lugar de F2 (BRD §15.1
 * D16: España y solo España en el MVP).
 *
 * **Fuente**: GeoNames (https://download.geonames.org/export/dump/ES.zip),
 * bajo licencia CC BY 4.0. La atribución es obligatoria y vive en
 * `data/README.md`; el fichero de origen se guarda en el repo **comprimido**
 * (11 MB → 3 MB) a propósito, para que regenerar no dependa de que una URL
 * siga viva dentro de dos años.
 *
 * Se filtra a lugares poblados con población conocida (`feature class P`,
 * `population > 0`): son ~8.000, prácticamente los 8.131 municipios de España,
 * y deja fuera los miles de parajes y despoblados que solo ensucian la
 * búsqueda.
 *
 * Sale JSON y no `.ts` como las constelaciones porque son 8.000 filas: un
 * módulo TypeScript de ese tamaño hace trabajar al compilador en cada
 * arranque de Metro para nada. Va en **arrays y no en objetos**, y con las
 * coordenadas a dos decimales (~1 km), que para una carta astral sobra: la
 * longitud entra en el cálculo como tiempo, y 0,01° son 2,4 segundos.
 *
 * Uso: npm run generate:municipalities
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, '..', '..', 'data', 'geonames-ES.txt.gz');
const OUT = join(here, '..', 'src', 'pet', 'ui', 'municipalities.generated.json');

/**
 * Código `admin1` de GeoNames → comunidad autónoma, en español.
 *
 * GeoNames las da en inglés ("Catalonia", "Castille and León") y lo que lee el
 * usuario va en español, así que la tabla vive aquí y no en el dataset: es
 * etiqueta, no dato.
 */
const COMMUNITIES = {
  51: 'Andalucía',
  52: 'Aragón',
  34: 'Asturias',
  '07': 'Islas Baleares',
  53: 'Canarias',
  39: 'Cantabria',
  54: 'Castilla-La Mancha',
  55: 'Castilla y León',
  56: 'Cataluña',
  57: 'Extremadura',
  58: 'Galicia',
  27: 'La Rioja',
  29: 'Madrid',
  31: 'Murcia',
  32: 'Navarra',
  59: 'País Vasco',
  60: 'Comunidad Valenciana',
  CE: 'Ceuta',
  ML: 'Melilla',
};

/** Columnas del volcado de GeoNames que nos importan (formato documentado en su README). */
const COL = { name: 1, lat: 4, lon: 5, featureClass: 6, admin1: 10, population: 14, timezone: 17 };

const rows = gunzipSync(readFileSync(SOURCE)).toString('utf8').split('\n');
const communityCodes = Object.keys(COMMUNITIES);

const municipalities = [];
for (const row of rows) {
  if (row === '') continue;
  const cell = row.split('\t');
  if (cell[COL.featureClass] !== 'P') continue;

  const population = Number(cell[COL.population]);
  if (population <= 0) continue;

  const communityIndex = communityCodes.indexOf(cell[COL.admin1]);
  // Un puñado de filas del volcado caen fuera de las 19 comunidades (frontera
  // con Portugal y Francia, sobre todo). No son municipios españoles: fuera.
  if (communityIndex === -1) continue;

  // El huso sale del propio dataset y no de la comunidad: Canarias es la
  // excepción evidente, pero tenerlo por fila evita razonar sobre casos raros.
  const isCanary = cell[COL.timezone] === 'Atlantic/Canary' ? 1 : 0;

  municipalities.push({
    population,
    row: [
      cell[COL.name],
      communityIndex,
      Number(Number(cell[COL.lat]).toFixed(2)),
      Number(Number(cell[COL.lon]).toFixed(2)),
      isCanary,
    ],
  });
}

// Por población descendente: quien escribe "barcel" quiere Barcelona antes que
// Barcelonilla. El buscador conserva este orden, así que la relevancia sale
// gratis y no hay que puntuar nada en el dispositivo.
municipalities.sort((a, b) => b.population - a.population);
const rowsOut = municipalities.map((entry) => entry.row);

writeFileSync(
  OUT,
  JSON.stringify({ communities: Object.values(COMMUNITIES), municipalities: rowsOut }),
);

console.log(
  `✓ ${rowsOut.length} municipios → src/pet/ui/municipalities.generated.json`,
);
