/**
 * Interfaz mínima que necesita el runner de migraciones y los repositorios.
 * `expo-sqlite`'s `SQLiteDatabase` la satisface por estructura sin necesidad
 * de importarla aquí — así el motor de migraciones se puede probar contra
 * cualquier motor SQL (en los tests, `node:sqlite`) sin depender del módulo
 * nativo, que solo existe en el dispositivo.
 */
export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[] | Record<string, unknown>): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params?: unknown[] | Record<string, unknown>): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[] | Record<string, unknown>): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

/**
 * Cómo se consigue la base de datos. Es una función porque abrirla es
 * asíncrono (aplica migraciones): así los repositorios se pueden construir en
 * el arranque, síncronos, y la base se abre en la primera consulta.
 */
export type DatabaseProvider = () => Promise<SqlDatabase>;

export interface Migration {
  version: number;
  description: string;
  up: (db: SqlDatabase) => Promise<void>;
}
