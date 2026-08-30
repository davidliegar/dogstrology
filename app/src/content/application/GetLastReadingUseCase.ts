import { UseCase } from '@/_kernel/architecture';
import type { DailyEdition } from '../domain/DailyEdition';
import type { DailyRepository, lastReadingInput } from '../domain/DailyRepository';

/**
 * La última lectura que llegó al dispositivo. Sale de la copia local y no de
 * la red — ver `DailyRepository.lastReading`.
 */
export default class GetLastReadingUseCase extends UseCase<lastReadingInput, DailyEdition | null> {
  static create({ repository }: { repository: DailyRepository }): GetLastReadingUseCase {
    return new GetLastReadingUseCase(repository);
  }

  constructor(private readonly repository: DailyRepository) {
    super();
  }

  async execute(input: lastReadingInput): Promise<DailyEdition | null> {
    return this.repository.lastReading(input);
  }
}
