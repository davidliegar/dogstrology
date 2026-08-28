import type { DailyEdition } from './DailyEdition';

/**
 * Cuántos días de diario se guardan en el dispositivo (F12, Bloque 5).
 *
 * Siete, contando el de hoy: es lo que hace que un fin de semana en el monte
 * no deje la app en blanco. Más no serviría de mucho —el diario de hace nueve
 * días no lo abre nadie— y menos convierte cualquier viaje en la pantalla sin
 * red.
 */
export const OFFLINE_DAYS = 7;

export interface readEditionInput {
  date: string;
}

export interface writeEditionInput {
  edition: DailyEdition;
}

export interface pruneEditionsInput {
  /** Se borra todo lo **anterior** a esta fecha; ella se queda. */
  before: string;
}

/**
 * La copia local del diario.
 *
 * Es un puerto y no un detalle del adaptador de red porque es una decisión de
 * producto —siete días de app usable sin cobertura— y no una optimización:
 * cambiar la política se hace aquí, y se ve.
 *
 * **Borra de verdad, con `DELETE`.** El borrado lógico de BRD §12.2 protege
 * los datos del usuario, y esto no lo es: es una copia de contenido público
 * que se puede volver a descargar. Guardar lápidas de ediciones caducadas
 * haría crecer la tabla para siempre a cambio de nada.
 */
export interface DailyCache {
  read(input: readEditionInput): Promise<DailyEdition | null>;
  write(input: writeEditionInput): Promise<void>;
  prune(input: pruneEditionsInput): Promise<void>;
}
