import { z } from 'zod';

import { Model } from '@/_kernel/architecture';
import { Birth } from './Birth';
import { MediaReference } from './MediaReference';

export const SPECIES = ['dog', 'cat'] as const;
export type Species = (typeof SPECIES)[number];

export const SEXES = ['male', 'female'] as const;
export type Sex = (typeof SEXES)[number];

const PetValidation = z.object({
  id: z.uuid('[Pet] id inválido'),
  name: z
    .string({ error: (iss) => (iss.input === undefined ? '[Pet] name es obligatorio' : undefined) })
    .min(1, '[Pet] name no puede estar vacío'),
  species: z.enum(SPECIES, {
    error: (iss) => (iss.input === undefined ? '[Pet] species es obligatoria' : '[Pet] species inválida'),
  }),
  photo: z.instanceof(MediaReference, { message: '[Pet] photo inválida' }).optional(),
  breedId: z.string().optional(),
  sex: z.enum(SEXES).optional(),
  neutered: z.boolean().optional(),
  birth: z.instanceof(Birth, { message: '[Pet] birth inválido' }),
  // "Gotcha day" (BRD §12.1): la fecha en que llegó a casa. Mismo formato que
  // `birth.date` — si no se valida, entra cualquier cosa y revienta en F2.
  adoptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '[Pet] adoptionDate debe ser YYYY-MM-DD').optional(),
  // ISO 8601. Distinto de `updatedAt`: no cambia con cada edición (BRD §12.1).
  createdAt: z
    .string({ error: (iss) => (iss.input === undefined ? '[Pet] createdAt es obligatorio' : undefined) })
    .refine((value) => !Number.isNaN(Date.parse(value)), '[Pet] createdAt debe ser una fecha ISO'),
  updatedAt: z.number({ error: (iss) => (iss.input === undefined ? '[Pet] updatedAt es obligatorio' : undefined) }),
  deletedAt: z.number().optional(),
  syncedAt: z.number().optional(),
});

export type PetInput = z.infer<typeof PetValidation>;
/** Campos que `withChanges()` acepta tocar — nunca la identidad ni los timestamps de sistema. */
export type PetChanges = Partial<
  Pick<PetInput, 'name' | 'species' | 'photo' | 'breedId' | 'sex' | 'neutered' | 'birth' | 'adoptionDate'>
>;

/**
 * Aggregate root (BRD §12.1 `Pet`). El borrado lógico y la actualización
 * parcial son reglas del modelo (`deleted()`, `withChanges()`), no del
 * repositorio (BRD §12.2.2-3): el repositorio solo sabe `save` una
 * instancia, nunca decide qué significa borrar o actualizar.
 */
