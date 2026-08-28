import type { Migration } from '../types';

/**
 * v3: la copia local del diario (F12) — siete días de app usable sin
 * cobertura.
 *
 * **La edición entera se guarda como un JSON en una columna**, y no
 * desmenuzada en una fila por fragmento. Se lee siempre completa —la pantalla
 * de Hoy pide el cielo y los tres ejes de la misma edición— y no se consulta
 * nunca por campo: partirla en 37 filas añadiría un índice, un `JOIN` y una
 * forma más de que el esquema y `schema.mjs` dejen de coincidir, a cambio de
 * nada. La regla de BRD §12.2 que prohíbe los BLOB es sobre **ficheros de
 * medios**, que sí se guardan por referencia; esto es texto y es contenido
 * público.
 *
 * **Sin `deleted_at`.** El borrado lógico protege lo que el usuario ha escrito
 * y no se puede recuperar; una edición caducada se vuelve a descargar. Aquí el
 * `DELETE` es físico a propósito — ver `content/domain/DailyCache`.
 *
 * `fetched_at` no caduca nada: la edición de un día no cambia una vez
 * publicada. Está para poder mirar, el día que haga falta, cuándo se bajó cada
 * una.
 */
export const migration003DailyEditions: Migration = {
  version: 3,
  description: 'Caché local del diario',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE daily_editions (
        date TEXT PRIMARY KEY,
        fragments TEXT NOT NULL,
        fetched_at INTEGER NOT NULL
      );
    `);
  },
};
