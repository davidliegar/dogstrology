import { InMemoryPetRepository } from '../../testing/InMemoryPetRepository';
import CreatePetUseCase from '../CreatePetUseCase';
import UpdatePetUseCase from '../UpdatePetUseCase';
import DeletePetUseCase from '../DeletePetUseCase';
import ListPetsUseCase from '../ListPetsUseCase';

const BIRTH = { date: '2025-12-14', accuracy: 'exact' as const };

describe('UpdatePetUseCase', () => {
  it('aplica los cambios sobre la mascota existente vía Pet.withChanges()', async () => {
    const repository = new InMemoryPetRepository();
    const created = await CreatePetUseCase.create({ repository }).execute({ name: 'Baloo', species: 'dog', birth: BIRTH });

    const updated = await UpdatePetUseCase.create({ repository }).execute({
      id: created.id(),
      changes: { name: 'Baloo II' },
    });

    expect(updated.name()).toBe('Baloo II');
    expect((await repository.get({ id: created.id() }))?.name()).toBe('Baloo II');
  });

  it('mascota inexistente lanza', async () => {
    const repository = new InMemoryPetRepository();
    await expect(
      UpdatePetUseCase.create({ repository }).execute({ id: 'no-existe', changes: { name: 'X' } }),
    ).rejects.toThrow();
  });
});

describe('DeletePetUseCase', () => {
  it('borra lógicamente: desaparece de list() pero Pet.deleted() no pierde datos', async () => {
    const repository = new InMemoryPetRepository();
    const created = await CreatePetUseCase.create({ repository }).execute({ name: 'Baloo', species: 'dog', birth: BIRTH });

    await DeletePetUseCase.create({ repository }).execute({ id: created.id() });

    expect(await ListPetsUseCase.create({ repository }).execute()).toHaveLength(0);
  });

  it('mascota inexistente lanza', async () => {
    const repository = new InMemoryPetRepository();
    await expect(DeletePetUseCase.create({ repository }).execute({ id: 'no-existe' })).rejects.toThrow();
  });
});
