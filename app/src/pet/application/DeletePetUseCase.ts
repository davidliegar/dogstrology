import { UseCase } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { PetRepository } from '../domain/PetRepository';

export interface DeletePetUseCaseInput {
  id: string;
}

/** Borrado lógico (BRD §12.2.2): `get → pet.deleted() → save`. No hay un
 * método `delete` en el repositorio — borrar es guardar una mascota a la
 * que se le ha pedido que se marque borrada. */
export default class DeletePetUseCase extends UseCase<DeletePetUseCaseInput, void> {
  static create({ repository }: { repository: PetRepository }): DeletePetUseCase {
    return new DeletePetUseCase(repository);
  }

  constructor(private readonly repository: PetRepository) {
    super();
  }

  async execute({ id }: DeletePetUseCaseInput): Promise<void> {
    const pet = await this.repository.get({ id });
    if (!pet) throw DomainError.withCodes(ErrorCode.PET_NOT_FOUND);

    await this.repository.save({ pet: pet.deleted() });
  }
}
