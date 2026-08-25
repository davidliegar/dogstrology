import { UseCase } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { Pet, PetChanges } from '../domain/Pet';
import type { PetRepository } from '../domain/PetRepository';

export interface UpdatePetUseCaseInput {
  id: string;
  changes: PetChanges;
}

export default class UpdatePetUseCase extends UseCase<UpdatePetUseCaseInput, Pet> {
  static create({ repository }: { repository: PetRepository }): UpdatePetUseCase {
    return new UpdatePetUseCase(repository);
  }

  constructor(private readonly repository: PetRepository) {
    super();
  }

  async execute({ id, changes }: UpdatePetUseCaseInput): Promise<Pet> {
    const current = await this.repository.get({ id });
    if (!current) throw DomainError.withCodes(ErrorCode.PET_NOT_FOUND);

    const updated = current.withChanges(changes);
    await this.repository.save({ pet: updated });
    return updated;
  }
}
