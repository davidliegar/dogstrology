import { migrate } from '@/_db/migrate';
import { createNodeSqliteAdapter } from '@/_db/testing/nodeSqliteAdapter';
import type { SqlDatabase } from '@/_db/types';
import { SqlitePetRepository } from '@/pet/infrastructure/SqlitePetRepository';
import { migration001Pets } from '../001_pets';
import { migration002EnglishEnums } from '../002_english_enums';

let counter = 0;

/** Una mascota tal como la escribía la app **antes** del cambio de idioma. */
async function insertLegacyPet(db: SqlDatabase, overrides: { species?: string; sex?: string | null } = {}) {
  counter += 1;
  await db.runAsync(
    `INSERT INTO pets (id, name, species, sex, birth_date, birth_accuracy, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `01996a3e-7e2a-7000-8000-00000000000${counter}`,
      'Baloo',
      overrides.species ?? 'perro',
      'sex' in overrides ? overrides.sex : 'macho',
      '2025-12-14',
      'exact',
      new Date().toISOString(),
      Date.now(),
    ],
  );
}

/** Base con solo la v1 aplicada: el estado del dispositivo antes de actualizar. */
async function databaseAtV1(): Promise<SqlDatabase> {
  const db = createNodeSqliteAdapter();
  await migration001Pets.up(db);
  await db.execAsync('PRAGMA user_version = 1');
  return db;
}

const petsOf = (db: SqlDatabase) => SqlitePetRepository.create({ db: async () => db }).list();

describe('migración 002 — valores de enum en inglés', () => {
  it('sin ella, una fila vieja rompe la lista entera', async () => {
    // Es el fallo que sacó la app a su pantalla de error: `Pet.create()` valida
    // con Zod al leer, y `species = 'perro'` ya no está en el enum.
    const db = await databaseAtV1();
    await insertLegacyPet(db);

    await expect(petsOf(db)).rejects.toThrow();
  });

  it('traduce species y sex, y la mascota vuelve a leerse', async () => {
    const db = await databaseAtV1();
    await insertLegacyPet(db);

    await migrate(db);

    const [pet] = await petsOf(db);
    expect(pet.species()).toBe('dog');
    expect(pet.sex()).toBe('male');
    expect(pet.name()).toBe('Baloo');
  });

  it('traduce también gato y hembra', async () => {
    const db = await databaseAtV1();
    await insertLegacyPet(db, { species: 'gato', sex: 'hembra' });

    await migrate(db);

    const [pet] = await petsOf(db);
    expect(pet.species()).toBe('cat');
    expect(pet.sex()).toBe('female');
  });

  it('deja en paz el sexo ausente, que es lo que crea el onboarding de F1', async () => {
    // F1 solo pide nombre y fecha: `sex` queda a NULL y debe seguir a NULL.
    const db = await databaseAtV1();
    await insertLegacyPet(db, { sex: null });

    await migrate(db);

    const [pet] = await petsOf(db);
    expect(pet.sex()).toBeUndefined();
  });

  it('es idempotente: reaplicarla sobre valores ya traducidos no cambia nada', async () => {
    const db = await databaseAtV1();
    await insertLegacyPet(db);

    await migrate(db);
    await migration002EnglishEnums.up(db);

    const [pet] = await petsOf(db);
    expect(pet.species()).toBe('dog');
    expect(pet.sex()).toBe('male');
  });

  it('alcanza a las filas borradas lógicamente', async () => {
    // El borrado es lógico (BRD §12.2.2): la fila sigue ahí y hay que poder
    // leerla, así que también tiene que traducirse.
    const db = await databaseAtV1();
    await insertLegacyPet(db);
    await db.runAsync('UPDATE pets SET deleted_at = ?', [Date.now()]);

    await migrate(db);

    const rows = await db.getAllAsync<{ species: string; sex: string | null }>('SELECT species, sex FROM pets');
    expect(rows[0].species).toBe('dog');
    expect(rows[0].sex).toBe('male');
  });
});
