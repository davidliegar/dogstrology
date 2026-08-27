import type { House } from '../domain/House';

/**
 * Dónde cae la casa en la rueda (artboard 21, el pie del diagrama).
 *
 * Es una lectura del dibujo, no prosa de catálogo: la I arranca en el
 * Ascendente —el horizonte por el este, a la izquierda— y las doce corren en
 * antihorario, así que el número de casa ya dice en qué cuadrante está y si
 * queda por encima o por debajo del horizonte. Por eso son cuatro frases y no
 * doce: lo que describen es el cuadrante, que es lo único que la geometría
 * sabe de una casa sin carta delante.
 *
 * Los cuatro ejes se nombran como se han nombrado siempre (BRD §11.2.0):
 * el horizonte por el este y por el oeste, el Fondo del Cielo abajo y el
 * Medio Cielo arriba.
 */
const QUADRANT_NOTES = [
  'Baja desde el horizonte del este hasta el fondo del cielo',
  'Empieza bajo el horizonte y sube hacia el oeste',
  'Sube desde el horizonte del oeste hasta lo más alto',
  'Baja desde el medio cielo de vuelta al este',
] as const;

export const housePlacementNote = (house: House): string =>
  QUADRANT_NOTES[Math.floor((house - 1) / 3)];
