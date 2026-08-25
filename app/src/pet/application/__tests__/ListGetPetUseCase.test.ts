import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { InMemoryPetRepository } from '../../testing/InMemoryPetRepository';
import CreatePetUseCase from '../CreatePetUseCase';
import ListPetsUseCase from '../ListPetsUseCase';
import GetPetUseCase from '../GetPetUseCase';

const BIRTH = { date: '2025-12-14', accuracy: 'exact' as const };

describe('ListPetsUseCase', () => {
  it('devuelve las mascotas creadas', async () => {
    const repository = new InMemoryPetRepository();
    await CreatePetUseCase.create({ repository }).execute({ name: 'Baloo', species: 'dog', birth: BIRTH });

    const pets = await ListPetsUseCase.create({ repository }).execute();

    expect(pets.map((p) => p.name())).toEqual(['Baloo']);
  });
});

describe('GetPetUseCase', () => {
  it('devuelve la mascota si existe', async () => {
    const repository = new InMemoryPetRepository();
    const created = await CreatePetUseCase.create({ repository }).execute({ name: 'Baloo', species: 'dog', birth: BIRTH });

    const fetched = await GetPetUseCase.create({ repository }).execute({ id: created.id() });

    expect(fetched.id()).toBe(created.id());
  });

  it('lanza DomainError.PET_NOT_FOUND si no existe', async () => {
    const repository = new InMemoryPetRepository();
    const useCase = GetPetUseCase.create({ repository });

    await expect(useCase.execute({ id: 'no-existe' })).rejects.toThrow(DomainError);
    try {
      await useCase.execute({ id: 'no-existe' });
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).hasCode(ErrorCode.PET_NOT_FOUND)).toBe(true);
    }
  });
});
