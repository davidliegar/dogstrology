/**
 * labels.mjs — los nombres en español que ve el modelo.
 *
 * El pipeline maneja dos cosas distintas que antes eran la misma:
 *
 * - **La clave** (`planet=sun;sign=aries`) es un identificador. Viaja al JSON
 *   publicado, la app la construye por su cuenta a partir de la carta que ya
 *   ha calculado, y las dos tienen que coincidir carácter a carácter. Va en
 *   inglés y en minúscula, como cualquier clave de caché.
 *
 * - **El mensaje al modelo** ("Escribe la interpretación para: Sol en Aries")
 *   es prosa en español, porque el fragmento que va a escribir es prosa en
 *   español. Pedirle en inglés que escriba español mete un salto de traducción
 *   y es de donde salen los anglicismos.
 *
 * Que la clave sea inglesa y el mensaje español chirría al leerlo junto, y es
 * a propósito: el día que la app salga en inglés, se traducen las etiquetas y
 * **las claves no se tocan** — que es justo lo que evita regenerar el catálogo
 * entero, con lo que cuesta.
 *
 * Espejo de `app/src/chart/ui/labels.ts`. Si divergen, la app enseñaría un
 * nombre y el contenido hablaría de otro.
 */

export const SIGN_LABELS = {
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

export const PLANET_LABELS = {
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

export const ASPECT_LABELS = {
  conjunction: 'Conjunción',
  sextile: 'Sextil',
  square: 'Cuadratura',
  trine: 'Trígono',
  opposition: 'Oposición',
};

export const MOON_PHASE_LABELS = {
  new_moon: 'Luna nueva',
  waxing_crescent: 'Luna creciente',
  first_quarter: 'Cuarto creciente',
  waxing_gibbous: 'Gibosa creciente',
  full_moon: 'Luna llena',
  waning_gibbous: 'Gibosa menguante',
  last_quarter: 'Cuarto menguante',
  waning_crescent: 'Luna menguante',
};

/** Los tres ejes del diario (BRD §7.3). `id` va en la clave, `label` en el mensaje. */
export const AXES = [
  { id: 'sun', label: 'Sol' },
  { id: 'moon', label: 'Luna' },
  { id: 'ascendant', label: 'Ascendente' },
];

/** Falla ruidosamente: una etiqueta ausente saldría como `undefined` en el prompt. */
export function label(table, id) {
  const found = table[id];
  if (!found) throw new Error(`Sin etiqueta para "${id}"`);
  return found;
}
