import { ContentKey } from '../../domain/ContentKey';
import { BundledCatalogContentRepository } from '../BundledCatalogContentRepository';

/**
 * En su propio fichero a propósito: Jest da un registro de módulos limpio por
 * fichero de test, y esto mide justo eso — qué se ha cargado y qué no. Metido
 * junto a los demás casos, cualquier test anterior habría cargado ya el
 * catálogo de razas y la comprobación no valdría nada.
 *
 * Lo que se afirma es la promesa del adaptador: abrir la carta natal carga 110
 * KB, no los 740 del catálogo entero.
 */
describe('el catálogo se carga por familias, no de golpe', () => {
  const fileOf = (family: string) => require.resolve(`../catalog/${family}.generated.json`);

  it('pedir un fragmento solo carga el fichero de su familia', async () => {
    const repository = BundledCatalogContentRepository.create();

    // Construirlo no carga nada.
    for (const family of ['aspects', 'planet-sign-house', 'breed-sign', 'personality']) {
      expect(require.cache[fileOf(family)]).toBeUndefined();
    }

    await repository.get({ key: ContentKey.planetInSign({ planet: 'sun', sign: 'aries' }) });

    expect(require.cache[fileOf('planet-sign-house')]).toBeDefined();
    expect(require.cache[fileOf('breed-sign')]).toBeUndefined();
    expect(require.cache[fileOf('aspects')]).toBeUndefined();
    expect(require.cache[fileOf('personality')]).toBeUndefined();
  });
});
