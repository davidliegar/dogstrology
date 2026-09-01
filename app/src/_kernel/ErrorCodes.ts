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
  /**
   * No se pudo llegar al CDN del diario y no había copia local. Es el único
   * fallo de la app que se arregla con cobertura, y por eso tiene código
   * propio: es lo que deja a la pantalla ofrecer un reintento en vez de un
   * "algo ha ido mal" (artboard 17).
   */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Un plan que llega de la tienda sin precio, sin moneda o con un
   * identificador que la app no conoce: producto mal dado de alta en Play
   * Console, no un fallo del usuario. */
  INVALID_PLAN = 'INVALID_PLAN',
  /** Estado de suscripción que no es del vocabulario. */
  INVALID_SUBSCRIPTION = 'INVALID_SUBSCRIPTION',
  /**
   * El usuario cerró la hoja de compra de la tienda. Tiene código propio
   * porque **no es un error que enseñar**: es la salida normal de quien mira
   * el precio y decide que no. Distinguirlo es lo que evita el aviso rojo
   * después de un gesto deliberado.
   */
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED',
  /** La compra se intentó y la tienda la rechazó. Esta sí se enseña. */
  PURCHASE_FAILED = 'PURCHASE_FAILED',
  /**
   * El sistema no dejó programar o cancelar el aviso diario. No incluye el
   * permiso denegado, que no es un fallo: es una respuesta, y viaja como
   * `NotificationPermission`.
   */
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  /**
   * No se pudo componer o entregar la imagen que se comparte. No incluye que
   * el usuario cierre la hoja del sistema sin elegir destino: eso no es un
   * fallo, es la salida normal, y ni Android ni iOS lo distinguen de haber
   * compartido.
   */
  SHARE_FAILED = 'SHARE_FAILED',
}
