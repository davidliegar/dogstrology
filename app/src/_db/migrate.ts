import { MIGRATIONS } from './migrations';
import type { Migration, SqlDatabase } from './types';

/**
 * Aplica las migraciones pendientes en orden, cada una en su propia
 * transacción, avanzando `PRAGMA user_version` al terminar cada una. Si el
 * proceso se corta a mitad, la siguiente ejecución retoma desde la última
 * versión confirmada, no desde cero.
 *
 * `migrations` es inyectable (por defecto, las reales) para poder probar el
 * runner con una lista sintética sin depender del esquema de verdad.
 */
export async function migrate(db: SqlDatabase, migrations: Migration[] = MIGRATIONS): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  const pending = migrations
    .filter((m) => m.version > version)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    version = migration.version;
  }

  return version;
}
