import { migrate } from '@/_db/migrate';
import { createNodeSqliteAdapter } from '@/_db/testing/nodeSqliteAdapter';
import { DailyEdition } from '../../domain/DailyEdition';
import { Fragment } from '../../domain/Fragment';
import { SqliteDailyCache } from '../SqliteDailyCache';

async function createCache() {
  const db = createNodeSqliteAdapter();
  await migrate(db);
  return { db, cache: SqliteDailyCache.create({ db: async () => db }) };
}

const edition = (date: string) =>
  DailyEdition.create({
    date,
    fragments: [
      Fragment.create({
        key: `date=${date}`,
        headline: 'La Luna entra en Escorpio a media tarde',
        body: 'Baja el volumen de todo: el cielo pide guarida, no parque.',
        advice: 'Paseo corto y manta.',
        energyScore: 3,
        color: 'water',
      }),
    ],
  });

describe('SqliteDailyCache', () => {
  it('write() + read() hacen round-trip', async () => {
    const { cache } = await createCache();

    await cache.write({ edition: edition('2026-08-25') });

    const read = await cache.read({ date: '2026-08-25' });
    expect(read?.sky()?.headline()).toBe('La Luna entra en Escorpio a media tarde');
  });

  it('sin edición guardada, null', async () => {
    const { cache } = await createCache();
    expect(await cache.read({ date: '2026-08-25' })).toBeNull();
  });

  it('guardar el mismo día dos veces no crea una segunda fila', async () => {
    const { db, cache } = await createCache();

    await cache.write({ edition: edition('2026-08-25') });
    await cache.write({ edition: edition('2026-08-25') });

    expect(await db.getAllAsync('SELECT date FROM daily_editions')).toHaveLength(1);
  });

  it('prune() borra lo anterior a la fecha y deja esa misma', async () => {
    const { cache } = await createCache();
    for (const date of ['2026-08-18', '2026-08-19', '2026-08-25']) {
      await cache.write({ edition: edition(date) });
    }

    await cache.prune({ before: '2026-08-19' });

    expect(await cache.read({ date: '2026-08-18' })).toBeNull();
    expect(await cache.read({ date: '2026-08-19' })).not.toBeNull();
    expect(await cache.read({ date: '2026-08-25' })).not.toBeNull();
  });

  it('una fila que ya no parsea se lee como si no estuviera', async () => {
    // La escribió una versión anterior con otra forma de fragmento. Tirar la
    // pantalla por una copia que se puede volver a descargar sería cambiar un
    // fallo recuperable por uno que no lo es.
    const { db, cache } = await createCache();
    await db.runAsync('INSERT INTO daily_editions (date, fragments, fetched_at) VALUES (?, ?, ?)', [
      '2026-08-25',
      'no soy json',
      Date.now(),
    ]);

    expect(await cache.read({ date: '2026-08-25' })).toBeNull();
  });
});
