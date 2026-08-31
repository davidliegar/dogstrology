import { MONTHS } from '@/_ui/components/DateFields';
import type { Pet } from '../domain/Pet';
import { BREEDS } from './breeds';
import { SEX_LABELS } from './labels';

/**
 * `2025-12-14` → `14 de diciembre de 2025`.
 *
 * La fecha se parte a mano en vez de pasarla por `new Date()`: `YYYY-MM-DD` se
 * lee como medianoche **UTC**, y formatearla con los métodos locales adelanta
 * o atrasa un día en media Europa. Es el mismo cuidado que se toma
 * `Pet.ageInYears()`, y por la misma razón.
 *
 * Los nombres de mes salen de `MONTHS` — la misma tabla que usa el selector de
 * F1. Tener aquí una segunda lista sería la copia destinada a divergir.
 */
export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

/** `41,39 · 2,17` — coma decimal, que es como se escribe un número en español. */
export function formatCoordinates(lat: number, lon: number): string {
  const coordinate = (value: number) => value.toFixed(2).replace('.', ',');
  return `${coordinate(lat)} · ${coordinate(lon)}`;
}

/**
 * Hasta cuándo la edad se dice en meses (artboard 32): hasta los dos años.
 * Un cachorro de ocho meses y uno de dieciséis son perros distintos, y en años
 * los dos serían «0», que no dice nada.
 */
const MONTHS_UNTIL = 24;

/**
 * `8 meses`, `15 meses`, `7 años`. La regla del artboard 32, y vive aquí
 * porque es cómo se cuenta y no qué se cuenta: el dominio da los dos números.
 *
 * Por debajo del mes se dice así en vez de «0 meses», que es lo mismo que «0
 * años» y no dice nada. Es la única frase de las tres que el artboard no
 * dibuja, porque su ejemplo más joven tiene ocho meses.
 */
export function formatAge(pet: Pet, reference?: Date): string {
  const months = pet.ageInMonths(reference);
  if (months === 0) return 'menos de un mes';
  if (months < MONTHS_UNTIL) return months === 1 ? '1 mes' : `${months} meses`;
  return `${pet.ageInYears(reference)} años`;
}

/**
 * La segunda línea de la lista de mascotas: `Perro de agua español · 8 meses`.
 *
 * **Raza y edad, en ese orden**, que es lo que identifica a un perro cuando
 * son cinco y dos son mestizas medianas. Sin raza queda la edad sola: la edad
 * siempre se sabe —la fecha es obligatoria— y la raza no.
 */
export function formatBreedAndAge(pet: Pet, reference?: Date): string {
  return [breedLabel(pet.breedId()), formatAge(pet, reference)].filter(Boolean).join(' · ');
}

/** La etiqueta de la raza, o `undefined` si la mascota no tiene raza puesta. */
export function breedLabel(breedId: string | undefined): string | undefined {
  if (breedId === undefined) return undefined;
  return BREEDS.find((breed) => breed.id === breedId)?.label;
}

/**
 * El subtítulo del bloque de identidad: `Perro de agua español · macho`.
 *
 * Se compone con lo que haya, en ese orden, y devuelve `undefined` cuando no
 * hay ninguna de las dos cosas — una mascota recién creada en el onboarding de
 * F1 no tiene ni raza ni sexo, y ahí la línea no se pinta en vez de pintarse
 * vacía.
 *
 * El sexo va en minúscula porque en el subtítulo es aposición, no título;
 * `SEX_LABELS` sigue siendo la única fuente del texto.
 */
export function formatBreedAndSex(pet: Pet): string | undefined {
  const sex = pet.sex();
  const parts = [breedLabel(pet.breedId()), sex && SEX_LABELS[sex].toLowerCase()].filter(Boolean);
  return parts.length === 0 ? undefined : parts.join(' · ');
}

export interface ProfileDates {
  birth: { label: string; value: string };
  /**
   * El bloque del día de adopción, o `null` cuando no toca pintarlo.
   * `value` sin definir es "Sin fecha": es opcional de verdad y el perfil no
   * lo pide.
   */
  adoption: { value: string | undefined } | null;
}

/**
 * Las fechas del perfil: la de nacimiento, dentro del bloque de nacimiento, y
 * la de adopción, debajo y sin caja porque no entra en la carta.
 *
 * El día de adopción **desaparece** cuando la fecha de nacimiento tiene
 * `accuracy: 'gotcha_day'`, y ahí está el matiz que no se ve desde la
 * pantalla: `Birth.date` es obligatorio, así que "solo sé el día que llegó a
 * casa" no puede ser `adoptionDate` sin fecha de nacimiento — es esa fecha
 * haciendo de sustituta. Pintar las dos filas sería repetir el mismo día e
 * invitar a editar una y no la otra.
 */
export function profileDates(pet: Pet): ProfileDates {
  const birth = pet.birth();
  const isGotchaDay = birth.accuracy() === 'gotcha_day';

  return {
    birth: { label: 'Fecha', value: formatLongDate(birth.date()) },
    adoption: isGotchaDay
      ? null
      : { value: pet.adoptionDate() && formatLongDate(pet.adoptionDate() as string) },
  };
}
