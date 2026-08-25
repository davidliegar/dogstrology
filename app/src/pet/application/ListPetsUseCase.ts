import { UseCase } from '@/_kernel/architecture';
import type { Pet } from '../domain/Pet';
import type { PetRepository } from '../domain/PetRepository';

export default class ListPetsUseCase extends UseCase<undefined, Pet[]> {
  static create({ repository }: { repository: PetRepository }): ListPetsUseCase {
    return new ListPetsUseCase(repository);
  }

  constructor(private readonly repository: PetRepository) {
    super();
  }

  async execute(): Promise<Pet[]> {
    return this.repository.list();
  }
}
