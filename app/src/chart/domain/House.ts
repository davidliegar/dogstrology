import { ELEMENTS, SIGNS, type Element, type Sign } from './PlanetPosition';

/**
 * Las doce casas, **propiedad del dominio** igual que los signos y los
 * planetas. Aquí no hay ninguna carta: son las reglas de la casa como
 * concepto, que es lo que la ficha de una casa (artboard 21) necesita saber
 * sin tener delante la carta de nadie.
 *
 * Una casa se identifica por su número, no por un token de texto: es lo que
 * ya viaja en las claves del catálogo (`species=dog;house=5`) y lo que
 * `PlanetPosition.house()` devuelve.
 */
export const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type House = (typeof HOUSES)[number];

export const isHouse = (value: number): value is House =>
  Number.isInteger(value) && value >= 1 && value <= 12;

/**
 * Angular, sucedente o cadente: el papel de la casa según dónde caiga
 * respecto a los cuatro ejes. Las angulares (I, IV, VII, X) arrancan en el
 * Ascendente, el Fondo del Cielo, el Descendente y el Medio Cielo.
 *
 * Es la misma partición en tres que las modalidades de un signo —cardinal,
 * fijo, mutable— y por eso se calcula igual: el ciclo se repite cada tres.
 * Los nombres sí son distintos porque nombran otra cosa, y la convención
 * heredada los llama así (BRD §11.2.0).
 */
export const HOUSE_KINDS = ['angular', 'succedent', 'cadent'] as const;
export type HouseKind = (typeof HOUSE_KINDS)[number];

export const kindOfHouse = (house: House): HouseKind => HOUSE_KINDS[(house - 1) % 3];

/**
 * La triplicidad de la casa: I·V·IX de fuego, II·VI·X de tierra, y así. Se
 * repite cada cuatro, exactamente igual que en los signos.
 */
export const elementOfHouse = (house: House): Element => ELEMENTS[(house - 1) % 4];

/**
 * El **regente natural**: el signo que rige esa casa en el zodiaco natural,
 * Aries la I y Piscis la XII. No es el signo que hay en su cúspide en una
 * carta concreta —eso depende del Ascendente y cambia con cada mascota—, sino
 * la correspondencia heredada que hace legible la casa cuando no hay carta.
 */
export const signRulingHouse = (house: House): Sign => SIGNS[house - 1];
