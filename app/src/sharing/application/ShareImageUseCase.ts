import { UseCase } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { ShareSheet } from '../domain/ShareSheet';

export interface ShareImageUseCaseInput {
  png: string;
  name: string;
}

/**
 * Entregar al sistema la imagen ya compuesta (F9).
 *
 * **Aquí no se dibuja nada.** La imagen la compone la UI con Skia, porque es
 * diseño —tokens, tipografía, la marca de agua— y el dominio no sabe de eso.
 * Lo que sí es suyo: que no se abra la hoja con una imagen vacía, y que un
 * sistema sin a dónde compartir no parezca un fallo de la app.
 */
export default class ShareImageUseCase extends UseCase<ShareImageUseCaseInput, void> {
  static create({ sheet }: { sheet: ShareSheet }): ShareImageUseCase {
    return new ShareImageUseCase(sheet);
  }

  constructor(private readonly sheet: ShareSheet) {
    super();
  }

  async execute({ png, name }: ShareImageUseCaseInput): Promise<void> {
    // Un PNG vacío llega hasta la hoja del sistema y falla allí, donde el
    // mensaje ya no es nuestro. Se para aquí.
    if (png.length === 0) throw DomainError.withCodes(ErrorCode.SHARE_FAILED);
    if (!(await this.sheet.isAvailable())) throw DomainError.withCodes(ErrorCode.SHARE_FAILED);
    await this.sheet.share({ png, name });
  }
}
