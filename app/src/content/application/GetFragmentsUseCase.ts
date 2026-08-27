import { UseCase } from '@/_kernel/architecture';
import type { ContentKey } from '../domain/ContentKey';
import type { ContentRepository } from '../domain/ContentRepository';
import type { Fragment } from '../domain/Fragment';

export interface GetFragmentsUseCaseInput {
  keys: ContentKey[];
}

/**
 * El lote que necesita una pantalla entera: la carta natal pide diez planetas
 * en signo y diez en casa de una vez. Devuelve los que existen, en orden; cada
 * `Fragment` lleva su clave, así que emparejarlos con lo que se pidió no
 * necesita nada más.
 */
export default class GetFragmentsUseCase extends UseCase<GetFragmentsUseCaseInput, Fragment[]> {
  static create({ repository }: { repository: ContentRepository }): GetFragmentsUseCase {
    return new GetFragmentsUseCase(repository);
  }

  constructor(private readonly repository: ContentRepository) {
    super();
  }

  async execute({ keys }: GetFragmentsUseCaseInput): Promise<Fragment[]> {
    if (keys.length === 0) return [];
    return this.repository.getMany({ keys });
  }
}
