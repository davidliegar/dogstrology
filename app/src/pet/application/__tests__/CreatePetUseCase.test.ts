import { InMemoryPetRepository } from '../../testing/InMemoryPetRepository';
import CreatePetUseCase from '../CreatePetUseCase';

describe('CreatePetUseCase', () => {
  it('crea la mascota, la guarda y la devuelve', async () => {
    const repository = new InMemoryPetRepository();
    const useCase = CreatePetUseCase.create({ repository });

    const pet = await useCase.execute({
      name: 'Baloo',
      species: 'perro',
      birth: { date: '2025-12-14', time: '09:15', tzOffsetMinutes: 60, lat: 41.3874, lon: 2.1686, accuracy: 'exact' },
      photo: { kind: 'local', relativePath: 'pets/baloo.jpg' },
    });

    expect(pet.name()).toBe('Baloo');
    expect(pet.photo()?.isLocal()).toBe(true);
    expect(await repository.get({ id: pet.id() })).not.toBeNull();
  });

  it('un nacimiento inválido lanza antes de tocar el repositorio', async () => {
    const repository = new InMemoryPetRepository();
    const useCase = CreatePetUseCase.create({ repository });

    await expect(
      useCase.execute({ name: 'X', species: 'perro', birth: { date: 'mal', accuracy: 'exact' } }),
    ).rejects.toThrow('[Birth] date debe ser YYYY-MM-DD');

    expect(await repository.list()).toHaveLength(0);
  });
});
