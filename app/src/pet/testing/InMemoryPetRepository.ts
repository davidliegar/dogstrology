import type { Pet } from '../domain/Pet';
import type { getInput, PetRepository, saveInput } from '../domain/PetRepository';

/** Doble en memoria de `PetRepository`, para probar casos de uso sin
 * SQLite — la persistencia real se prueba en `pet/infrastructure`. */
export class InMemoryPetRepository implements PetRepository {
  private readonly pets = new Map<string, Pet>();

  async list(): Promise<Pet[]> {
    return [...this.pets.values()]
      .filter((p) => !p.isDeleted())
      .sort((a, b) => a.createdAt().localeCompare(b.createdAt()));
  }

  async get({ id }: getInput): Promise<Pet | null> {
    const pet = this.pets.get(id);
    return pet && !pet.isDeleted() ? pet : null;
  }

  async save({ pet }: saveInput): Promise<void> {
    this.pets.set(pet.id(), pet);
  }
}
