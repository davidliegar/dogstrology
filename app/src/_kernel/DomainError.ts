import type { ErrorCode } from './ErrorCodes';

/**
 * Puerto reducido del `DomainError` del proyecto de referencia: sin la
 * detección de cancelación de red (`hasBeenCanceled`), porque aquí no hay
 * `fetch` que abortar. El resto del patrón se mantiene: códigos + causa
 * envuelta, para que quien captura pueda distinguir el caso ("no encontrada"
 * vs. "fallo de almacenamiento") sin parsear mensajes.
 */
export class DomainError extends AggregateError {
  static withCodes(...codes: ErrorCode[]): DomainError {
    return new DomainError(codes.map((code) => new Error(code)));
  }

  hasCode(code: ErrorCode): boolean {
    return this.errors.some((error) => error.message === code);
  }

  withCauses(...causes: Error[]): DomainError {
    if (causes.length !== 1 && causes.length !== this.errors.length) {
      throw new Error('El número de causas debe ser 1 (para todos) o igual al número de errores');
    }
    const errorsWithCause = this.errors.map((error, index) => {
      const cause = causes.length === 1 ? causes[0] : causes[index];
      return new Error(error.message, { cause });
    });
    return new DomainError(errorsWithCause);
  }
}
