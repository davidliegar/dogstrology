import { normalize } from '@/_ui/text';
import type { SpanishZone } from '../domain/spanishTimeZone';
import data from './municipalities.generated.json';

export interface Municipality {
  name: string;
  /** Comunidad autónoma, ya resuelta a texto. */
  community: string;
  lat: number;
  lon: number;
  zone: SpanishZone;
}

/**
 * Los ~8.000 municipios de España (BRD §15.1 D16), generados desde GeoNames.
 *
 * El JSON viene en arrays y no en objetos, y con las coordenadas a dos
 * decimales: son 8.000 filas y la diferencia son cientos de kilobytes en el
 * bundle. Aquí se les pone nombre a las posiciones una sola vez, de forma
 * perezosa, para que abrir la app no pague por una pantalla que casi nadie
 * visita.
 */
const NAME = 0;
const COMMUNITY = 1;
const LAT = 2;
const LON = 3;
const IS_CANARY = 4;

let cache: Municipality[] | undefined;

function all(): Municipality[] {
  if (cache) return cache;
  cache = (data.municipalities as [string, number, number, number, number][]).map((row) => ({
    name: row[NAME],
    community: data.communities[row[COMMUNITY]],
    lat: row[LAT],
    lon: row[LON],
    zone: row[IS_CANARY] === 1 ? 'canary' : 'mainland',
  }));
  return cache;
}

/** Cuántos hay. Lo usa el texto del buscador, que dice entre cuántos busca. */
export const municipalityCount = data.municipalities.length;

/**
 * Municipios cuyo nombre contiene lo escrito, **en orden de población**.
 *
 * El generador ya los deja ordenados por población descendente y el filtro
 * conserva ese orden, así que quien escribe "barcel" ve Barcelona antes que
 * Barcelonilla sin que haya que puntuar nada en el dispositivo.
 *
 * Se corta a `limit` porque "san" son cientos de resultados y ninguno por
 * debajo del vigésimo se va a mirar.
 */
export function searchMunicipalities(query: string, limit = 20): Municipality[] {
  const normalized = normalize(query);
  if (normalized === '') return [];

  const found: Municipality[] = [];
  for (const municipality of all()) {
    if (normalize(municipality.name).includes(normalized)) {
      found.push(municipality);
      if (found.length === limit) break;
    }
  }
  return found;
}
