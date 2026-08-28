import { Model } from '@/_kernel/architecture';
import { isIsoDate } from './DailyDate';
import { DailyKey, type DailyAxis } from './DailyKey';
import { Fragment, type FragmentData } from './Fragment';

export interface DailyEditionData {
  date: string;
  fragments: FragmentData[];
}

/**
 * El diario de un día: los 37 fragmentos que el pipeline publica juntos en un
 * fichero (BRD §7.4, capa 2).
 *
 * Es un modelo y no un `Fragment[]` suelto porque la pantalla no quiere
 * fragmentos, quiere respuestas: *el cielo de hoy*, *cómo le toca a su Sol*.
 * Con la lista pelada, cada pantalla tendría que construirse la clave, y
 * construir claves fuera de la gramática es exactamente lo que BRD §7.3.1
 * prohíbe.
 *
 * **Un fragmento que falta no es un error**: el filtro de salud del pipeline
 * bloquea los que no son publicables (en la edición del 25 de agosto fueron 2
 * de 37), así que una edición incompleta es lo normal y no lo excepcional.
 * `sky()` y `forAxis()` devuelven `null` y la tarjeta no se pinta.
 */
export class DailyEdition extends Model {
  private constructor(
    private readonly _date: string,
    private readonly _fragments: Map<string, Fragment>,
  ) {
    super();
  }

  static create({ date, fragments }: { date: string; fragments: Fragment[] }): DailyEdition {
    if (!isIsoDate(date)) {
      throw new Error(`[DailyEdition] date no es una fecha de calendario: ${JSON.stringify(date)}`);
    }
    return new DailyEdition(date, new Map(fragments.map((fragment) => [fragment.key(), fragment])));
  }

  /** Desde el JSON que sirve el CDN o el que guarda la caché. */
  static fromJSON({ date, fragments }: DailyEditionData): DailyEdition {
    return DailyEdition.create({ date, fragments: fragments.map((data) => Fragment.create(data)) });
  }

  date(): string {
    return this._date;
  }

  /** El resumen universal, sin signo: la tarjeta que ve todo el mundo igual. */
  sky(): Fragment | null {
    return this.find(DailyKey.sky({ date: this._date }));
  }

  /** Cómo le toca el día a quien tiene ese eje en ese signo. */
  forAxis(axis: DailyAxis, sign: string): Fragment | null {
    return this.find(DailyKey.ofAxis({ date: this._date, axis, sign }));
  }

  /** Vacía significa "descargada pero sin nada que enseñar", no "sin descargar". */
  isEmpty(): boolean {
    return this._fragments.size === 0;
  }

  fragments(): Fragment[] {
    return [...this._fragments.values()];
  }

  toJSON(): DailyEditionData {
    return { date: this._date, fragments: this.fragments().map((fragment) => fragment.toJSON()) };
  }

  private find(key: DailyKey): Fragment | null {
    return this._fragments.get(key.value()) ?? null;
  }
}
