import { Preferences } from '../domain/Preferences';
import type { PreferencesRepository, saveInput } from '../domain/PreferencesRepository';

/**
 * Doble en memoria de `PreferencesRepository`. Empieza sin nada guardado, que
 * es el estado real de quien nunca ha entrado en Ajustes.
 */
export class InMemoryPreferencesRepository implements PreferencesRepository {
  private stored?: Preferences;

  async get(): Promise<Preferences> {
    return this.stored ?? Preferences.default();
  }

  async save({ preferences }: saveInput): Promise<void> {
    this.stored = preferences;
  }
}
