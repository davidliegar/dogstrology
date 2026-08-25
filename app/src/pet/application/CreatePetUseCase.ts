import { UseCase } from '@/_kernel/architecture';
import { generateId } from '@/_kernel/id';
import { type BirthInput, Birth } from '../domain/Birth';
import { MediaReference } from '../domain/MediaReference';
import { Pet, type Sex, type Species } from '../domain/Pet';
import type { PetRepository } from '../domain/PetRepository';

type PhotoInput = { kind: 'local'; relativePath: string } | { kind: 'remote'; url: string };

export interface CreatePetUseCaseInput {
  name: string;
  species: Species;
  photo?: PhotoInput;
  breedId?: string;
  sex?: Sex;
  neutered?: boolean;
  birth: BirthInput;
  adoptionDate?: string;
}

function toMediaReference(photo: PhotoInput | undefined): MediaReference | undefined {
  if (!photo) return undefined;
  return photo.kind === 'local' ? MediaReference.local({ relativePath: photo.relativePath }) : MediaReference.remote({ url: photo.url });
}

export default class CreatePetUseCase extends UseCase<CreatePetUseCaseInput, Pet> {
  static create({ repository }: { repository: PetRepository }): CreatePetUseCase {
    return new CreatePetUseCase(repository);
  }

  constructor(private readonly repository: PetRepository) {
    super();
  }

  async execute(input: CreatePetUseCaseInput): Promise<Pet> {
    const pet = Pet.createNew({
      id: generateId(),
      name: input.name,
      species: input.species,
      photo: toMediaReference(input.photo),
      breedId: input.breedId,
      sex: input.sex,
      neutered: input.neutered,
      birth: Birth.create(input.birth),
      adoptionDate: input.adoptionDate,
    });
    await this.repository.save({ pet });
    return pet;
  }
}
