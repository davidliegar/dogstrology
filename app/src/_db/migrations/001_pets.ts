import type { Migration } from '../types';

/**
 * v1 del esquema (BRD §12.1, §12.2.7). Solo `pets`: es la única tabla que
 * necesita F1-F3. `diary_entries`, `preferences` y `purchases` se añaden en
 * migraciones futuras cuando el bloque que las usa arranque — no antes.
 *
 * Columnas `updated_at` / `deleted_at` / `synced_at` en epoch ms (borrado
 * lógico, BRD §12.2.2: nunca `DELETE` físico). `id` es el UUIDv7 generado en
 * dispositivo (BRD §12.2.1) — nunca autoincremental.
 */
export const migration001Pets: Migration = {
  version: 1,
  description: 'Tabla de mascotas',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE pets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        photo_kind TEXT,
        photo_rel_path TEXT,
        photo_url TEXT,
        breed_id TEXT,
        sex TEXT,
        neutered INTEGER,
        birth_date TEXT NOT NULL,
        birth_time TEXT,
        birth_tz_offset_minutes INTEGER,
        birth_lat REAL,
        birth_lon REAL,
        birth_accuracy TEXT NOT NULL,
        adoption_date TEXT,
        created_at TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        synced_at INTEGER
      );
      CREATE INDEX idx_pets_deleted_at ON pets(deleted_at);
    `);
  },
};
