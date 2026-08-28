import { InMemoryPreferencesRepository } from '../../testing/InMemoryPreferencesRepository';
import GetPreferencesUseCase from '../GetPreferencesUseCase';
import SetHouseSystemUseCase from '../SetHouseSystemUseCase';

function useCases() {
  const repository = new InMemoryPreferencesRepository();
  return {
    get: GetPreferencesUseCase.create({ repository }),
    set: SetHouseSystemUseCase.create({ repository }),
  };
}

describe('SetHouseSystemUseCase', () => {
  it('lo guardado es lo que se lee después', async () => {
    const { get, set } = useCases();

    await set.execute({ houseSystem: 'placidus' });

    expect((await get.execute()).houseSystem()).toBe('placidus');
  });

  it('devuelve los ajustes ya cambiados, para no tener que releerlos', async () => {
    const { set } = useCases();
    expect((await set.execute({ houseSystem: 'placidus' })).houseSystem()).toBe('placidus');
  });

  it('sin haber elegido nunca, se lee el defecto sin escribir nada', async () => {
    const { get } = useCases();
    expect((await get.execute()).houseSystem()).toBe('whole_sign');
  });
});
