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
import { ASPECT_LABELS, label, MOON_PHASE_LABELS, PLANET_LABELS, SIGN_LABELS } from './labels.mjs';
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

// Las 8 fases, en el orden del ciclo. `PHASE_NAMES` no se exporta de
// `astro.mjs` —igual que `ASPECTOS`— así que se toman de la tabla de etiquetas,
// y `test/fragments-catalogo.test.mjs` comprueba **por comportamiento** que
// `moonPhase()` no devuelve nunca un nombre que no esté aquí.
const MOON_PHASES = Object.keys(MOON_PHASE_LABELS);

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
        // **Nombrar los dos es obligatorio, y por eso se pide.** La primera
        // tanda salió con 162 de 780 que no decían ni la raza ni el signo
        // —«un perro que organiza el salón», que vale para cualquiera— y eso
        // vacía justo lo que hace diferencial a este cruce (BRD §7.3): si el
        // texto no nombra al bulldog, no es la ficha del bulldog.
        userMessage:
          `Escribe la interpretación permanente del catálogo para: un perro de raza ${breed.label} ` +
          `con signo solar ${label(SIGN_LABELS, sign)}. Nombra la raza y el signo dentro del texto: ` +
          `quien lo lea tiene que reconocer que habla de su perro y no de un perro cualquiera.`,
      });
    }
  }
  return fragments;
}

/**
 * Personalidad: 12 signos + 8 fases natales + 8 fases de cielo + 12 casas =
 * **40** para el MVP (BRD §7.3; el 68 de la tabla es una previsión para 4
 * especies).
 *
 * **Las fases van dos veces, y no es un descuido.** Una fase lunar se lee de
 * dos maneras que no se sustituyen:
 *
 * - `species=dog;moon_phase=full_moon` — el perro **nacido** en luna llena.
 *   Es carácter, no cambia nunca, y es lo que pide la ficha de una fase
 *   cuando la mascota nació en ella
 * - `species=dog;moon_phase=full_moon;when=today` — qué se nota en **todos**
 *   los perros durante los días de luna llena. Es el cielo de este tramo de
 *   mes, igual para cualquier carta, y es lo que piden el artboard 07 (La
 *   Luna hoy) y la ficha de la fase de hoy (artboard 23)
 *
 * La sesión 23 de `PLAN.md` descubrió el hueco al implementar el 23: el
 * artboard rotulaba "En un perro" un texto de cielo, y lo único publicado era
 * el retrato natal. Las 8 de cielo se generaron el 2026-08-27. Sigue siendo catálogo inmutable y no diario: lo que se
 * nota en una menguante es verdad en **todas** las menguantes, así que se
 * escribe una vez y se paga una vez.
 *
 * Es otra cosa que `planet=sun;sign=aries`, aunque se parezcan. Aquella es la
 * lectura técnica de una posición; esta es el retrato — el contenido "hero" de
 * F6, la frase que remata la revelación de F1 y el glosario de Explorar
 * (BRD §11.4).
 *
 * **Los tres ejes llevan `species=dog`**, incluidos fases y casas. La aritmética
 * del 68 (`4×12 + 8 + 12`) daba por hecho que fases y casas se comparten entre
 * especies, y al escribir el mensaje se ve que no: "un perro nacido en luna
 * llena" y "la casa IV es su cama y su territorio" (BRD §6.4 ya traduce las
 * casas al mundo canino) son prosa de perro, no prosa neutra. Una clave que
 * promete neutralidad que no tiene es de las caras de arreglar, así que la
 * previsión a 4 especies pasa a ser 4×40 = 160. El MVP son 40.
 */
export function personalityFragments() {
  const fragments = [];

  for (const sign of SIGNS) {
    fragments.push({
      key: `species=dog;sign=${sign}`,
      userMessage: `Escribe el retrato de personalidad permanente del catálogo para: un perro de signo ${label(SIGN_LABELS, sign)}. Es el texto que define su carácter, no la lectura de una posición concreta.`,
    });
  }

  for (const phase of MOON_PHASES) {
    fragments.push({
      key: `species=dog;moon_phase=${phase}`,
      userMessage: `Escribe el retrato de personalidad permanente del catálogo para: un perro nacido en ${label(MOON_PHASE_LABELS, phase)}.`,
    });
  }

  // La misma fase leída como cielo y no como nacimiento. Ver el porqué en el
  // bloque de arriba: son dos textos distintos sobre la misma fase.
  for (const phase of MOON_PHASES) {
    fragments.push({
      key: `species=dog;moon_phase=${phase};when=today`,
      userMessage:
        `Escribe la entrada permanente del catálogo para: qué se nota en los perros durante los días de ${label(MOON_PHASE_LABELS, phase)}. ` +
        'Habla del tramo del ciclo lunar que hay en el cielo y de cómo se nota en el descanso y la conducta de **cualquier** perro, sea cual sea su carta. ' +
        'No es el perro nacido en esa fase: eso es otra entrada.',
    });
  }

  for (const house of HOUSES) {
    fragments.push({
      key: `species=dog;house=${house}`,
      userMessage: `Escribe la entrada de glosario permanente del catálogo para: qué área de la vida de un perro representa la casa ${house}. Explica el área, no un planeta dentro de ella.`,
    });
  }

  return fragments;
}

/** Registro de categorías listas para generar hoy. */
export const CATEGORIES = [
  { id: 'aspects', count: 500, build: aspectFragments },
  { id: 'planet-sign-house', count: 240, build: planetSignHouseFragments },
  { id: 'breed-sign', count: BREEDS.length * 12, build: breedSignFragments },
  { id: 'personality', count: 40, build: personalityFragments },
];

/**
 * **No queda ninguna categoría MVP pendiente.** Las cuatro del BRD §7.3 están
 * implementadas y generadas (2026-08-26).
 *
 * Las que quedan en el BRD —compatibilidad perro↔perro, perro↔humano,
 * perro↔gato y momentos— son de fase 2 y 3 (BRD §9), no del MVP: se añaden aquí
 * cuando su feature entre, no antes.
 *
 * Dos números del BRD se corrigieron al construirlas, y los dos por lo mismo —
 * eran aritmética de una tabla de coste, no requisitos: las razas son 65 y no
 * 60, y la previsión de personalidad a 4 especies es 4×32 y no 68.
 */
export const PENDING_CATEGORIES = [];

export { MAJOR_ASPECTS, BODIES };
