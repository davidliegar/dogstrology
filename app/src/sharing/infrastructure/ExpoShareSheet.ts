import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { ShareSheet, shareInput } from '../domain/ShareSheet';

const MIME = 'image/png';

/**
 * La hoja del sistema, con `expo-sharing`, y el fichero temporal que necesita.
 *
 * **En la caché y no en documentos**: la imagen se compone para este gesto y no
 * es del usuario — que la borre el sistema cuando le haga falta sitio es
 * exactamente lo que se quiere. Guardarla en documentos dejaría un PNG por cada
 * vez que alguien toca «Compartir», sin nadie que los limpie.
 *
 * **No se borra después de compartir.** La hoja del sistema lee el fichero de
 * forma asíncrona y puede seguir haciéndolo cuando la promesa ya ha resuelto:
 * borrarlo ahí es cómo se comparte una imagen vacía. Lo recoge el sistema, y
 * mientras tanto el nombre se reutiliza — así hay uno por formato, no uno por
 * toque.
 */
export class ExpoShareSheet implements ShareSheet {
  static create(): ExpoShareSheet {
    return new ExpoShareSheet();
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await Sharing.isAvailableAsync();
    } catch {
      return false;
    }
  }

  async share({ png, name }: shareInput): Promise<void> {
    try {
      const file = new File(Paths.cache, name);
      file.create({ overwrite: true });
      file.write(png, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, { mimeType: MIME, UTI: 'public.png' });
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw DomainError.withCodes(ErrorCode.SHARE_FAILED);
    }
  }
}
