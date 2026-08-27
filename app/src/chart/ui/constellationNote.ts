import type { Sign } from '../domain/PlanetPosition';
import { CONSTELLATIONS, type ConstellationStar } from './constellations.generated';

/**
 * Los números en letra, de 4 a 25, que es el rango real: Aries tiene cuatro
 * estrellas y Sagitario veinticinco. Es prosa, no una cifra que se compare.
 */
const SPELLED: Record<number, string> = {
  4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez',
  11: 'Once', 12: 'Doce', 13: 'Trece', 14: 'Catorce', 15: 'Quince', 16: 'Dieciséis',
  17: 'Diecisiete', 18: 'Dieciocho', 19: 'Diecinueve', 20: 'Veinte', 21: 'Veintiuna',
  22: 'Veintidós', 23: 'Veintitrés', 24: 'Veinticuatro', 25: 'Veinticinco',
};

/**
 * Qué se ve de una estrella de esa magnitud a simple vista. Los cortes son los
 * de la observación real, no una escala inventada: el límite urbano anda por
 * la magnitud 3-4 según el cielo que haya.
 */
const visibility = (magnitude: number): string => {
  if (magnitude < 1.5) return 'se ve desde cualquier sitio, hasta con la ciudad encendida';
  if (magnitude < 2.5) return 'se ve sin esfuerzo desde una ciudad';
  if (magnitude < 3) return 'desde una ciudad se ve si la noche acompaña';
  return 'a simple vista, desde una ciudad, no se ve';
};

export const dominantStar = (sign: Sign): ConstellationStar =>
  CONSTELLATIONS[sign].stars.find((star) => star.dominant) as ConstellationStar;

/** La magnitud de la más brillante de cada signo. El generador garantiza que la hay. */
const dominantMagnitude = (sign: Sign): number => dominantStar(sign).magnitude as number;

const SIGNS_BY_BRIGHTNESS = (Object.keys(CONSTELLATIONS) as Sign[]).sort(
  (a, b) => dominantMagnitude(a) - dominantMagnitude(b),
);

/** La más luminosa del zodiaco y la más apagada, calculadas y no supuestas. */
const BRIGHTEST = SIGNS_BY_BRIGHTNESS[0];
const FAINTEST = SIGNS_BY_BRIGHTNESS[SIGNS_BY_BRIGHTNESS.length - 1];

export interface ConstellationNote {
  stars: string;
  brightest: string;
  magnitude: string;
  visibility: string;
}

/**
 * La ficha técnica de una constelación (artboard 18, "La constelación").
 *
 * **Es dato, no prosa de catálogo**, y por eso vive en la app y no en el
 * pipeline: cuántas estrellas tiene, cuál es la más brillante y qué magnitud
 * alcanza salen de `constellations.generated.ts`, que a su vez sale de las
 * coordenadas reales. Lo único escrito a mano son las junturas.
 *
 * Es la regla de canon aplicada al texto (BRD §11.2.0): si Cáncer es la más
 * discreta del zodiaco, se dice; fingir que todas lucen igual sería rediseñar
 * el cielo con palabras en vez de con vectores.
 */
export function constellationNote(sign: Sign): ConstellationNote {
  const art = CONSTELLATIONS[sign];
  const star = dominantStar(sign);
  const magnitude = star.magnitude as number;

  const count = SPELLED[art.stars.length] ?? String(art.stars.length);
  const faint = magnitude >= 3;
  let stars = `${count} estrellas${faint ? ' y ninguna brillante' : ''}`;
  // El superlativo se enuncia **sobre la principal**, que es lo que el dato
  // sabe. "La constelación más discreta del zodiaco" es otra medida —cuántas
  // estrellas, cuánto ocupa— y con ella la respuesta cambia: Cáncer tiene
  // cinco estrellas y Piscis veintidós, pero la principal de Piscis (3,6) es
  // más débil que la de Cáncer (3,5). Decir cuál es "la más discreta" sin
  // decir según qué sería elegir una medida por el resultado que da.
  if (sign === FAINTEST) stars += ': ninguna otra del zodiaco tiene una principal más débil';
  else if (sign === BRIGHTEST) stars += ': ninguna otra del zodiaco tiene una principal más brillante';

  return {
    stars: `${stars}.`,
    brightest: star.name as string,
    // Coma decimal: es un número que se lee, no uno que se compara.
    magnitude: `${faint ? 'apenas llega a' : 'brilla a'} magnitud ${magnitude.toFixed(1).replace('.', ',')}`,
    visibility: visibility(magnitude),
  };
}
