import { ContentKey } from '../../domain/ContentKey';
import { BundledCatalogContentRepository } from '../BundledCatalogContentRepository';

describe('BundledCatalogContentRepository', () => {
  it('lee un fragmento real del catálogo publicado', async () => {
    const repository = BundledCatalogContentRepository.create();
    const fragment = await repository.get({ key: ContentKey.planetInSign({ planet: 'sun', sign: 'aries' }) });

    expect(fragment).not.toBeNull();
    expect(fragment!.key()).toBe('planet=sun;sign=aries');
    expect(fragment!.headline().length).toBeGreaterThan(0);
    expect(fragment!.energyScore()).toBeGreaterThanOrEqual(1);
    expect(fragment!.color()).toBe('fire');
  });

  it('lee de las cuatro familias', async () => {
    const repository = BundledCatalogContentRepository.create();
    const keys = [
      ContentKey.planetInHouse({ planet: 'moon', house: 4 }),
      ContentKey.transitAspect({ transit: 'sun', aspect: 'conjunction', natal: 'sun' }),
      ContentKey.breedInSign({ breed: 'german-shepherd', sign: 'aries' }),
      ContentKey.personalityOfSign({ sign: 'aries' }),
    ];

    for (const key of keys) {
      expect(await repository.get({ key })).not.toBeNull();
    }
  });

  it('devuelve el lote en el orden en que se pidió', async () => {
    const repository = BundledCatalogContentRepository.create();
    const fragments = await repository.getMany({
      keys: [
        ContentKey.planetInSign({ planet: 'mars', sign: 'leo' }),
        ContentKey.planetInSign({ planet: 'venus', sign: 'pisces' }),
      ],
    });

    expect(fragments.map((fragment) => fragment.key())).toEqual([
      'planet=mars;sign=leo',
      'planet=venus;sign=pisces',
    ]);
  });

  it('en desarrollo, una clave que no existe revienta', () => {
    // Es el único sitio donde el fallo mudo de BRD §7.3.1 hace ruido. Los
    // tests corren con `__DEV__` en true, igual que el emulador.
    expect(__DEV__).toBe(true);
    const repository = BundledCatalogContentRepository.create();
    return expect(
      repository.get({ key: ContentKey.breedInSign({ breed: 'perro-que-no-existe', sign: 'aries' }) }),
    ).rejects.toThrow(/no existe el fragmento/);
  });

  it('en producción, una clave que no existe devuelve null y la sesión sigue', async () => {
    const dev = __DEV__;
    // @ts-expect-error `__DEV__` es una global del bundler, no una constante de TS.
    global.__DEV__ = false;
    try {
      const repository = BundledCatalogContentRepository.create();
      const missing = ContentKey.breedInSign({ breed: 'perro-que-no-existe', sign: 'aries' });

      expect(await repository.get({ key: missing })).toBeNull();
      // El lote no se rompe por un hueco: devuelve los que sí están.
      const fragments = await repository.getMany({
        keys: [missing, ContentKey.personalityOfSign({ sign: 'leo' })],
      });
      expect(fragments.map((fragment) => fragment.key())).toEqual(['species=dog;sign=leo']);
    } finally {
      // @ts-expect-error idem.
      global.__DEV__ = dev;
    }
  });
});
