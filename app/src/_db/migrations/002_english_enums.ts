import type { Migration } from '../types';

/**
 * v2 — traduce a inglés los valores de enum que quedaron guardados en español.
 *
 * El 2026-08-26 el vocabulario del dominio pasó a identificadores en inglés
 * (`perro`→`dog`, `macho`→`male`). Los **valores ya escritos en la base no se
 * enteran de un cambio de tipos**: `Pet.create()` los valida con Zod al leerlos
 * y una fila con `species = 'perro'` deja de construirse, así que la lista de
 * mascotas falla entera y la app arranca en su pantalla de error.
 *
 * Se decidió que el cambio era barato "porque no hay consumidores", y es cierto
 * para el contenido publicado — pero **no para una base de datos que ya existe
 * en un dispositivo**, aunque sea el de desarrollo. Un `UPDATE` es más barato
 * que reinstalar, y es lo que habría que hacer igualmente el día que hubiera
 * usuarios de verdad: por eso vive aquí y no en un apaño manual.
 *
 * Solo `species` y `sex`. `birth_accuracy` (`exact`/`approx`/`gotcha_day`/
 * `inferred`) y `photo_kind` (`local`/`remote`) ya estaban en inglés desde la
 * v1 y no se tocan.
 *
 * Es idempotente: un `UPDATE ... WHERE` sobre valores que ya están traducidos
 * no encuentra filas. Y alcanza también a las borradas lógicamente
 * (`deleted_at IS NOT NULL`), que siguen siendo filas que hay que poder leer.
 */
export const migration002EnglishEnums: Migration = {
  version: 2,
  description: 'Valores de enum en inglés (species, sex)',
  async up(db) {
    await db.execAsync(`
      UPDATE pets SET species = 'dog'    WHERE species = 'perro';
      UPDATE pets SET species = 'cat'    WHERE species = 'gato';
      UPDATE pets SET sex     = 'male'   WHERE sex     = 'macho';
      UPDATE pets SET sex     = 'female' WHERE sex     = 'hembra';
    `);
  },
};
