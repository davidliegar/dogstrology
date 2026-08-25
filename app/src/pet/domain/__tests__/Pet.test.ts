import { Pet } from '../Pet';
import { Birth } from '../Birth';
import { MediaReference } from '../MediaReference';

const birth = Birth.create({
  date: '2020-06-15',
  time: '09:15',
  tzOffsetMinutes: 60,
  lat: 41.3874,
  lon: 2.1686,
  accuracy: 'exact',
});

function validPet() {
  return Pet.createNew({
    id: '01996a3e-7e2a-7000-8000-000000000000',
    name: 'Baloo',
    species: 'dog',
    photo: MediaReference.local({ relativePath: 'pets/baloo.jpg' }),
    breedId: 'perro-de-agua-espanol',
    sex: 'male',
    neutered: true,
    birth,
    adoptionDate: undefined,
  });
}

describe('Pet', () => {
  it('createNew() genera createdAt/updatedAt y construye una instancia válida', () => {
    const p = validPet();
    expect(p.name()).toBe('Baloo');
    expect(p.createdAt()).toBe(new Date(p.updatedAt()).toISOString());
    expect(p.isDeleted()).toBe(false);
  });

  it('id inválido lanza', () => {
    const input = { ...validPet().toJSON(), id: 'not-a-uuid', birth, photo: undefined };
    expect(() => Pet.create(input)).toThrow('[Pet] id inválido');
  });

  it('name es obligatorio', () => {
    const input = { ...validPet().toJSON(), name: undefined as unknown as string, birth, photo: undefined };
    expect(() => Pet.create(input)).toThrow('[Pet] name es obligatorio');
  });

  it('name vacío se rechaza', () => {
    const input = { ...validPet().toJSON(), name: '', birth, photo: undefined };
    expect(() => Pet.create(input)).toThrow('[Pet] name no puede estar vacío');
  });

  it('species fuera de catálogo se rechaza', () => {
    const input = { ...validPet().toJSON(), species: 'loro' as never, birth, photo: undefined };
    expect(() => Pet.create(input)).toThrow('[Pet] species inválida');
  });

  it('canCalculateAscendant() exige hora y lugar (BRD §12.3)', () => {
    expect(validPet().canCalculateAscendant()).toBe(true);

    const noTime = Pet.createNew({
      id: '01996a3e-7e2a-7000-8000-000000000001',
      name: 'Sin hora',
      species: 'dog',
      birth: Birth.create({ date: '2020-01-01', accuracy: 'approx' }),
    });
    expect(noTime.canCalculateAscendant()).toBe(false);
  });

  describe('ageInYears()', () => {
    it('un día antes del cumpleaños todavía no ha cumplido', () => {
      expect(validPet().ageInYears(new Date('2025-06-14T12:00:00Z'))).toBe(4);
    });

    it('el día del cumpleaños ya ha cumplido', () => {
      expect(validPet().ageInYears(new Date('2025-06-15T12:00:00Z'))).toBe(5);
    });
  });

  it('rechaza un gotcha day que no sea YYYY-MM-DD', () => {
    expect(() => Pet.create({ ...validPet().toJSON(), birth: validPet().birth(), adoptionDate: '14/12/2025' } as never))
      .toThrow('[Pet] adoptionDate debe ser YYYY-MM-DD');
  });

  it('rechaza un createdAt que no sea una fecha', () => {
    expect(() => Pet.create({ ...validPet().toJSON(), birth: validPet().birth(), createdAt: 'ayer' } as never))
      .toThrow('[Pet] createdAt debe ser una fecha ISO');
  });

  describe('withChanges()', () => {
    it('cambia solo los campos indicados y avanza updatedAt', () => {
      const original = validPet();
      const now = original.updatedAt() + 1000;

      const changed = original.withChanges({ name: 'Baloo II' }, now);

      expect(changed.name()).toBe('Baloo II');
      expect(changed.species()).toBe(original.species());
      expect(changed.updatedAt()).toBe(now);
      expect(changed.createdAt()).toBe(original.createdAt());
    });

    it('sin `now` usa el reloj, pero nunca retrocede', () => {
      const original = validPet();
      expect(original.withChanges({ name: 'Baloo II' }).updatedAt()).toBeGreaterThanOrEqual(original.updatedAt());
    });

    it('una mascota modificada queda pendiente de subir: limpia syncedAt (BRD §12.2.4)', () => {
      const subida = Pet.fromJSON({ ...validPet().toJSON(), syncedAt: 1735689600000 });

      expect(subida.withChanges({ name: 'Baloo II' }).syncedAt()).toBeUndefined();
      expect(subida.deleted().syncedAt()).toBeUndefined();
    });

    it('permite limpiar explícitamente un campo opcional pasando undefined', () => {
      const original = validPet();
      expect(original.breedId()).toBe('perro-de-agua-espanol');

      const changed = original.withChanges({ breedId: undefined });

      expect(changed.breedId()).toBeUndefined();
    });
  });

  it('la edad no depende de la zona horaria: el día del cumpleaños ya cuenta', () => {
    const pet = Pet.createNew({
      id: '01996a3e-7e2a-7000-8000-00000000000b',
      name: 'Cumpleañero',
      species: 'dog',
      birth: Birth.create({ date: '2020-06-14', accuracy: 'exact' }),
    });

    // 14 de junio a las 00:30 locales: en UTC-5 esto es todavía el día 14 en
    // hora local, y el perro cumple 5 años hoy — no 4.
    expect(pet.ageInYears(new Date(2025, 5, 14, 0, 30))).toBe(5);
    expect(pet.ageInYears(new Date(2025, 5, 13, 23, 30))).toBe(4);
  });

  describe('deleted() — BRD §12.2.2, borrado lógico', () => {
    it('marca deletedAt y updatedAt sin tocar el resto', () => {
      const original = validPet();
      const now = original.updatedAt() + 1000;

      const deleted = original.deleted(now);

      expect(deleted.isDeleted()).toBe(true);
      expect(deleted.deletedAt()).toBe(now);
      expect(deleted.updatedAt()).toBe(now);
      expect(deleted.name()).toBe(original.name());
    });
  });

  it('fromJSON(toJSON()) es circular, incluida la foto y el nacimiento', () => {
    const original = validPet();
    const rebuilt = Pet.fromJSON(original.toJSON());
    expect(rebuilt.toJSON()).toEqual(original.toJSON());
  });
});
