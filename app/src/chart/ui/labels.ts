import type { ChartConfidence, HouseSystem, MoonPhaseName } from '../domain/NatalChart';
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

/**
 * Los tres sistemas de casas (BRD §12.3, D7). El nombre propio se deja como
 * es —Placidus es un apellido, no una palabra traducible—; los otros dos sí
 * se dicen en español porque describen lo que hacen.
 */
export const HOUSE_SYSTEM_LABELS: Record<HouseSystem, string> = {
  whole_sign: 'Signos enteros',
  placidus: 'Placidus',
  equal: 'Casas iguales',
};

/**
 * Los tres grados de degradación del motor (BRD §12.3). Se enseñan tal cual
 * en la barra de confianza del perfil: la etiqueta nombra **lo que falta**,
 * no lo que hay, porque es lo accionable.
 */
export const CONFIDENCE_LABELS: Record<ChartConfidence, string> = {
  full: 'Completa',
  no_location: 'Sin lugar',
  no_time: 'Sin hora',
};

/**
 * El texto de cada grado de confianza, en el perfil (canvas: "los tres estados
 * de ChartConfidence"). Nombra **lo que se gana** completando el dato, no lo
 * que falta: es lo que hace que el usuario quiera darlo.
 *
 * El de carta completa no pide nada y por eso no lleva acción — el tono
 * `settled` de `NoticeCard` le quita el oro.
 */
export const CONFIDENCE_NOTICES: Record<
  ChartConfidence,
  { text: (context: { name: string; time?: string }) => string; action?: string }
> = {
  no_time: {
    text: () => 'Su carta está a medias: con la hora se calculan el Ascendente y las doce casas.',
    action: 'Añadir la hora',
  },
  no_location: {
    text: ({ time }) =>
      `Tienes su hora, pero las ${time ?? 'suyas'} son una hora distinta en cada país. ` +
      'Sin el lugar, su Ascendente puede caer medio signo más allá.',
    action: 'Elegir el lugar',
  },
  full: {
    text: ({ name }) =>
      `Su carta está completa. Fecha, hora y lugar: nada de lo que la app cuenta sobre ${name} se está estimando.`,
  },
};
