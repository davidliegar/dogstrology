/** Catálogo de códigos de `DomainError`. Crece según haga falta — no se
 * inventan códigos que nadie lanza todavía. */
export enum ErrorCode {
  PET_NOT_FOUND = 'PET_NOT_FOUND',
  /** Fallo del almacenamiento local (SQLite). La infraestructura envuelve
   * aquí cualquier error de la librería: nadie fuera de ella debería tener
   * que reconocer un `SQLiteError`. */
  STORAGE_ERROR = 'STORAGE_ERROR',
  /** El motor no pudo calcular la carta (datos de nacimiento imposibles). */
  CHART_CALCULATION_FAILED = 'CHART_CALCULATION_FAILED',
  /** Ajustes guardados que ya no son del vocabulario: una fila escrita por una
   * versión anterior con un valor que hoy no existe. */
  INVALID_PREFERENCES = 'INVALID_PREFERENCES',
}
