import { UseCase } from '@/_kernel/architecture';
import type { MediaReference } from '../domain/MediaReference';
import type { PhotoStore } from '../domain/PhotoStore';

export interface ResolvePetPhotoUseCaseInput {
  photo: MediaReference | undefined;
}

/**
 * Convierte la referencia guardada en algo que un `<Image>` pueda pintar.
 *
 * Parece de más para una concatenación, y no lo es: **la ruta absoluta se
 * construye en un solo sitio** (BRD §12.2.5). El día que las fotos vivan en
 * object storage, `kind: 'remote'` empieza a devolver una URL y ni una pantalla
 * se entera. Si cada componente concatenase `documentDirectory`, ese día habría
 * que buscarlas todas.
 */
export default class ResolvePetPhotoUseCase extends UseCase<
  ResolvePetPhotoUseCaseInput,
  string | undefined
> {
  static create({ photos }: { photos: PhotoStore }): ResolvePetPhotoUseCase {
    return new ResolvePetPhotoUseCase(photos);
  }

  constructor(private readonly photos: PhotoStore) {
    super();
  }

  async execute({ photo }: ResolvePetPhotoUseCaseInput): Promise<string | undefined> {
    if (!photo) return undefined;
    return this.photos.resolve({ photo });
  }
}
