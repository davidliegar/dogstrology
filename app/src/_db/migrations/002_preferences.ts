import type { Migration } from '../types';

/**
 * v2: los ajustes del usuario, que la v1 ya dejaba anunciados.
 *
 * **Una sola fila, y lo dice el esquema**: `CHECK (id = 1)` convierte en error
 * de la base lo que si no sería disciplina de los repositorios. El `1` no es
 * un identificador de entidad —esos son UUIDv7 y se generan en el dispositivo
 * (BRD §12.2.1)— sino la marca de que aquí solo cabe una fila.
 *
 * No lleva borrado lógico: unos ajustes no se borran, se cambian. Y no lleva
 * `synced_at` porque no se sincronizan: la preferencia es de este móvil.
 */
export const migration002Preferences: Migration = {
  version: 2,
  description: 'Ajustes del usuario',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE preferences (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        house_system TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  },
};
