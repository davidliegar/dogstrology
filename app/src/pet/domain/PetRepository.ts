import type { Pet } from './Pet';

export interface getInput {
  id: string;
}

export interface saveInput {
  pet: Pet;
}

/**
 * Puerto del aggregate `Pet` (BRD §12.2.3: la UI nunca ve SQL). Solo tres
 * métodos: no hace falta un `delete` aparte — borrar es guardar una mascota
 * a la que se le ha llamado `.deleted()` (ver `Pet.deleted()`).
 *
 * `list`/`get` devuelven solo mascotas vivas (`deletedAt IS NULL`, BRD
 * §12.2.2) — es responsabilidad de la implementación, no de quien llama.
 *
 * Los fallos de almacenamiento salen como `DomainError(STORAGE_ERROR)`: quien
 * llama a un puerto no debería tener que reconocer errores de una librería.
 */
export interface PetRepository {
  list(): Promise<Pet[]>;
  get(input: getInput): Promise<Pet | null>;
  save(input: saveInput): Promise<void>;
}
