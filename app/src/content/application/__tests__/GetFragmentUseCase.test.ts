import { ContentKey } from '../../domain/ContentKey';
import { InMemoryContentRepository } from '../../testing/InMemoryContentRepository';
import GetFragmentUseCase from '../GetFragmentUseCase';
import GetFragmentsUseCase from '../GetFragmentsUseCase';

const sunInAries = ContentKey.planetInSign({ planet: 'sun', sign: 'aries' });
const moonInTaurus = ContentKey.planetInSign({ planet: 'moon', sign: 'taurus' });

describe('GetFragmentUseCase', () => {
  it('devuelve el fragmento cuando está', async () => {
    const repository = InMemoryContentRepository.with([{ key: 'planet=sun;sign=aries' }]);
    const fragment = await GetFragmentUseCase.create({ repository }).execute({ key: sunInAries });

    expect(fragment?.key()).toBe('planet=sun;sign=aries');
  });

  it('devuelve null cuando no está, sin lanzar', async () => {
    // A diferencia de `GetPetUseCase`: un hueco de contenido no es un error de
    // navegación, y la pantalla se tiene que seguir pintando sin ese párrafo.
    const repository = InMemoryContentRepository.with();
    await expect(GetFragmentUseCase.create({ repository }).execute({ key: sunInAries })).resolves.toBeNull();
  });
});

describe('GetFragmentsUseCase', () => {
  it('pide el lote de una vez y devuelve los que existen', async () => {
    const repository = InMemoryContentRepository.with([{ key: 'planet=sun;sign=aries' }]);
    const fragments = await GetFragmentsUseCase.create({ repository }).execute({
      keys: [sunInAries, moonInTaurus],
    });

    expect(fragments.map((fragment) => fragment.key())).toEqual(['planet=sun;sign=aries']);
    expect(repository.asked).toEqual(['planet=sun;sign=aries', 'planet=moon;sign=taurus']);
  });

  it('con la lista vacía no toca el repositorio', async () => {
    const repository = InMemoryContentRepository.with();
    await expect(GetFragmentsUseCase.create({ repository }).execute({ keys: [] })).resolves.toEqual([]);
    expect(repository.asked).toEqual([]);
  });
});
