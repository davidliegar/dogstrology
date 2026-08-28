import { UseCase } from '@/_kernel/architecture';
import type { Preferences } from '../domain/Preferences';
import type { PreferencesRepository } from '../domain/PreferencesRepository';

export default class GetPreferencesUseCase extends UseCase<void, Preferences> {
  static create({ repository }: { repository: PreferencesRepository }): GetPreferencesUseCase {
    return new GetPreferencesUseCase(repository);
  }

  constructor(private readonly repository: PreferencesRepository) {
    super();
  }

  async execute(): Promise<Preferences> {
    return this.repository.get();
  }
}
