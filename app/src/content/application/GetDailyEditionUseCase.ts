import { UseCase } from '@/_kernel/architecture';
import type { DailyEdition } from '../domain/DailyEdition';
import type { DailyRepository, getEditionInput } from '../domain/DailyRepository';

export default class GetDailyEditionUseCase extends UseCase<getEditionInput, DailyEdition | null> {
  static create({ repository }: { repository: DailyRepository }): GetDailyEditionUseCase {
    return new GetDailyEditionUseCase(repository);
  }

  constructor(private readonly repository: DailyRepository) {
    super();
  }

  async execute(input: getEditionInput): Promise<DailyEdition | null> {
    return this.repository.get(input);
  }
}
