import { InMemoryPetRepository } from '@/pet/testing/InMemoryPetRepository';
import { InMemoryPhotoStore } from '@/pet/testing/InMemoryPhotoStore';
import { Birth } from '@/pet/domain/Birth';
import { Pet } from '@/pet/domain/Pet';
import SetPetPhotoUseCase from '../SetPetPhotoUseCase';

const ID = '0193f0a0-0000-7000-8000-000000000000';

const baloo = () =>
  Pet.createNew({
    id: ID,
    name: 'Baloo',
    species: 'dog',
    birth: Birth.create({ date: '2025-12-14', accuracy: 'exact' }),
  });

async function scenario() {
  const repository = new InMemoryPetRepository();
  const photos = new InMemoryPhotoStore();
  await repository.save({ pet: baloo() });
  return { repository, photos, useCase: SetPetPhotoUseCase.create({ repository, photos }) };
}

describe('SetPetPhotoUseCase', () => {
  it('guarda el fichero y deja la referencia relativa en la mascota', async () => {
    const { useCase, photos } = await scenario();
    const pet = await useCase.execute({ id: ID, sourceUri: 'file:///tmp/foto.jpg' });

    expect(photos.saved).toEqual(['file:///tmp/foto.jpg']);
    // Relativa, nunca absoluta ni BLOB (BRD §12.2.5, irreversible).
    expect(pet.photo()?.relativePath()).toBe(`pets/${ID}-0.jpg`);
    expect(pet.photo()?.isLocal()).toBe(true);
  });

  it('al cambiarla, borra la anterior — pero solo después de guardar la nueva', async () => {
    const { useCase, photos, repository } = await scenario();
    await useCase.execute({ id: ID, sourceUri: 'file:///tmp/primera.jpg' });
    await useCase.execute({ id: ID, sourceUri: 'file:///tmp/segunda.jpg' });

    expect(photos.removed).toEqual([`pets/${ID}-0.jpg`]);
    const stored = await repository.get({ id: ID });
    expect(stored?.photo()?.relativePath()).toBe(`pets/${ID}-1.jpg`);
  });

  it('quitarla borra el fichero y deja la mascota sin foto', async () => {
    const { useCase, photos } = await scenario();
    await useCase.execute({ id: ID, sourceUri: 'file:///tmp/foto.jpg' });
    const pet = await useCase.execute({ id: ID, sourceUri: null });

    expect(pet.photo()).toBeUndefined();
    expect(photos.removed).toEqual([`pets/${ID}-0.jpg`]);
  });

  it('si el fichero no se puede escribir, la fila no se toca', async () => {
    // El orden es lo único que hace falta acertar: fichero, fila, borrado. Si
    // fallara al revés quedaría una fila apuntando a un fichero que no existe,
    // que es un hueco en el perfil que nadie sabe arreglar.
    const { useCase, photos, repository } = await scenario();
    photos.failOnSave = true;

    await expect(useCase.execute({ id: ID, sourceUri: 'file:///tmp/foto.jpg' })).rejects.toThrow();
    expect((await repository.get({ id: ID }))?.photo()).toBeUndefined();
  });

  it('una mascota que no existe no crea ficheros', async () => {
    const { useCase, photos } = await scenario();
    await expect(
      useCase.execute({ id: '0193f0a0-0000-7000-8000-999999999999', sourceUri: 'file:///tmp/x.jpg' }),
    ).rejects.toThrow();
    expect(photos.saved).toEqual([]);
  });
});
