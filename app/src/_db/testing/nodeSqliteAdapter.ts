import { DatabaseSync } from 'node:sqlite';

import type { SqlDatabase } from '../types';

/**
 * Implementa `SqlDatabase` sobre `node:sqlite` para poder probar el runner
 * de migraciones (y el SQL real de cada una) en Node, sin el módulo nativo
 * de `expo-sqlite`, que solo existe en el dispositivo.
 */
export function createNodeSqliteAdapter(): SqlDatabase {
  const db = new DatabaseSync(':memory:');
  const args = (params?: unknown[] | Record<string, unknown>): unknown[] =>
    Array.isArray(params) ? params : Object.values(params ?? {});

  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, params) {
      const info = db.prepare(sql).run(...(args(params) as never[]));
      return { lastInsertRowId: Number(info.lastInsertRowid), changes: Number(info.changes) };
    },
    async getAllAsync<T>(sql: string, params?: unknown[] | Record<string, unknown>) {
      return db.prepare(sql).all(...(args(params) as never[])) as T[];
    },
    async getFirstAsync<T>(sql: string, params?: unknown[] | Record<string, unknown>) {
      const row = db.prepare(sql).get(...(args(params) as never[]));
      return (row as T | undefined) ?? null;
    },
    async withTransactionAsync(fn) {
      db.exec('BEGIN');
      try {
        await fn();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
