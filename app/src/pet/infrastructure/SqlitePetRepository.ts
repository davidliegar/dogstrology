import type { DatabaseProvider, SqlDatabase } from '@/_db/types';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { Birth, type BirthAccuracy } from '../domain/Birth';
import { MediaReference } from '../domain/MediaReference';
import { Pet, type Sex, type Species } from '../domain/Pet';
import type { getInput, PetRepository, saveInput } from '../domain/PetRepository';

interface PetRow {
  id: string;
  name: string;
  species: string;
  photo_kind: string | null;
  photo_rel_path: string | null;
  photo_url: string | null;
  breed_id: string | null;
  sex: string | null;
  neutered: number | null;
  birth_date: string;
  birth_time: string | null;
  birth_tz_offset_minutes: number | null;
  birth_lat: number | null;
  birth_lon: number | null;
  birth_accuracy: string;
  adoption_date: string | null;
  created_at: string;
  updated_at: number;
  deleted_at: number | null;
  synced_at: number | null;
}

function photoFromRow(row: PetRow): MediaReference | undefined {
  if (row.photo_kind === 'local' && row.photo_rel_path) return MediaReference.local({ relativePath: row.photo_rel_path });
  if (row.photo_kind === 'remote' && row.photo_url) return MediaReference.remote({ url: row.photo_url });
  return undefined;
}

function rowToPet(row: PetRow): Pet {
  return Pet.create({
    id: row.id,
    name: row.name,
    species: row.species as Species,
    photo: photoFromRow(row),
    breedId: row.breed_id ?? undefined,
    sex: (row.sex as Sex | null) ?? undefined,
    neutered: row.neutered == null ? undefined : Boolean(row.neutered),
    birth: Birth.create({
      date: row.birth_date,
      time: row.birth_time ?? undefined,
      tzOffsetMinutes: row.birth_tz_offset_minutes ?? undefined,
      lat: row.birth_lat ?? undefined,
      lon: row.birth_lon ?? undefined,
      accuracy: row.birth_accuracy as BirthAccuracy,
    }),
    adoptionDate: row.adoption_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    syncedAt: row.synced_at ?? undefined,
  });
}

/** Columnas en el orden que espera el `INSERT ... VALUES` de `save()`. */
function petToColumns(pet: Pet): unknown[] {
  const photo = pet.photo();
  const birth = pet.birth();
  return [
    pet.id(),
    pet.name(),
    pet.species(),
    photo ? (photo.isLocal() ? 'local' : 'remote') : null,
    photo?.isLocal() ? (photo.relativePath() ?? null) : null,
    photo && !photo.isLocal() ? (photo.url() ?? null) : null,
    pet.breedId() ?? null,
    pet.sex() ?? null,
    pet.neutered() == null ? null : Number(pet.neutered()),
    birth.date(),
    birth.time() ?? null,
    birth.tzOffsetMinutes() ?? null,
    birth.lat() ?? null,
    birth.lon() ?? null,
    birth.accuracy(),
    pet.adoptionDate() ?? null,
    pet.createdAt(),
    pet.updatedAt(),
    pet.deletedAt() ?? null,
    pet.syncedAt() ?? null,
  ];
}

/**
 * Adaptador SQLite del puerto `PetRepository` (BRD §12.2.3).
 *
 * Recibe un **proveedor** de base de datos, no una instancia: abrir la base
 * aplica migraciones y es asíncrono, así que el contenedor puede construir los
 * repositorios en el arranque sin bloquear nada, y la base se abre de verdad
 * en la primera consulta.
 */
export class SqlitePetRepository implements PetRepository {
  static create({ db }: { db: DatabaseProvider }): SqlitePetRepository {
    return new SqlitePetRepository(db);
  }

  constructor(private readonly db: DatabaseProvider) {}

  /**
   * Todo acceso a SQLite pasa por aquí. Un fallo de la librería (base
   * corrupta, disco lleno, fila que ya no valida) sale convertido en
   * `DomainError(STORAGE_ERROR)` con la causa original dentro: la frontera de
   * la infraestructura es también la frontera de sus errores.
   */
  private async run<T>(operation: (db: SqlDatabase) => Promise<T>): Promise<T> {
    try {
      return await operation(await this.db());
    } catch (error) {
      throw DomainError.withCodes(ErrorCode.STORAGE_ERROR).withCauses(error as Error);
    }
  }

  async list(): Promise<Pet[]> {
    return this.run(async (db) => {
      const rows = await db.getAllAsync<PetRow>(
        'SELECT * FROM pets WHERE deleted_at IS NULL ORDER BY created_at ASC',
      );
      return rows.map(rowToPet);
    });
  }

  async get({ id }: getInput): Promise<Pet | null> {
    return this.run(async (db) => {
      const row = await db.getFirstAsync<PetRow>(
        'SELECT * FROM pets WHERE id = ? AND deleted_at IS NULL',
        [id],
      );
      return row ? rowToPet(row) : null;
    });
  }

  async save({ pet }: saveInput): Promise<void> {
    await this.run((db) => db.runAsync(
      `INSERT INTO pets (
        id, name, species, photo_kind, photo_rel_path, photo_url, breed_id, sex, neutered,
        birth_date, birth_time, birth_tz_offset_minutes, birth_lat, birth_lon, birth_accuracy,
        adoption_date, created_at, updated_at, deleted_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        species = excluded.species,
        photo_kind = excluded.photo_kind,
        photo_rel_path = excluded.photo_rel_path,
        photo_url = excluded.photo_url,
        breed_id = excluded.breed_id,
        sex = excluded.sex,
        neutered = excluded.neutered,
        birth_date = excluded.birth_date,
        birth_time = excluded.birth_time,
        birth_tz_offset_minutes = excluded.birth_tz_offset_minutes,
        birth_lat = excluded.birth_lat,
        birth_lon = excluded.birth_lon,
        birth_accuracy = excluded.birth_accuracy,
        adoption_date = excluded.adoption_date,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        synced_at = excluded.synced_at`,
      petToColumns(pet),
    ));
  }
}
