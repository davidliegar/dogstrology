import type { MoonPhaseName } from '../domain/NatalChart';
import type { AspectType } from '../domain/ChartAspect';
import type { Element, Modality, PlanetId, Sign } from '../domain/PlanetPosition';

/**
 * Los nombres que lee el usuario.
 *
 * El dominio habla en identificadores (`sun`, `aries`, `fire`) porque son
 * claves: viajan en las claves del catálogo, se comparan, se indexan. Lo que
 * se enseña en pantalla es **otra cosa**, y vive aquí, en la capa de UI.
 *
 * Antes eran lo mismo — `Sign` era a la vez el tipo y el texto de la pantalla —
 * y eso ataba el modelo de datos al idioma del mercado: sacar la app en inglés
 * habría obligado a regenerar todo el catálogo, porque el idioma estaba metido
 * dentro de las claves de caché.
 *
 * `Record<X, string>` a propósito: añadir un signo o un aspecto al dominio y
 * olvidarse de su etiqueta no compila.
 */
export const SIGN_LABELS: Record<Sign, string> = {
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
};

export const ELEMENT_LABELS: Record<Element, string> = {
  fire: 'Fuego',
  earth: 'Tierra',
  air: 'Aire',
  water: 'Agua',
};

export const MODALITY_LABELS: Record<Modality, string> = {
  cardinal: 'Cardinal',
  fixed: 'Fijo',
  mutable: 'Mutable',
};

export const PLANET_LABELS: Record<PlanetId, string> = {
  sun: 'Sol',
  moon: 'Luna',
  mercury: 'Mercurio',
  venus: 'Venus',
  mars: 'Marte',
  jupiter: 'Júpiter',
  saturn: 'Saturno',
  uranus: 'Urano',
  neptune: 'Neptuno',
  pluto: 'Plutón',
};

export const ASPECT_LABELS: Record<AspectType, string> = {
  conjunction: 'Conjunción',
  sextile: 'Sextil',
  square: 'Cuadratura',
  trine: 'Trígono',
  opposition: 'Oposición',
};

export const MOON_PHASE_LABELS: Record<MoonPhaseName, string> = {
  new_moon: 'Luna nueva',
  waxing_crescent: 'Luna creciente',
  first_quarter: 'Cuarto creciente',
  waxing_gibbous: 'Gibosa creciente',
  full_moon: 'Luna llena',
  waning_gibbous: 'Gibosa menguante',
  last_quarter: 'Cuarto menguante',
  waning_crescent: 'Luna menguante',
};
