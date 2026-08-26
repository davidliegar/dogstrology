/**
 * catalogFragments.mjs — el catálogo inmutable (BRD §7.3), por categoría.
 *
 * Igual que `dailyFragments.mjs`: funciones puras, sin red, sin SDK. Cada
 * categoría es independiente y se puede lanzar por separado (`generateCatalog.mjs
 * --categories aspects`), porque cada una acaba en su propio informe de PR.
 *
 * De las 8 categorías del BRD, aquí solo están las 4 que son MVP y las 2 que
 * de verdad se pueden build hoy — ver el porqué de las otras dos al final
 * del fichero, en `PENDING_CATEGORIES`.
 */

import { planetPositions, SIGNS } from '../../proto/astro.mjs';
import { ASPECT_LABELS, label, PLANET_LABELS, SIGN_LABELS } from './labels.mjs';
import { BREEDS } from './breeds.mjs';

// IDs de cuerpo derivados en runtime del propio motor (fecha fija, arbitraria:
// los IDs no dependen de la fecha) — así nunca se desalinean si `astro.mjs`
// añade o renombra un cuerpo.
const BODIES = planetPositions(new Date('2000-01-01T00:00:00Z')).map((p) => p.id);

// Los 5 aspects mayores de `astro.mjs` (ASPECTOS, BRD §6.5) no se exportan
// del motor — se listan aquí tal cual. `test/fragments-catalogo.test.mjs`
// verifica por comportamiento (separaciones sintéticas de 0/60/90/120/180°)
// que estos nombres son justo los que `aspects()` devuelve, para detectar
// cualquier deriva sin tener que exportar la constante interna del motor.
const MAJOR_ASPECTS = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];

const HOUSES = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Interpretación de aspects: 10 × 10 × 5 = 500. La key usa los mismos
 * nombres de campo que devuelve `transits()` en runtime — la app indexa el
 * catálogo con la clave que ya calcula sola, sin tabla intermedia.
 */
export function aspectFragments() {
  const fragments = [];
  for (const transit of BODIES) {
    for (const natal of BODIES) {
      for (const aspect of MAJOR_ASPECTS) {
        fragments.push({
          key: `transit=${transit};aspect=${aspect};natal=${natal}`,
          userMessage: `Escribe la interpretación permanente del catálogo para: ${label(PLANET_LABELS, transit)} en tránsito en ${label(ASPECT_LABELS, aspect)} con ${label(PLANET_LABELS, natal)} natal.`,
        });
      }
    }
  }
  return fragments;
}

/** Planeta en signo / planeta en casa: 10×12 + 10×12 = 240. */
export function planetSignHouseFragments() {
  const fragments = [];
  for (const planet of BODIES) {
    for (const sign of SIGNS) {
      fragments.push({
        key: `planet=${planet};sign=${sign}`,
        userMessage: `Escribe la interpretación permanente del catálogo para: ${label(PLANET_LABELS, planet)} en ${label(SIGN_LABELS, sign)}.`,
      });
    }
    for (const house of HOUSES) {
      fragments.push({
        key: `planet=${planet};house=${house}`,
        userMessage: `Escribe la interpretación permanente del catálogo para: ${label(PLANET_LABELS, planet)} en la casa ${house}.`,
      });
    }
  }
  return fragments;
}

/**
 * Raza × signo: 65 × 12 = 780. La lista vive en `breeds.mjs` porque la comparte
 * con el selector de F2 (BRD §8.1) — ver allí el criterio.
 *
 * Es la categoría donde más aprieta el guardarraíl de salud (BRD §7.5): con una
 * braquicéfala o un shar pei delante, el modelo tiende a escribir sobre
 * respiración, pliegues o displasia, y "afirmaciones factuales sobre patologías
 * de razas" está explícitamente prohibido. El prompt lo dice; el filtro es la
 * segunda barrera.
 */
export function breedSignFragments() {
  const fragments = [];
  for (const breed of BREEDS) {
    for (const sign of SIGNS) {
      fragments.push({
        key: `breed=${breed.id};sign=${sign}`,
        userMessage: `Escribe la interpretación permanente del catálogo para: un perro de raza ${breed.label} con signo solar ${label(SIGN_LABELS, sign)}.`,
      });
    }
  }
  return fragments;
}

/** Registro de categorías listas para generar hoy. */
export const CATEGORIES = [
  { id: 'aspects', count: 500, build: aspectFragments },
  { id: 'planet-sign-house', count: 240, build: planetSignHouseFragments },
  { id: 'breed-sign', count: BREEDS.length * 12, build: breedSignFragments },
];

/**
 * Queda una categoría MVP sin implementar:
 *
 * - `personality-species-sign`: el BRD §7.3 da el total (68) como previsión
 *   para 4 especies; con especie=perro el MVP son 32 (`12 signos + 8 fases +
 *   12 casas`). Falta decidir la forma exacta del mensaje de cada eje.
 *
 * `breed-sign` salió de aquí el 2026-08-26, al fijarse la lista de razas.
 * Fueron 65 y no las 60 que estimaba el BRD: la aritmética de 720 era una
 * línea de una tabla de coste, no un requisito, y a ~$0,005 el fragmento las
 * cinco razas de más cuestan 30 céntimos — más barato que dejar fuera al
 * pitbull o al braco alemán por cuadrar un número.
 */
export const PENDING_CATEGORIES = ['personality-species-sign'];

export { MAJOR_ASPECTS, BODIES };
