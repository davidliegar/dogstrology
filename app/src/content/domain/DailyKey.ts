import { Model } from '@/_kernel/architecture';
import { isIsoDate } from './DailyDate';

/**
 * Los tres ejes del diario, tal y como los nombra `pipeline/src/labels.mjs`
 * (`AXES`). Son identificadores y viajan dentro de la clave; lo que el usuario
 * lee ("Su Sol") vive en la capa de UI.
 */
export const DAILY_AXES = ['sun', 'moon', 'ascendant'] as const;
export type DailyAxis = (typeof DAILY_AXES)[number];

/** El vocabulario de un signo: minúsculas y `_`, como en `ContentKey`. */
const TOKEN = /^[a-z][a-z0-9_]*$/;

/**
 * Lanza siempre, igual que `ContentKey` y por lo mismo: una clave mal formada
 * no da error, da una tarjeta vacía que nadie reporta. Ver el porqué largo en
 * `ContentKey`.
 */
const token = (field: string, value: string): string => {
  if (typeof value !== 'string' || !TOKEN.test(value)) {
    throw new Error(`[DailyKey] ${field} no es un identificador del diario: ${JSON.stringify(value)}`);
  }
  return value;
};

const date = (value: string): string => {
  if (!isIsoDate(value)) {
    throw new Error(`[DailyKey] date no es una fecha de calendario: ${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * La clave de un fragmento del diario (BRD §7.4, capa 2).
 *
 * Es hermana de `ContentKey` y no una familia suya, porque no son la misma
 * cosa: el catálogo es inmutable y viaja en el binario, y el diario se publica
 * cada día y se descarga. Comparten la forma de los fragmentos —el mismo
 * `schema.mjs` los produce— y nada más.
 *
 * Dos formas, que son las que escribe `pipeline/src/dailyFragments.mjs`:
 *
 * - `date=2026-08-25` — el cielo del día, el mismo para todo el mundo
 * - `date=2026-08-25;axis=sun;sign=sagittarius` — cómo le toca a quien tiene
 *   ese eje en ese signo
 */
export class DailyKey extends Model {
  private constructor(private readonly _value: string) {
    super();
  }

  /** El cielo del día: el único fragmento que no depende de ninguna carta. */
  static sky({ date: day }: { date: string }): DailyKey {
    return new DailyKey(`date=${date(day)}`);
  }

  /**
   * `sign` entra como `string` y no como `Sign` a propósito: el vocabulario de
   * los signos es de `chart/domain`, y el contenido no tiene por qué depender
   * de él para poder indexar. El guardia de arriba es lo que protege, no el
   * tipo — ver `ContentKey`.
   */
  static ofAxis({ date: day, axis, sign }: { date: string; axis: DailyAxis; sign: string }): DailyKey {
    return new DailyKey(
      `date=${date(day)};axis=${token('axis', axis)};sign=${token('sign', sign)}`,
    );
  }

  value(): string {
    return this._value;
  }
}
