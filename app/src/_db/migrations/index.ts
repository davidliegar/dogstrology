import type { Migration } from '../types';
import { migration001Pets } from './001_pets';
import { migration002Preferences } from './002_preferences';
import { migration003DailyEditions } from './003_daily_editions';

/**
 * Ordenadas y numeradas (BRD §12.2.7). Añadir una migración es añadir un
 * fichero `NNN_description.ts` y una línea aquí.
 *
 * **Nunca se edita ni se borra una migración publicada** — pero "publicada"
 * significa que existe en un dispositivo que no es el tuyo. Mientras eso no
 * pase, el esquema se puede colapsar en una sola v1 y reinstalar, que es más
 * limpio que arrastrar migraciones de correcciones del propio desarrollo. La
 * regla entra en vigor con el primer build que salga de esta máquina; a partir
 * de ahí, un cambio de esquema **o de valores** solo se arregla añadiendo.
 */
export const MIGRATIONS: Migration[] = [
  migration001Pets,
  migration002Preferences,
  migration003DailyEditions,
];
