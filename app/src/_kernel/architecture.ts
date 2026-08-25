/**
 * Building blocks de arquitectura, comunes a todos los bounded contexts.
 * Puerto reducido de `packages/stayforlong/src/_kernel/architecture.ts` (ver
 * PLAN.md, sesión de arquitectura hexagonal) — sin `Config`/`AbortSignal`
 * (nada aquí es red ni cancelable) ni `getUseCaseMetadata()`/facade (no hay
 * todavía un compositor multi-consumidor que los necesite).
 */

/** Ancla vacía: necesaria para que `z.instanceof(Modelo)` compile cuando un
 * modelo compone a otro (ver skill `domain-models` del proyecto de referencia). */
export class Model {}

export abstract class UseCase<Input, Output> {
  abstract execute(input: Input): Promise<Output>;
}

/**
 * Caso de uso que nunca lanza: captura sus propios errores en `execute()` y
 * devuelve `Modelo.default()`. Declarada para cuando haga falta (lecturas de
 * entorno con fallback significativo) — ningún caso de uso la usa todavía.
 */
export abstract class InfallibleUseCase<Input, Output> extends UseCase<Input, Output> {
  readonly INFALLIBLE = true as const;
  abstract execute(input: Input): Promise<Output>;
}
