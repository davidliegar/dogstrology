import type { DatabaseProvider, SqlDatabase } from '@/_db/types';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { DailyReminder } from '@/notifications/domain/DailyReminder';
import { Preferences, type SelectableHouseSystem } from '../domain/Preferences';
import type { PreferencesRepository, saveInput } from '../domain/PreferencesRepository';

interface PreferencesRow {
  house_system: string;
  reminder_enabled: number;
  reminder_hour: number;
  reminder_minute: number;
  updated_at: number;
}

/** La única fila de la tabla. Ver la migración 002: el esquema lo impone. */
const ROW_ID = 1;

export class SqlitePreferencesRepository implements PreferencesRepository {
  static create({ db }: { db: DatabaseProvider }): SqlitePreferencesRepository {
    return new SqlitePreferencesRepository(db);
  }

  constructor(private readonly database: DatabaseProvider) {}

  private async db(): Promise<SqlDatabase> {
    return this.database();
  }

  /**
   * Sin fila, los ajustes por defecto — y **no se escribe nada**: guardar en
   * una lectura convertiría abrir la app en una escritura, y dejaría la
   * respuesta a "¿el usuario ha elegido alguna vez?" perdida para siempre.
   *
   * Con una fila que ya no es del vocabulario —una versión anterior que
   * guardó un valor que hoy no existe— el modelo lanza, y aquí se deja pasar:
   * es exactamente el fallo silencioso que conviene que se oiga.
   */
  async get(): Promise<Preferences> {
    const db = await this.db();
    const row = await this.guard(() =>
      db.getFirstAsync<PreferencesRow>(
        `SELECT house_system, reminder_enabled, reminder_hour, reminder_minute, updated_at
         FROM preferences WHERE id = ?`,
        [ROW_ID],
      ),
    );
    if (!row) return Preferences.default();
    return Preferences.create({
      houseSystem: row.house_system as SelectableHouseSystem,
      // SQLite no tiene booleano: 0 y 1 son enteros y aquí se traducen, que es
      // lo que impide que un `0` se cuele como verdadero en el modelo.
      reminder: DailyReminder.create({
        enabled: row.reminder_enabled === 1,
        hour: row.reminder_hour,
        minute: row.reminder_minute,
      }),
    });
  }

  async save({ preferences }: saveInput): Promise<void> {
    const db = await this.db();
    const reminder = preferences.reminder();
    await this.guard(() =>
      db.runAsync(
        `INSERT INTO preferences (id, house_system, reminder_enabled, reminder_hour, reminder_minute, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           house_system = excluded.house_system,
           reminder_enabled = excluded.reminder_enabled,
           reminder_hour = excluded.reminder_hour,
           reminder_minute = excluded.reminder_minute,
           updated_at = excluded.updated_at`,
        [
          ROW_ID,
          preferences.houseSystem(),
          reminder.isEnabled() ? 1 : 0,
          reminder.hour(),
          reminder.minute(),
          Date.now(),
        ],
      ),
    );
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
