import type { Migration } from '../types';
import { migration001Pets } from './001_pets';

/**
 * Ordenadas y numeradas (BRD §12.2.7). Añadir una migración es añadir un
 * fichero `NNN_description.ts` y una línea aquí — nunca editar una ya
 * publicada.
 */
export const MIGRATIONS: Migration[] = [migration001Pets];
