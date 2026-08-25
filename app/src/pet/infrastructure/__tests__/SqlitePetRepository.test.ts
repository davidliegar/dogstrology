import { migrate } from '@/_db/migrate';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { createNodeSqliteAdapter } from '@/_db/testing/nodeSqliteAdapter';
import { Pet } from '../../domain/Pet';
import { Birth } from '../../domain/Birth';
import { MediaReference } from '../../domain/MediaReference';
import { SqlitePetRepository } from '../SqlitePetRepository';

function baloo(overrides: { id?: string; name?: string } = {}) {
  return Pet.createNew({
    id: overrides.id ?? '01996a3e-7e2a-7000-8000-000000000000',
    name: overrides.name ?? 'Baloo',
    species: 'perro',
    photo: MediaReference.local({ relativePath: 'pets/baloo.jpg' }),
    breedId: 'perro-de-agua-espanol',
    sex: 'macho',
    neutered: true,
    birth: Birth.create({
      date: '2025-12-14',
      time: '09:15',
      tzOffsetMinutes: 60,
      lat: 41.3874,
      lon: 2.1686,
      accuracy: 'exact',
    }),
  });
}

async function createRepository() {
  const db = createNodeSqliteAdapter();
  await migrate(db);
  // El repositorio recibe un proveedor, no la base: se construye síncrono y
  // abre en la primera consulta (igual que en el arranque real de la app).
  return { db, repo: SqlitePetRepository.create({ db: async () => db }) };
}

describe('SqlitePetRepository (BRD §12.2.3)', () => {
  it('save() + get() hacen un round-trip completo', async () => {
    const { repo } = await createRepository();
    const pet = baloo();
    await repo.save({ pet });

    const fetched = await repo.get({ id: pet.id() });
    expect(fetched?.toJSON()).toEqual(pet.toJSON());
  });

  it('list() devuelve solo mascotas vivas, en orden de alta', async () => {
    const { repo } = await createRepository();
    const a = baloo({ id: '01996a3e-7e2a-7000-8000-000000000001', name: 'A' });
    const b = baloo({ id: '01996a3e-7e2a-7000-8000-000000000002', name: 'B' });
    await repo.save({ pet: a });
    await repo.save({ pet: b });

    await repo.save({ pet: a.deleted() });

    const list = await repo.list();
    expect(list.map((p) => p.name())).toEqual(['B']);
  });

  it('save() sobre una mascota borrada no hace DELETE físico: la fila sigue en la tabla', async () => {
    const { db, repo } = await createRepository();
    const pet = baloo();
    await repo.save({ pet });
    await repo.save({ pet: pet.deleted() });

    expect(await repo.get({ id: pet.id() })).toBeNull();

    const row = await db.getFirstAsync<{ id: string; deleted_at: number | null }>(
      'SELECT id, deleted_at FROM pets WHERE id = ?',
      [pet.id()],
    );
    expect(row?.id).toBe(pet.id());
    expect(row?.deleted_at).not.toBeNull();
  });

  it('save() sobre un id existente actualiza en vez de duplicar', async () => {
    const { repo } = await createRepository();
    const pet = baloo();
    await repo.save({ pet });
    await repo.save({ pet: pet.withChanges({ name: 'Baloo II' }) });

    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].name()).toBe('Baloo II');
  });

  it('acepta una mascota sin foto ni hora de nacimiento (grado de degradación de F3)', async () => {
    const { repo } = await createRepository();
    const pet = Pet.createNew({
      id: '01996a3e-7e2a-7000-8000-000000000003',
      name: 'Sin datos',
      species: 'perro',
      birth: Birth.create({ date: '2024-01-01', accuracy: 'gotcha_day' }),
    });
    await repo.save({ pet });

    const fetched = await repo.get({ id: pet.id() });
    expect(fetched?.photo()).toBeUndefined();
    expect(fetched?.birth().hasTime()).toBe(false);
    expect(fetched?.toJSON()).toEqual(pet.toJSON());
  });

  it('persiste `syncedAt`: la columna de sincronización no se pierde en el round-trip (BRD §12.1)', async () => {
    const { repo } = await createRepository();
    // Estado imposible hoy (en el MVP siempre es null) pero que el esquema ya
    // soporta: si `save()` la ignorase, la primera sincronización real
    // reenviaría filas ya subidas y nadie se enteraría hasta entonces.
    const synced = Pet.fromJSON({ ...baloo().toJSON(), syncedAt: 1735689600000 });
    await repo.save({ pet: synced });

    expect((await repo.get({ id: synced.id() }))?.syncedAt()).toBe(1735689600000);
  });

  it('un fallo de SQLite sale como DomainError(STORAGE_ERROR), no como error de librería', async () => {
    const roto = SqlitePetRepository.create({ db: async () => createNodeSqliteAdapter() }); // sin migrar: no hay tabla `pets`

    const error = await roto.list().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).hasCode(ErrorCode.STORAGE_ERROR)).toBe(true);
    expect((error as DomainError).errors[0].cause).toBeDefined();
  });
});
