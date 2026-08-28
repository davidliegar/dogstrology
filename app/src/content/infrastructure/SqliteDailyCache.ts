import type { DatabaseProvider, SqlDatabase } from '@/_db/types';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type {
  DailyCache,
  pruneEditionsInput,
  readEditionInput,
  writeEditionInput,
} from '../domain/DailyCache';
import { DailyEdition } from '../domain/DailyEdition';
import type { FragmentData } from '../domain/Fragment';

interface EditionRow {
  fragments: string;
}

/**
 * La copia local del diario, en la tabla `daily_editions` (migración 003).
 *
 * Guarda la edición entera como JSON porque se lee entera; el porqué largo
 * está en la migración.
 */
export class SqliteDailyCache implements DailyCache {
  static create({ db }: { db: DatabaseProvider }): SqliteDailyCache {
    return new SqliteDailyCache(db);
  }

  constructor(private readonly database: DatabaseProvider) {}

  private async db(): Promise<SqlDatabase> {
    return this.database();
  }

  /**
   * Una fila que no parsea se trata como si no estuviera: es una copia de algo
   * que se puede volver a descargar, así que tirar la pantalla por ella sería
   * cambiar un fallo recuperable por uno que no lo es. La escribió una versión
   * anterior de la app con otra forma de fragmento, y la de hoy la sustituirá
   * en cuanto baje la edición de nuevo.
   */
  async read({ date }: readEditionInput): Promise<DailyEdition | null> {
    const db = await this.db();
    const row = await this.guard(() =>
      db.getFirstAsync<EditionRow>('SELECT fragments FROM daily_editions WHERE date = ?', [date]),
    );
    if (!row) return null;

    try {
      const fragments = JSON.parse(row.fragments) as FragmentData[];
      return DailyEdition.fromJSON({ date, fragments });
    } catch {
      return null;
    }
  }

  async write({ edition }: writeEditionInput): Promise<void> {
    const db = await this.db();
    await this.guard(() =>
      db.runAsync(
        `INSERT INTO daily_editions (date, fragments, fetched_at) VALUES (?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET fragments = excluded.fragments, fetched_at = excluded.fetched_at`,
        [edition.date(), JSON.stringify(edition.toJSON().fragments), Date.now()],
      ),
    );
  }

  /** Comparación de cadenas: `YYYY-MM-DD` ordena igual como texto que como fecha. */
  async prune({ before }: pruneEditionsInput): Promise<void> {
    const db = await this.db();
    await this.guard(() => db.runAsync('DELETE FROM daily_editions WHERE date < ?', [before]));
  }

  /** Ningún `SQLiteError` sale de aquí: fuera solo se conoce `DomainError`. */
  private async guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw DomainError.withCodes(ErrorCode.STORAGE_ERROR);
    }
  }
}
