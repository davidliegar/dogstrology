import type { PlanetId, Sign } from '../domain/PlanetPosition';

/**
 * Los símbolos de planeta y signo, en Unicode.
 *
 * **No son etiquetas y por eso no viven en `labels.ts`.** Una etiqueta es lo
 * que cambia al sacar la app en inglés; un glifo no: ♈ es Aries en cualquier
 * idioma desde hace siglos. Es la regla de canon del BRD §11.2.0 aplicada a la
 * tipografía — lo heredado se representa como es, no se rediseña.
 *
 * El selector de variante `︎` (U+FE0E) no sobra: sin él, iOS y Android pintan
 * varios de estos como emoji a todo color, que es exactamente lo que la lámina
 * no quiere. Con él salen como texto y heredan el color del token.
 */
const TEXT_VARIANT = '︎';

export const PLANET_GLYPHS: Record<PlanetId, string> = {
  sun: `☉${TEXT_VARIANT}`,
  moon: `☽${TEXT_VARIANT}`,
  mercury: `☿${TEXT_VARIANT}`,
  venus: `♀${TEXT_VARIANT}`,
  mars: `♂${TEXT_VARIANT}`,
  jupiter: `♃${TEXT_VARIANT}`,
  saturn: `♄${TEXT_VARIANT}`,
  uranus: `♅${TEXT_VARIANT}`,
  neptune: `♆${TEXT_VARIANT}`,
  pluto: `♇${TEXT_VARIANT}`,
};

export const SIGN_GLYPHS: Record<Sign, string> = {
  aries: `♈${TEXT_VARIANT}`,
  taurus: `♉${TEXT_VARIANT}`,
  gemini: `♊${TEXT_VARIANT}`,
  cancer: `♋${TEXT_VARIANT}`,
  leo: `♌${TEXT_VARIANT}`,
  virgo: `♍${TEXT_VARIANT}`,
  libra: `♎${TEXT_VARIANT}`,
  scorpio: `♏${TEXT_VARIANT}`,
  sagittarius: `♐${TEXT_VARIANT}`,
  capricorn: `♑${TEXT_VARIANT}`,
  aquarius: `♒${TEXT_VARIANT}`,
  pisces: `♓${TEXT_VARIANT}`,
};

/** Las casas se numeran en romano en toda la lámina, nunca en arábigo. */
export const HOUSE_NUMERALS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
] as const;
