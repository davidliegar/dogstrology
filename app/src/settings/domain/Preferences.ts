import { z } from 'zod';

import { Model } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { HouseSystem } from '@/chart/domain/NatalChart';

/**
 * Los sistemas que se **eligen**, que no son los tres que el motor sabe
 * calcular (BRD D7, §12.3): signos enteros por defecto y Placidus para quien
 * cruza datos con astro.com. `equal` no está aquí a propósito — no es una
 * opción, es el fallback automático del motor por encima de los 66° de
 * latitud, donde Placidus degenera (§14 R10). Ofrecerlo sería pedirle al
 * usuario que elija una degradación.
 */
export const SELECTABLE_HOUSE_SYSTEMS = ['whole_sign', 'placidus'] as const satisfies readonly HouseSystem[];

export type SelectableHouseSystem = (typeof SELECTABLE_HOUSE_SYSTEMS)[number];

/**
 * Signos enteros. El BRD lo razona (§12.3): cada casa **es** un signo, así que
 * "la Luna está en la casa V" es inequívoco, no hay casas de 40° que explicar
 * y no degenera nunca en latitud alta.
 */
export const DEFAULT_HOUSE_SYSTEM: SelectableHouseSystem = 'whole_sign';

const schema = z.object({
  houseSystem: z.enum(SELECTABLE_HOUSE_SYSTEMS),
});

export interface PreferencesData {
  houseSystem: SelectableHouseSystem;
}

/**
 * Los ajustes del usuario. Uno solo por ahora —el sistema de casas—, pero es
 * el sitio donde van a caer los avisos cuando existan.
 *
 * **No es la carta ni la mascota**: es una elección sobre cómo se calcula, y
 * por eso vive en su propio contexto y no colgando de `chart/`. Lo único que
 * toma prestado de allí es el vocabulario de `HouseSystem`, que es el que el
 * motor entiende — duplicarlo aquí sería tener dos listas que pueden divergir
 * sin que nada lo note.
 */
export class Preferences extends Model {
  static create(data: PreferencesData): Preferences {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw DomainError.withCodes(ErrorCode.INVALID_PREFERENCES);
    return new Preferences(parsed.data.houseSystem);
  }

  /** Lo que ve quien nunca ha entrado en Ajustes. */
  static default(): Preferences {
    return new Preferences(DEFAULT_HOUSE_SYSTEM);
  }

  /**
   * Los mismos ajustes con otro sistema de casas. Devuelve uno nuevo en vez de
   * mutar: un modelo que cambia por debajo es un modelo del que nadie puede
   * fiarse para comparar.
   */
  withHouseSystem(houseSystem: SelectableHouseSystem): Preferences {
    return Preferences.create({ houseSystem });
  }

  constructor(private readonly _houseSystem: SelectableHouseSystem) {
    super();
  }

  houseSystem(): SelectableHouseSystem {
    return this._houseSystem;
  }

  toData(): PreferencesData {
    return { houseSystem: this._houseSystem };
  }
}
