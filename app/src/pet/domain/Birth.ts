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
  accuracy: z.enum(BIRTH_ACCURACIES, {
    error: (iss) => (iss.input === undefined ? '[Birth] accuracy es obligatoria' : '[Birth] accuracy inválida'),
  }),
});

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
    private readonly _accuracy: BirthAccuracy,
  ) {
    super();
  }

  static create(input: BirthInput): Birth {
    BirthValidation.parse(input);
    return new Birth(input.date, input.time, input.tzOffsetMinutes, input.lat, input.lon, input.accuracy);
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

  tzOffsetMinutes(): number | undefined {
    return this._tzOffsetMinutes;
  }

  lat(): number | undefined {
    return this._lat;
  }

  lon(): number | undefined {
    return this._lon;
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

  toJSON() {
    return {
      date: this._date,
      time: this._time,
      tzOffsetMinutes: this._tzOffsetMinutes,
      lat: this._lat,
      lon: this._lon,
      accuracy: this._accuracy,
    };
  }
}
