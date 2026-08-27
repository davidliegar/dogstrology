import { Directory, File, Paths } from 'expo-file-system';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { MediaReference } from '../domain/MediaReference';
import type {
  PhotoStore,
  removePhotoInput,
  resolvePhotoInput,
  savePhotoInput,
} from '../domain/PhotoStore';

/** Carpeta bajo `documentDirectory`. La ruta que se guarda es relativa a ella. */
const FOLDER = 'pets';

/**
 * Adaptador de `PhotoStore` sobre el sistema de ficheros del dispositivo.
 *
 * **Guarda fichero + referencia relativa, nunca un BLOB** (BRD §12.2.5): un
 * binario dentro de SQLite infla la base y bloquea escrituras. Y nunca una
 * ruta absoluta: en iOS el contenedor de la app cambia de UUID en cada
 * reinstalación, así que `/var/mobile/.../Documents/pets/x.jpg` deja de
 * existir aunque el fichero siga ahí.
 *
 * El nombre lleva un sello de tiempo además del id de la mascota. Sin él,
 * cambiar la foto reescribiría la misma ruta y el `<Image>` seguiría
 * enseñando la vieja: React Native cachea por URI, y la URI no habría
 * cambiado.
 */
export class FileSystemPhotoStore implements PhotoStore {
  static create(): FileSystemPhotoStore {
    return new FileSystemPhotoStore();
  }

  async save({ petId, sourceUri }: savePhotoInput): Promise<MediaReference> {
    try {
      const folder = new Directory(Paths.document, FOLDER);
      if (!folder.exists) folder.create({ intermediates: true });

      const source = new File(sourceUri);
      const extension = source.extension === '' ? '.jpg' : source.extension;
      const relativePath = `${FOLDER}/${petId}-${Date.now()}${extension}`;

      source.copy(new File(Paths.document, relativePath));
      return MediaReference.local({ relativePath });
    } catch (error) {
      throw DomainError.withCodes(ErrorCode.STORAGE_ERROR).withCauses(error as Error);
    }
  }

  async remove({ photo }: removePhotoInput): Promise<void> {
    const relativePath = photo.relativePath();
    if (relativePath === undefined) return;

    // Borrar lo que ya no está no es un error: la foto anterior puede haberse
    // ido con una limpieza del sistema, y fallar aquí abortaría un cambio de
    // foto que por lo demás fue bien.
    try {
      const file = new File(Paths.document, relativePath);
      if (file.exists) file.delete();
    } catch {
      return;
    }
  }

  resolve({ photo }: resolvePhotoInput): string | undefined {
    const remote = photo.url();
    if (remote !== undefined) return remote;

    const relativePath = photo.relativePath();
    if (relativePath === undefined) return undefined;

    const file = new File(Paths.document, relativePath);
    return file.exists ? file.uri : undefined;
  }
}
