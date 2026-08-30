import type { DailyEdition } from '../domain/DailyEdition';
import type { DailyRepository, getEditionInput, lastReadingInput } from '../domain/DailyRepository';

/**
 * Doble de `DailyRepository` con las ediciones que le pases y ninguna más.
 *
 * Sabe fingir el tercer desenlace del puerto —no llegar— porque es el que la
 * pantalla de Hoy tiene que saber pintar (artboard 17) y el que no se puede
 * provocar de verdad en un test.
 */
export class InMemoryDailyRepository implements DailyRepository {
  private readonly editions = new Map<string, DailyEdition>();
  private failure: Error | null = null;

  static with(...editions: DailyEdition[]): InMemoryDailyRepository {
    const repository = new InMemoryDailyRepository();
    for (const edition of editions) repository.editions.set(edition.date(), edition);
    return repository;
  }

  /** A partir de aquí, cualquier lectura lanza. */
  failingWith(error: Error): this {
    this.failure = error;
    return this;
  }

  async get({ date }: getEditionInput): Promise<DailyEdition | null> {
    if (this.failure) throw this.failure;
    return this.editions.get(date) ?? null;
  }

  /** No lanza aunque el doble esté en modo fallo: la caché no depende de la red. */
  async lastReading({ notAfter }: lastReadingInput): Promise<DailyEdition | null> {
    const date = [...this.editions.keys()].filter((d) => d <= notAfter).sort().pop();
    return date ? (this.editions.get(date) ?? null) : null;
  }
}
