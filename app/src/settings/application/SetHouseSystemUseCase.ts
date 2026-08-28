import { UseCase } from '@/_kernel/architecture';
import type { Preferences, SelectableHouseSystem } from '../domain/Preferences';
import type { PreferencesRepository } from '../domain/PreferencesRepository';

export interface SetHouseSystemUseCaseInput {
  houseSystem: SelectableHouseSystem;
}

/**
 * Cambiar el sistema de casas. Lee, deriva y guarda: no escribe un campo
 * suelto, porque los ajustes son un modelo y el que valida es él.
 */
export default class SetHouseSystemUseCase extends UseCase<SetHouseSystemUseCaseInput, Preferences> {
  static create({ repository }: { repository: PreferencesRepository }): SetHouseSystemUseCase {
    return new SetHouseSystemUseCase(repository);
  }

  constructor(private readonly repository: PreferencesRepository) {
    super();
  }

  async execute({ houseSystem }: SetHouseSystemUseCaseInput): Promise<Preferences> {
    const current = await this.repository.get();
    const next = current.withHouseSystem(houseSystem);
    await this.repository.save({ preferences: next });
    return next;
  }
}
