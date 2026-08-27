import { UseCase } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { Pet } from '../domain/Pet';
import type { PetRepository } from '../domain/PetRepository';
import type { PhotoStore } from '../domain/PhotoStore';

export interface SetPetPhotoUseCaseInput {
  id: string;
  /** Ruta temporal del selector de imagen, o `null` para quitar la foto. */
  sourceUri: string | null;
}

/**
 * Pone o quita la foto de una mascota (BRD §12.2.5).
 *
 * El orden importa y es el único motivo por el que esto es un caso de uso y no
 * dos llamadas sueltas desde la pantalla: **primero se escribe el fichero
 * nuevo, luego la fila, y solo al final se borra el viejo**. Si algo falla por
 * el camino queda un fichero huérfano —recuperable, invisible— en vez de una
 * fila apuntando a un fichero que ya no existe, que es un hueco en el perfil
 * que nadie sabe arreglar.
 */
export default class SetPetPhotoUseCase extends UseCase<SetPetPhotoUseCaseInput, Pet> {
  static create({ repository, photos }: { repository: PetRepository; photos: PhotoStore }): SetPetPhotoUseCase {
    return new SetPetPhotoUseCase(repository, photos);
  }

  constructor(
    private readonly repository: PetRepository,
    private readonly photos: PhotoStore,
  ) {
    super();
  }

  async execute({ id, sourceUri }: SetPetPhotoUseCaseInput): Promise<Pet> {
    const current = await this.repository.get({ id });
    if (!current) throw DomainError.withCodes(ErrorCode.PET_NOT_FOUND);

    const previous = current.photo();
    const photo = sourceUri === null ? undefined : await this.photos.save({ petId: id, sourceUri });

    const updated = current.withChanges({ photo });
    await this.repository.save({ pet: updated });

    // Ya está guardada la referencia nueva: a partir de aquí, el fichero viejo
    // no lo mira nadie.
    if (previous) await this.photos.remove({ photo: previous });

    return updated;
  }
}
