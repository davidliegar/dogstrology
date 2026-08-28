import { migrate } from '@/_db/migrate';
import { createNodeSqliteAdapter } from '@/_db/testing/nodeSqliteAdapter';
import { Preferences } from '../../domain/Preferences';
import { SqlitePreferencesRepository } from '../SqlitePreferencesRepository';

async function createRepository() {
  const db = createNodeSqliteAdapter();
  await migrate(db);
  return { db, repo: SqlitePreferencesRepository.create({ db: async () => db }) };
}

describe('SqlitePreferencesRepository', () => {
  it('sin fila, los ajustes por defecto — y sigue sin haber fila', async () => {
    const { db, repo } = await createRepository();

    expect((await repo.get()).houseSystem()).toBe('whole_sign');

    // Leer no puede escribir: si lo hiciera, se perdería para siempre la
    // respuesta a "¿ha elegido el usuario alguna vez?".
    const rows = await db.getAllAsync('SELECT id FROM preferences');
    expect(rows).toHaveLength(0);
  });

  it('save() + get() hacen round-trip', async () => {
    const { repo } = await createRepository();

    await repo.save({ preferences: Preferences.create({ houseSystem: 'placidus' }) });

    expect((await repo.get()).houseSystem()).toBe('placidus');
  });

  it('guardar dos veces no crea una segunda fila', async () => {
    const { db, repo } = await createRepository();

    await repo.save({ preferences: Preferences.create({ houseSystem: 'placidus' }) });
    await repo.save({ preferences: Preferences.create({ houseSystem: 'whole_sign' }) });

    const rows = await db.getAllAsync('SELECT id FROM preferences');
    expect(rows).toHaveLength(1);
    expect((await repo.get()).houseSystem()).toBe('whole_sign');
  });

  it('el esquema impide una segunda fila aunque alguien la intente', async () => {
    const { db } = await createRepository();

    await expect(
      db.runAsync('INSERT INTO preferences (id, house_system, updated_at) VALUES (?, ?, ?)', [2, 'placidus', 0]),
    ).rejects.toThrow();
  });
});
