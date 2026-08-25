import { UseCase } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { Pet } from '../domain/Pet';
import type { PetRepository } from '../domain/PetRepository';

export interface GetPetUseCaseInput {
  id: string;
}

export default class GetPetUseCase extends UseCase<GetPetUseCaseInput, Pet> {
  static create({ repository }: { repository: PetRepository }): GetPetUseCase {
    return new GetPetUseCase(repository);
  }

  constructor(private readonly repository: PetRepository) {
    super();
  }

  async execute({ id }: GetPetUseCaseInput): Promise<Pet> {
    const pet = await this.repository.get({ id });
    if (!pet) throw DomainError.withCodes(ErrorCode.PET_NOT_FOUND);
    return pet;
  }
}
