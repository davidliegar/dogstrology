import { ASPECT_TYPES } from '../chart/domain/ChartAspect';
import { MOON_PHASE_NAMES } from '../chart/domain/NatalChart';
import { PLANET_IDS, SIGNS } from '../chart/domain/PlanetPosition';
import { ContentKey } from '../content/domain/ContentKey';
import { BundledCatalogContentRepository } from '../content/infrastructure/BundledCatalogContentRepository';
import { BREEDS } from '../pet/ui/breeds';

const HOUSES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Todo lo que la app sabe pedir. Desde 2026-08-27, todo está publicado. */
const EVERY_KEY = 1560;

/**
 * **Todas** las claves que la app puede llegar a construir con el vocabulario
 * que tiene hoy. No es una muestra: son las 1.560, generadas desde las mismas
 * constantes que usan las pantallas.
 */
function everyKeyTheAppCanAsk(): ContentKey[] {
  const keys: ContentKey[] = [];

  for (const planet of PLANET_IDS) {
    for (const sign of SIGNS) keys.push(ContentKey.planetInSign({ planet, sign }));
    for (const house of HOUSES) keys.push(ContentKey.planetInHouse({ planet, house }));
  }

  for (const transit of PLANET_IDS) {
    for (const natal of PLANET_IDS) {
      for (const aspect of ASPECT_TYPES) keys.push(ContentKey.transitAspect({ transit, aspect, natal }));
    }
  }

  for (const breed of BREEDS) {
    for (const sign of SIGNS) keys.push(ContentKey.breedInSign({ breed: breed.id, sign }));
  }

  for (const sign of SIGNS) keys.push(ContentKey.personalityOfSign({ sign }));
  for (const moonPhase of MOON_PHASE_NAMES) keys.push(ContentKey.personalityOfMoonPhase({ moonPhase }));
  for (const moonPhase of MOON_PHASE_NAMES) keys.push(ContentKey.moonPhaseToday({ moonPhase }));
  for (const house of HOUSES) keys.push(ContentKey.houseGlossary({ house }));

  return keys;
}

/**
 * El guardarraíl contra BRD §7.3.1.
 *
 * El pipeline genera las claves y la app las construye por su cuenta; en
 * producción **nunca se comparan**, y si divergen no hay error: la tarjeta sale
 * vacía y nadie se entera. Este test es el único sitio donde las dos mitades se
 * ponen una al lado de la otra, y por eso va en las dos direcciones — que no
 * falte ninguna que la app pida, y que no sobre ninguna que la app no sepa
 * pedir. Un fragmento huérfano son 3.500 tokens pagados que nadie va a leer.
 *
 * Si falla después de tocar `breeds.ts`, `PlanetPosition.ts` o
 * `catalogFragments.mjs`: el catálogo hay que regenerarlo y volver a publicar
 * (`content/catalog/`), y luego `npm run generate:catalog`.
 */
describe('cobertura del catálogo publicado', () => {
  const wasDev = __DEV__;

  beforeAll(() => {
    // El adaptador lanza en desarrollo, que es lo que se quiere en el
    // emulador. Aquí interesa la lista entera de lo que falta, no la primera.
    // @ts-expect-error `__DEV__` es una global del bundler, no una constante de TS.
    global.__DEV__ = false;
  });

  afterAll(() => {
    // @ts-expect-error idem.
    global.__DEV__ = wasDev;
  });

  it('la app puede construir exactamente las claves del catálogo', () => {
    expect(everyKeyTheAppCanAsk()).toHaveLength(EVERY_KEY);
  });

  it('no falta ni un fragmento de los que la app sabe pedir', async () => {
    const repository = BundledCatalogContentRepository.create();
    const keys = everyKeyTheAppCanAsk();
    const found = await repository.getMany({ keys });

    const there = new Set(found.map((fragment) => fragment.key()));
    const missing = keys.map((key) => key.value()).filter((key) => !there.has(key));

    expect(missing).toEqual([]);
  });

  it('no sobra ningún fragmento que la app no sepa pedir', () => {
    const asked = new Set(everyKeyTheAppCanAsk().map((key) => key.value()));
    const published = [
      ...Object.keys(require('../content/infrastructure/catalog/aspects.generated.json')),
      ...Object.keys(require('../content/infrastructure/catalog/planet-sign-house.generated.json')),
      ...Object.keys(require('../content/infrastructure/catalog/breed-sign.generated.json')),
      ...Object.keys(require('../content/infrastructure/catalog/personality.generated.json')),
    ];

    expect(published).toHaveLength(EVERY_KEY);
    expect(published.filter((key) => !asked.has(key))).toEqual([]);
  });

  it('todos los fragmentos publicados tienen la forma que el dominio exige', async () => {
    // `Fragment.create()` valida cada uno al construirlo: si un color se
    // saliera de la paleta o una energía fuese 0, esto lanza. Es el único
    // recorrido completo del catálogo que hace la app, y solo pasa aquí.
    const repository = BundledCatalogContentRepository.create();
    const fragments = await repository.getMany({ keys: everyKeyTheAppCanAsk() });

    expect(fragments).toHaveLength(EVERY_KEY);
  });
});
