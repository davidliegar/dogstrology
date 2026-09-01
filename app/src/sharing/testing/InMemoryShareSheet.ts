import type { ShareSheet, shareInput } from '../domain/ShareSheet';

/** Doble de `ShareSheet`. Guarda lo último compartido y cuántas veces. */
export class InMemoryShareSheet implements ShareSheet {
  shared: shareInput[] = [];

  static create(available = true): InMemoryShareSheet {
    return new InMemoryShareSheet(available);
  }

  constructor(private available = true) {}

  /** Como un Android sin ninguna app que acepte imágenes. */
  becomesUnavailable(): void {
    this.available = false;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async share(input: shareInput): Promise<void> {
    this.shared.push(input);
  }
}
