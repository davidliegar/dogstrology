import { MediaReference } from '../domain/MediaReference';
import type { PhotoStore, removePhotoInput, resolvePhotoInput, savePhotoInput } from '../domain/PhotoStore';

/** Doble de `PhotoStore` que recuerda qué se guardó y qué se borró. */
export class InMemoryPhotoStore implements PhotoStore {
  readonly saved: string[] = [];
  readonly removed: string[] = [];
  /** Fuerza un fallo al guardar, para probar que no se toca la fila. */
  failOnSave = false;

  async save({ petId, sourceUri }: savePhotoInput): Promise<MediaReference> {
    if (this.failOnSave) throw new Error('disco lleno');
    const relativePath = `pets/${petId}-${this.saved.length}.jpg`;
    this.saved.push(sourceUri);
    return MediaReference.local({ relativePath });
  }

  async remove({ photo }: removePhotoInput): Promise<void> {
    const relativePath = photo.relativePath();
    if (relativePath) this.removed.push(relativePath);
  }

  resolve({ photo }: resolvePhotoInput): string | undefined {
    return photo.url() ?? `file:///documents/${photo.relativePath()}`;
  }
}
