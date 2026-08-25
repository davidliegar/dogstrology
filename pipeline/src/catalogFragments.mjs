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

/** Registro de categorías listas para generar hoy. */
export const CATEGORIES = [
  { id: 'aspects', count: 500, build: aspectFragments },
  { id: 'planet-sign-house', count: 240, build: planetSignHouseFragments },
];

/**
 * Raza × sign (720) y personalidad especie×sign/fases/casas (68) son MVP
 * según el BRD §7.3, pero no se generan todavía:
 *
 * - `breed-sign`: no existe en ningún fichero del repo una lista de las "60
 *   razas principales" que cita el BRD (línea 308) — es una decisión
 *   editorial (qué razas, en qué orden de prioridad), no algo que se pueda
 *   derivar del motor ni inventar sin revisión.
 * - `personality-species-sign`: el BRD (línea 314) da el total (68) sin
 *   desglose aritmético, y con especie=perro (gato queda fuera del MVP) no
 *   hay una combinación obvia de signos/fases/casas que dé 68 exacto.
 *
 * Añadir aquí un objeto `{id, count, build}` en cuanto haya lista de
 * razas y desglose confirmado — el resto del pipeline (lote, filtro,
 * report) no necesita cambios para soportarlas.
 */
export const PENDING_CATEGORIES = ['breed-sign', 'personality-species-sign'];

export { MAJOR_ASPECTS, BODIES };
