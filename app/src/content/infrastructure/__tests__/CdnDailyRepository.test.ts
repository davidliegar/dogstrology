import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { DailyEdition } from '../../domain/DailyEdition';
import { Fragment } from '../../domain/Fragment';
import { InMemoryDailyCache } from '../../testing/InMemoryDailyCache';
import { CdnDailyRepository } from '../CdnDailyRepository';

const BASE_URL = 'https://contenido.example/daily/';

/** Un fragmento tal y como sale de `generateDaily.mjs`: con `colorOfDay`. */
const published = (key: string, overrides: Record<string, unknown> = {}) => ({
  key,
  headline: 'La Luna entra en Escorpio a media tarde',
  body: 'Baja el volumen de todo: el cielo pide guarida, no parque.',
  advice: 'Paseo corto y manta.',
  energyScore: 3,
  colorOfDay: 'water',
  ...overrides,
});

const cachedEdition = (date: string) =>
  DailyEdition.create({
    date,
    fragments: [
      Fragment.create({
        key: `date=${date}`,
        headline: 'De la caché',
        body: 'Guardada de una descarga anterior.',
        advice: 'Nada que hacer.',
        energyScore: 2,
        color: 'gold',
      }),
    ],
  });

/** Sustituye `fetch` por una respuesta fija y devuelve las URLs pedidas. */
function stubFetch(respond: () => Partial<Response> | Promise<never>) {
  const asked: string[] = [];
  global.fetch = jest.fn((url: unknown) => {
    asked.push(String(url));
    return Promise.resolve(respond()) as Promise<Response>;
  }) as unknown as typeof fetch;
  return asked;
}

const okWith = (body: unknown) => () => ({ ok: true, status: 200, json: async () => body });

describe('CdnDailyRepository', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('descarga la edición, la traduce y la guarda', async () => {
    const asked = stubFetch(okWith([published('date=2026-08-25'), published('date=2026-08-25;axis=sun;sign=leo')]));
    const cache = InMemoryDailyCache.empty();
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache });

    const edition = await repository.get({ date: '2026-08-25' });

    expect(asked).toEqual(['https://contenido.example/daily/2026-08-25.json']);
    // `colorOfDay` es el nombre del schema del pipeline y muere en la
    // frontera: dentro del dominio el campo es `color`.
    expect(edition?.sky()?.color()).toBe('water');
    expect(edition?.forAxis('sun', 'leo')).not.toBeNull();
    expect(cache.dates()).toEqual(['2026-08-25']);
  });

  it('con la edición en caché no toca la red', async () => {
    // La edición de un día no cambia una vez publicada: revalidar solo
    // gastaría datos para recibir lo mismo.
    const asked = stubFetch(okWith([]));
    const cache = InMemoryDailyCache.with(cachedEdition('2026-08-25'));
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache });

    const edition = await repository.get({ date: '2026-08-25' });

    expect(edition?.sky()?.headline()).toBe('De la caché');
    expect(asked).toEqual([]);
  });

  it('poda la ventana contando desde el día que se pide', async () => {
    stubFetch(okWith([published('date=2026-08-25')]));
    const cache = InMemoryDailyCache.empty();
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache });

    await repository.get({ date: '2026-08-25' });

    // Siete días contando el pedido: se conserva desde el 19.
    expect(cache.pruned).toEqual(['2026-08-19']);
  });

  it('un 404 es "ese día no está publicado", no un fallo', async () => {
    stubFetch(() => ({ ok: false, status: 404, json: async () => ({}) }));
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache: InMemoryDailyCache.empty() });

    expect(await repository.get({ date: '2026-12-31' })).toBeNull();
  });

  it('sin red y sin copia, NETWORK_ERROR', async () => {
    stubFetch(() => Promise.reject(new TypeError('Network request failed')));
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache: InMemoryDailyCache.empty() });

    const error = await repository.get({ date: '2026-08-25' }).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).hasCode(ErrorCode.NETWORK_ERROR)).toBe(true);
  });

  it('un portal cautivo que responde HTML con un 200 es no tener red', async () => {
    stubFetch(() => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    }));
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache: InMemoryDailyCache.empty() });

    const error = await repository.get({ date: '2026-08-25' }).catch((thrown: unknown) => thrown);

    expect((error as DomainError).hasCode(ErrorCode.NETWORK_ERROR)).toBe(true);
  });

  it('un fragmento roto se cae él solo, no la edición', async () => {
    stubFetch(okWith([published('date=2026-08-25'), published('date=2026-08-25;axis=sun;sign=leo', { energyScore: 9 })]));
    const repository = CdnDailyRepository.create({ baseUrl: BASE_URL, cache: InMemoryDailyCache.empty() });

    const edition = await repository.get({ date: '2026-08-25' });

    expect(edition?.sky()).not.toBeNull();
    expect(edition?.forAxis('sun', 'leo')).toBeNull();
  });
});
