import type { Migration } from '../types';
import { migrate } from '../migrate';
import { createNodeSqliteAdapter } from '../testing/nodeSqliteAdapter';

describe('migrate — runner (BRD §12.2.7)', () => {
  const syntheticMigrations: Migration[] = [
    { version: 1, description: 'primera', up: async (db) => db.execAsync('CREATE TABLE a (id INTEGER)') },
    { version: 2, description: 'segunda', up: async (db) => db.execAsync('CREATE TABLE b (id INTEGER)') },
  ];

  it('aplica todas las migraciones pendientes, en orden, sobre una base vacía', async () => {
    const db = createNodeSqliteAdapter();
    const version = await migrate(db, syntheticMigrations);
    expect(version).toBe(2);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual(['a', 'b']);
  });

  it('retoma desde una base en una versión anterior sin reaplicar lo ya hecho', async () => {
    const db = createNodeSqliteAdapter();
    // Simula una base que ya está en v1: crea solo la tabla `a` y marca la
    // versión a mano, sin pasar por el runner.
    await db.execAsync('CREATE TABLE a (id INTEGER)');
    await db.execAsync('PRAGMA user_version = 1');

    const version = await migrate(db, syntheticMigrations);
    expect(version).toBe(2);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual(['a', 'b']);
  });

  it('es idempotente: volver a migrar una base al día no falla ni reaplica', async () => {
    const db = createNodeSqliteAdapter();
    await migrate(db, syntheticMigrations);
    await expect(migrate(db, syntheticMigrations)).resolves.toBe(2);
  });

  it('si una migración falla, no deja `user_version` avanzada (transacción por migración)', async () => {
    const db = createNodeSqliteAdapter();
    const withOneBroken: Migration[] = [
      syntheticMigrations[0],
      { version: 2, description: 'rota', up: async (db) => db.execAsync('CREATE TABLE b (') },
    ];
    await expect(migrate(db, withOneBroken)).rejects.toThrow();

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(1);
  });
});

describe('migrate — esquema real', () => {
  it('crea la tabla `pets` desde una base vacía', async () => {
    const db = createNodeSqliteAdapter();
    const version = await migrate(db);
    expect(version).toBeGreaterThanOrEqual(1);

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(version);

    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(pets)');
    const names = columns.map((c) => c.name);
    expect(names).toEqual(
      expect.arrayContaining(['id', 'name', 'species', 'birth_date', 'created_at', 'updated_at', 'deleted_at']),
    );
  });
});
