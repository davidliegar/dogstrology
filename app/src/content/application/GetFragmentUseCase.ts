import { UseCase } from '@/_kernel/architecture';
import type { ContentKey } from '../domain/ContentKey';
import type { ContentRepository } from '../domain/ContentRepository';
import type { Fragment } from '../domain/Fragment';

export interface GetFragmentUseCaseInput {
  key: ContentKey;
}

/**
 * Un fragmento del catálogo, o `null` si no está.
 *
 * No lanza `DomainError` cuando falta —a diferencia de `GetPetUseCase`, que sí
 * lanza `PET_NOT_FOUND`— porque no son el mismo tipo de ausencia. Una mascota
 * que no existe es un error de navegación; un fragmento que falta es un hueco
 * de contenido, y la pantalla que lo pide tiene que seguir pintándose sin él.
 * Que se note es cosa del adaptador, que en desarrollo revienta.
 */
export default class GetFragmentUseCase extends UseCase<GetFragmentUseCaseInput, Fragment | null> {
  static create({ repository }: { repository: ContentRepository }): GetFragmentUseCase {
    return new GetFragmentUseCase(repository);
  }

  constructor(private readonly repository: ContentRepository) {
    super();
  }

  async execute({ key }: GetFragmentUseCaseInput): Promise<Fragment | null> {
    return this.repository.get({ key });
  }
}
