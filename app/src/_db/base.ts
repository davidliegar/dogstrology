import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrate';
import type { SqlDatabase } from './types';

const DB_NAME = 'dogstrology.db';

let instance: Promise<SqlDatabase> | null = null;

/**
 * Abre (o reutiliza) la base de datos del dispositivo y aplica migraciones
 * pendientes. Devuelve el puerto `SqlDatabase`, no el tipo de `expo-sqlite`:
 * esta línea es, además, la única comprobación en todo el proyecto de que
 * `SQLiteDatabase` satisface el puerto por estructura — si dejara de hacerlo,
 * el build se rompe aquí y no dentro de un repositorio.
 *
 * Si el arranque falla (migración rota, base corrupta), la promesa **no se
 * cachea**: se limpia para que el siguiente intento vuelva a probar. Cachear
 * un rechazo dejaría la app muerta hasta reiniciar el proceso, sin reintento
 * posible.
 */
export function openDatabase(): Promise<SqlDatabase> {
  if (!instance) {
    instance = (async (): Promise<SQLiteDatabase> => {
      const db = await openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })().catch((error: unknown) => {
      instance = null;
      throw error;
    });
  }
  return instance;
}
