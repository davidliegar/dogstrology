import type { DailyEdition } from './DailyEdition';

export interface getEditionInput {
  /** Fecha de calendario local, `YYYY-MM-DD`. Ver `DailyDate`. */
  date: string;
}

/**
 * Puerto del diario (BRD §7.4, **capa 2**). La capa 1 es `ContentRepository`,
 * que lee el catálogo inmutable del propio binario.
 *
 * Las dos son de solo lectura y ahí se acaba el parecido: el catálogo viaja
 * dentro de la app y no caduca; el diario se publica cada noche, se descarga y
 * se guarda siete días (F12).
 *
 * **Tres desenlaces, y conviene no mezclarlos:**
 *
 * - una edición — de la red o de la caché;
 * - `null` — ese día no está publicado. No es un fallo del dispositivo: o el
 *   pipeline no ha llegado, o la fecha es futura;
 * - `DomainError` con `NETWORK_ERROR` — no se pudo llegar y no había copia.
 *   Es el único de los tres que se arregla con conexión, y por eso es el único
 *   que la pantalla puede ofrecer reintentar (artboard 17).
 */
export interface lastReadingInput {
  /** No posterior a esta fecha: hoy, normalmente. */
  notAfter: string;
}

export interface DailyRepository {
  get(input: getEditionInput): Promise<DailyEdition | null>;
  /**
   * La última lectura que llegó a este dispositivo, **sin tocar la red**.
   *
   * Es el desenlace que faltaba: sin cobertura, la pantalla no se queda vacía
   * —enseña la última que sí llegó, fechada— y por eso esto no puede intentar
   * descargar nada. Si lo hiciera, el caso que existe para resolver sería el
   * mismo caso en el que fallaría.
   */
  lastReading(input: lastReadingInput): Promise<DailyEdition | null>;
}
