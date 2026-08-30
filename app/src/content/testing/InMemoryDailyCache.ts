import type {
  DailyCache,
  pruneEditionsInput,
  readEditionInput,
  readLatestInput,
  writeEditionInput,
} from '../domain/DailyCache';
import type { DailyEdition } from '../domain/DailyEdition';

/** Doble de `DailyCache` que además apunta lo que le han pedido. */
export class InMemoryDailyCache implements DailyCache {
  private readonly editions = new Map<string, DailyEdition>();
  readonly pruned: string[] = [];

  static empty(): InMemoryDailyCache {
    return new InMemoryDailyCache();
  }

  static with(edition: DailyEdition): InMemoryDailyCache {
    const cache = new InMemoryDailyCache();
    cache.editions.set(edition.date(), edition);
    return cache;
  }

  async read({ date }: readEditionInput): Promise<DailyEdition | null> {
    return this.editions.get(date) ?? null;
  }

  async latest({ notAfter }: readLatestInput): Promise<DailyEdition | null> {
    const date = [...this.editions.keys()].filter((d) => d <= notAfter).sort().pop();
    return date ? (this.editions.get(date) ?? null) : null;
  }

  async write({ edition }: writeEditionInput): Promise<void> {
    this.editions.set(edition.date(), edition);
  }

  async prune({ before }: pruneEditionsInput): Promise<void> {
    this.pruned.push(before);
    for (const date of this.editions.keys()) {
      if (date < before) this.editions.delete(date);
    }
  }

  dates(): string[] {
    return [...this.editions.keys()].sort();
  }
}