export class Pet extends Model {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _species: Species,
    private readonly _photo: MediaReference | undefined,
    private readonly _breedId: string | undefined,
    private readonly _sex: Sex | undefined,
    private readonly _neutered: boolean | undefined,
    private readonly _birth: Birth,
    private readonly _adoptionDate: string | undefined,
    private readonly _createdAt: string,
    private readonly _updatedAt: number,
    private readonly _deletedAt: number | undefined,
    private readonly _syncedAt: number | undefined,
  ) {
    super();
  }

  static create(input: PetInput): Pet {
    PetValidation.parse(input);
    return new Pet(
      input.id,
      input.name,
      input.species,
      input.photo,
      input.breedId,
      input.sex,
      input.neutered,
      input.birth,
      input.adoptionDate,
      input.createdAt,
      input.updatedAt,
      input.deletedAt,
      input.syncedAt,
    );
  }

  static createOrNull(input: PetInput): Pet | null {
    try {
      return Pet.create(input);
    } catch {
      return null;
    }
  }

  /** Alta nueva: genera timestamps, delega en `create()`. `id` ya viene
   * generado por el llamante (UUIDv7 en dispositivo, BRD §12.2.1) — no es
   * responsabilidad del modelo decidir cómo se genera un ID. */
  static createNew(
    input: Omit<PetInput, 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncedAt'>,
  ): Pet {
    const now = Date.now();
    return Pet.create({ ...input, createdAt: new Date(now).toISOString(), updatedAt: now });
  }

  static fromJSON(json: ReturnType<Pet['toJSON']>): Pet {
    return Pet.create({
      ...json,
      photo: json.photo ? MediaReference.fromJSON(json.photo) : undefined,
      birth: Birth.fromJSON(json.birth),
    });
  }

  id(): string {
    return this._id;
  }

  name(): string {
    return this._name;
  }

  species(): Species {
    return this._species;
  }

  photo(): MediaReference | undefined {
    return this._photo;
  }

  breedId(): string | undefined {
    return this._breedId;
  }

  sex(): Sex | undefined {
    return this._sex;
  }

  neutered(): boolean | undefined {
    return this._neutered;
  }

  birth(): Birth {
    return this._birth;
  }

  adoptionDate(): string | undefined {
    return this._adoptionDate;
  }

  createdAt(): string {
    return this._createdAt;
  }

  updatedAt(): number {
    return this._updatedAt;
  }

  syncedAt(): number | undefined {
    return this._syncedAt;
  }

  deletedAt(): number | undefined {
    return this._deletedAt;
  }

  isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  /** BRD §12.3: Ascendente y casas exigen hora **y** lugar de nacimiento. */
  canCalculateAscendant(): boolean {
    return this._birth.hasTime() && this._birth.hasLocation();
  }

  /**
   * Años cumplidos a fecha de `reference` (por defecto, hoy).
   *
   * La fecha de nacimiento se parte a mano en lugar de pasarla por `new
   * Date()`: 'YYYY-MM-DD' se interpreta como medianoche **UTC**, y comparar
   * eso con los componentes locales de `reference` adelanta un día el
   * cumpleaños en cualquier zona horaria negativa. Un día de más no importa
   * para la edad de un perro; equivocarse de año el día del cumpleaños, sí.
   */
  ageInYears(reference: Date = new Date()): number {
    const [birthYear, birthMonth, birthDay] = this._birth.date().split('-').map(Number);
    let age = reference.getFullYear() - birthYear;
    const notYetTurned =
      reference.getMonth() + 1 < birthMonth ||
      (reference.getMonth() + 1 === birthMonth && reference.getDate() < birthDay);
    if (notYetTurned) age -= 1;
    return age;
  }

  /**
   * Meses cumplidos a fecha de `reference`. El mismo cuidado con la fecha que
   * `ageInYears()`, y por lo mismo.
   *
   * Existe porque **un cachorro de ocho meses y uno de dieciséis son perros
   * distintos**, y en años los dos son «0». Cuándo se cuenta en meses y cuándo
   * en años lo decide la capa que lo enseña, no este método.
   */
  ageInMonths(reference: Date = new Date()): number {
    const [birthYear, birthMonth, birthDay] = this._birth.date().split('-').map(Number);
    let months = (reference.getFullYear() - birthYear) * 12 + (reference.getMonth() + 1 - birthMonth);
    if (reference.getDate() < birthDay) months -= 1;
    return Math.max(0, months);
  }

  /**
   * Única transición interna: reconstruye la mascota cambiando lo indicado y
   * dejando intacto lo demás. Privada a propósito — `withChanges()` y
   * `deleted()` pasan por aquí, así la lista de campos vive en un solo sitio y
   * no hay forma de añadir un campo nuevo y olvidarlo en una de las dos.
   *
   * `'campo' in changes` (y no `??`) distingue "no lo toques" de "bórralo":
   * `{ photo: undefined }` quita la foto, `{}` la conserva.
   */
  private copyWith(changes: PetChanges, system: { updatedAt: number; deletedAt?: number }): Pet {
    return Pet.create({
      id: this._id,
      name: changes.name ?? this._name,
      species: changes.species ?? this._species,
      photo: 'photo' in changes ? changes.photo : this._photo,
      breedId: 'breedId' in changes ? changes.breedId : this._breedId,
      sex: 'sex' in changes ? changes.sex : this._sex,
      neutered: 'neutered' in changes ? changes.neutered : this._neutered,
      birth: changes.birth ?? this._birth,
      adoptionDate: 'adoptionDate' in changes ? changes.adoptionDate : this._adoptionDate,
      createdAt: this._createdAt,
      updatedAt: system.updatedAt,
      deletedAt: system.deletedAt ?? this._deletedAt,
      // Toda modificación deja la fila pendiente de subir (BRD §12.2.4: el
      // conflicto se resuelve por `updatedAt`, y `syncedAt` marca qué versión
      // llegó a subirse). En el MVP siempre es `undefined`, pero la regla se
      // cumple desde el día 1 para que el día que haya backend no haya que
      // reinterpretar filas viejas.
      syncedAt: undefined,
    });
  }

  /** Reconstruye la mascota con los campos indicados y `updatedAt` al día.
   * `now` es inyectable para que los tests no dependan del reloj de pared. */
  withChanges(changes: PetChanges, now: number = Date.now()): Pet {
    return this.copyWith(changes, { updatedAt: now });
  }

  /** Borrado lógico (BRD §12.2.2): nunca `DELETE` físico. */
  deleted(now: number = Date.now()): Pet {
    return this.copyWith({}, { updatedAt: now, deletedAt: now });
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      species: this._species,
      photo: this._photo?.toJSON(),
      breedId: this._breedId,
      sex: this._sex,
      neutered: this._neutered,
      birth: this._birth.toJSON(),
      adoptionDate: this._adoptionDate,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      syncedAt: this._syncedAt,
    };
  }
}
