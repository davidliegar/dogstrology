import { z } from 'zod';

import { Model } from '@/_kernel/architecture';

/** `gotcha_day`: sin fecha de nacimiento real, solo el día en que llegó a
 * casa. `inferred`: estimación del dueño o de un veterinario. */
export const BIRTH_ACCURACIES = ['exact', 'approx', 'gotcha_day', 'inferred'] as const;
export type BirthAccuracy = (typeof BIRTH_ACCURACIES)[number];

/**
 * Una fecha del calendario, no solo una cadena con la forma correcta.
 *
 * El regex por sí solo deja pasar `2025-02-31`, y `new Date()` la desplaza a
 * marzo sin avisar: la carta saldría de un día que no existe y nadie se
 * enteraría. Se comprueba reconstruyendo la fecha en UTC y exigiendo que los
 * tres componentes sobrevivan al viaje de ida y vuelta.
 */
const isCalendarDate = (value: string): boolean => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const BirthValidation = z.object({
  date: z
    .string({ error: (iss) => (iss.input === undefined ? '[Birth] date es obligatoria' : undefined) })
    .regex(/^\d{4}-\d{2}-\d{2}$/, '[Birth] date debe ser YYYY-MM-DD')
    .refine(isCalendarDate, '[Birth] date no existe en el calendario'),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, '[Birth] time debe ser HH:mm')
    .optional(),
  tzOffsetMinutes: z.number().optional(),
  lat: z.number().min(-90, '[Birth] lat fuera de rango').max(90, '[Birth] lat fuera de rango').optional(),
  lon: z.number().min(-180, '[Birth] lon fuera de rango').max(180, '[Birth] lon fuera de rango').optional(),
  /**
   * Cómo se llama el sitio: "Barcelona, España". No entra en ningún cálculo —
   * el motor solo usa lat/lon— y existe para que la coordenada sea
   * **verificable**: `41,39 · 2,17` no lo comprueba nadie, y hay cuatro
   * Barcelonas. Lo escribe quien elige el lugar, nunca se teclea a mano: un
   * nombre que no concuerde con sus coordenadas parece una confirmación y no
   * lo es. Nunca la dirección — solo el pueblo o la ciudad.
   */
  placeName: z.string().min(1, '[Birth] placeName no puede estar vacío').optional(),
  accuracy: z.enum(BIRTH_ACCURACIES, {
    error: (iss) => (iss.input === undefined ? '[Birth] accuracy es obligatoria' : '[Birth] accuracy inválida'),
  }),
})
  /**
   * Con hora **y** lugar, el huso es obligatorio.
   *
   * Es la combinación que produce Ascendente y casas, y ahí un huso equivocado
   * cuesta **15° por cada hora**: media hora de signo en España, un signo
   * entero en México. Y sin fallar — la carta sale entera, plausible y
   * equivocada. El huso se resuelve desde el lugar y la fecha (el 14 de
   * diciembre Barcelona estaba en horario de invierno), nunca desde el reloj
   * del móvil, que puede estar en otro país.
   *
   * Con hora y **sin** lugar sí se admite sin huso, y es un estado diseñado
   * (artboard E): no hay Ascendente que estropear, la confianza se queda en
   * `no_location` y la app dice qué falta en vez de asumir una zona horaria.
   * Guardar solo la hora mejora la Luna y no miente sobre nada.
   */
  .refine(
    (birth) =>
      birth.time === undefined ||
      birth.lat === undefined ||
      birth.lon === undefined ||
      birth.tzOffsetMinutes !== undefined,
    {
      error: '[Birth] una hora con lugar necesita su tzOffsetMinutes',
      path: ['tzOffsetMinutes'],
    },
  );

export type BirthInput = z.infer<typeof BirthValidation>;

/**
 * Value object del nacimiento de una mascota (BRD §12.1 `Pet.birth`).
 *
 * Dice **qué datos hay** (`hasTime()`, `hasLocation()`), nunca qué carta sale
 * de ellos: el grado de confianza de la carta (BRD §12.3) lo decide quien la
 * calcula y viaja en `NatalChart.confidence()`. Tenerlo también aquí era una
 * segunda copia de la misma regla de negocio, condenada a divergir.
 */
export class Birth extends Model {
  constructor(
    private readonly _date: string,
    private readonly _time: string | undefined,
    private readonly _tzOffsetMinutes: number | undefined,
    private readonly _lat: number | undefined,
    private readonly _lon: number | undefined,
    private readonly _placeName: string | undefined,
    private readonly _accuracy: BirthAccuracy,
  ) {
    super();
  }

  static create(input: BirthInput): Birth {
    BirthValidation.parse(input);
    return new Birth(
      input.date,
      input.time,
      input.tzOffsetMinutes,
      input.lat,
      input.lon,
      input.placeName,
      input.accuracy,
    );
  }

  static createOrNull(input: BirthInput): Birth | null {
    try {
      return Birth.create(input);
    } catch {
      return null;
    }
  }

  static fromJSON(json: ReturnType<Birth['toJSON']>): Birth {
    return Birth.create(json);
  }

  date(): string {
    return this._date;
  }

  time(): string | undefined {
    return this._time;
  }

  /** Minutos respecto a UTC. Garantizado presente siempre que haya hora. */

  tzOffsetMinutes(): number | undefined {
    return this._tzOffsetMinutes;
  }

  lat(): number | undefined {
    return this._lat;
  }

  lon(): number | undefined {
    return this._lon;
  }

  /** El nombre del sitio, si quien lo eligió lo trajo. Nunca la dirección. */
  placeName(): string | undefined {
    return this._placeName;
  }

  accuracy(): BirthAccuracy {
    return this._accuracy;
  }

  hasTime(): boolean {
    return this._time !== undefined;
  }

  hasLocation(): boolean {
    return this._lat !== undefined && this._lon !== undefined;
  }

  /**
   * **El cuándo y el dónde, en una cadena estable.** Dos nacimientos con el
   * mismo `moment()` producen exactamente la misma carta: son los cinco campos
   * que `CalculateNatalChartUseCase` le pasa al motor, y ninguno más.
   *
   * Es una afirmación del dominio antes que una clave de caché, y por eso vive
   * aquí y no en la capa que cachea. Lo que quedaba fuera —el nombre del
   * lugar, la exactitud de la fecha— no entra en el cálculo: el motor no los
   * ve. Si algún día el cálculo mirase un sexto campo, este método tiene que
   * crecer con él, y el comentario de arriba es el aviso.
   *
   * `''` para lo ausente y no `undefined`: sin hora ni lugar la cadena tiene
   * que seguir siendo comparable, y `'2021-06-14||||'` lo es.
   */
  moment(): string {
    return [this._date, this._time, this._tzOffsetMinutes, this._lat, this._lon]
      .map((value) => value ?? '')
      .join('|');
  }

  toJSON() {
    return {
      date: this._date,
      time: this._time,
      tzOffsetMinutes: this._tzOffsetMinutes,
      lat: this._lat,
      lon: this._lon,
      placeName: this._placeName,
      accuracy: this._accuracy,
    };
  }
}
