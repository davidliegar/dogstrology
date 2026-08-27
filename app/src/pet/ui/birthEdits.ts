import { Birth, type BirthAccuracy, type BirthInput } from '../domain/Birth';
import { spanishOffsetMinutes, spanishZoneFromLongitude, type SpanishZone } from '../domain/spanishTimeZone';

/** Lo que el selector de lugar entrega: las tres cosas juntas, nunca sueltas. */
export interface BirthPlace {
  name: string;
  community: string;
  lat: number;
  lon: number;
  zone: SpanishZone;
}

/**
 * Las transiciones del nacimiento, cada una en una función pura.
 *
 * Viven aquí y no en `Birth` porque llevan dentro una regla **española** (el
 * huso sale del lugar y de la fecha, BRD §15.1 D16) y el value object no tiene
 * por qué saber en qué país estamos. Y viven juntas porque comparten el
 * invariante que de verdad importa: **hora, lugar y huso describen el mismo
 * instante o no describen nada**.
 */

/** El huso que le toca a este nacimiento en esa fecha, o `undefined` sin lugar. */
function offsetFor(birth: BirthInput, date: string): number | undefined {
  if (birth.lon === undefined) return undefined;
  return spanishOffsetMinutes(date, spanishZoneFromLongitude(birth.lon));
}

/**
 * Cambiar la fecha **recalcula el huso** aunque no se toque el lugar: del 14 de
 * diciembre al 14 de julio, Barcelona pasa de UTC+1 a UTC+2. Sin esto quedarían
 * hora y huso describiendo instantes distintos.
 */
export function withBirthDate(birth: Birth, date: string, accuracy: BirthAccuracy): Birth {
  const current = birth.toJSON();
  return Birth.create({ ...current, date, accuracy, tzOffsetMinutes: offsetFor(current, date) });
}

export function withBirthTime(birth: Birth, time: string | undefined): Birth {
  return Birth.create({ ...birth.toJSON(), time });
}

/**
 * El lugar entra entero o no entra. Quitarlo se lleva el huso por delante:
 * sin lugar no hay zona horaria que valga, y dejar el offset viejo sería
 * afirmar algo que ya no se sabe.
 */
export function withBirthPlace(birth: Birth, place: BirthPlace | undefined): Birth {
  const current = birth.toJSON();
  if (!place) {
    return Birth.create({
      ...current,
      lat: undefined,
      lon: undefined,
      placeName: undefined,
      tzOffsetMinutes: undefined,
    });
  }
  return Birth.create({
    ...current,
    lat: place.lat,
    lon: place.lon,
    // El artboard escribe "Barcelona, España" porque su lista era
    // internacional y el país era lo que desambiguaba. Con D16 el país es
    // siempre España, y lo que distingue un municipio de otro con el mismo
    // nombre es la comunidad: ese es el par que se guarda.
    placeName: `${place.name}, ${place.community}`,
    tzOffsetMinutes: spanishOffsetMinutes(current.date, place.zone),
  });
}
