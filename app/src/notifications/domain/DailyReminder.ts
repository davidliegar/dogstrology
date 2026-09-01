import { z } from 'zod';

import { Model } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';

/**
 * Las nueve de la mañana. El diario se genera con el cron de las 03:00 UTC
 * (`generate-daily.yml`), así que a esta hora lleva publicado varias horas en
 * cualquier huso de España — el aviso nunca llega antes que la lectura de la
 * que habla.
 */
export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;

const schema = z.object({
  enabled: z.boolean(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export interface DailyReminderData {
  enabled: boolean;
  hour: number;
  minute: number;
}

/**
 * El aviso diario (F8, BRD §8.1): si está encendido y a qué hora.
 *
 * **Es una preferencia, no un permiso.** Que el usuario quiera el aviso y que
 * el sistema deje enviarlo son dos hechos distintos y se guardan en sitios
 * distintos: esto vive en la base, el permiso vive en el sistema operativo y se
 * pregunta cada vez (`NotificationScheduler.permission()`). Mezclarlos haría
 * que revocar el permiso desde los ajustes de Android dejara aquí un `true`
 * mintiendo para siempre.
 *
 * **No guarda zona horaria.** El disparador diario de `expo-notifications` es
 * de reloj de pared: «a las 9:00» significa las nueve de donde esté el móvil,
 * y si el usuario se va de viaje el aviso le sigue. Es lo que se quiere — a
 * diferencia de la hora de nacimiento, que sí lleva su `tzOffsetMinutes`
 * porque es un instante fijo del pasado.
 */
export class DailyReminder extends Model {
  static create(data: DailyReminderData): DailyReminder {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw DomainError.withCodes(ErrorCode.INVALID_PREFERENCES);
    return new DailyReminder(parsed.data.enabled, parsed.data.hour, parsed.data.minute);
  }

  /** Apagado, y a las nueve. Nadie recibe un aviso que no ha pedido. */
  static default(): DailyReminder {
    return new DailyReminder(false, DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE);
  }

  constructor(
    private readonly _enabled: boolean,
    private readonly _hour: number,
    private readonly _minute: number,
  ) {
    super();
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  hour(): number {
    return this._hour;
  }

  minute(): number {
    return this._minute;
  }

  /**
   * El mismo aviso, encendido o apagado. **Apagarlo no olvida la hora**: quien
   * lo vuelve a encender la semana siguiente encuentra la que había elegido, y
   * no las nueve otra vez.
   */
  switched(enabled: boolean): DailyReminder {
    return DailyReminder.create({ enabled, hour: this._hour, minute: this._minute });
  }

  /** El mismo aviso a otra hora. Encender y cambiar la hora son dos gestos. */
  at(hour: number, minute: number): DailyReminder {
    return DailyReminder.create({ enabled: this._enabled, hour, minute });
  }

  toData(): DailyReminderData {
    return { enabled: this._enabled, hour: this._hour, minute: this._minute };
  }
}
